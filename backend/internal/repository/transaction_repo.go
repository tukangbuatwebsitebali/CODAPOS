package repository

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type transactionRepo struct {
	db *gorm.DB
}

func NewTransactionRepository(db *gorm.DB) domain.TransactionRepository {
	return &transactionRepo{db: db}
}

func (r *transactionRepo) Create(transaction *domain.Transaction) error {
	return r.db.Create(transaction).Error
}

func (r *transactionRepo) FindByID(id uuid.UUID) (*domain.Transaction, error) {
	var tx domain.Transaction
	err := r.db.
		Preload("Items").
		Preload("Payments").
		Preload("Cashier").
		Preload("Outlet").
		Where("id = ?", id).
		First(&tx).Error
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

func (r *transactionRepo) FindByTenantID(tenantID uuid.UUID, outletID *uuid.UUID, limit, offset int) ([]domain.Transaction, int64, error) {
	var transactions []domain.Transaction
	var total int64

	query := r.db.Model(&domain.Transaction{}).Where("tenant_id = ?", tenantID)
	if outletID != nil {
		query = query.Where("outlet_id = ?", *outletID)
	}

	query.Count(&total)

	err := query.
		Preload("Items").
		Preload("Payments").
		Preload("Cashier").
		Preload("Outlet").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&transactions).Error

	return transactions, total, err
}

func (r *transactionRepo) FindByNumber(number string) (*domain.Transaction, error) {
	var tx domain.Transaction
	err := r.db.
		Preload("Items").
		Preload("Payments").
		Where("transaction_number = ?", number).
		First(&tx).Error
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

func (r *transactionRepo) Update(transaction *domain.Transaction) error {
	return r.db.Save(transaction).Error
}

func (r *transactionRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&domain.Transaction{}, "id = ?", id).Error
}

func (r *transactionRepo) GetMDRMonthlyAggregation(month, year int) ([]struct {
	TenantID    uuid.UUID
	TotalTrx    int
	TotalMDRVal float64
}, error) {
	var results []struct {
		TenantID    uuid.UUID
		TotalTrx    int
		TotalMDRVal float64
	}

	// Calculate totals for a given month and year
	// NOTE: We rely on total_mdr_merchant which includes fee_midtrans + fee_codapos
	// We only bill on Cashless / Non-Cash payments, where total_mdr_merchant > 0
	err := r.db.Model(&domain.Transaction{}).
		Select("tenant_id, COUNT(id) as total_trx, SUM(total_mdr_merchant) as total_mdr_val").
		Where("EXTRACT(MONTH FROM created_at) = ? AND EXTRACT(YEAR FROM created_at) = ?", month, year).
		Where("status = ?", domain.TransactionStatusCompleted).
		Where("total_mdr_merchant > 0").
		Group("tenant_id").
		Scan(&results).Error

	return results, err
}
