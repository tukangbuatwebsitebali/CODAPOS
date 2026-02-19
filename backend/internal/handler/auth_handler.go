package handler

import (
	"strings"

	"github.com/codapos/backend/internal/domain"
	"github.com/codapos/backend/internal/usecase"
	"github.com/codapos/backend/pkg/response"
	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authUsecase       *usecase.AuthUsecase
	accountingUsecase *usecase.AccountingUsecase
	tenantRepo        domain.TenantRepository
}

func NewAuthHandler(au *usecase.AuthUsecase, acu *usecase.AccountingUsecase, tr domain.TenantRepository) *AuthHandler {
	return &AuthHandler{authUsecase: au, accountingUsecase: acu, tenantRepo: tr}
}

// Register handles tenant + user registration
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req domain.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	if req.Email == "" || req.Password == "" || req.TenantName == "" || req.TenantSlug == "" || req.FullName == "" {
		return response.BadRequest(c, "all fields are required")
	}

	result, err := h.authUsecase.Register(req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}

	// Initialize default Chart of Accounts for the new tenant
	go h.accountingUsecase.InitializeDefaultCOA(result.User.TenantID)

	return response.Created(c, result, "registration successful")
}

// Login handles user authentication
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req domain.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	if req.Email == "" || req.Password == "" {
		return response.BadRequest(c, "email and password are required")
	}

	result, err := h.authUsecase.Login(req)
	if err != nil {
		return response.Unauthorized(c, err.Error())
	}

	return response.Success(c, result, "login successful")
}

// CheckSlug checks if a tenant slug/subdomain is available
func (h *AuthHandler) CheckSlug(c *fiber.Ctx) error {
	slug := strings.TrimSpace(c.Query("slug"))
	if slug == "" {
		return response.BadRequest(c, "slug is required")
	}

	slug = strings.ToLower(strings.ReplaceAll(slug, " ", "-"))

	existing, _ := h.tenantRepo.FindBySlug(slug)
	available := existing == nil

	return c.JSON(fiber.Map{
		"success":   true,
		"slug":      slug,
		"available": available,
	})
}
