package usecase

import (
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
)

type DeliveryUsecase struct {
	deliveryRepo domain.DeliveryRepository
}

func NewDeliveryUsecase(dr domain.DeliveryRepository) *DeliveryUsecase {
	return &DeliveryUsecase{deliveryRepo: dr}
}

// CreateOrder creates a new delivery order
func (u *DeliveryUsecase) CreateOrder(tenantID uuid.UUID, req domain.CreateDeliveryRequest) (*domain.DeliveryOrder, error) {
	if req.PickupAddress == "" || req.DropoffAddress == "" {
		return nil, errors.New("pickup and dropoff addresses are required")
	}

	// Calculate distance and fee
	distanceKm := u.calculateDistance(req.PickupLat, req.PickupLng, req.DropoffLat, req.DropoffLng)
	deliveryFee := u.calculateFee(distanceKm)
	estimatedTime := u.estimateTime(distanceKm)

	order := &domain.DeliveryOrder{
		TenantID:       tenantID,
		OrderNumber:    fmt.Sprintf("DLV-%s-%d", tenantID.String()[:6], time.Now().UnixMilli()%100000),
		Status:         domain.DeliveryStatusPending,
		PickupAddress:  req.PickupAddress,
		PickupLat:      req.PickupLat,
		PickupLng:      req.PickupLng,
		PickupContact:  req.PickupContact,
		PickupPhone:    req.PickupPhone,
		DropoffAddress: req.DropoffAddress,
		DropoffLat:     req.DropoffLat,
		DropoffLng:     req.DropoffLng,
		DropoffContact: req.DropoffContact,
		DropoffPhone:   req.DropoffPhone,
		PackageDesc:    req.PackageDesc,
		Notes:          req.Notes,
		DistanceKm:     distanceKm,
		DeliveryFee:    deliveryFee,
		EstimatedTime:  estimatedTime,
	}

	if req.TransactionID != "" {
		txID, err := uuid.Parse(req.TransactionID)
		if err == nil {
			order.TransactionID = &txID
		}
	}
	if req.CustomerID != "" {
		custID, err := uuid.Parse(req.CustomerID)
		if err == nil {
			order.CustomerID = &custID
		}
	}

	if err := u.deliveryRepo.CreateOrder(order); err != nil {
		return nil, errors.New("failed to create delivery order")
	}
	return order, nil
}

// GetOrders returns delivery orders for a tenant
func (u *DeliveryUsecase) GetOrders(tenantID uuid.UUID, status string, limit, offset int) ([]domain.DeliveryOrder, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	return u.deliveryRepo.FindOrdersByTenantID(tenantID, status, limit, offset)
}

// GetOrderByID returns a delivery order by ID
func (u *DeliveryUsecase) GetOrderByID(id uuid.UUID) (*domain.DeliveryOrder, error) {
	return u.deliveryRepo.FindOrderByID(id)
}

// UpdateOrderStatus updates delivery status (GoSend-style flow)
func (u *DeliveryUsecase) UpdateOrderStatus(orderID uuid.UUID, req domain.UpdateDeliveryStatusRequest) (*domain.DeliveryOrder, error) {
	order, err := u.deliveryRepo.FindOrderByID(orderID)
	if err != nil {
		return nil, errors.New("order not found")
	}

	// Validate status transitions
	if !u.isValidTransition(order.Status, req.Status) {
		return nil, fmt.Errorf("invalid status transition: %s → %s", order.Status, req.Status)
	}

	now := time.Now()
	order.Status = req.Status

	switch req.Status {
	case domain.DeliveryStatusPreparing:
		order.AssignedAt = &now
	case domain.DeliveryStatusOnDelivery:
		order.PickedUpAt = &now
	case domain.DeliveryStatusDelivered:
		order.DeliveredAt = &now
	case domain.DeliveryStatusCancelled:
		order.CancelledAt = &now
		order.CancelReason = req.CancelReason
	}

	// Update driver position if provided
	if req.DriverLat != nil && req.DriverLng != nil {
		order.DriverLat = req.DriverLat
		order.DriverLng = req.DriverLng
	}

	if err := u.deliveryRepo.UpdateOrder(order); err != nil {
		return nil, errors.New("failed to update order")
	}
	return order, nil
}

// AssignDriver assigns a driver to an order
func (u *DeliveryUsecase) AssignDriver(orderID uuid.UUID, driverID uuid.UUID) (*domain.DeliveryOrder, error) {
	order, err := u.deliveryRepo.FindOrderByID(orderID)
	if err != nil {
		return nil, errors.New("order not found")
	}

	if order.Status != domain.DeliveryStatusPending {
		return nil, errors.New("order already assigned")
	}

	driver, err := u.deliveryRepo.FindDriverByID(driverID)
	if err != nil {
		return nil, errors.New("driver not found")
	}

	if !driver.IsAvailable || !driver.IsOnline {
		return nil, errors.New("driver is not available")
	}

	now := time.Now()
	order.DriverID = &driver.UserID
	order.Status = domain.DeliveryStatusPreparing
	order.AssignedAt = &now

	// Mark driver as unavailable
	driver.IsAvailable = false
	_ = u.deliveryRepo.UpdateDriver(driver)

	if err := u.deliveryRepo.UpdateOrder(order); err != nil {
		return nil, errors.New("failed to assign driver")
	}

	order.Driver = driver.User
	return order, nil
}

