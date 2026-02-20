package handler

import (
	"strconv"

	"github.com/codapos/backend/internal/domain"
	"github.com/codapos/backend/internal/usecase"
	"github.com/codapos/backend/pkg/response"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type SuperAdminHandler struct {
	usecase *usecase.SuperAdminUsecase
}

func NewSuperAdminHandler(uc *usecase.SuperAdminUsecase) *SuperAdminHandler {
	return &SuperAdminHandler{usecase: uc}
}

func (h *SuperAdminHandler) RegisterRoutes(api fiber.Router) {
	admin := api.Group("/admin")

	// Merchants
	admin.Get("/merchants", h.ListMerchants)
	admin.Get("/merchants/:id", h.GetMerchant)
	admin.Put("/merchants/:id/toggle", h.ToggleMerchant)
	admin.Put("/merchants/:id/revenue-share", h.UpdateRevenueShare)
	admin.Put("/merchants/:id", h.UpdateMerchant)
	admin.Delete("/merchants/:id", h.DeleteMerchant)

	// Merchant Types
	admin.Get("/merchant-types", h.ListMerchantTypes)
	admin.Post("/merchant-types", h.CreateMerchantType)
	admin.Put("/merchant-types/:id", h.UpdateMerchantType)
	admin.Delete("/merchant-types/:id", h.DeleteMerchantType)

	// Feature Flags
	admin.Get("/merchants/:id/features", h.GetFeatureFlags)
	admin.Put("/merchants/:id/features", h.ToggleFeatureFlag)
	admin.Put("/merchants/:id/features/enable-all", h.EnableAllFeatures)

	// Global Config
	admin.Get("/config", h.GetGlobalConfigs)
	admin.Put("/config", h.SetGlobalConfig)

	// Role Permissions (RBAC)
	admin.Get("/role-permissions", h.GetRolePermissions)
	admin.Get("/role-permissions/:role", h.GetRolePermissionsByRole)
	admin.Put("/role-permissions", h.SetRolePermission)
	admin.Put("/role-permissions/bulk", h.BulkSetRolePermissions)

	// Revenue Analysis (MDR Margin + Penalty)
	admin.Get("/revenue/stats", h.GetRevenueStats)
	admin.Get("/revenue/merchants", h.GetRevenueByMerchant)
}

// ========================
// Merchants
// ========================

func (h *SuperAdminHandler) ListMerchants(c *fiber.Ctx) error {
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	merchants, total, err := h.usecase.GetAllMerchants(limit, offset)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    merchants,
		"total":   total,
	})
}

func (h *SuperAdminHandler) GetMerchant(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid merchant ID")
	}

	merchant, err := h.usecase.GetMerchantByID(id)
	if err != nil {
		return response.NotFound(c, "merchant not found")
	}

	return response.Success(c, merchant, "merchant found")
}

func (h *SuperAdminHandler) ToggleMerchant(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid merchant ID")
	}

	var body struct {
		Enabled bool `json:"enabled"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	if err := h.usecase.ToggleMerchant(id, body.Enabled); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.Map{"message": "merchant status updated"}, "ok")
}

func (h *SuperAdminHandler) UpdateRevenueShare(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid merchant ID")
	}

	var body struct {
		Pct float64 `json:"pct"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	if err := h.usecase.UpdateRevenueShare(id, body.Pct); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}

	return response.Success(c, fiber.Map{"message": "revenue share updated"}, "ok")
}

// UpdateMerchant updates a merchant's details
func (h *SuperAdminHandler) UpdateMerchant(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid merchant ID")
	}

	var body struct {
		Name             string  `json:"name"`
		Slug             string  `json:"slug"`
		Subdomain        string  `json:"subdomain"`
		SubscriptionPlan string  `json:"subscription_plan"`
		OpenTime         string  `json:"open_time"`
		CloseTime        string  `json:"close_time"`
		MerchantTypeID   *string `json:"merchant_type_id"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	var mtID *uuid.UUID
	if body.MerchantTypeID != nil && *body.MerchantTypeID != "" {
		parsed, err := uuid.Parse(*body.MerchantTypeID)
		if err == nil {
			mtID = &parsed
		}
	}

	if err := h.usecase.UpdateMerchant(id, body.Name, body.Slug, body.Subdomain, body.SubscriptionPlan, body.OpenTime, body.CloseTime, mtID); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}

	return response.Success(c, fiber.Map{"message": "merchant updated"}, "ok")
}

// DeleteMerchant deletes a merchant
func (h *SuperAdminHandler) DeleteMerchant(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid merchant ID")
	}

	if err := h.usecase.DeleteMerchant(id); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.Map{"message": "merchant deleted"}, "ok")
}

// ========================
// Merchant Types
// ========================

func (h *SuperAdminHandler) ListMerchantTypes(c *fiber.Ctx) error {
	types, err := h.usecase.GetMerchantTypes()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, types, "merchant types listed")
}

func (h *SuperAdminHandler) CreateMerchantType(c *fiber.Ctx) error {
	var body struct {
		Name string `json:"name"`
		Slug string `json:"slug"`
		Icon string `json:"icon"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	if body.Name == "" || body.Slug == "" {
		return response.BadRequest(c, "name and slug are required")
	}

	mt, err := h.usecase.CreateMerchantType(body.Name, body.Slug, body.Icon)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true, "data": mt,
	})
}

