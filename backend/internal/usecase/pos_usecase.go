package usecase

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
)

type POSUsecase struct {
	transactionRepo   domain.TransactionRepository
	productRepo       domain.ProductRepository
	inventoryRepo     domain.InventoryRepository
	accountingRepo    domain.AccountingRepository
	tenantBillingRepo domain.TenantBillingRepository
}

func NewPOSUsecase(
	tr domain.TransactionRepository,
	pr domain.ProductRepository,
	ir domain.InventoryRepository,
	ar domain.AccountingRepository,
	tbr domain.TenantBillingRepository,
) *POSUsecase {
	return &POSUsecase{
		transactionRepo:   tr,
		productRepo:       pr,
		inventoryRepo:     ir,
		accountingRepo:    ar,
		tenantBillingRepo: tbr,
	}
}

// Checkout processes a POS transaction
func (u *POSUsecase) Checkout(tenantID, cashierID uuid.UUID, req domain.CheckoutRequest) (*domain.Transaction, error) {
	// 1. Verify Tenant Billing Status (The 7th Rule Enforcement)
	// Get all unpaid or past_due bills
	unpaidBills, _, _ := u.tenantBillingRepo.FindByTenantID(tenantID, 10, 0)
	now := time.Now()
	for _, b := range unpaidBills {
		// If status is suspended, immediately block
		if b.Status == "suspended" {
			return nil, errors.New("akun anda ditangguhkan karena menunggak tagihan MDR lebih dari 1 bulan. Harap segera melunasi tagihan")
		}
		// If status is past_due OR (status is unpaid AND we are past the 7th of the month)
		if b.Status == "past_due" || (b.Status == "unpaid" && now.Day() > 7) {
			return nil, errors.New("akses Kasir (POS) dibekukan sementara karena ada Tagihan MDR yang melewati jatuh tempo (Tanggal 7). Harap bayar tagihan di menu Tagihan MDR")
		}
	}

	// Build transaction items
	var items []domain.TransactionItem
	var subtotal float64
	var totalTax float64

	for _, itemReq := range req.Items {
		product, err := u.productRepo.FindByID(itemReq.ProductID)
		if err != nil {
			return nil, fmt.Errorf("product not found: %s", itemReq.ProductID)
		}

		unitPrice := product.BasePrice
		variantName := ""

		// Check variant
		if itemReq.VariantID != nil {
			for _, v := range product.Variants {
				if v.ID == *itemReq.VariantID {
					unitPrice += v.AdditionalPrice
					variantName = v.Name
					break
				}
			}
		}

		// Add modifier prices
		modifierTotal := 0.0
		for _, mod := range itemReq.Modifiers {
			modifierTotal += mod.Price
		}
		unitPrice += modifierTotal

		itemSubtotal := unitPrice * itemReq.Quantity
		taxAmount := itemSubtotal * (product.TaxRate / 100)

		modJSON, _ := json.Marshal(itemReq.Modifiers)

		items = append(items, domain.TransactionItem{
			ProductID:   itemReq.ProductID,
			VariantID:   itemReq.VariantID,
			ProductName: product.Name,
			VariantName: variantName,
			Quantity:    itemReq.Quantity,
			UnitPrice:   unitPrice,
			TaxAmount:   taxAmount,
			Subtotal:    itemSubtotal,
			Modifiers:   domain.JSON(modJSON),
			Notes:       itemReq.Notes,
		})

		subtotal += itemSubtotal
		totalTax += taxAmount
	}

	totalAmount := subtotal + totalTax

	// Validate payment total
	var paymentTotal float64
	for _, p := range req.Payments {
		paymentTotal += p.Amount
	}
	if paymentTotal < totalAmount {
		return nil, errors.New("payment amount is less than total")
	}

	// Generate transaction number
	txNumber := fmt.Sprintf("TXN-%s-%d", time.Now().Format("20060102"), time.Now().UnixNano()%100000)

	// Determine primary payment method (use logic to calculate MDR)
	var primaryPaymentMethod string
	if len(req.Payments) > 0 {
		primaryPaymentMethod = req.Payments[0].PaymentMethod
	}

	// Calculate MDR Margins
	feeMidtrans, feeCodapos, mdrPercent, mdrFlat := calculateMDR(primaryPaymentMethod, totalAmount)
	totalMDRMerchant := feeMidtrans + feeCodapos
	netProfit := totalAmount - totalMDRMerchant

	// Create transaction
	tx := &domain.Transaction{
		TenantID:          tenantID,
		OutletID:          req.OutletID,
		CashierID:         cashierID,
		TransactionNumber: txNumber,
		Type:              domain.TransactionTypeSale,
		Status:            domain.TransactionStatusCompleted,
		Subtotal:          subtotal,
		TaxAmount:         totalTax,
		TotalAmount:       totalAmount,
		PromotionID:       req.PromotionID,
		Notes:             req.Notes,
		Items:             items,
		PaymentMethod:     primaryPaymentMethod,
		MDRRatePercentage: mdrPercent,
		MDRRateFlat:       mdrFlat,
		FeeMidtrans:       feeMidtrans,
		FeeCodapos:        feeCodapos,
		TotalMDRMerchant:  totalMDRMerchant,
		NetProfit:         netProfit,
	}

	// Create payments
	for _, p := range req.Payments {
		tx.Payments = append(tx.Payments, domain.TransactionPayment{
			PaymentMethod:   p.PaymentMethod,
			Amount:          p.Amount,
			ReferenceNumber: p.ReferenceNumber,
			Status:          "completed",
		})
	}

	if err := u.transactionRepo.Create(tx); err != nil {
		return nil, fmt.Errorf("failed to create transaction: %w", err)
	}

	// Auto-deduct inventory
	for _, item := range items {
		if err := u.inventoryRepo.UpdateStock(req.OutletID, item.ProductID, item.VariantID, -item.Quantity); err != nil {
			// Log but don't fail the transaction
			fmt.Printf("Warning: failed to deduct stock for product %s: %v\n", item.ProductID, err)
		}
		// Record movement
		movement := &domain.InventoryMovement{
			OutletID:      req.OutletID,
			ProductID:     item.ProductID,
			VariantID:     item.VariantID,
			Type:          domain.MovementSale,
			Quantity:      -item.Quantity,
			ReferenceType: "transaction",
			ReferenceID:   &tx.ID,
			CreatedBy:     &cashierID,
		}
		_ = u.inventoryRepo.CreateMovement(movement)
	}

	// Auto-create accounting journal entry (POS → Journal)
	go u.createSaleJournal(tenantID, tx)

	return tx, nil
}

