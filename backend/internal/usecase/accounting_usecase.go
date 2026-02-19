package usecase

import (
	"fmt"
	"time"

	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
)

type AccountingUsecase struct {
	accountingRepo domain.AccountingRepository
}

func NewAccountingUsecase(ar domain.AccountingRepository) *AccountingUsecase {
	return &AccountingUsecase{accountingRepo: ar}
}

// InitializeDefaultCOA creates default chart of accounts for a new tenant
func (u *AccountingUsecase) InitializeDefaultCOA(tenantID uuid.UUID) error {
	defaultAccounts := []domain.ChartOfAccount{
		// Assets
		{TenantID: tenantID, Code: "1000", Name: "Aset", Type: domain.AccountTypeAsset, IsSystem: true},
		{TenantID: tenantID, Code: "1100", Name: "Kas", Type: domain.AccountTypeAsset, SubType: domain.AccountSubTypeCash, IsSystem: true},
		{TenantID: tenantID, Code: "1200", Name: "Bank", Type: domain.AccountTypeAsset, SubType: domain.AccountSubTypeBank, IsSystem: true},
		{TenantID: tenantID, Code: "1300", Name: "Piutang Usaha", Type: domain.AccountTypeAsset, SubType: domain.AccountSubTypeReceivable, IsSystem: true},
		{TenantID: tenantID, Code: "1400", Name: "Persediaan", Type: domain.AccountTypeAsset, SubType: domain.AccountSubTypeInventory, IsSystem: true},

		// Liabilities
		{TenantID: tenantID, Code: "2000", Name: "Kewajiban", Type: domain.AccountTypeLiability, IsSystem: true},
		{TenantID: tenantID, Code: "2100", Name: "Hutang Usaha", Type: domain.AccountTypeLiability, SubType: domain.AccountSubTypePayable, IsSystem: true},
		{TenantID: tenantID, Code: "2200", Name: "Hutang Pajak", Type: domain.AccountTypeLiability, SubType: domain.AccountSubTypeTax, IsSystem: true},

		// Equity
		{TenantID: tenantID, Code: "3000", Name: "Modal", Type: domain.AccountTypeEquity, IsSystem: true},
		{TenantID: tenantID, Code: "3100", Name: "Modal Disetor", Type: domain.AccountTypeEquity, IsSystem: true},
		{TenantID: tenantID, Code: "3200", Name: "Laba Ditahan", Type: domain.AccountTypeEquity, IsSystem: true},

		// Revenue
		{TenantID: tenantID, Code: "4000", Name: "Pendapatan", Type: domain.AccountTypeRevenue, IsSystem: true},
		{TenantID: tenantID, Code: "4100", Name: "Penjualan", Type: domain.AccountTypeRevenue, SubType: domain.AccountSubTypeSales, IsSystem: true},
		{TenantID: tenantID, Code: "4200", Name: "Pendapatan Lain-lain", Type: domain.AccountTypeRevenue, IsSystem: true},

		// Expenses
		{TenantID: tenantID, Code: "5000", Name: "Beban", Type: domain.AccountTypeExpense, IsSystem: true},
		{TenantID: tenantID, Code: "5100", Name: "Harga Pokok Penjualan", Type: domain.AccountTypeExpense, SubType: domain.AccountSubTypeCOGS, IsSystem: true},
		{TenantID: tenantID, Code: "5200", Name: "Beban Gaji", Type: domain.AccountTypeExpense, IsSystem: true},
		{TenantID: tenantID, Code: "5300", Name: "Beban Sewa", Type: domain.AccountTypeExpense, IsSystem: true},
		{TenantID: tenantID, Code: "5400", Name: "Beban Operasional", Type: domain.AccountTypeExpense, IsSystem: true},
	}

	for _, acc := range defaultAccounts {
		if err := u.accountingRepo.CreateAccount(&acc); err != nil {
			return fmt.Errorf("failed to create account %s: %w", acc.Code, err)
		}
	}

	return nil
}

// GetCOA returns all accounts for a tenant
func (u *AccountingUsecase) GetCOA(tenantID uuid.UUID) ([]domain.ChartOfAccount, error) {
	return u.accountingRepo.FindAccountsByTenantID(tenantID)
}

// CreateAccount creates a custom account
func (u *AccountingUsecase) CreateAccount(account *domain.ChartOfAccount) error {
	return u.accountingRepo.CreateAccount(account)
}

// GetJournals returns journal entries with pagination
func (u *AccountingUsecase) GetJournals(tenantID uuid.UUID, startDate, endDate *time.Time, page, perPage int) ([]domain.JournalEntry, int64, error) {
	offset := (page - 1) * perPage
	return u.accountingRepo.FindJournalsByTenantID(tenantID, startDate, endDate, perPage, offset)
}

// GetTrialBalance returns trial balance
func (u *AccountingUsecase) GetTrialBalance(tenantID uuid.UUID) ([]domain.ChartOfAccount, error) {
	return u.accountingRepo.GetTrialBalance(tenantID, time.Now())
}

// GetProfitLoss returns profit & loss statement
func (u *AccountingUsecase) GetProfitLoss(tenantID uuid.UUID, startDate, endDate time.Time) ([]domain.ChartOfAccount, error) {
	return u.accountingRepo.GetProfitLoss(tenantID, startDate, endDate)
}

// GetBalanceSheet returns balance sheet
func (u *AccountingUsecase) GetBalanceSheet(tenantID uuid.UUID) ([]domain.ChartOfAccount, error) {
	return u.accountingRepo.GetBalanceSheet(tenantID, time.Now())
}
