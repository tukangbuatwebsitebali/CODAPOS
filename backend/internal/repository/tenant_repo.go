package repository

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type tenantRepo struct {
	db *gorm.DB
}

func NewTenantRepository(db *gorm.DB) domain.TenantRepository {
	return &tenantRepo{db: db}
}

func (r *tenantRepo) Create(tenant *domain.Tenant) error {
	return r.db.Create(tenant).Error
}

func (r *tenantRepo) FindByID(id uuid.UUID) (*domain.Tenant, error) {
	var tenant domain.Tenant
	err := r.db.Where("id = ?", id).First(&tenant).Error
	if err != nil {
		return nil, err
	}
	return &tenant, nil
}

func (r *tenantRepo) FindBySlug(slug string) (*domain.Tenant, error) {
	var tenant domain.Tenant
	err := r.db.Where("slug = ?", slug).First(&tenant).Error
	if err != nil {
		return nil, err
	}
	return &tenant, nil
}

func (r *tenantRepo) Update(tenant *domain.Tenant) error {
	return r.db.Save(tenant).Error
}

func (r *tenantRepo) FindAll(limit, offset int) ([]domain.Tenant, int64, error) {
	var tenants []domain.Tenant
	var total int64
	r.db.Model(&domain.Tenant{}).Count(&total)
	err := r.db.Preload("MerchantType").Order("created_at DESC").Limit(limit).Offset(offset).Find(&tenants).Error
	return tenants, total, err
}

func (r *tenantRepo) FindAllActive() ([]domain.Tenant, error) {
	var tenants []domain.Tenant
	err := r.db.Where("is_enabled = ?", true).Find(&tenants).Error
	return tenants, err
}

func (r *tenantRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&domain.Tenant{}, id).Error
}
