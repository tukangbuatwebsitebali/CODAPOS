package handler

import (
	"strconv"

	"github.com/codapos/backend/internal/middleware"
	"github.com/codapos/backend/internal/usecase"
	"github.com/codapos/backend/pkg/response"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type InventoryHandler struct {
	usecase *usecase.InventoryUsecase
}

func NewInventoryHandler(iu *usecase.InventoryUsecase) *InventoryHandler {
	return &InventoryHandler{usecase: iu}
}

// GetStock lists inventory for an outlet
func (h *InventoryHandler) GetStock(c *fiber.Ctx) error {
	outletID, err := uuid.Parse(c.Query("outlet_id"))
	if err != nil {
		return response.BadRequest(c, "outlet_id is required")
	}

	inventory, err := h.usecase.GetStockByOutlet(outletID)
	if err != nil {
		return response.InternalError(c, "failed to fetch inventory")
	}

	return response.Success(c, inventory, "")
}

// GetLowStock returns items below min_stock
func (h *InventoryHandler) GetLowStock(c *fiber.Ctx) error {
	outletID, err := uuid.Parse(c.Query("outlet_id"))
	if err != nil {
		return response.BadRequest(c, "outlet_id is required")
	}

	inventory, err := h.usecase.GetLowStock(outletID)
	if err != nil {
		return response.InternalError(c, "failed to fetch low stock items")
	}

	return response.Success(c, inventory, "")
}

// AdjustStock adjusts stock by a delta amount (+/-)
func (h *InventoryHandler) AdjustStock(c *fiber.Ctx) error {
	var req struct {
		OutletID  string  `json:"outlet_id"`
		ProductID string  `json:"product_id"`
		VariantID *string `json:"variant_id,omitempty"`
		Delta     float64 `json:"delta"`
		Notes     string  `json:"notes"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	outletID, err := uuid.Parse(req.OutletID)
	if err != nil {
		return response.BadRequest(c, "invalid outlet_id")
	}
	productID, err := uuid.Parse(req.ProductID)
	if err != nil {
		return response.BadRequest(c, "invalid product_id")
	}

	var variantID *uuid.UUID
	if req.VariantID != nil && *req.VariantID != "" {
		parsed, err := uuid.Parse(*req.VariantID)
		if err == nil {
			variantID = &parsed
		}
	}

	userID := middleware.GetUserID(c)

	if err := h.usecase.AdjustStock(outletID, productID, variantID, req.Delta, req.Notes, &userID); err != nil {
		return response.InternalError(c, "failed to adjust stock")
	}

	return response.Success(c, nil, "stock adjusted successfully")
}

// SetStock sets stock to an absolute value
func (h *InventoryHandler) SetStock(c *fiber.Ctx) error {
	var req struct {
		OutletID  string  `json:"outlet_id"`
		ProductID string  `json:"product_id"`
		VariantID *string `json:"variant_id,omitempty"`
		Quantity  float64 `json:"quantity"`
		Notes     string  `json:"notes"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	outletID, err := uuid.Parse(req.OutletID)
	if err != nil {
		return response.BadRequest(c, "invalid outlet_id")
	}
	productID, err := uuid.Parse(req.ProductID)
	if err != nil {
		return response.BadRequest(c, "invalid product_id")
	}

	var variantID *uuid.UUID
	if req.VariantID != nil && *req.VariantID != "" {
		parsed, err := uuid.Parse(*req.VariantID)
		if err == nil {
			variantID = &parsed
		}
	}

	userID := middleware.GetUserID(c)

	if err := h.usecase.SetStock(outletID, productID, variantID, req.Quantity, req.Notes, &userID); err != nil {
		return response.InternalError(c, "failed to set stock")
	}

	return response.Success(c, nil, "stock set successfully")
}

// GetMovements returns stock movement history
func (h *InventoryHandler) GetMovements(c *fiber.Ctx) error {
	outletID, err := uuid.Parse(c.Query("outlet_id"))
	if err != nil {
		return response.BadRequest(c, "outlet_id is required")
	}

	var productID *uuid.UUID
	if pid := c.Query("product_id"); pid != "" {
		parsed, err := uuid.Parse(pid)
		if err == nil {
			productID = &parsed
		}
	}

	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	movements, err := h.usecase.GetMovements(outletID, productID, limit)
	if err != nil {
		return response.InternalError(c, "failed to fetch movements")
	}

	return response.Success(c, movements, "")
}
