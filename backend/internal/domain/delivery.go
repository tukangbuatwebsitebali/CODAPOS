package domain

import (
	"time"

	"github.com/google/uuid"
)

// DeliveryOrder represents a delivery/courier order (GoSend-style)
type DeliveryOrder struct {
	BaseModel
	TenantID      uuid.UUID  `json:"tenant_id" gorm:"type:uuid;not null;index"`
	TransactionID *uuid.UUID `json:"transaction_id,omitempty" gorm:"type:uuid;index"`
	CustomerID    *uuid.UUID `json:"customer_id,omitempty" gorm:"type:uuid;index"`
	DriverID      *uuid.UUID `json:"driver_id,omitempty" gorm:"type:uuid;index"`
	OrderNumber   string     `json:"order_number" gorm:"size:50;uniqueIndex;not null"`
	Status        string     `json:"status" gorm:"size:30;not null;default:'pending';index"`

	// Pickup
	PickupAddress string  `json:"pickup_address" gorm:"not null"`
	PickupLat     float64 `json:"pickup_lat" gorm:"type:decimal(10,7)"`
	PickupLng     float64 `json:"pickup_lng" gorm:"type:decimal(10,7)"`
	PickupContact string  `json:"pickup_contact" gorm:"size:100"`
	PickupPhone   string  `json:"pickup_phone" gorm:"size:20"`

	// Dropoff
	DropoffAddress string  `json:"dropoff_address" gorm:"not null"`
	DropoffLat     float64 `json:"dropoff_lat" gorm:"type:decimal(10,7)"`
	DropoffLng     float64 `json:"dropoff_lng" gorm:"type:decimal(10,7)"`
	DropoffContact string  `json:"dropoff_contact" gorm:"size:100"`
	DropoffPhone   string  `json:"dropoff_phone" gorm:"size:20"`

	// Delivery details
	PackageDesc     string  `json:"package_desc" gorm:"size:255"`
	DistanceKm      float64 `json:"distance_km" gorm:"type:decimal(10,2)"`
	DeliveryFee     float64 `json:"delivery_fee" gorm:"type:decimal(15,2);default:0"`
	Notes           string  `json:"notes,omitempty"`
	EstimatedTime   int     `json:"estimated_time"` // minutes
	CourierName     string  `json:"courier_name" gorm:"size:100"`
	MidtransOrderID string  `json:"midtrans_order_id" gorm:"size:100;index"`
	TotalAmount     float64 `json:"total_amount" gorm:"type:decimal(15,2);default:0"`
	ItemsSummary    string  `json:"items_summary" gorm:"type:text"`

	// Timestamps
	AssignedAt   *time.Time `json:"assigned_at,omitempty"`
	PickedUpAt   *time.Time `json:"picked_up_at,omitempty"`
	DeliveredAt  *time.Time `json:"delivered_at,omitempty"`
	CancelledAt  *time.Time `json:"cancelled_at,omitempty"`
	CancelReason string     `json:"cancel_reason,omitempty"`

	// Driver position (last known)
	DriverLat *float64 `json:"driver_lat,omitempty" gorm:"type:decimal(10,7)"`
	DriverLng *float64 `json:"driver_lng,omitempty" gorm:"type:decimal(10,7)"`

	// Relations
	Customer    *Customer    `json:"customer,omitempty" gorm:"foreignKey:CustomerID"`
	Driver      *User        `json:"driver,omitempty" gorm:"foreignKey:DriverID"`
	Transaction *Transaction `json:"transaction,omitempty" gorm:"foreignKey:TransactionID"`
}

func (DeliveryOrder) TableName() string { return "delivery_orders" }

// Delivery status constants
const (
	DeliveryStatusWaitingPayment = "waiting_payment" // order created, awaiting payment
	DeliveryStatusPending        = "pending"         // paid, waiting for merchant
	DeliveryStatusPreparing      = "preparing"       // merchant preparing
	DeliveryStatusOnDelivery     = "on_delivery"     // courier delivering
	DeliveryStatusDelivered      = "delivered"       // completed
	DeliveryStatusCancelled      = "cancelled"       // cancelled
)

// DeliveryDriver represents driver availability/info
type DeliveryDriver struct {
	BaseModel
	TenantID    uuid.UUID `json:"tenant_id" gorm:"type:uuid;not null;index"`
	UserID      uuid.UUID `json:"user_id" gorm:"type:uuid;not null;uniqueIndex"`
	IsAvailable bool      `json:"is_available" gorm:"default:true"`
	IsOnline    bool      `json:"is_online" gorm:"default:false"`
	CurrentLat  float64   `json:"current_lat" gorm:"type:decimal(10,7)"`
	CurrentLng  float64   `json:"current_lng" gorm:"type:decimal(10,7)"`
	VehicleType string    `json:"vehicle_type" gorm:"size:30;default:'motorcycle'"` // motorcycle, car, bicycle
	PlateNumber string    `json:"plate_number" gorm:"size:20"`
	TotalTrips  int       `json:"total_trips" gorm:"default:0"`
	Rating      float64   `json:"rating" gorm:"type:decimal(3,2);default:5.00"`

	// Relations
	User *User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

func (DeliveryDriver) TableName() string { return "delivery_drivers" }

// DTOs
type CreateDeliveryRequest struct {
	TransactionID  string  `json:"transaction_id"`
	CustomerID     string  `json:"customer_id"`
	PickupAddress  string  `json:"pickup_address" validate:"required"`
	PickupLat      float64 `json:"pickup_lat"`
	PickupLng      float64 `json:"pickup_lng"`
	PickupContact  string  `json:"pickup_contact"`
	PickupPhone    string  `json:"pickup_phone"`
	DropoffAddress string  `json:"dropoff_address" validate:"required"`
	DropoffLat     float64 `json:"dropoff_lat"`
	DropoffLng     float64 `json:"dropoff_lng"`
	DropoffContact string  `json:"dropoff_contact"`
	DropoffPhone   string  `json:"dropoff_phone"`
	PackageDesc    string  `json:"package_desc"`
	Notes          string  `json:"notes"`
}

type UpdateDeliveryStatusRequest struct {
	Status       string   `json:"status" validate:"required"`
	DriverLat    *float64 `json:"driver_lat"`
	DriverLng    *float64 `json:"driver_lng"`
	CancelReason string   `json:"cancel_reason"`
}

type RegisterDriverRequest struct {
	UserID      string `json:"user_id" validate:"required"`
	VehicleType string `json:"vehicle_type"`
	PlateNumber string `json:"plate_number"`
}

type UpdateDriverLocationRequest struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

// DeliveryRepository interface
type DeliveryRepository interface {
	// Orders
	CreateOrder(order *DeliveryOrder) error
	FindOrderByID(id uuid.UUID) (*DeliveryOrder, error)
	FindOrdersByTenantID(tenantID uuid.UUID, status string, limit, offset int) ([]DeliveryOrder, int64, error)
	FindOrdersByDriverID(driverID uuid.UUID, status string) ([]DeliveryOrder, error)
	UpdateOrder(order *DeliveryOrder) error

	// Drivers
	CreateDriver(driver *DeliveryDriver) error
	FindDriverByID(id uuid.UUID) (*DeliveryDriver, error)
	FindDriverByUserID(userID uuid.UUID) (*DeliveryDriver, error)
	FindAvailableDrivers(tenantID uuid.UUID) ([]DeliveryDriver, error)
	FindDriversByTenantID(tenantID uuid.UUID) ([]DeliveryDriver, error)
	UpdateDriver(driver *DeliveryDriver) error
}
