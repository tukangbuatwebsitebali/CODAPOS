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

type POSHandler struct {
	posUsecase *usecase.POSUsecase
}

func NewPOSHandler(pu *usecase.POSUsecase) *POSHandler {
	return &POSHandler{posUsecase: pu}
}

// Checkout creates a new POS transaction
func (h *POSHandler) Checkout(c *fiber.Ctx) error {
	var req domain.CheckoutRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	tenantID := middleware.GetTenantID(c)
	cashierID := middleware.GetUserID(c)

	tx, err := h.posUsecase.Checkout(tenantID, cashierID, req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}

	return response.Created(c, tx, "transaction created successfully")
}

// Refund processes a refund
func (h *POSHandler) Refund(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return response.BadRequest(c, "invalid transaction ID")
	}

	var body struct {
		Reason string `json:"reason"`
	}
	_ = c.BodyParser(&body)

	tenantID := middleware.GetTenantID(c)
	cashierID := middleware.GetUserID(c)

	refund, err := h.posUsecase.Refund(tenantID, cashierID, id, body.Reason)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}

	return response.Created(c, refund, "refund processed successfully")
}

// GetTransactions returns transactions list
func (h *POSHandler) GetTransactions(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)

	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "20"))

	var outletID *uuid.UUID
	if oid := c.Query("outlet_id"); oid != "" {
		parsed, err := uuid.Parse(oid)
		if err == nil {
			outletID = &parsed
		}
	}

	transactions, total, err := h.posUsecase.GetTransactions(tenantID, outletID, page, perPage)
	if err != nil {
		return response.InternalError(c, "failed to fetch transactions")
	}

	totalPages := (total + int64(perPage) - 1) / int64(perPage)
	return response.SuccessWithMeta(c, transactions, &response.Meta{
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: totalPages,
	})
}

// GetTransaction returns a single transaction
func (h *POSHandler) GetTransaction(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return response.BadRequest(c, "invalid transaction ID")
	}

	tx, err := h.posUsecase.GetTransaction(id)
	if err != nil {
		return response.NotFound(c, "transaction not found")
	}

	return response.Success(c, tx, "")
}
