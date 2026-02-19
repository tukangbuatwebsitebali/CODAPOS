package domain

import (
	"time"

	"github.com/google/uuid"
)

// SubscriptionPlan defines available plans
type SubscriptionPlan struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name         string    `json:"name" gorm:"size:100;not null"`
	Slug         string    `json:"slug" gorm:"size:100;uniqueIndex;not null"`
	PriceMonthly float64   `json:"price_monthly" gorm:"type:decimal(15,2);not null"`
	PriceYearly  *float64  `json:"price_yearly,omitempty" gorm:"type:decimal(15,2)"`
	MaxOutlets   int       `json:"max_outlets" gorm:"default:1"`
	MaxUsers     int       `json:"max_users" gorm:"default:5"`
	MaxProducts  int       `json:"max_products" gorm:"default:100"`
	Features     JSON      `json:"features" gorm:"type:jsonb;default:'{}'"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
}

func (SubscriptionPlan) TableName() string { return "subscription_plans" }

// Subscription represents a tenant's active subscription
type Subscription struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TenantID    uuid.UUID  `json:"tenant_id" gorm:"type:uuid;not null;index"`
	PlanID      uuid.UUID  `json:"plan_id" gorm:"type:uuid;not null"`
	Status      string     `json:"status" gorm:"size:20;default:'active'"`
	StartedAt   time.Time  `json:"started_at" gorm:"not null"`
	ExpiresAt   time.Time  `json:"expires_at" gorm:"not null"`
	CancelledAt *time.Time `json:"cancelled_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`

	// Relations
	Plan   *SubscriptionPlan `json:"plan,omitempty" gorm:"foreignKey:PlanID"`
	Tenant *Tenant           `json:"tenant,omitempty" gorm:"foreignKey:TenantID"`
}

func (Subscription) TableName() string { return "subscriptions" }

// BillingInvoice represents a billing invoice for subscription
type BillingInvoice struct {
	ID             uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TenantID       uuid.UUID  `json:"tenant_id" gorm:"type:uuid;not null;index"`
	SubscriptionID *uuid.UUID `json:"subscription_id,omitempty" gorm:"type:uuid"`
	InvoiceNumber  string     `json:"invoice_number" gorm:"size:50;uniqueIndex;not null"`
	Amount         float64    `json:"amount" gorm:"type:decimal(15,2);not null"`
	Status         string     `json:"status" gorm:"size:20;default:'pending'"`
	DueDate        time.Time  `json:"due_date" gorm:"type:date;not null"`
	PaidAt         *time.Time `json:"paid_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}

func (BillingInvoice) TableName() string { return "billing_invoices" }

// SubscriptionRepository defines the interface for subscription data access
type SubscriptionRepository interface {
	// Plans
	CreatePlan(plan *SubscriptionPlan) error
	FindAllPlans() ([]SubscriptionPlan, error)
	FindPlanByID(id uuid.UUID) (*SubscriptionPlan, error)

	// Subscriptions
	CreateSubscription(sub *Subscription) error
	FindByTenantID(tenantID uuid.UUID) (*Subscription, error)
	UpdateSubscription(sub *Subscription) error
}
