package handler

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/codapos/backend/internal/middleware"
	"github.com/codapos/backend/internal/usecase"
	"github.com/codapos/backend/pkg/response"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type OutletHandler struct {
	outletUsecase *usecase.OutletUsecase
}

func NewOutletHandler(ou *usecase.OutletUsecase) *OutletHandler {
	return &OutletHandler{outletUsecase: ou}
}

func (h *OutletHandler) CreateOutlet(c *fiber.Ctx) error {
	var outlet domain.Outlet
	if err := c.BodyParser(&outlet); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	outlet.TenantID = middleware.GetTenantID(c)
	if outlet.Name == "" || outlet.Code == "" {
		return response.BadRequest(c, "name and code are required")
	}
	if err := h.outletUsecase.CreateOutlet(&outlet); err != nil {
		return response.InternalError(c, "failed to create outlet")
	}
	return response.Created(c, outlet, "outlet created successfully")
}

func (h *OutletHandler) GetOutlets(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	outlets, err := h.outletUsecase.GetOutlets(tenantID)
	if err != nil {
		return response.InternalError(c, "failed to fetch outlets")
	}
	return response.Success(c, outlets, "")
}

func (h *OutletHandler) GetOutlet(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid outlet ID")
	}
	outlet, err := h.outletUsecase.GetOutlet(id)
	if err != nil {
		return response.NotFound(c, "outlet not found")
	}
	return response.Success(c, outlet, "")
}

func (h *OutletHandler) UpdateOutlet(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid outlet ID")
	}
	var outlet domain.Outlet
	if err := c.BodyParser(&outlet); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	outlet.ID = id
	outlet.TenantID = middleware.GetTenantID(c)
	if err := h.outletUsecase.UpdateOutlet(&outlet); err != nil {
		return response.InternalError(c, "failed to update outlet")
	}
	return response.Success(c, outlet, "outlet updated successfully")
}

func (h *OutletHandler) DeleteOutlet(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid outlet ID")
	}
	if err := h.outletUsecase.DeleteOutlet(id); err != nil {
		return response.InternalError(c, "failed to delete outlet")
	}
	return response.Success(c, nil, "outlet deleted successfully")
}
