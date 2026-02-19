package domain

import (
	"github.com/google/uuid"
)

// Customer represents an end-customer who purchases from a merchant
type Customer struct {
	BaseModel
	TenantID uuid.UUID `json:"tenant_id" gorm:"type:uuid;not null;index"`
	Name     string    `json:"name" gorm:"size:255;not null"`
	Phone    string    `json:"phone" gorm:"size:50;not null;index"`
	Email    string    `json:"email,omitempty" gorm:"size:255"`
	Notes    string    `json:"notes,omitempty"`
	IsActive bool      `json:"is_active" gorm:"default:true"`

	// Relations
	Tenant    *Tenant           `json:"tenant,omitempty" gorm:"foreignKey:TenantID"`
	Addresses []CustomerAddress `json:"addresses,omitempty" gorm:"foreignKey:CustomerID"`
}

func (Customer) TableName() string { return "customers" }

// CustomerAddress represents a delivery/location address with GPS coordinates
type CustomerAddress struct {
	BaseModel
	CustomerID  uuid.UUID `json:"customer_id" gorm:"type:uuid;not null;index"`
	Label       string    `json:"label" gorm:"size:100;default:'Rumah'"`
	FullAddress string    `json:"full_address" gorm:"not null"`
	City        string    `json:"city,omitempty" gorm:"size:100"`
	Province    string    `json:"province,omitempty" gorm:"size:100"`
	PostalCode  string    `json:"postal_code,omitempty" gorm:"size:10"`
	Latitude    float64   `json:"latitude" gorm:"type:decimal(10,7)"`
	Longitude   float64   `json:"longitude" gorm:"type:decimal(10,7)"`
	IsDefault   bool      `json:"is_default" gorm:"default:false"`

	// Relations
	Customer *Customer `json:"customer,omitempty" gorm:"foreignKey:CustomerID"`
}

func (CustomerAddress) TableName() string { return "customer_addresses" }

// DTOs

type CreateCustomerRequest struct {
	Name        string  `json:"name" validate:"required"`
	Phone       string  `json:"phone" validate:"required"`
	Email       string  `json:"email,omitempty"`
	Notes       string  `json:"notes,omitempty"`
	FullAddress string  `json:"full_address,omitempty"`
	City        string  `json:"city,omitempty"`
	Province    string  `json:"province,omitempty"`
	PostalCode  string  `json:"postal_code,omitempty"`
	Latitude    float64 `json:"latitude,omitempty"`
	Longitude   float64 `json:"longitude,omitempty"`
}

// CustomerSignUpRequest is the DTO for public customer self-registration
type CustomerSignUpRequest struct {
	TenantSlug  string  `json:"tenant_slug" validate:"required"`
	Name        string  `json:"name" validate:"required"`
	Phone       string  `json:"phone" validate:"required"`
	Email       string  `json:"email,omitempty"`
	FullAddress string  `json:"full_address,omitempty"`
	City        string  `json:"city,omitempty"`
	Province    string  `json:"province,omitempty"`
	PostalCode  string  `json:"postal_code,omitempty"`
	Latitude    float64 `json:"latitude,omitempty"`
	Longitude   float64 `json:"longitude,omitempty"`
}

// AddAddressRequest is the DTO for adding a new address to a customer
type AddAddressRequest struct {
	Label       string  `json:"label" validate:"required"`
	FullAddress string  `json:"full_address" validate:"required"`
	City        string  `json:"city,omitempty"`
	Province    string  `json:"province,omitempty"`
	PostalCode  string  `json:"postal_code,omitempty"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	IsDefault   bool    `json:"is_default,omitempty"`
}

// UpdateCustomerRequest is the DTO for updating a customer profile
type UpdateCustomerRequest struct {
	Name  string `json:"name,omitempty"`
	Phone string `json:"phone,omitempty"`
	Email string `json:"email,omitempty"`
	Notes string `json:"notes,omitempty"`
}

// CustomerRepository defines the interface for customer data access
type CustomerRepository interface {
	Create(customer *Customer) error
	CreateAddress(address *CustomerAddress) error
	FindByID(id uuid.UUID) (*Customer, error)
	FindByPhone(tenantID uuid.UUID, phone string) (*Customer, error)
	FindByTenantID(tenantID uuid.UUID, limit, offset int) ([]Customer, int64, error)
	FindAll(limit, offset int) ([]Customer, int64, error) // Super Admin
	FindAddressesByCustomerID(customerID uuid.UUID) ([]CustomerAddress, error)
	Update(customer *Customer) error
	UpdateAddress(address *CustomerAddress) error
	DeleteAddress(id uuid.UUID) error
	Delete(id uuid.UUID) error
}
