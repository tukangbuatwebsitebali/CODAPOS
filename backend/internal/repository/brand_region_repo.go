package repository

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type brandRepo struct {
	db *gorm.DB
}

func NewBrandRepository(db *gorm.DB) domain.BrandRepository {
	return &brandRepo{db: db}
}

func (r *brandRepo) Create(brand *domain.Brand) error {
	return r.db.Create(brand).Error
}

func (r *brandRepo) FindByID(id uuid.UUID) (*domain.Brand, error) {
	var brand domain.Brand
	err := r.db.Where("id = ?", id).First(&brand).Error
	if err != nil {
		return nil, err
	}
	return &brand, nil
}

func (r *brandRepo) FindByTenantID(tenantID uuid.UUID) ([]domain.Brand, error) {
	var brands []domain.Brand
	err := r.db.Where("tenant_id = ?", tenantID).Find(&brands).Error
	return brands, err
}

func (r *brandRepo) Update(brand *domain.Brand) error {
	return r.db.Save(brand).Error
}

func (r *brandRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&domain.Brand{}, id).Error
}

type regionRepo struct {
	db *gorm.DB
}

func NewRegionRepository(db *gorm.DB) domain.RegionRepository {
	return &regionRepo{db: db}
}

func (r *regionRepo) Create(region *domain.Region) error {
	return r.db.Create(region).Error
}

func (r *regionRepo) FindByID(id uuid.UUID) (*domain.Region, error) {
	var region domain.Region
	err := r.db.Preload("Children").Where("id = ?", id).First(&region).Error
	if err != nil {
		return nil, err
	}
	return &region, nil
}

func (r *regionRepo) FindByTenantID(tenantID uuid.UUID) ([]domain.Region, error) {
	var regions []domain.Region
	err := r.db.Where("tenant_id = ?", tenantID).Find(&regions).Error
	return regions, err
}

func (r *regionRepo) Update(region *domain.Region) error {
	return r.db.Save(region).Error
}

func (r *regionRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&domain.Region{}, id).Error
}
