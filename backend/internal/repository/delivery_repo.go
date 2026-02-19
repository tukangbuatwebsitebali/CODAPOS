package repository

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DeliveryRepository struct {
	db *gorm.DB
}

func NewDeliveryRepository(db *gorm.DB) *DeliveryRepository {
	return &DeliveryRepository{db: db}
}

// -------- Orders --------

func (r *DeliveryRepository) CreateOrder(order *domain.DeliveryOrder) error {
	return r.db.Create(order).Error
}

func (r *DeliveryRepository) FindOrderByID(id uuid.UUID) (*domain.DeliveryOrder, error) {
	var order domain.DeliveryOrder
	err := r.db.Preload("Customer").Preload("Driver").Where("id = ?", id).First(&order).Error
	return &order, err
}

func (r *DeliveryRepository) FindOrdersByTenantID(tenantID uuid.UUID, status string, limit, offset int) ([]domain.DeliveryOrder, int64, error) {
	var orders []domain.DeliveryOrder
	var total int64
	q := r.db.Where("tenant_id = ?", tenantID)
	if status != "" {
		q = q.Where("status = ?", status)
	}
	q.Model(&domain.DeliveryOrder{}).Count(&total)
	err := q.Preload("Customer").Preload("Driver").Order("created_at DESC").Limit(limit).Offset(offset).Find(&orders).Error
	return orders, total, err
}

func (r *DeliveryRepository) FindOrdersByDriverID(driverID uuid.UUID, status string) ([]domain.DeliveryOrder, error) {
	var orders []domain.DeliveryOrder
	q := r.db.Where("driver_id = ?", driverID)
	if status != "" {
		q = q.Where("status = ?", status)
	}
	err := q.Preload("Customer").Order("created_at DESC").Find(&orders).Error
	return orders, err
}

func (r *DeliveryRepository) UpdateOrder(order *domain.DeliveryOrder) error {
	return r.db.Save(order).Error
}

// -------- Drivers --------

func (r *DeliveryRepository) CreateDriver(driver *domain.DeliveryDriver) error {
	return r.db.Create(driver).Error
}

func (r *DeliveryRepository) FindDriverByID(id uuid.UUID) (*domain.DeliveryDriver, error) {
	var driver domain.DeliveryDriver
	err := r.db.Preload("User").Where("id = ?", id).First(&driver).Error
	return &driver, err
}

func (r *DeliveryRepository) FindDriverByUserID(userID uuid.UUID) (*domain.DeliveryDriver, error) {
	var driver domain.DeliveryDriver
	err := r.db.Preload("User").Where("user_id = ?", userID).First(&driver).Error
	return &driver, err
}

func (r *DeliveryRepository) FindAvailableDrivers(tenantID uuid.UUID) ([]domain.DeliveryDriver, error) {
	var drivers []domain.DeliveryDriver
	err := r.db.Preload("User").Where("tenant_id = ? AND is_available = ? AND is_online = ?", tenantID, true, true).Find(&drivers).Error
	return drivers, err
}

func (r *DeliveryRepository) FindDriversByTenantID(tenantID uuid.UUID) ([]domain.DeliveryDriver, error) {
	var drivers []domain.DeliveryDriver
	err := r.db.Preload("User").Where("tenant_id = ?", tenantID).Find(&drivers).Error
	return drivers, err
}

func (r *DeliveryRepository) UpdateDriver(driver *domain.DeliveryDriver) error {
	return r.db.Save(driver).Error
}
