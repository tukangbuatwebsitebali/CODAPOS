package domain

import (
	"time"

	"github.com/google/uuid"
)

// Transaction represents a POS transaction
type Transaction struct {
	BaseModel
	TenantID              uuid.UUID  `json:"tenant_id" gorm:"type:uuid;not null;index"`
	OutletID              uuid.UUID  `json:"outlet_id" gorm:"type:uuid;not null;index"`
	CashierID             uuid.UUID  `json:"cashier_id" gorm:"type:uuid;not null"`
	CustomerID            *uuid.UUID `json:"customer_id,omitempty" gorm:"type:uuid;index"`
	TransactionNumber     string     `json:"transaction_number" gorm:"size:50;uniqueIndex;not null"`
	Type                  string     `json:"type" gorm:"size:20;not null;default:'sale'"`
	Status                string     `json:"status" gorm:"size:20;not null;default:'completed'"`
	Subtotal              float64    `json:"subtotal" gorm:"type:decimal(15,2);not null;default:0"`
	DiscountAmount        float64    `json:"discount_amount" gorm:"type:decimal(15,2);default:0"`
	TaxAmount             float64    `json:"tax_amount" gorm:"type:decimal(15,2);default:0"`
	TotalAmount           float64    `json:"total_amount" gorm:"type:decimal(15,2);not null;default:0"`
	PromotionID           *uuid.UUID `json:"promotion_id,omitempty" gorm:"type:uuid"`
	Notes                 string     `json:"notes,omitempty"`
	RefundReason          string     `json:"refund_reason,omitempty"`
	OriginalTransactionID *uuid.UUID `json:"original_transaction_id,omitempty" gorm:"type:uuid"`
	ReprintCount          int        `json:"reprint_count" gorm:"default:0"`
	LastReprintAt         *time.Time `json:"last_reprint_at,omitempty"`
	PaymentMethod         string     `json:"payment_method,omitempty" gorm:"size:50"`
	MDRRatePercentage     float64    `json:"mdr_rate_percentage,omitempty" gorm:"type:decimal(5,2);default:0"`
	MDRRateFlat           float64    `json:"mdr_rate_flat,omitempty" gorm:"type:decimal(15,2);default:0"`
	FeeMidtrans           float64    `json:"fee_midtrans,omitempty" gorm:"type:decimal(15,2);default:0"`
	FeeCodapos            float64    `json:"fee_codapos,omitempty" gorm:"type:decimal(15,2);default:0"`
	TotalMDRMerchant      float64    `json:"total_mdr_merchant,omitempty" gorm:"type:decimal(15,2);default:0"`
	NetProfit             float64    `json:"net_profit,omitempty" gorm:"type:decimal(15,2);default:0"`

	// Relations
	Outlet              *Outlet              `json:"outlet,omitempty" gorm:"foreignKey:OutletID"`
	Cashier             *User                `json:"cashier,omitempty" gorm:"foreignKey:CashierID"`
	Customer            *Customer            `json:"customer,omitempty" gorm:"foreignKey:CustomerID"`
	Items               []TransactionItem    `json:"items,omitempty" gorm:"foreignKey:TransactionID"`
	Payments            []TransactionPayment `json:"payments,omitempty" gorm:"foreignKey:TransactionID"`
	OriginalTransaction *Transaction         `json:"original_transaction,omitempty" gorm:"foreignKey:OriginalTransactionID"`
	Promotion           *Promotion           `json:"promotion,omitempty" gorm:"foreignKey:PromotionID"`
}

func (Transaction) TableName() string { return "transactions" }

// Transaction type constants
const (
	TransactionTypeSale   = "sale"
	TransactionTypeRefund = "refund"
	TransactionTypeVoid   = "void"
)

// Transaction status constants
const (
	TransactionStatusPending   = "pending"
	TransactionStatusCompleted = "completed"
	TransactionStatusVoided    = "voided"
	TransactionStatusRefunded  = "refunded"
)

