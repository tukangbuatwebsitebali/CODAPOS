package repository

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type outletRepo struct {
	db *gorm.DB
}

func NewOutletRepository(db *gorm.DB) domain.OutletRepository {
	return &outletRepo{db: db}
}

func (r *outletRepo) Create(outlet *domain.Outlet) error {
	return r.db.Create(outlet).Error
}

func (r *outletRepo) FindByID(id uuid.UUID) (*domain.Outlet, error) {
	var outlet domain.Outlet
	err := r.db.Preload("Brand").Preload("Region").Where("id = ?", id).First(&outlet).Error
	if err != nil {
		return nil, err
	}
	return &outlet, nil
}

func (r *outletRepo) FindByTenantID(tenantID uuid.UUID) ([]domain.Outlet, error) {
	var outlets []domain.Outlet
	err := r.db.Preload("Brand").Preload("Region").Where("tenant_id = ?", tenantID).Find(&outlets).Error
	return outlets, err
}

func (r *outletRepo) FindByCode(code string) (*domain.Outlet, error) {
	var outlet domain.Outlet
	err := r.db.Where("code = ?", code).First(&outlet).Error
	if err != nil {
		return nil, err
	}
	return &outlet, nil
}

func (r *outletRepo) Update(outlet *domain.Outlet) error {
	return r.db.Save(outlet).Error
}

func (r *outletRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&domain.Outlet{}, id).Error
}
