package usecase

import (
	"errors"

	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
)

type CustomerUsecase struct {
	customerRepo domain.CustomerRepository
	tenantRepo   domain.TenantRepository
}

func NewCustomerUsecase(cr domain.CustomerRepository, tr domain.TenantRepository) *CustomerUsecase {
	return &CustomerUsecase{customerRepo: cr, tenantRepo: tr}
}

// CreateCustomer creates a new customer and optionally an address (merchant-side)
func (u *CustomerUsecase) CreateCustomer(tenantID uuid.UUID, req domain.CreateCustomerRequest) (*domain.Customer, error) {
	// Check if customer already exists by phone
	existing, _ := u.customerRepo.FindByPhone(tenantID, req.Phone)
	if existing != nil {
		// Update name if different
		if req.Name != "" && req.Name != existing.Name {
			existing.Name = req.Name
			u.customerRepo.Update(existing)
		}
		// Add new address if provided
		if req.FullAddress != "" {
			address := &domain.CustomerAddress{
				CustomerID:  existing.ID,
				Label:       "Utama",
				FullAddress: req.FullAddress,
				City:        req.City,
				Province:    req.Province,
				PostalCode:  req.PostalCode,
				Latitude:    req.Latitude,
				Longitude:   req.Longitude,
				IsDefault:   true,
			}
			u.customerRepo.CreateAddress(address)
		}
		return existing, nil
	}

	customer := &domain.Customer{
		TenantID: tenantID,
		Name:     req.Name,
		Phone:    req.Phone,
		Email:    req.Email,
		Notes:    req.Notes,
		IsActive: true,
	}

	if err := u.customerRepo.Create(customer); err != nil {
		return nil, err
	}

	// Create address if provided
	if req.FullAddress != "" {
		address := &domain.CustomerAddress{
			CustomerID:  customer.ID,
			Label:       "Utama",
			FullAddress: req.FullAddress,
			City:        req.City,
			Province:    req.Province,
			PostalCode:  req.PostalCode,
			Latitude:    req.Latitude,
			Longitude:   req.Longitude,
			IsDefault:   true,
		}
		if err := u.customerRepo.CreateAddress(address); err != nil {
			return nil, err
		}
		customer.Addresses = append(customer.Addresses, *address)
	}

	return customer, nil
}

// SignUpCustomer handles public self-registration by a customer
func (u *CustomerUsecase) SignUpCustomer(req domain.CustomerSignUpRequest) (*domain.Customer, error) {
	if req.TenantSlug == "" || req.Name == "" || req.Phone == "" {
		return nil, errors.New("tenant_slug, name, and phone are required")
	}

	// Find the tenant by slug
	tenant, err := u.tenantRepo.FindBySlug(req.TenantSlug)
	if err != nil || tenant == nil {
		return nil, errors.New("merchant not found")
	}

	if !tenant.IsEnabled {
		return nil, errors.New("merchant is currently disabled")
	}

	// Check if customer already exists
	existing, _ := u.customerRepo.FindByPhone(tenant.ID, req.Phone)
	if existing != nil {
		return existing, nil
	}

	customer := &domain.Customer{
		TenantID: tenant.ID,
		Name:     req.Name,
		Phone:    req.Phone,
		Email:    req.Email,
		IsActive: true,
	}

	if err := u.customerRepo.Create(customer); err != nil {
		return nil, errors.New("failed to register customer")
	}

	// Create address if provided
	if req.FullAddress != "" {
		address := &domain.CustomerAddress{
			CustomerID:  customer.ID,
			Label:       "Utama",
			FullAddress: req.FullAddress,
			City:        req.City,
			Province:    req.Province,
			PostalCode:  req.PostalCode,
			Latitude:    req.Latitude,
			Longitude:   req.Longitude,
			IsDefault:   true,
		}
		_ = u.customerRepo.CreateAddress(address)
		customer.Addresses = append(customer.Addresses, *address)
	}

	return customer, nil
}

// AddAddress adds a new address to an existing customer
func (u *CustomerUsecase) AddAddress(customerID uuid.UUID, req domain.AddAddressRequest) (*domain.CustomerAddress, error) {
	customer, err := u.customerRepo.FindByID(customerID)
	if err != nil {
		return nil, errors.New("customer not found")
	}

	address := &domain.CustomerAddress{
		CustomerID:  customer.ID,
		Label:       req.Label,
		FullAddress: req.FullAddress,
		City:        req.City,
		Province:    req.Province,
		PostalCode:  req.PostalCode,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		IsDefault:   req.IsDefault,
	}

	if err := u.customerRepo.CreateAddress(address); err != nil {
		return nil, errors.New("failed to add address")
	}

	return address, nil
}

// UpdateAddress updates an existing address
func (u *CustomerUsecase) UpdateAddress(addressID uuid.UUID, req domain.AddAddressRequest) error {
	address := &domain.CustomerAddress{
		BaseModel:   domain.BaseModel{ID: addressID},
		Label:       req.Label,
		FullAddress: req.FullAddress,
		City:        req.City,
		Province:    req.Province,
		PostalCode:  req.PostalCode,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		IsDefault:   req.IsDefault,
	}

	return u.customerRepo.UpdateAddress(address)
}

// DeleteAddress removes an address
func (u *CustomerUsecase) DeleteAddress(addressID uuid.UUID) error {
	return u.customerRepo.DeleteAddress(addressID)
}

// UpdateCustomer updates a customer's profile
func (u *CustomerUsecase) UpdateCustomer(customerID uuid.UUID, req domain.UpdateCustomerRequest) (*domain.Customer, error) {
	customer, err := u.customerRepo.FindByID(customerID)
	if err != nil {
		return nil, errors.New("customer not found")
	}

	if req.Name != "" {
		customer.Name = req.Name
	}
	if req.Phone != "" {
		customer.Phone = req.Phone
	}
	if req.Email != "" {
		customer.Email = req.Email
	}
	if req.Notes != "" {
		customer.Notes = req.Notes
	}

	if err := u.customerRepo.Update(customer); err != nil {
		return nil, errors.New("failed to update customer")
	}
	return customer, nil
}

// GetCustomersByTenant returns customers for a specific merchant
func (u *CustomerUsecase) GetCustomersByTenant(tenantID uuid.UUID, limit, offset int) ([]domain.Customer, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	return u.customerRepo.FindByTenantID(tenantID, limit, offset)
}

// GetAllCustomers returns all customers (Super Admin)
func (u *CustomerUsecase) GetAllCustomers(limit, offset int) ([]domain.Customer, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	return u.customerRepo.FindAll(limit, offset)
}

// GetCustomerByID returns a customer by ID
func (u *CustomerUsecase) GetCustomerByID(id uuid.UUID) (*domain.Customer, error) {
	return u.customerRepo.FindByID(id)
}

// GetAddressesByCustomerID returns addresses for a customer
func (u *CustomerUsecase) GetAddressesByCustomerID(customerID uuid.UUID) ([]domain.CustomerAddress, error) {
	return u.customerRepo.FindAddressesByCustomerID(customerID)
}
