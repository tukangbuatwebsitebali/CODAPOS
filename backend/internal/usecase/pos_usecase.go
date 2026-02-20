package usecase

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
)

type POSUsecase struct {
	transactionRepo domain.TransactionRepository
	productRepo     domain.ProductRepository
	inventoryRepo   domain.InventoryRepository
	accountingRepo  domain.AccountingRepository
}

func NewPOSUsecase(
	tr domain.TransactionRepository,
	pr domain.ProductRepository,
	ir domain.InventoryRepository,
	ar domain.AccountingRepository,
) *POSUsecase {
	return &POSUsecase{
		transactionRepo: tr,
		productRepo:     pr,
		inventoryRepo:   ir,
		accountingRepo:  ar,
	}
}

// Checkout processes a POS transaction
func (u *POSUsecase) Checkout(tenantID, cashierID uuid.UUID, req domain.CheckoutRequest) (*domain.Transaction, error) {
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
