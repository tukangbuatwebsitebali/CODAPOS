package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BaseModel provides common fields for all entities
type BaseModel struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// Tenant represents a business/brand in the multi-tenant system
type Tenant struct {
	BaseModel
	Name                  string     `json:"name" gorm:"size:255;not null"`
	Slug                  string     `json:"slug" gorm:"size:100;uniqueIndex;not null"`
	LogoURL               string     `json:"logo_url,omitempty"`
	SubscriptionPlan      string     `json:"subscription_plan" gorm:"size:50;default:'free-basic'"`
	SubscriptionStatus    string     `json:"subscription_status" gorm:"size:20;default:'active'"`
	SubscriptionExpiresAt *time.Time `json:"subscription_expires_at,omitempty"`
	Settings              JSON       `json:"settings" gorm:"type:jsonb;default:'{}'"`

	// Phase 1: Core Architecture fields
	MerchantTypeID  *uuid.UUID `json:"merchant_type_id,omitempty" gorm:"type:uuid"`
	Subdomain       string     `json:"subdomain" gorm:"size:100;uniqueIndex"`
	OpenTime        string     `json:"open_time" gorm:"size:5;default:'09:00'"`
	CloseTime       string     `json:"close_time" gorm:"size:5;default:'17:00'"`
	RevenueSharePct float64    `json:"revenue_share_pct" gorm:"type:decimal(5,2);default:10"`
	IsEnabled       bool       `json:"is_enabled" gorm:"default:true"`

	// Bank account info
	BankName          string `json:"bank_name,omitempty" gorm:"size:100"`
	BankAccountNumber string `json:"bank_account_number,omitempty" gorm:"size:50"`
	BankAccountHolder string `json:"bank_account_holder,omitempty" gorm:"size:255"`

	// Relations
	Users        []User        `json:"users,omitempty" gorm:"foreignKey:TenantID"`
	Outlets      []Outlet      `json:"outlets,omitempty" gorm:"foreignKey:TenantID"`
	Brands       []Brand       `json:"brands,omitempty" gorm:"foreignKey:TenantID"`
	MerchantType *MerchantType `json:"merchant_type,omitempty" gorm:"foreignKey:MerchantTypeID"`
}

func (Tenant) TableName() string { return "tenants" }

// TenantRepository defines the interface for tenant data access
type TenantRepository interface {
	Create(tenant *Tenant) error
	FindByID(id uuid.UUID) (*Tenant, error)
	FindBySlug(slug string) (*Tenant, error)
	FindAll(limit, offset int) ([]Tenant, int64, error)
	FindAllActive() ([]Tenant, error)
	Update(tenant *Tenant) error
	Delete(id uuid.UUID) error
}