// calculateMDR computes Midtrans fee, CODAPOS margin (0.5%), and the split based on payment method.
// NOTE: "credit_card" -> 2.9% + 2000 (Midtrans), 0.5% (Codapos) -> Merchant: 3.4% + 2000
// "qris" -> 0.7% (Midtrans), 0.5% (Codapos) -> Merchant: 1.2%
// "gopay", "shopeepay", "ewallet" -> 2.0% (Midtrans), 0.5% (Codapos) -> Merchant: 2.5%
// "bank_transfer", "virtual_account" -> 4000 Flat (Midtrans), 1000 Flat (Codapos) -> Merchant: 5000
// "cash" -> 0
func calculateMDR(paymentMethod string, totalAmount float64) (feeMidtrans, feeCodapos, percentage, flat float64) {
	method := strings.ToLower(paymentMethod)

	// In CODAPOS context, these are mapping to Payment constants
	switch method {
	case domain.PaymentCreditCard:
		percentage = 3.4
		flat = 2000.0
		feeMidtrans = (totalAmount * 0.029) + 2000.0
		feeCodapos = (totalAmount * 0.005)
	case domain.PaymentQRIS:
		percentage = 1.2
		feeMidtrans = totalAmount * 0.007
		feeCodapos = totalAmount * 0.005
	case domain.PaymentEWallet, "gopay", "shopeepay", "dana", "ovo", "linkaja":
		percentage = 2.5
		feeMidtrans = totalAmount * 0.020
		feeCodapos = totalAmount * 0.005
	case domain.PaymentBankTransfer, "virtual_account", "bca_va", "bni_va", "bri_va", "mandiri_va":
		flat = 5000.0
		feeMidtrans = 4000.0
		feeCodapos = 1000.0
	default:
		// "cash", "whatsapp", etc. NO MDR.
		return 0, 0, 0, 0
	}

	return feeMidtrans, feeCodapos, percentage, flat
}