// TransactionItem represents an item in a transaction
type TransactionItem struct {
	ID             uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TransactionID  uuid.UUID  `json:"transaction_id" gorm:"type:uuid;not null;index"`
	ProductID      uuid.UUID  `json:"product_id" gorm:"type:uuid;not null"`
	VariantID      *uuid.UUID `json:"variant_id,omitempty" gorm:"type:uuid"`
	ProductName    string     `json:"product_name" gorm:"size:255;not null"`
	VariantName    string     `json:"variant_name,omitempty" gorm:"size:255"`
	Quantity       float64    `json:"quantity" gorm:"type:decimal(15,2);not null"`
	UnitPrice      float64    `json:"unit_price" gorm:"type:decimal(15,2);not null"`
	DiscountAmount float64    `json:"discount_amount" gorm:"type:decimal(15,2);default:0"`
	TaxAmount      float64    `json:"tax_amount" gorm:"type:decimal(15,2);default:0"`
	Subtotal       float64    `json:"subtotal" gorm:"type:decimal(15,2);not null"`
	Modifiers      JSON       `json:"modifiers" gorm:"type:jsonb;default:'[]'"`
	Notes          string     `json:"notes,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}

func (TransactionItem) TableName() string { return "transaction_items" }

// TransactionPayment represents a payment for a transaction
type TransactionPayment struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TransactionID   uuid.UUID `json:"transaction_id" gorm:"type:uuid;not null;index"`
	PaymentMethod   string    `json:"payment_method" gorm:"size:50;not null"`
	Amount          float64   `json:"amount" gorm:"type:decimal(15,2);not null"`
	ReferenceNumber string    `json:"reference_number,omitempty" gorm:"size:255"`
	Status          string    `json:"status" gorm:"size:20;default:'completed'"`
	CreatedAt       time.Time `json:"created_at"`
}

func (TransactionPayment) TableName() string { return "transaction_payments" }

// Payment method constants
const (
	PaymentCash         = "cash"
	PaymentQRIS         = "qris"
	PaymentEWallet      = "ewallet"
	PaymentBankTransfer = "bank_transfer"
	PaymentCreditCard   = "credit_card"
	PaymentWhatsApp     = "whatsapp"
)

// SplitBill represents split billing for a transaction
type SplitBill struct {
	ID            uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TransactionID uuid.UUID `json:"transaction_id" gorm:"type:uuid;not null;index"`
	SplitNumber   int       `json:"split_number" gorm:"not null"`
	Amount        float64   `json:"amount" gorm:"type:decimal(15,2);not null"`
	PaymentMethod string    `json:"payment_method,omitempty" gorm:"size:50"`
	Status        string    `json:"status" gorm:"size:20;default:'pending'"`
}

func (SplitBill) TableName() string { return "split_bills" }

// TenantBilling represents monthly MDR invoice for a tenant
type TenantBilling struct {
	BaseModel
	TenantID          uuid.UUID `json:"tenant_id" gorm:"type:uuid;not null;index"`
	BillingMonth      string    `json:"billing_month" gorm:"size:10;not null;index"` // Format: MM-YYYY
	TotalTransactions int       `json:"total_transactions" gorm:"not null;default:0"`
	TotalMDR          float64   `json:"total_mdr" gorm:"type:decimal(15,2);not null;default:0"`
	PenaltyFee        float64   `json:"penalty_fee" gorm:"type:decimal(15,2);not null;default:0"`
	Status            string    `json:"status" gorm:"size:20;not null;default:'unpaid'"` // unpaid, paid, past_due, suspended

	Tenant *Tenant `json:"tenant,omitempty" gorm:"foreignKey:TenantID"`
}

func (TenantBilling) TableName() string { return "tenant_billings" }

// CheckoutRequest is the DTO for creating a transaction
type CheckoutRequest struct {
	OutletID    uuid.UUID             `json:"outlet_id" validate:"required"`
	CustomerID  *uuid.UUID            `json:"customer_id,omitempty"`
	Items       []CheckoutItemRequest `json:"items" validate:"required,min=1"`
	Payments    []PaymentRequest      `json:"payments" validate:"required,min=1"`
	PromotionID *uuid.UUID            `json:"promotion_id,omitempty"`
	Notes       string                `json:"notes,omitempty"`
}

type CheckoutItemRequest struct {
	ProductID uuid.UUID         `json:"product_id" validate:"required"`
	VariantID *uuid.UUID        `json:"variant_id,omitempty"`
	Quantity  float64           `json:"quantity" validate:"required,gt=0"`
	Modifiers []ModifierRequest `json:"modifiers,omitempty"`
	Notes     string            `json:"notes,omitempty"`
}

type ModifierRequest struct {
	Name  string  `json:"name"`
	Price float64 `json:"price"`
}

type PaymentRequest struct {
	PaymentMethod   string  `json:"payment_method" validate:"required"`
	Amount          float64 `json:"amount" validate:"required,gt=0"`
	ReferenceNumber string  `json:"reference_number,omitempty"`
}

// TransactionRepository defines the interface for transaction data access
type TransactionRepository interface {
	Create(transaction *Transaction) error
	FindByID(id uuid.UUID) (*Transaction, error)
	FindByTenantID(tenantID uuid.UUID, outletID *uuid.UUID, limit, offset int) ([]Transaction, int64, error)
	GetMDRMonthlyAggregation(month, year int) ([]struct {
		TenantID    uuid.UUID
		TotalTrx    int
		TotalMDRVal float64
	}, error)
	Update(transaction *Transaction) error
	Delete(id uuid.UUID) error
}

// TenantBillingRepository defines the interface for MDR invoice data access
type TenantBillingRepository interface {
	Create(billing *TenantBilling) error
	GetByTenantAndMonth(tenantID uuid.UUID, month string) (*TenantBilling, error)
	Update(billing *TenantBilling) error
	FindAll(limit, offset int) ([]TenantBilling, int64, error)
	FindByTenantID(tenantID uuid.UUID, limit, offset int) ([]TenantBilling, int64, error)
	GetUnpaidPastDue() ([]TenantBilling, error)
}
