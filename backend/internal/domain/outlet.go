package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Brand represents a franchise brand
type Brand struct {
	BaseModel
	TenantID    uuid.UUID `json:"tenant_id" gorm:"type:uuid;not null;index"`
	Name        string    `json:"name" gorm:"size:255;not null"`
	LogoURL     string    `json:"logo_url,omitempty"`
	Description string    `json:"description,omitempty"`
}

func (Brand) TableName() string { return "brands" }

// Region represents a geographic region for outlets
type Region struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TenantID  uuid.UUID      `json:"tenant_id" gorm:"type:uuid;not null;index"`
	Name      string         `json:"name" gorm:"size:255;not null"`
	ParentID  *uuid.UUID     `json:"parent_id,omitempty" gorm:"type:uuid"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`

	// Relations
	Parent   *Region  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children []Region `json:"children,omitempty" gorm:"foreignKey:ParentID"`
}

func (Region) TableName() string { return "regions" }

// Outlet represents a physical store/outlet
type Outlet struct {
	BaseModel
	TenantID         uuid.UUID  `json:"tenant_id" gorm:"type:uuid;not null;index"`
	BrandID          *uuid.UUID `json:"brand_id,omitempty" gorm:"type:uuid"`
	RegionID         *uuid.UUID `json:"region_id,omitempty" gorm:"type:uuid"`
	Name             string     `json:"name" gorm:"size:255;not null"`
	Code             string     `json:"code" gorm:"size:50;uniqueIndex;not null"`
	Address          string     `json:"address,omitempty"`
	City             string     `json:"city,omitempty" gorm:"size:100"`
	Province         string     `json:"province,omitempty" gorm:"size:100"`
	Phone            string     `json:"phone,omitempty" gorm:"size:50"`
	Status           string     `json:"status" gorm:"size:20;default:'active'"`
	Type             string     `json:"type" gorm:"size:20;default:'owned'"`
	FranchiseOwnerID *uuid.UUID `json:"franchise_owner_id,omitempty" gorm:"type:uuid"`
	OpeningDate      *time.Time `json:"opening_date,omitempty" gorm:"type:date"`
	Settings         JSON       `json:"settings" gorm:"type:jsonb;default:'{}'"`

	// Relations
	Brand          *Brand  `json:"brand,omitempty" gorm:"foreignKey:BrandID"`
	Region         *Region `json:"region,omitempty" gorm:"foreignKey:RegionID"`
	FranchiseOwner *User   `json:"franchise_owner,omitempty" gorm:"foreignKey:FranchiseOwnerID"`
}

func (Outlet) TableName() string { return "outlets" }

// Outlet status constants
const (
	OutletStatusActive    = "active"
	OutletStatusInactive  = "inactive"
	OutletStatusSuspended = "suspended"
)

// Outlet type constants
const (
	OutletTypeOwned     = "owned"
	OutletTypeFranchise = "franchise"
)

// OutletRepository defines the interface for outlet data access
type OutletRepository interface {
	Create(outlet *Outlet) error
	FindByID(id uuid.UUID) (*Outlet, error)
	FindByTenantID(tenantID uuid.UUID) ([]Outlet, error)
	FindByCode(code string) (*Outlet, error)
	Update(outlet *Outlet) error
	Delete(id uuid.UUID) error
}

// BrandRepository defines the interface for brand data access
type BrandRepository interface {
	Create(brand *Brand) error
	FindByID(id uuid.UUID) (*Brand, error)
	FindByTenantID(tenantID uuid.UUID) ([]Brand, error)
	Update(brand *Brand) error
	Delete(id uuid.UUID) error
}

// RegionRepository defines the interface for region data access
type RegionRepository interface {
	Create(region *Region) error
	FindByID(id uuid.UUID) (*Region, error)
	FindByTenantID(tenantID uuid.UUID) ([]Region, error)
	Update(region *Region) error
	Delete(id uuid.UUID) error
}
