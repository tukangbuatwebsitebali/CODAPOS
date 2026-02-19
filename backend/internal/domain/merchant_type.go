package domain

import (
	"github.com/google/uuid"
)

// MerchantType represents a category of merchant (Restaurant, Grosir, etc.)
type MerchantType struct {
	BaseModel
	Name     string `json:"name" gorm:"size:255;not null"`
	Slug     string `json:"slug" gorm:"size:100;uniqueIndex;not null"`
	Icon     string `json:"icon,omitempty" gorm:"size:50"`
	IsActive bool   `json:"is_active" gorm:"default:true"`
}

func (MerchantType) TableName() string { return "merchant_types" }

// Default merchant type slugs
const (
	MerchantTypeRestaurant = "restaurant"
	MerchantTypeGrosir     = "grosir-sembako"
	MerchantTypePengrajin  = "pengrajin"
	MerchantTypeLainnya    = "lainnya"
)

// MerchantTypeRepository defines the interface for merchant type data access
type MerchantTypeRepository interface {
	Create(mt *MerchantType) error
	FindByID(id uuid.UUID) (*MerchantType, error)
	FindBySlug(slug string) (*MerchantType, error)
	FindAll() ([]MerchantType, error)
	Update(mt *MerchantType) error
	Delete(id uuid.UUID) error
}
