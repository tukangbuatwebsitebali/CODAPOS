package handler

import (
	"github.com/codapos/backend/internal/middleware"
	"github.com/codapos/backend/internal/usecase"
	"github.com/codapos/backend/pkg/response"
	"github.com/gofiber/fiber/v2"
)

type AccountingHandler struct {
	accountingUsecase *usecase.AccountingUsecase
}

func NewAccountingHandler(au *usecase.AccountingUsecase) *AccountingHandler {
	return &AccountingHandler{accountingUsecase: au}
}

// GetCOA returns chart of accounts
func (h *AccountingHandler) GetCOA(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	accounts, err := h.accountingUsecase.GetCOA(tenantID)
	if err != nil {
		return response.InternalError(c, "failed to fetch chart of accounts")
	}
	return response.Success(c, accounts, "")
}

// GetJournals returns journal entries
func (h *AccountingHandler) GetJournals(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)

	page := 1
	perPage := 20

	journals, total, err := h.accountingUsecase.GetJournals(tenantID, nil, nil, page, perPage)
	if err != nil {
		return response.InternalError(c, "failed to fetch journals")
	}

	totalPages := (total + int64(perPage) - 1) / int64(perPage)
	return response.SuccessWithMeta(c, journals, &response.Meta{
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: totalPages,
	})
}

// GetTrialBalance returns trial balance report
func (h *AccountingHandler) GetTrialBalance(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	accounts, err := h.accountingUsecase.GetTrialBalance(tenantID)
	if err != nil {
		return response.InternalError(c, "failed to generate trial balance")
	}
	return response.Success(c, accounts, "")
}

// GetProfitLoss returns profit & loss report
func (h *AccountingHandler) GetProfitLoss(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	accounts, err := h.accountingUsecase.GetBalanceSheet(tenantID)
	if err != nil {
		return response.InternalError(c, "failed to generate profit & loss")
	}
	return response.Success(c, accounts, "")
}

// GetBalanceSheet returns balance sheet report
func (h *AccountingHandler) GetBalanceSheet(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	accounts, err := h.accountingUsecase.GetBalanceSheet(tenantID)
	if err != nil {
		return response.InternalError(c, "failed to generate balance sheet")
	}
	return response.Success(c, accounts, "")
}
