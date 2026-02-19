package repository

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type customerRepo struct {
	db *gorm.DB
}

func NewCustomerRepository(db *gorm.DB) domain.CustomerRepository {
	return &customerRepo{db: db}
}

func (r *customerRepo) Create(customer *domain.Customer) error {
	return r.db.Create(customer).Error
}

func (r *customerRepo) CreateAddress(address *domain.CustomerAddress) error {
	return r.db.Create(address).Error
}

func (r *customerRepo) FindByID(id uuid.UUID) (*domain.Customer, error) {
	var customer domain.Customer
	err := r.db.Preload("Addresses").Where("id = ?", id).First(&customer).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

func (r *customerRepo) FindByPhone(tenantID uuid.UUID, phone string) (*domain.Customer, error) {
	var customer domain.Customer
	err := r.db.Preload("Addresses").Where("tenant_id = ? AND phone = ?", tenantID, phone).First(&customer).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

func (r *customerRepo) FindByTenantID(tenantID uuid.UUID, limit, offset int) ([]domain.Customer, int64, error) {
	var customers []domain.Customer
	var total int64
	r.db.Model(&domain.Customer{}).Where("tenant_id = ?", tenantID).Count(&total)
	err := r.db.Preload("Addresses").Where("tenant_id = ?", tenantID).
		Order("created_at DESC").Limit(limit).Offset(offset).Find(&customers).Error
	return customers, total, err
}

func (r *customerRepo) FindAll(limit, offset int) ([]domain.Customer, int64, error) {
	var customers []domain.Customer
	var total int64
	r.db.Model(&domain.Customer{}).Count(&total)
	err := r.db.Preload("Addresses").Preload("Tenant").
		Order("created_at DESC").Limit(limit).Offset(offset).Find(&customers).Error
	return customers, total, err
}

func (r *customerRepo) Update(customer *domain.Customer) error {
	return r.db.Save(customer).Error
}

func (r *customerRepo) FindAddressesByCustomerID(customerID uuid.UUID) ([]domain.CustomerAddress, error) {
	var addresses []domain.CustomerAddress
	err := r.db.Where("customer_id = ?", customerID).Order("is_default DESC, created_at DESC").Find(&addresses).Error
	return addresses, err
}

func (r *customerRepo) UpdateAddress(address *domain.CustomerAddress) error {
	return r.db.Save(address).Error
}

func (r *customerRepo) DeleteAddress(id uuid.UUID) error {
	return r.db.Delete(&domain.CustomerAddress{}, id).Error
}

func (r *customerRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&domain.Customer{}, id).Error
}
