package middleware

import (
	"strings"

	"github.com/codapos/backend/internal/config"
	"github.com/codapos/backend/pkg/response"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// AuthMiddleware validates JWT tokens
func AuthMiddleware(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return response.Unauthorized(c, "missing authorization header")
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			return response.Unauthorized(c, "invalid authorization format")
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.NewError(fiber.StatusUnauthorized, "invalid signing method")
			}
			return []byte(cfg.JWT.Secret), nil
		})

		if err != nil || !token.Valid {
			return response.Unauthorized(c, "invalid or expired token")
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return response.Unauthorized(c, "invalid token claims")
		}

		// Set user context
		userID, _ := uuid.Parse(claims["user_id"].(string))
		tenantID, _ := uuid.Parse(claims["tenant_id"].(string))

		c.Locals("user_id", userID)
		c.Locals("tenant_id", tenantID)
		c.Locals("role", claims["role"].(string))
		c.Locals("email", claims["email"].(string))

		return c.Next()
	}
}

// RoleMiddleware checks if user has required role
func RoleMiddleware(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := c.Locals("role").(string)
		for _, r := range allowedRoles {
			if role == r {
				return c.Next()
			}
		}
		return response.Forbidden(c, "insufficient permissions")
	}
}

// GetUserID extracts user ID from context
func GetUserID(c *fiber.Ctx) uuid.UUID {
	return c.Locals("user_id").(uuid.UUID)
}

// GetTenantID extracts tenant ID from context
func GetTenantID(c *fiber.Ctx) uuid.UUID {
	return c.Locals("tenant_id").(uuid.UUID)
}