// createSaleJournal creates an automatic journal entry for a sale
func (u *POSUsecase) createSaleJournal(tenantID uuid.UUID, tx *domain.Transaction) {
	entryNumber := fmt.Sprintf("JRN-SALE-%s", tx.TransactionNumber)
	journal := &domain.JournalEntry{
		TenantID:      tenantID,
		OutletID:      &tx.OutletID,
		EntryNumber:   entryNumber,
		Date:          tx.CreatedAt,
		Description:   fmt.Sprintf("Auto journal for sale %s", tx.TransactionNumber),
		Source:        domain.JournalSourcePOSSale,
		ReferenceType: "transaction",
		ReferenceID:   &tx.ID,
		Status:        "posted",
		TotalDebit:    tx.TotalAmount,
		TotalCredit:   tx.TotalAmount,
	}

	// Get system accounts
	accounts, _ := u.accountingRepo.FindAccountsByTenantID(tenantID)
	var cashAccountID, salesAccountID, taxAccountID uuid.UUID

	for _, acc := range accounts {
		switch acc.SubType {
		case domain.AccountSubTypeCash:
			cashAccountID = acc.ID
		case domain.AccountSubTypeSales:
			salesAccountID = acc.ID
		case domain.AccountSubTypeTax:
			taxAccountID = acc.ID
		}
	}

	if cashAccountID != uuid.Nil && salesAccountID != uuid.Nil {
		journal.Lines = []domain.JournalEntryLine{
			{AccountID: cashAccountID, Debit: tx.TotalAmount, Description: "Cash received"},
			{AccountID: salesAccountID, Credit: tx.Subtotal, Description: "Sales revenue"},
		}
		if tx.TaxAmount > 0 && taxAccountID != uuid.Nil {
			journal.Lines = append(journal.Lines, domain.JournalEntryLine{
				AccountID:   taxAccountID,
				Credit:      tx.TaxAmount,
				Description: "Tax payable",
			})
		}
		_ = u.accountingRepo.CreateJournal(journal)

		// Update account balances
		_ = u.accountingRepo.UpdateAccountBalance(cashAccountID, tx.TotalAmount)
		_ = u.accountingRepo.UpdateAccountBalance(salesAccountID, tx.Subtotal)
		if tx.TaxAmount > 0 && taxAccountID != uuid.Nil {
			_ = u.accountingRepo.UpdateAccountBalance(taxAccountID, tx.TaxAmount)
		}
	}
}

// Refund processes a refund
func (u *POSUsecase) Refund(tenantID, cashierID uuid.UUID, transactionID uuid.UUID, reason string) (*domain.Transaction, error) {
	original, err := u.transactionRepo.FindByID(transactionID)
	if err != nil {
		return nil, errors.New("original transaction not found")
	}

	if original.Status == domain.TransactionStatusRefunded {
		return nil, errors.New("transaction already refunded")
	}

	// Create refund transaction
	txNumber := fmt.Sprintf("REF-%s-%d", time.Now().Format("20060102"), time.Now().UnixNano()%100000)
	refund := &domain.Transaction{
		TenantID:              tenantID,
		OutletID:              original.OutletID,
		CashierID:             cashierID,
		TransactionNumber:     txNumber,
		Type:                  domain.TransactionTypeRefund,
		Status:                domain.TransactionStatusCompleted,
		Subtotal:              -original.Subtotal,
		TaxAmount:             -original.TaxAmount,
		TotalAmount:           -original.TotalAmount,
		RefundReason:          reason,
		OriginalTransactionID: &transactionID,
	}

	if err := u.transactionRepo.Create(refund); err != nil {
		return nil, fmt.Errorf("failed to create refund: %w", err)
	}

	// Update original
	original.Status = domain.TransactionStatusRefunded
	_ = u.transactionRepo.Update(original)

	// Restore inventory
	for _, item := range original.Items {
		_ = u.inventoryRepo.UpdateStock(original.OutletID, item.ProductID, item.VariantID, item.Quantity)
	}

	return refund, nil
}

