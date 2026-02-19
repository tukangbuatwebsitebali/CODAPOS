package handler

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/codapos/backend/internal/middleware"
	"github.com/codapos/backend/internal/usecase"
	"github.com/codapos/backend/pkg/response"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ProductHandler struct {
	productUsecase *usecase.ProductUsecase
}

func NewProductHandler(pu *usecase.ProductUsecase) *ProductHandler {
	return &ProductHandler{productUsecase: pu}
}

// CreateProduct creates a new product
func (h *ProductHandler) CreateProduct(c *fiber.Ctx) error {
	var product domain.Product
	if err := c.BodyParser(&product); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	product.TenantID = middleware.GetTenantID(c)
	if product.Name == "" {
		return response.BadRequest(c, "product name is required")
	}

	if err := h.productUsecase.CreateProduct(&product); err != nil {
		return response.InternalError(c, "failed to create product")
	}

	return response.Created(c, product, "product created successfully")
}

// GetProducts returns all products for a tenant
func (h *ProductHandler) GetProducts(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	search := c.Query("search")

	var categoryID *uuid.UUID
	if cid := c.Query("category_id"); cid != "" {
		parsed, err := uuid.Parse(cid)
		if err == nil {
			categoryID = &parsed
		}
	}

	products, err := h.productUsecase.GetProducts(tenantID, search, categoryID)
	if err != nil {
		return response.InternalError(c, "failed to fetch products")
	}

	return response.Success(c, products, "")
}

// GetProduct returns a single product
func (h *ProductHandler) GetProduct(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid product ID")
	}

	product, err := h.productUsecase.GetProduct(id)
	if err != nil {
		return response.NotFound(c, "product not found")
	}

	return response.Success(c, product, "")
}

// UpdateProduct updates a product
func (h *ProductHandler) UpdateProduct(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid product ID")
	}

	var product domain.Product
	if err := c.BodyParser(&product); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	product.ID = id
	product.TenantID = middleware.GetTenantID(c)

	if err := h.productUsecase.UpdateProduct(&product); err != nil {
		return response.InternalError(c, "failed to update product")
	}

	return response.Success(c, product, "product updated successfully")
}

// DeleteProduct deletes a product
func (h *ProductHandler) DeleteProduct(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid product ID")
	}

	if err := h.productUsecase.DeleteProduct(id); err != nil {
		return response.InternalError(c, "failed to delete product")
	}

	return response.Success(c, nil, "product deleted successfully")
}

// --- Category endpoints ---

func (h *ProductHandler) CreateCategory(c *fiber.Ctx) error {
	var category domain.Category
	if err := c.BodyParser(&category); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	category.TenantID = middleware.GetTenantID(c)
	if category.Name == "" {
		return response.BadRequest(c, "category name is required")
	}

	if err := h.productUsecase.CreateCategory(&category); err != nil {
		return response.InternalError(c, "failed to create category")
	}

	return response.Created(c, category, "category created successfully")
}

func (h *ProductHandler) GetCategories(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	categories, err := h.productUsecase.GetCategories(tenantID)
	if err != nil {
		return response.InternalError(c, "failed to fetch categories")
	}
	return response.Success(c, categories, "")
}

func (h *ProductHandler) UpdateCategory(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid category ID")
	}

	var category domain.Category
	if err := c.BodyParser(&category); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	category.ID = id
	category.TenantID = middleware.GetTenantID(c)

	if err := h.productUsecase.UpdateCategory(&category); err != nil {
		return response.InternalError(c, "failed to update category")
	}

	return response.Success(c, category, "category updated successfully")
}

func (h *ProductHandler) DeleteCategory(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid category ID")
	}

	if err := h.productUsecase.DeleteCategory(id); err != nil {
		return response.InternalError(c, "failed to delete category")
	}

	return response.Success(c, nil, "category deleted successfully")
}
