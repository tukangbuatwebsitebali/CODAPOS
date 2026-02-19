package middleware

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/codapos/backend/pkg/response"
	"github.com/gofiber/fiber/v2"
)

// Action constants for permission checks
const (
	ActionManageUsers      = "manage_users"
	ActionManageProducts   = "manage_products"
	ActionReadProducts     = "read_products"
	ActionManageOutlets    = "manage_outlets"
	ActionPOSCheckout      = "pos_checkout"
	ActionPOSRefund        = "pos_refund"
	ActionReadTransactions = "read_transactions"
	ActionManageAccounting = "manage_accounting"
	ActionManageCustomers  = "manage_customers"
	ActionManageSettings   = "manage_settings"
)

// Package-level repository for dynamic permission checks
var rolePermRepo domain.RolePermissionRepository

// InitPermissions sets the repository used by PermissionMiddleware
func InitPermissions(repo domain.RolePermissionRepository) {
	rolePermRepo = repo
}

// PermissionMiddleware checks if the authenticated user has permission for a given action.
// super_admin always passes. Other roles are checked against the database.
func PermissionMiddleware(action string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(string)
		if !ok || role == "" {
			return response.Forbidden(c, "no role found")
		}

		// super_admin bypasses all permission checks
		if role == domain.RoleSuperAdmin {
			return c.Next()
		}

		// Check database for dynamic permission
		if rolePermRepo != nil {
			allowed, err := rolePermRepo.IsAllowed(role, action)
			if err == nil {
				if allowed {
					return c.Next()
				}
				return response.Forbidden(c, "insufficient permissions for this action")
			}
			// If DB lookup fails, fall through to deny
		}

		return response.Forbidden(c, "insufficient permissions for this action")
	}
}

// GetRole extracts role from context
func GetRole(c *fiber.Ctx) string {
	role, _ := c.Locals("role").(string)
	return role
}