// GetTransactions returns transactions with pagination
func (u *POSUsecase) GetTransactions(tenantID uuid.UUID, outletID *uuid.UUID, page, perPage int) ([]domain.Transaction, int64, error) {
	offset := (page - 1) * perPage
	return u.transactionRepo.FindByTenantID(tenantID, outletID, perPage, offset)
}

// GetTransaction returns a single transaction
func (u *POSUsecase) GetTransaction(id uuid.UUID) (*domain.Transaction, error) {
	return u.transactionRepo.FindByID(id)
}

// IncrementReprint processes a receipt reprint logging
func (u *POSUsecase) IncrementReprint(id uuid.UUID) (*domain.Transaction, error) {
	tx, err := u.transactionRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("transaction not found")
	}

	tx.ReprintCount += 1
	now := time.Now()
	tx.LastReprintAt = &now

	if err := u.transactionRepo.Update(tx); err != nil {
		return nil, fmt.Errorf("failed to update transaction reprint: %w", err)
	}

	return tx, nil
}

// GetTenantBillings returns MDR invoices for a specific tenant
func (u *POSUsecase) GetTenantBillings(tenantID uuid.UUID, page, perPage int) ([]domain.TenantBilling, int64, error) {
	offset := (page - 1) * perPage
	return u.tenantBillingRepo.FindByTenantID(tenantID, perPage, offset)
}

// GenerateMonthlyBillings aggregates all MDRs from the previous month and creates an invoice
func (u *POSUsecase) GenerateMonthlyBillings() error {
	// E.g., if run on Feb 1st, it generates bills for January (01-YYYY)
	now := time.Now()
	lastMonth := now.AddDate(0, -1, 0)
	billingMonthStr := lastMonth.Format("01-2006")

	// 1. Fetch Aggregated MDR from Transaction Repo for lastMonth
	aggregates, err := u.transactionRepo.GetMDRMonthlyAggregation(int(lastMonth.Month()), lastMonth.Year())
	if err != nil {
		return fmt.Errorf("failed to fetch monthly aggregation: %w", err)
	}

	// 2. Iterate through each tenant and save their billings
	for _, agg := range aggregates {
		// Check if a bill already exists so we don't double-charge
		existing, _ := u.tenantBillingRepo.GetByTenantAndMonth(agg.TenantID, billingMonthStr)
		if existing != nil {
			continue // Already processed
		}

		bill := &domain.TenantBilling{
			TenantID:          agg.TenantID,
			BillingMonth:      billingMonthStr,
			TotalTransactions: agg.TotalTrx,
			TotalMDR:          agg.TotalMDRVal,
			Status:            "unpaid", // Unpaid initially, due on 7th
			PenaltyFee:        0,        // Late fee applied later if unpaid
		}

		if err := u.tenantBillingRepo.Create(bill); err != nil {
			fmt.Printf("Warning: failed to create billing for tenant %s: %v\n", agg.TenantID, err)
		}
	}

	return nil
}

// PayTenantBilling processes a payment for a monthly MDR invoice
func (u *POSUsecase) PayTenantBilling(tenantID uuid.UUID, billingID uuid.UUID) (*domain.TenantBilling, error) {
	// E.g., This would be hit by a successful Midtrans webhook or a manual superadmin override
	var bill *domain.TenantBilling
	bills, _, err := u.GetTenantBillings(tenantID, 1, 100)
	if err != nil {
		return nil, errors.New("failed to retrieve billings")
	}

	for _, b := range bills {
		if b.ID == billingID {
			bill = &b
			break
		}
	}

	if bill == nil {
		return nil, errors.New("billing invoice not found")
	}

	if bill.Status == "paid" {
		return nil, errors.New("billing is already paid")
	}

	// 10% Late penalty logic
	// If today's date > 7 and it's for the previous month, add 10% penalty
	// To simplify: if Status == "past_due" or date>7
	now := time.Now()
	if now.Day() > 7 && bill.Status != "paid" {
		bill.PenaltyFee = bill.TotalMDR * 0.10 // 10% Late Fee
		bill.Status = "past_due"
	}

	// For the sake of this mock API, we assume payment is successful and mark as paid
	bill.Status = "paid"

	if err := u.tenantBillingRepo.Update(bill); err != nil {
		return nil, fmt.Errorf("failed to update billing status: %w", err)
	}

	return bill, nil
}