// RegisterDriver registers a user as a delivery driver
func (u *DeliveryUsecase) RegisterDriver(tenantID uuid.UUID, req domain.RegisterDriverRequest) (*domain.DeliveryDriver, error) {
	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	// Check if already registered
	existing, _ := u.deliveryRepo.FindDriverByUserID(userID)
	if existing != nil {
		return nil, errors.New("user is already registered as driver")
	}

	vehicleType := req.VehicleType
	if vehicleType == "" {
		vehicleType = "motorcycle"
	}

	driver := &domain.DeliveryDriver{
		TenantID:    tenantID,
		UserID:      userID,
		IsAvailable: true,
		IsOnline:    false,
		VehicleType: vehicleType,
		PlateNumber: req.PlateNumber,
		Rating:      5.0,
	}

	if err := u.deliveryRepo.CreateDriver(driver); err != nil {
		return nil, errors.New("failed to register driver")
	}
	return driver, nil
}

// GetDrivers returns all drivers for the tenant
func (u *DeliveryUsecase) GetDrivers(tenantID uuid.UUID) ([]domain.DeliveryDriver, error) {
	return u.deliveryRepo.FindDriversByTenantID(tenantID)
}

// GetAvailableDrivers returns online available drivers
func (u *DeliveryUsecase) GetAvailableDrivers(tenantID uuid.UUID) ([]domain.DeliveryDriver, error) {
	return u.deliveryRepo.FindAvailableDrivers(tenantID)
}

// ToggleDriverOnline toggles driver online status
func (u *DeliveryUsecase) ToggleDriverOnline(userID uuid.UUID) (*domain.DeliveryDriver, error) {
	driver, err := u.deliveryRepo.FindDriverByUserID(userID)
	if err != nil {
		return nil, errors.New("driver not found")
	}
	driver.IsOnline = !driver.IsOnline
	if !driver.IsOnline {
		driver.IsAvailable = false
	} else {
		driver.IsAvailable = true
	}
	if err := u.deliveryRepo.UpdateDriver(driver); err != nil {
		return nil, errors.New("failed to update driver status")
	}
	return driver, nil
}

// UpdateDriverLocation updates driver GPS position
func (u *DeliveryUsecase) UpdateDriverLocation(userID uuid.UUID, lat, lng float64) error {
	driver, err := u.deliveryRepo.FindDriverByUserID(userID)
	if err != nil {
		return errors.New("driver not found")
	}
	driver.CurrentLat = lat
	driver.CurrentLng = lng
	return u.deliveryRepo.UpdateDriver(driver)
}

// isValidTransition checks if a status transition is valid (GoSend-style flow)
func (u *DeliveryUsecase) isValidTransition(current, next string) bool {
	validTransitions := map[string][]string{
		domain.DeliveryStatusWaitingPayment: {domain.DeliveryStatusPending, domain.DeliveryStatusCancelled},
		domain.DeliveryStatusPending:        {domain.DeliveryStatusPreparing, domain.DeliveryStatusCancelled},
		domain.DeliveryStatusPreparing:      {domain.DeliveryStatusOnDelivery, domain.DeliveryStatusCancelled},
		domain.DeliveryStatusOnDelivery:     {domain.DeliveryStatusDelivered},
	}

	allowed, ok := validTransitions[current]
	if !ok {
		return false
	}
	for _, s := range allowed {
		if s == next {
			return true
		}
	}
	return false
}

// calculateDistance calculates distance using Haversine formula
func (u *DeliveryUsecase) calculateDistance(lat1, lng1, lat2, lng2 float64) float64 {
	if lat1 == 0 && lng1 == 0 || lat2 == 0 && lng2 == 0 {
		return 3.0 // default 3km
	}
	const R = 6371 // Earth radius in km
	dLat := (lat2 - lat1) * math.Pi / 180
	dLng := (lng2 - lng1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLng/2)*math.Sin(dLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return math.Round(R*c*100) / 100
}

// calculateFee calculates delivery fee
func (u *DeliveryUsecase) calculateFee(distanceKm float64) float64 {
	baseFee := 5000.0  // Rp 5,000 base
	perKmFee := 3000.0 // Rp 3,000/km
	fee := baseFee + (distanceKm * perKmFee)
	return math.Round(fee/500) * 500 // round to nearest 500
}

// estimateTime estimates delivery time in minutes
func (u *DeliveryUsecase) estimateTime(distanceKm float64) int {
	// Average speed 25 km/h in city + 5 min overhead
	minutes := (distanceKm / 25.0) * 60
	return int(math.Ceil(minutes)) + 5
}