func (h *SuperAdminHandler) UpdateMerchantType(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid ID")
	}

	var body struct {
		Name string `json:"name"`
		Icon string `json:"icon"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	if err := h.usecase.UpdateMerchantType(id, body.Name, body.Icon); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}

	return response.Success(c, fiber.Map{"message": "merchant type updated"}, "ok")
}

func (h *SuperAdminHandler) DeleteMerchantType(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid ID")
	}

	if err := h.usecase.DeleteMerchantType(id); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.Map{"message": "merchant type deleted"}, "ok")
}

// ========================
// Feature Flags
// ========================

func (h *SuperAdminHandler) GetFeatureFlags(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid merchant ID")
	}

	flags, err := h.usecase.GetFeatureFlags(id)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, flags, "feature flags retrieved")
}

func (h *SuperAdminHandler) ToggleFeatureFlag(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid merchant ID")
	}

	var body struct {
		FeatureKey string `json:"feature_key"`
		Enabled    bool   `json:"enabled"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	if err := h.usecase.ToggleFeatureFlag(id, body.FeatureKey, body.Enabled); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.Map{"message": "feature flag updated"}, "ok")
}

func (h *SuperAdminHandler) EnableAllFeatures(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid merchant ID")
	}

	if err := h.usecase.EnableAllFeatures(id); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.Map{"message": "all features enabled (Pro upgrade)"}, "ok")
}

// ========================
// Global Config
// ========================

func (h *SuperAdminHandler) GetGlobalConfigs(c *fiber.Ctx) error {
	configs, err := h.usecase.GetGlobalConfigs()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, configs, "global configs retrieved")
}

func (h *SuperAdminHandler) SetGlobalConfig(c *fiber.Ctx) error {
	var body struct {
		Key         string `json:"key"`
		Value       string `json:"value"`
		Description string `json:"description"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	if body.Key == "" || body.Value == "" {
		return response.BadRequest(c, "key and value are required")
	}

	if err := h.usecase.SetGlobalConfig(body.Key, body.Value, body.Description); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.Map{"message": "global config updated"}, "ok")
}

// ========================
// Role Permissions (RBAC)
// ========================

func (h *SuperAdminHandler) GetRolePermissions(c *fiber.Ctx) error {
	perms, err := h.usecase.GetRolePermissions()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return c.JSON(fiber.Map{
		"success":       true,
		"data":          perms,
		"roles":         domain.AllMerchantRoles(),
		"actions":       domain.AllActions(),
		"role_labels":   domain.RoleLabels(),
		"action_labels": domain.ActionLabels(),
	})
}

func (h *SuperAdminHandler) GetRolePermissionsByRole(c *fiber.Ctx) error {
	role := c.Params("role")
	perms, err := h.usecase.GetRolePermissionsByRole(role)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, perms, "role permissions found")
}

func (h *SuperAdminHandler) SetRolePermission(c *fiber.Ctx) error {
	var body struct {
		Role      string `json:"role"`
		Action    string `json:"action"`
		IsAllowed bool   `json:"is_allowed"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if body.Role == "" || body.Action == "" {
		return response.BadRequest(c, "role and action are required")
	}

	if err := h.usecase.SetRolePermission(body.Role, body.Action, body.IsAllowed); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.Map{"message": "permission updated"}, "ok")
}

func (h *SuperAdminHandler) BulkSetRolePermissions(c *fiber.Ctx) error {
	var body struct {
		Role        string `json:"role"`
		Permissions []struct {
			Action    string `json:"action"`
			IsAllowed bool   `json:"is_allowed"`
		} `json:"permissions"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if body.Role == "" || len(body.Permissions) == 0 {
		return response.BadRequest(c, "role and permissions are required")
	}

	if err := h.usecase.BulkSetRolePermissions(body.Role, body.Permissions); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.Map{"message": "permissions updated"}, "ok")
}

// ========================
// Revenue Analysis (MDR Margin + Penalty)
// ========================

func (h *SuperAdminHandler) GetRevenueStats(c *fiber.Ctx) error {
	stats, err := h.usecase.GetRevenueStats()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, stats, "revenue stats retrieved")
}

func (h *SuperAdminHandler) GetRevenueByMerchant(c *fiber.Ctx) error {
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	page, _ := strconv.Atoi(c.Query("page", "1"))
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	merchants, total, err := h.usecase.GetRevenueByMerchant(limit, offset)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    merchants,
		"total":   total,
		"page":    page,
		"limit":   limit,
	})
}
