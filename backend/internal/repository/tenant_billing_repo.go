package repository

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type tenantBillingRepository struct {
	db *gorm.DB
}

func NewTenantBillingRepository(db *gorm.DB) domain.TenantBillingRepository {
	return &tenantBillingRepository{db}
}

func (r *tenantBillingRepository) Create(billing *domain.TenantBilling) error {
	return r.db.Create(billing).Error
}

func (r *tenantBillingRepository) GetByTenantAndMonth(tenantID uuid.UUID, month string) (*domain.TenantBilling, error) {
	var billing domain.TenantBilling
	err := r.db.Where("tenant_id = ? AND billing_month = ?", tenantID, month).First(&billing).Error
	if err != nil {
		return nil, err
	}
	return &billing, nil
}

func (r *tenantBillingRepository) Update(billing *domain.TenantBilling) error {
	return r.db.Save(billing).Error
}

func (r *tenantBillingRepository) FindAll(limit, offset int) ([]domain.TenantBilling, int64, error) {
	var bills []domain.TenantBilling
	var total int64

	query := r.db.Model(&domain.TenantBilling{})
	query.Count(&total)

	err := query.Preload("Tenant").
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&bills).Error

	return bills, total, err
}

func (r *tenantBillingRepository) FindByTenantID(tenantID uuid.UUID, limit, offset int) ([]domain.TenantBilling, int64, error) {
	var bills []domain.TenantBilling
	var total int64

	query := r.db.Model(&domain.TenantBilling{}).Where("tenant_id = ?", tenantID)
	query.Count(&total)

	err := query.Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&bills).Error

	return bills, total, err
}

func (r *tenantBillingRepository) GetUnpaidPastDue() ([]domain.TenantBilling, error) {
	var bills []domain.TenantBilling
	err := r.db.Where("status IN ?", []string{"unpaid", "past_due"}).Find(&bills).Error
	return bills, err
}
