package handler

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/codapos/backend/internal/middleware"
	"github.com/codapos/backend/internal/usecase"
	"github.com/codapos/backend/pkg/response"
	"github.com/gofiber/fiber/v2"
)

type ForecastHandler struct {
	usecase *usecase.ForecastUsecase
}

func NewForecastHandler(uc *usecase.ForecastUsecase) *ForecastHandler {
	return &ForecastHandler{usecase: uc}
}

// RegisterRoutes registers forecast routes
func (h *ForecastHandler) RegisterRoutes(api fiber.Router) {
	forecast := api.Group("/forecast")
	forecast.Post("/generate", h.Generate)
}

// Generate creates a new forecast
func (h *ForecastHandler) Generate(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)

	var req domain.ForecastRequest
	if err := c.BodyParser(&req); err != nil {
		// Default request
		req = domain.ForecastRequest{
			Period: "daily",
			Days:   7,
		}
	}

	if req.Period == "" {
		req.Period = "daily"
	}
	if req.Days <= 0 {
		req.Days = 7
	}

	result, err := h.usecase.GenerateForecast(tenantID, req)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, result, "forecast generated")
}
