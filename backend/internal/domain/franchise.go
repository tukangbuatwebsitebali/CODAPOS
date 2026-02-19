package domain

import (
	"time"

	"github.com/google/uuid"
)

// RoyaltyRule defines how royalties are calculated
type RoyaltyRule struct {
	BaseModel
	TenantID          uuid.UUID  `json:"tenant_id" gorm:"type:uuid;not null;index"`
	BrandID           *uuid.UUID `json:"brand_id,omitempty" gorm:"type:uuid"`
	OutletID          *uuid.UUID `json:"outlet_id,omitempty" gorm:"type:uuid"`
	Type              string     `json:"type" gorm:"size:50;not null"`
	CalculationMethod string     `json:"calculation_method" gorm:"size:20;not null"`
	Value             float64    `json:"value" gorm:"type:decimal(15,4);not null"`
	Frequency         string     `json:"frequency" gorm:"size:20;default:'monthly'"`
	IsActive          bool       `json:"is_active" gorm:"default:true"`

	// Relations
	Brand  *Brand  `json:"brand,omitempty" gorm:"foreignKey:BrandID"`
	Outlet *Outlet `json:"outlet,omitempty" gorm:"foreignKey:OutletID"`
}

func (RoyaltyRule) TableName() string { return "royalty_rules" }

// Royalty type constants
const (
	RoyaltyTypeRoyalty      = "royalty"
	RoyaltyTypeRevenueShare = "revenue_share"
	RoyaltyTypeLicenseFee   = "license_fee"
)

// RoyaltyInvoice represents a generated royalty invoice
type RoyaltyInvoice struct {
	ID            uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TenantID      uuid.UUID  `json:"tenant_id" gorm:"type:uuid;not null;index"`
	RuleID        uuid.UUID  `json:"rule_id" gorm:"type:uuid;not null"`
	OutletID      uuid.UUID  `json:"outlet_id" gorm:"type:uuid;not null"`
	PeriodStart   time.Time  `json:"period_start" gorm:"type:date;not null"`
	PeriodEnd     time.Time  `json:"period_end" gorm:"type:date;not null"`
	BaseAmount    float64    `json:"base_amount" gorm:"type:decimal(15,2);not null"`
	RoyaltyAmount float64    `json:"royalty_amount" gorm:"type:decimal(15,2);not null"`
	Status        string     `json:"status" gorm:"size:20;default:'pending'"`
	PaidAt        *time.Time `json:"paid_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`

	// Relations
	Rule   *RoyaltyRule `json:"rule,omitempty" gorm:"foreignKey:RuleID"`
	Outlet *Outlet      `json:"outlet,omitempty" gorm:"foreignKey:OutletID"`
}

func (RoyaltyInvoice) TableName() string { return "royalty_invoices" }

// FranchiseRepository defines the interface for franchise data access
type FranchiseRepository interface {
	// Royalty Rules
	CreateRule(rule *RoyaltyRule) error
	FindRuleByID(id uuid.UUID) (*RoyaltyRule, error)
	FindRulesByTenantID(tenantID uuid.UUID) ([]RoyaltyRule, error)
	UpdateRule(rule *RoyaltyRule) error

	// Royalty Invoices
	CreateInvoice(invoice *RoyaltyInvoice) error
	FindInvoicesByTenantID(tenantID uuid.UUID, status string) ([]RoyaltyInvoice, error)
	UpdateInvoiceStatus(id uuid.UUID, status string) error
}
