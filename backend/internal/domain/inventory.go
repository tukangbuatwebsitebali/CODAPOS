package domain

import (
	"time"

	"github.com/google/uuid"
)

// Inventory represents stock for a product at an outlet
type Inventory struct {
	BaseModel
	OutletID  uuid.UUID  `json:"outlet_id" gorm:"type:uuid;not null;uniqueIndex:idx_inventory_unique"`
	ProductID uuid.UUID  `json:"product_id" gorm:"type:uuid;not null;uniqueIndex:idx_inventory_unique"`
	VariantID *uuid.UUID `json:"variant_id,omitempty" gorm:"type:uuid;uniqueIndex:idx_inventory_unique"`
	Quantity  float64    `json:"quantity" gorm:"type:decimal(15,2);not null;default:0"`
	MinStock  float64    `json:"min_stock" gorm:"type:decimal(15,2);default:0"`

	// Relations
	Outlet  *Outlet         `json:"outlet,omitempty" gorm:"foreignKey:OutletID"`
	Product *Product        `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	Variant *ProductVariant `json:"variant,omitempty" gorm:"foreignKey:VariantID"`
}

func (Inventory) TableName() string { return "inventory" }

// InventoryMovement records stock changes
type InventoryMovement struct {
	ID            uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	OutletID      uuid.UUID  `json:"outlet_id" gorm:"type:uuid;not null;index"`
	ProductID     uuid.UUID  `json:"product_id" gorm:"type:uuid;not null"`
	VariantID     *uuid.UUID `json:"variant_id,omitempty" gorm:"type:uuid"`
	Type          string     `json:"type" gorm:"size:50;not null"`
	Quantity      float64    `json:"quantity" gorm:"type:decimal(15,2);not null"`
	ReferenceType string     `json:"reference_type,omitempty" gorm:"size:50"`
	ReferenceID   *uuid.UUID `json:"reference_id,omitempty" gorm:"type:uuid"`
	Notes         string     `json:"notes,omitempty"`
	CreatedBy     *uuid.UUID `json:"created_by,omitempty" gorm:"type:uuid"`
	CreatedAt     time.Time  `json:"created_at"`
}

func (InventoryMovement) TableName() string { return "inventory_movements" }

// Movement type constants
const (
	MovementSale        = "sale"
	MovementPurchase    = "purchase"
	MovementTransferIn  = "transfer_in"
	MovementTransferOut = "transfer_out"
	MovementAdjustment  = "adjustment"
)

// StockTransfer represents a transfer between outlets
type StockTransfer struct {
	BaseModel
	TenantID     uuid.UUID  `json:"tenant_id" gorm:"type:uuid;not null;index"`
	FromOutletID uuid.UUID  `json:"from_outlet_id" gorm:"type:uuid;not null"`
	ToOutletID   uuid.UUID  `json:"to_outlet_id" gorm:"type:uuid;not null"`
	Status       string     `json:"status" gorm:"size:20;default:'pending'"`
	Notes        string     `json:"notes,omitempty"`
	CreatedBy    *uuid.UUID `json:"created_by,omitempty" gorm:"type:uuid"`
	ApprovedBy   *uuid.UUID `json:"approved_by,omitempty" gorm:"type:uuid"`

	// Relations
	FromOutlet *Outlet             `json:"from_outlet,omitempty" gorm:"foreignKey:FromOutletID"`
	ToOutlet   *Outlet             `json:"to_outlet,omitempty" gorm:"foreignKey:ToOutletID"`
	Items      []StockTransferItem `json:"items,omitempty" gorm:"foreignKey:TransferID"`
}

func (StockTransfer) TableName() string { return "stock_transfers" }

// StockTransferItem represents items in a transfer
type StockTransferItem struct {
	ID               uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TransferID       uuid.UUID  `json:"transfer_id" gorm:"type:uuid;not null;index"`
	ProductID        uuid.UUID  `json:"product_id" gorm:"type:uuid;not null"`
	VariantID        *uuid.UUID `json:"variant_id,omitempty" gorm:"type:uuid"`
	Quantity         float64    `json:"quantity" gorm:"type:decimal(15,2);not null"`
	ReceivedQuantity *float64   `json:"received_quantity,omitempty" gorm:"type:decimal(15,2)"`
}

func (StockTransferItem) TableName() string { return "stock_transfer_items" }

// InventoryRepository defines the interface for inventory data access
type InventoryRepository interface {
	FindByOutlet(outletID uuid.UUID) ([]Inventory, error)
	FindByProduct(outletID, productID uuid.UUID) (*Inventory, error)
	UpdateStock(outletID, productID uuid.UUID, variantID *uuid.UUID, quantity float64) error
	SetStock(outletID, productID uuid.UUID, variantID *uuid.UUID, absoluteQty float64) error
	CreateMovement(movement *InventoryMovement) error
	FindMovements(outletID uuid.UUID, productID *uuid.UUID, limit int) ([]InventoryMovement, error)
	GetLowStock(outletID uuid.UUID) ([]Inventory, error)
}
