package repository

import (
	"time"

	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type accountingRepo struct {
	db *gorm.DB
}

func NewAccountingRepository(db *gorm.DB) domain.AccountingRepository {
	return &accountingRepo{db: db}
}

// Chart of Accounts
func (r *accountingRepo) CreateAccount(account *domain.ChartOfAccount) error {
	return r.db.Create(account).Error
}

func (r *accountingRepo) FindAccountByID(id uuid.UUID) (*domain.ChartOfAccount, error) {
	var account domain.ChartOfAccount
	err := r.db.Preload("Children").Where("id = ?", id).First(&account).Error
	if err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *accountingRepo) FindAccountsByTenantID(tenantID uuid.UUID) ([]domain.ChartOfAccount, error) {
	var accounts []domain.ChartOfAccount
	err := r.db.Where("tenant_id = ?", tenantID).Order("code ASC").Find(&accounts).Error
	return accounts, err
}

func (r *accountingRepo) UpdateAccount(account *domain.ChartOfAccount) error {
	return r.db.Save(account).Error
}

func (r *accountingRepo) UpdateAccountBalance(accountID uuid.UUID, amount float64) error {
	return r.db.Model(&domain.ChartOfAccount{}).
		Where("id = ?", accountID).
		UpdateColumn("balance", gorm.Expr("balance + ?", amount)).Error
}

// Journal Entries
func (r *accountingRepo) CreateJournal(entry *domain.JournalEntry) error {
	return r.db.Create(entry).Error
}

func (r *accountingRepo) FindJournalByID(id uuid.UUID) (*domain.JournalEntry, error) {
	var entry domain.JournalEntry
	err := r.db.Preload("Lines.Account").Where("id = ?", id).First(&entry).Error
	if err != nil {
		return nil, err
	}
	return &entry, nil
}

func (r *accountingRepo) FindJournalsByTenantID(tenantID uuid.UUID, startDate, endDate *time.Time, limit, offset int) ([]domain.JournalEntry, int64, error) {
	var entries []domain.JournalEntry
	var total int64

	query := r.db.Model(&domain.JournalEntry{}).Where("tenant_id = ?", tenantID)
	if startDate != nil {
		query = query.Where("date >= ?", *startDate)
	}
	if endDate != nil {
		query = query.Where("date <= ?", *endDate)
	}

	query.Count(&total)

	err := query.
		Preload("Lines.Account").
		Order("date DESC, created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&entries).Error

	return entries, total, err
}

// Reports
func (r *accountingRepo) GetTrialBalance(tenantID uuid.UUID, asOfDate time.Time) ([]domain.ChartOfAccount, error) {
	var accounts []domain.ChartOfAccount
	err := r.db.Where("tenant_id = ? AND is_active = ?", tenantID, true).
		Order("code ASC").
		Find(&accounts).Error
	return accounts, err
}

func (r *accountingRepo) GetProfitLoss(tenantID uuid.UUID, startDate, endDate time.Time) ([]domain.ChartOfAccount, error) {
	var accounts []domain.ChartOfAccount
	err := r.db.Where("tenant_id = ? AND type IN ? AND is_active = ?",
		tenantID, []string{domain.AccountTypeRevenue, domain.AccountTypeExpense}, true).
		Order("code ASC").
		Find(&accounts).Error
	return accounts, err
}

func (r *accountingRepo) GetBalanceSheet(tenantID uuid.UUID, asOfDate time.Time) ([]domain.ChartOfAccount, error) {
	var accounts []domain.ChartOfAccount
	err := r.db.Where("tenant_id = ? AND type IN ? AND is_active = ?",
		tenantID, []string{domain.AccountTypeAsset, domain.AccountTypeLiability, domain.AccountTypeEquity}, true).
		Order("code ASC").
		Find(&accounts).Error
	return accounts, err
}
