package handler

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/codapos/backend/internal/middleware"
	"github.com/codapos/backend/internal/usecase"
	"github.com/codapos/backend/pkg/response"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type UserHandler struct {
	usecase *usecase.UserUsecase
}

func NewUserHandler(uc *usecase.UserUsecase) *UserHandler {
	return &UserHandler{usecase: uc}
}

func (h *UserHandler) RegisterRoutes(api fiber.Router) {
	// GET /me — any authenticated user
	api.Get("/me", h.GetProfile)
	// PUT /me — update own profile
	api.Put("/me", h.UpdateProfile)
	// PUT /me/password — change own password
	api.Put("/me/password", h.ChangePassword)
	// PUT /me/merchant — update merchant info
	api.Put("/me/merchant", h.UpdateMerchant)

	// Team management (owner only via PermissionMiddleware in main.go)
	users := api.Group("/users", middleware.PermissionMiddleware(middleware.ActionManageUsers))
	users.Get("", h.ListTeam)
	users.Post("/invite", h.InviteUser)
	users.Put("/:id/role", h.UpdateRole)
	users.Put("/:id/toggle", h.ToggleActive)
}

// GetProfile returns the authenticated user's profile
func (h *UserHandler) GetProfile(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	user, err := h.usecase.GetProfile(userID)
	if err != nil {
		return response.NotFound(c, err.Error())
	}
	return response.Success(c, user, "profile loaded")
}

// UpdateProfile updates the authenticated user's profile
func (h *UserHandler) UpdateProfile(c *fiber.Ctx) error {
	var req domain.UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	userID := middleware.GetUserID(c)
	user, err := h.usecase.UpdateProfile(userID, req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Success(c, user, "profile updated")
}

// ChangePassword changes the authenticated user's password
func (h *UserHandler) ChangePassword(c *fiber.Ctx) error {
	var req domain.ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	userID := middleware.GetUserID(c)
	if err := h.usecase.ChangePassword(userID, req); err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Success(c, nil, "password changed successfully")
}

// UpdateMerchant updates the tenant/merchant info
func (h *UserHandler) UpdateMerchant(c *fiber.Ctx) error {
	var req domain.UpdateMerchantRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	tenantID := middleware.GetTenantID(c)
	tenant, err := h.usecase.UpdateMerchant(tenantID, req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Success(c, tenant, "merchant info updated")
}

// ListTeam returns all team members for the current tenant
func (h *UserHandler) ListTeam(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	users, err := h.usecase.GetTeamMembers(tenantID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, users, "team members listed")
}

// InviteUser creates a new team member
func (h *UserHandler) InviteUser(c *fiber.Ctx) error {
	var req domain.InviteUserRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	if req.Email == "" || req.FullName == "" || req.Role == "" || req.TempPassword == "" {
		return response.BadRequest(c, "email, full_name, role, and temp_password are required")
	}

	tenantID := middleware.GetTenantID(c)
	user, err := h.usecase.InviteUser(tenantID, req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}

	return response.Created(c, user, "user invited successfully")
}

// UpdateRole changes a team member's role
func (h *UserHandler) UpdateRole(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid user ID")
	}

	var body struct {
		Role string `json:"role"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	tenantID := middleware.GetTenantID(c)
	if err := h.usecase.UpdateUserRole(tenantID, id, body.Role); err != nil {
		return response.BadRequest(c, err.Error())
	}

	return response.Success(c, fiber.Map{"message": "role updated"}, "ok")
}

// ToggleActive toggles a team member's active status
func (h *UserHandler) ToggleActive(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid user ID")
	}

	tenantID := middleware.GetTenantID(c)
	if err := h.usecase.DeactivateUser(tenantID, id); err != nil {
		return response.BadRequest(c, err.Error())
	}

	return response.Success(c, fiber.Map{"message": "user status toggled"}, "ok")
}
