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

type CustomerHandler struct {
	usecase *usecase.CustomerUsecase
}

func NewCustomerHandler(uc *usecase.CustomerUsecase) *CustomerHandler {
	return &CustomerHandler{usecase: uc}
}

// RegisterRoutes registers protected customer routes
func (h *CustomerHandler) RegisterRoutes(api fiber.Router) {
	customers := api.Group("/customers")
	customers.Post("/", h.Create)
	customers.Get("/", h.List)
	customers.Get("/:id", h.GetByID)
	customers.Put("/:id", h.Update)
	customers.Post("/:id/addresses", h.AddAddress)
	customers.Get("/:id/addresses", h.GetAddresses)
	customers.Put("/addresses/:addressId", h.UpdateAddress)
	customers.Delete("/addresses/:addressId", h.DeleteAddress)
}

// RegisterPublicRoutes registers the public customer signup route
func (h *CustomerHandler) RegisterPublicRoutes(api fiber.Router) {
	api.Post("/customers/signup", h.SignUp)
}

// Create creates a new customer (merchant-side)
func (h *CustomerHandler) Create(c *fiber.Ctx) error {
	var req domain.CreateCustomerRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	if req.Name == "" || req.Phone == "" {
		return response.BadRequest(c, "name and phone are required")
	}

	tenantID := middleware.GetTenantID(c)
	customer, err := h.usecase.CreateCustomer(tenantID, req)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, customer, "customer created")
}

// SignUp handles public customer self-registration
func (h *CustomerHandler) SignUp(c *fiber.Ctx) error {
	var req domain.CustomerSignUpRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	if req.TenantSlug == "" || req.Name == "" || req.Phone == "" {
		return response.BadRequest(c, "tenant_slug, name, and phone are required")
	}

	customer, err := h.usecase.SignUpCustomer(req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}

	return response.Created(c, customer, "registration successful")
}

// List returns customers for the current merchant
func (h *CustomerHandler) List(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	customers, total, err := h.usecase.GetCustomersByTenant(tenantID, limit, offset)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    customers,
		"total":   total,
	})
}

// GetByID returns a single customer
func (h *CustomerHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid customer ID")
	}

	customer, err := h.usecase.GetCustomerByID(id)
	if err != nil {
		return response.NotFound(c, "customer not found")
	}

	return response.Success(c, customer, "customer found")
}

// Update updates a customer profile
func (h *CustomerHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid customer ID")
	}

	var req domain.UpdateCustomerRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	customer, err := h.usecase.UpdateCustomer(id, req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}

	return response.Success(c, customer, "customer updated")
}

// AddAddress adds a new address to a customer
func (h *CustomerHandler) AddAddress(c *fiber.Ctx) error {
	customerID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid customer ID")
	}

	var req domain.AddAddressRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	if req.FullAddress == "" {
		return response.BadRequest(c, "full_address is required")
	}

	address, err := h.usecase.AddAddress(customerID, req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}

	return response.Created(c, address, "address added")
}

// GetAddresses returns all addresses for a customer
func (h *CustomerHandler) GetAddresses(c *fiber.Ctx) error {
	customerID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid customer ID")
	}

	addresses, err := h.usecase.GetAddressesByCustomerID(customerID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, addresses, "addresses loaded")
}

// UpdateAddress updates an existing address
func (h *CustomerHandler) UpdateAddress(c *fiber.Ctx) error {
	addressID, err := uuid.Parse(c.Params("addressId"))
	if err != nil {
		return response.BadRequest(c, "invalid address ID")
	}

	var req domain.AddAddressRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	if err := h.usecase.UpdateAddress(addressID, req); err != nil {
		return response.BadRequest(c, err.Error())
	}

	return response.Success(c, fiber.Map{"message": "address updated"}, "ok")
}

// DeleteAddress removes an address
func (h *CustomerHandler) DeleteAddress(c *fiber.Ctx) error {
	addressID, err := uuid.Parse(c.Params("addressId"))
	if err != nil {
		return response.BadRequest(c, "invalid address ID")
	}

	if err := h.usecase.DeleteAddress(addressID); err != nil {
		return response.BadRequest(c, err.Error())
	}

	return response.Success(c, fiber.Map{"message": "address deleted"}, "ok")
}
