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
