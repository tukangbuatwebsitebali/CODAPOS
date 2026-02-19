package repository

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type categoryRepo struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) domain.CategoryRepository {
	return &categoryRepo{db: db}
}

func (r *categoryRepo) Create(category *domain.Category) error {
	return r.db.Create(category).Error
}

func (r *categoryRepo) FindByID(id uuid.UUID) (*domain.Category, error) {
	var category domain.Category
	err := r.db.Preload("Children").Where("id = ?", id).First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepo) FindByTenantID(tenantID uuid.UUID) ([]domain.Category, error) {
	var categories []domain.Category
	err := r.db.Where("tenant_id = ?", tenantID).Order("sort_order ASC, name ASC").Find(&categories).Error
	return categories, err
}

func (r *categoryRepo) Update(category *domain.Category) error {
	return r.db.Save(category).Error
}

func (r *categoryRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&domain.Category{}, id).Error
}
