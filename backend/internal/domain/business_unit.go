package domain

import "github.com/google/uuid"

// BusinessUnit represents a unit of measurement for a specific business type
type BusinessUnit struct {
	BaseModel
	MerchantTypeID uuid.UUID `json:"merchant_type_id" gorm:"type:uuid;not null;index"`
	Name           string    `json:"name" gorm:"size:50;not null"`
	Label          string    `json:"label" gorm:"size:100;not null"`
	SortOrder      int       `json:"sort_order" gorm:"default:0"`

	// Relations
	MerchantType *MerchantType `json:"merchant_type,omitempty" gorm:"foreignKey:MerchantTypeID"`
}

func (BusinessUnit) TableName() string { return "business_units" }

// BusinessUnitRepository defines the interface for business unit data access
type BusinessUnitRepository interface {
	Create(bu *BusinessUnit) error
	FindByMerchantTypeID(merchantTypeID uuid.UUID) ([]BusinessUnit, error)
	FindByMerchantTypeSlug(slug string) ([]BusinessUnit, error)
	FindAll() ([]BusinessUnit, error)
}
