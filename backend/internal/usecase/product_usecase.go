package usecase

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
)

type ProductUsecase struct {
	productRepo  domain.ProductRepository
	categoryRepo domain.CategoryRepository
}

func NewProductUsecase(pr domain.ProductRepository, cr domain.CategoryRepository) *ProductUsecase {
	return &ProductUsecase{productRepo: pr, categoryRepo: cr}
}

// CreateProduct creates a new product
func (u *ProductUsecase) CreateProduct(product *domain.Product) error {
	return u.productRepo.Create(product)
}

// GetProducts returns products for a tenant with optional search and category filter
func (u *ProductUsecase) GetProducts(tenantID uuid.UUID, search string, categoryID *uuid.UUID) ([]domain.Product, error) {
	return u.productRepo.FindByTenantID(tenantID, search, categoryID)
}

// GetProduct returns a single product
func (u *ProductUsecase) GetProduct(id uuid.UUID) (*domain.Product, error) {
	return u.productRepo.FindByID(id)
}

// UpdateProduct updates a product
func (u *ProductUsecase) UpdateProduct(product *domain.Product) error {
	return u.productRepo.Update(product)
}

// DeleteProduct deletes a product
func (u *ProductUsecase) DeleteProduct(id uuid.UUID) error {
	return u.productRepo.Delete(id)
}

// Category operations
func (u *ProductUsecase) CreateCategory(category *domain.Category) error {
	return u.categoryRepo.Create(category)
}

func (u *ProductUsecase) GetCategories(tenantID uuid.UUID) ([]domain.Category, error) {
	return u.categoryRepo.FindByTenantID(tenantID)
}

func (u *ProductUsecase) UpdateCategory(category *domain.Category) error {
	return u.categoryRepo.Update(category)
}

func (u *ProductUsecase) DeleteCategory(id uuid.UUID) error {
	return u.categoryRepo.Delete(id)
}
