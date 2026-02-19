package handler

import (
	"github.com/codapos/backend/internal/middleware"
	"github.com/codapos/backend/internal/usecase"
	"github.com/codapos/backend/pkg/response"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type SubscriptionHandler struct {
	usecase *usecase.SubscriptionUsecase
}

func NewSubscriptionHandler(uc *usecase.SubscriptionUsecase) *SubscriptionHandler {
	return &SubscriptionHandler{usecase: uc}
}

// RegisterPublicRoutes registers public plan listing
func (h *SubscriptionHandler) RegisterPublicRoutes(api fiber.Router) {
	api.Get("/plans", h.ListPlans)
}

// RegisterRoutes registers protected subscription routes
func (h *SubscriptionHandler) RegisterRoutes(api fiber.Router) {
	sub := api.Group("/subscription")
	sub.Get("/status", h.GetStatus)
	sub.Post("/upgrade", h.UpgradePlan)
}

// ListPlans returns all available plans (public)
func (h *SubscriptionHandler) ListPlans(c *fiber.Ctx) error {
	plans, err := h.usecase.GetPlans()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, plans, "plans loaded")
}

// GetStatus returns current subscription status for the tenant
func (h *SubscriptionHandler) GetStatus(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	status, err := h.usecase.GetSubscriptionStatus(tenantID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, status, "subscription status loaded")
}

// UpgradePlan handles plan upgrade
func (h *SubscriptionHandler) UpgradePlan(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)

	var req struct {
		PlanID       string `json:"plan_id"`
		BillingCycle string `json:"billing_cycle"` // "monthly" or "yearly"
	}
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	planID, err := uuid.Parse(req.PlanID)
	if err != nil {
		return response.BadRequest(c, "invalid plan ID")
	}

	if req.BillingCycle == "" {
		req.BillingCycle = "monthly"
	}

	sub, err := h.usecase.UpgradePlan(tenantID, planID, req.BillingCycle)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}

	return response.Success(c, sub, "plan upgraded successfully")
}
