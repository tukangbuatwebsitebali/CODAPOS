package domain

import (
	"github.com/google/uuid"
)

// Category represents a product category
type Category struct {
	BaseModel
	TenantID  uuid.UUID  `json:"tenant_id" gorm:"type:uuid;not null;index"`
	ParentID  *uuid.UUID `json:"parent_id,omitempty" gorm:"type:uuid"`
	Name      string     `json:"name" gorm:"size:255;not null"`
	Slug      string     `json:"slug,omitempty" gorm:"size:255"`
	Icon      string     `json:"icon,omitempty" gorm:"size:50"`
	SortOrder int        `json:"sort_order" gorm:"default:0"`

	// Relations
	Parent   *Category  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children []Category `json:"children,omitempty" gorm:"foreignKey:ParentID"`
	Products []Product  `json:"products,omitempty" gorm:"foreignKey:CategoryID"`
}

func (Category) TableName() string { return "categories" }

// Product represents a product
type Product struct {
	BaseModel
	TenantID    uuid.UUID  `json:"tenant_id" gorm:"type:uuid;not null;index"`
	CategoryID  *uuid.UUID `json:"category_id,omitempty" gorm:"type:uuid"`
	SKU         string     `json:"sku,omitempty" gorm:"size:100"`
	Barcode     string     `json:"barcode,omitempty" gorm:"size:100"`
	Name        string     `json:"name" gorm:"size:255;not null"`
	Description string     `json:"description,omitempty"`
	ImageURL    string     `json:"image_url,omitempty"`
	BasePrice   float64    `json:"base_price" gorm:"type:decimal(15,2);not null;default:0"`
	CostPrice   float64    `json:"cost_price" gorm:"type:decimal(15,2);default:0"`
	TaxRate     float64    `json:"tax_rate" gorm:"type:decimal(5,2);default:0"`
	IsActive    bool       `json:"is_active" gorm:"default:true"`
	TrackStock  bool       `json:"track_stock" gorm:"default:true"`
	IsLocked    bool       `json:"is_locked" gorm:"default:false"`
	SortOrder   int        `json:"sort_order" gorm:"default:0"`
	Unit        string     `json:"unit" gorm:"size:50;default:'pcs'"`

	// Virtual field — not stored in products table, used for create/update convenience
	StockQuantity *float64 `json:"stock_quantity,omitempty" gorm:"-"`

	// Relations
	Category       *Category        `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	Variants       []ProductVariant `json:"variants,omitempty" gorm:"foreignKey:ProductID"`
	ModifierGroups []ModifierGroup  `json:"modifier_groups,omitempty" gorm:"many2many:product_modifier_groups"`
}

func (Product) TableName() string { return "products" }

// ProductVariant represents a product variant (e.g., size, color)
type ProductVariant struct {
	BaseModel
	ProductID       uuid.UUID `json:"product_id" gorm:"type:uuid;not null;index"`
	Name            string    `json:"name" gorm:"size:255;not null"`
	SKU             string    `json:"sku,omitempty" gorm:"size:100"`
	Barcode         string    `json:"barcode,omitempty" gorm:"size:100"`
	AdditionalPrice float64   `json:"additional_price" gorm:"type:decimal(15,2);default:0"`
	CostPrice       float64   `json:"cost_price" gorm:"type:decimal(15,2);default:0"`
	IsActive        bool      `json:"is_active" gorm:"default:true"`
}

func (ProductVariant) TableName() string { return "product_variants" }

// ModifierGroup represents a group of modifiers (e.g. Toppings, Add-ons)
type ModifierGroup struct {
	BaseModel
	TenantID   uuid.UUID `json:"tenant_id" gorm:"type:uuid;not null;index"`
	Name       string    `json:"name" gorm:"size:255;not null"`
	IsRequired bool      `json:"is_required" gorm:"default:false"`
	MinSelect  int       `json:"min_select" gorm:"default:0"`
	MaxSelect  int       `json:"max_select" gorm:"default:1"`

	// Relations
	Modifiers []Modifier `json:"modifiers,omitempty" gorm:"foreignKey:GroupID"`
}

func (ModifierGroup) TableName() string { return "modifier_groups" }

// Modifier represents a single modifier option
type Modifier struct {
	BaseModel
	GroupID   uuid.UUID `json:"group_id" gorm:"type:uuid;not null;index"`
	Name      string    `json:"name" gorm:"size:255;not null"`
	Price     float64   `json:"price" gorm:"type:decimal(15,2);default:0"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	SortOrder int       `json:"sort_order" gorm:"default:0"`
}

func (Modifier) TableName() string { return "modifiers" }

// OutletPrice represents a price override for a specific outlet
type OutletPrice struct {
	BaseModel
	OutletID  uuid.UUID  `json:"outlet_id" gorm:"type:uuid;not null;uniqueIndex:idx_outlet_product_variant"`
	ProductID uuid.UUID  `json:"product_id" gorm:"type:uuid;not null;uniqueIndex:idx_outlet_product_variant"`
	VariantID *uuid.UUID `json:"variant_id,omitempty" gorm:"type:uuid;uniqueIndex:idx_outlet_product_variant"`
	Price     float64    `json:"price" gorm:"type:decimal(15,2);not null"`
}

func (OutletPrice) TableName() string { return "outlet_prices" }

// Promotion represents a promo/discount
type Promotion struct {
	BaseModel
	TenantID           uuid.UUID `json:"tenant_id" gorm:"type:uuid;not null;index"`
	Name               string    `json:"name" gorm:"size:255;not null"`
	Type               string    `json:"type" gorm:"size:50;not null"`
	Value              float64   `json:"value" gorm:"type:decimal(15,2);not null"`
	MinPurchase        float64   `json:"min_purchase" gorm:"type:decimal(15,2);default:0"`
	MaxDiscount        *float64  `json:"max_discount,omitempty" gorm:"type:decimal(15,2)"`
	StartDate          *string   `json:"start_date,omitempty" gorm:"type:timestamptz"`
	EndDate            *string   `json:"end_date,omitempty" gorm:"type:timestamptz"`
	IsActive           bool      `json:"is_active" gorm:"default:true"`
	ApplicableOutlets  JSON      `json:"applicable_outlets" gorm:"type:jsonb;default:'[]'"`
	ApplicableProducts JSON      `json:"applicable_products" gorm:"type:jsonb;default:'[]'"`
}

func (Promotion) TableName() string { return "promotions" }

// ProductRepository defines the interface for product data access
type ProductRepository interface {
	Create(product *Product) error
	FindByID(id uuid.UUID) (*Product, error)
	FindByTenantID(tenantID uuid.UUID, search string, categoryID *uuid.UUID) ([]Product, error)
	Update(product *Product) error
	Delete(id uuid.UUID) error
}

// CategoryRepository defines the interface for category data access
type CategoryRepository interface {
	Create(category *Category) error
	FindByID(id uuid.UUID) (*Category, error)
	FindByTenantID(tenantID uuid.UUID) ([]Category, error)
	Update(category *Category) error
	Delete(id uuid.UUID) error
}
