package repository

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type franchiseRepo struct {
	db *gorm.DB
}

func NewFranchiseRepository(db *gorm.DB) domain.FranchiseRepository {
	return &franchiseRepo{db: db}
}

func (r *franchiseRepo) CreateRule(rule *domain.RoyaltyRule) error {
	return r.db.Create(rule).Error
}

func (r *franchiseRepo) FindRuleByID(id uuid.UUID) (*domain.RoyaltyRule, error) {
	var rule domain.RoyaltyRule
	err := r.db.Preload("Brand").Preload("Outlet").Where("id = ?", id).First(&rule).Error
	if err != nil {
		return nil, err
	}
	return &rule, nil
}

func (r *franchiseRepo) FindRulesByTenantID(tenantID uuid.UUID) ([]domain.RoyaltyRule, error) {
	var rules []domain.RoyaltyRule
	err := r.db.Preload("Brand").Preload("Outlet").
		Where("tenant_id = ?", tenantID).Find(&rules).Error
	return rules, err
}

func (r *franchiseRepo) UpdateRule(rule *domain.RoyaltyRule) error {
	return r.db.Save(rule).Error
}

func (r *franchiseRepo) CreateInvoice(invoice *domain.RoyaltyInvoice) error {
	return r.db.Create(invoice).Error
}

func (r *franchiseRepo) FindInvoicesByTenantID(tenantID uuid.UUID, status string) ([]domain.RoyaltyInvoice, error) {
	var invoices []domain.RoyaltyInvoice
	query := r.db.Preload("Rule").Preload("Outlet").Where("tenant_id = ?", tenantID)
	if status != "" {
		query = query.Where("status = ?", status)
	}
	err := query.Order("created_at DESC").Find(&invoices).Error
	return invoices, err
}

func (r *franchiseRepo) UpdateInvoiceStatus(id uuid.UUID, status string) error {
	return r.db.Model(&domain.RoyaltyInvoice{}).Where("id = ?", id).Update("status", status).Error
}
