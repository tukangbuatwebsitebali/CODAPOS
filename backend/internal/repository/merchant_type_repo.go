package repository

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type merchantTypeRepo struct {
	db *gorm.DB
}

func NewMerchantTypeRepository(db *gorm.DB) domain.MerchantTypeRepository {
	return &merchantTypeRepo{db: db}
}

func (r *merchantTypeRepo) Create(mt *domain.MerchantType) error {
	return r.db.Create(mt).Error
}

func (r *merchantTypeRepo) FindByID(id uuid.UUID) (*domain.MerchantType, error) {
	var mt domain.MerchantType
	err := r.db.Where("id = ?", id).First(&mt).Error
	if err != nil {
		return nil, err
	}
	return &mt, nil
}

func (r *merchantTypeRepo) FindBySlug(slug string) (*domain.MerchantType, error) {
	var mt domain.MerchantType
	err := r.db.Where("slug = ?", slug).First(&mt).Error
	if err != nil {
		return nil, err
	}
	return &mt, nil
}

func (r *merchantTypeRepo) FindAll() ([]domain.MerchantType, error) {
	var types []domain.MerchantType
	err := r.db.Where("is_active = ?", true).Order("name ASC").Find(&types).Error
	return types, err
}

func (r *merchantTypeRepo) Update(mt *domain.MerchantType) error {
	return r.db.Save(mt).Error
}

func (r *merchantTypeRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&domain.MerchantType{}, id).Error
}
