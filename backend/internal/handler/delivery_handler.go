package handler

import (
	"strconv"

	"github.com/codapos/backend/internal/domain"
	"github.com/codapos/backend/internal/middleware"
	"github.com/codapos/backend/internal/usecase"
	"github.com/codapos/backend/pkg/response"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type DeliveryHandler struct {
	usecase *usecase.DeliveryUsecase
}

func NewDeliveryHandler(uc *usecase.DeliveryUsecase) *DeliveryHandler {
	return &DeliveryHandler{usecase: uc}
}

// RegisterRoutes registers delivery routes
func (h *DeliveryHandler) RegisterRoutes(api fiber.Router) {
	delivery := api.Group("/delivery")

	// Orders
	delivery.Post("/orders", h.CreateOrder)
	delivery.Get("/orders", h.ListOrders)
	delivery.Get("/orders/:id", h.GetOrder)
	delivery.Put("/orders/:id/status", h.UpdateStatus)
	delivery.Put("/orders/:id/assign", h.AssignDriver)

	// Drivers
	delivery.Post("/drivers", h.RegisterDriver)
	delivery.Get("/drivers", h.ListDrivers)
	delivery.Get("/drivers/available", h.AvailableDrivers)
	delivery.Put("/drivers/toggle-online", h.ToggleOnline)
	delivery.Put("/drivers/location", h.UpdateLocation)
}

// CreateOrder creates a delivery order
func (h *DeliveryHandler) CreateOrder(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	var req domain.CreateDeliveryRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	order, err := h.usecase.CreateOrder(tenantID, req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Created(c, order, "delivery order created")
}

// ListOrders returns delivery orders
func (h *DeliveryHandler) ListOrders(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	status := c.Query("status")
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	orders, total, err := h.usecase.GetOrders(tenantID, status, limit, offset)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, fiber.Map{"orders": orders, "total": total}, "delivery orders loaded")
}

// GetOrder returns a single delivery order
func (h *DeliveryHandler) GetOrder(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid order ID")
	}
	order, err := h.usecase.GetOrderByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, "order not found")
	}
	return response.Success(c, order, "order loaded")
}

// UpdateStatus updates delivery status
func (h *DeliveryHandler) UpdateStatus(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid order ID")
	}
	var req domain.UpdateDeliveryStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	order, err := h.usecase.UpdateOrderStatus(id, req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Success(c, order, "status updated")
}

// AssignDriver assigns a driver to an order
func (h *DeliveryHandler) AssignDriver(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid order ID")
	}
	var req struct {
		DriverID string `json:"driver_id"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	driverID, err := uuid.Parse(req.DriverID)
	if err != nil {
		return response.BadRequest(c, "invalid driver ID")
	}
	order, err := h.usecase.AssignDriver(id, driverID)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Success(c, order, "driver assigned")
}

// RegisterDriver registers a driver
func (h *DeliveryHandler) RegisterDriver(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	var req domain.RegisterDriverRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	driver, err := h.usecase.RegisterDriver(tenantID, req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Created(c, driver, "driver registered")
}

// ListDrivers returns all drivers
func (h *DeliveryHandler) ListDrivers(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	drivers, err := h.usecase.GetDrivers(tenantID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, drivers, "drivers loaded")
}

// AvailableDrivers returns available drivers
func (h *DeliveryHandler) AvailableDrivers(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	drivers, err := h.usecase.GetAvailableDrivers(tenantID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, drivers, "available drivers loaded")
}

// ToggleOnline toggles driver online status
func (h *DeliveryHandler) ToggleOnline(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	driver, err := h.usecase.ToggleDriverOnline(userID)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Success(c, driver, "driver status updated")
}

// UpdateLocation updates driver GPS location
func (h *DeliveryHandler) UpdateLocation(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	var req domain.UpdateDriverLocationRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if err := h.usecase.UpdateDriverLocation(userID, req.Lat, req.Lng); err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Success(c, nil, "location updated")
}
