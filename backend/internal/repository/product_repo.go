package repository

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type productRepo struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) domain.ProductRepository {
	return &productRepo{db: db}
}

func (r *productRepo) Create(product *domain.Product) error {
	return r.db.Create(product).Error
}

func (r *productRepo) FindByID(id uuid.UUID) (*domain.Product, error) {
	var product domain.Product
	err := r.db.
		Preload("Category").
		Preload("Variants").
		Preload("ModifierGroups.Modifiers").
		Where("id = ?", id).
		First(&product).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepo) FindByTenantID(tenantID uuid.UUID, search string, categoryID *uuid.UUID) ([]domain.Product, error) {
	var products []domain.Product
	query := r.db.
		Preload("Category").
		Preload("Variants").
		Where("tenant_id = ? AND is_active = ?", tenantID, true)

	if search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}
	if categoryID != nil {
		query = query.Where("category_id = ?", *categoryID)
	}

	err := query.Order("sort_order ASC, name ASC").Find(&products).Error
	return products, err
}

func (r *productRepo) Update(product *domain.Product) error {
	return r.db.Save(product).Error
}

func (r *productRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&domain.Product{}, id).Error
}
