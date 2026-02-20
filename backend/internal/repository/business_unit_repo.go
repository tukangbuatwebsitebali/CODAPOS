package repository

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type businessUnitRepo struct {
	db *gorm.DB
}

func NewBusinessUnitRepository(db *gorm.DB) domain.BusinessUnitRepository {
	return &businessUnitRepo{db: db}
}

func (r *businessUnitRepo) Create(bu *domain.BusinessUnit) error {
	return r.db.Create(bu).Error
}

func (r *businessUnitRepo) FindByMerchantTypeID(merchantTypeID uuid.UUID) ([]domain.BusinessUnit, error) {
	var units []domain.BusinessUnit
	err := r.db.Where("merchant_type_id = ?", merchantTypeID).Order("sort_order ASC").Find(&units).Error
	return units, err
}

func (r *businessUnitRepo) FindByMerchantTypeSlug(slug string) ([]domain.BusinessUnit, error) {
	var mt domain.MerchantType
	if err := r.db.Where("slug = ?", slug).First(&mt).Error; err != nil {
		return nil, err
	}
	var units []domain.BusinessUnit
	err := r.db.Where("merchant_type_id = ?", mt.ID).Order("sort_order ASC").Find(&units).Error
	return units, err
}

func (r *businessUnitRepo) FindAll() ([]domain.BusinessUnit, error) {
	var units []domain.BusinessUnit
	err := r.db.Preload("MerchantType").Order("sort_order ASC").Find(&units).Error
	return units, err
}
