package usecase

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
)

type SuperAdminUsecase struct {
	tenantRepo       domain.TenantRepository
	merchantTypeRepo domain.MerchantTypeRepository
	featureFlagRepo  domain.FeatureFlagRepository
	globalConfigRepo domain.GlobalConfigRepository
	rolePermRepo     domain.RolePermissionRepository
}

func NewSuperAdminUsecase(
	tr domain.TenantRepository,
	mtr domain.MerchantTypeRepository,
	ffr domain.FeatureFlagRepository,
	gcr domain.GlobalConfigRepository,
	rpr domain.RolePermissionRepository,
) *SuperAdminUsecase {
	return &SuperAdminUsecase{
		tenantRepo:       tr,
		merchantTypeRepo: mtr,
		featureFlagRepo:  ffr,
		globalConfigRepo: gcr,
		rolePermRepo:     rpr,
	}
}

// ========================
// Merchant Management
// ========================

// GetAllMerchants lists all tenants with pagination
func (u *SuperAdminUsecase) GetAllMerchants(limit, offset int) ([]domain.Tenant, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	return u.tenantRepo.FindAll(limit, offset)
}

// GetMerchantByID returns a specific tenant
func (u *SuperAdminUsecase) GetMerchantByID(id uuid.UUID) (*domain.Tenant, error) {
	return u.tenantRepo.FindByID(id)
}

// ToggleMerchant enables or disables a merchant
func (u *SuperAdminUsecase) ToggleMerchant(id uuid.UUID, enabled bool) error {
	tenant, err := u.tenantRepo.FindByID(id)
	if err != nil {
		return errors.New("merchant not found")
	}
	tenant.IsEnabled = enabled
	return u.tenantRepo.Update(tenant)
}

// UpdateRevenueShare sets the revenue share percentage for a merchant
func (u *SuperAdminUsecase) UpdateRevenueShare(id uuid.UUID, pct float64) error {
	if pct < 0 || pct > 100 {
		return errors.New("revenue share must be between 0 and 100")
	}
	tenant, err := u.tenantRepo.FindByID(id)
	if err != nil {
		return errors.New("merchant not found")
	}
	tenant.RevenueSharePct = pct
	return u.tenantRepo.Update(tenant)
}

// UpdateMerchant updates editable fields of a merchant
func (u *SuperAdminUsecase) UpdateMerchant(id uuid.UUID, name, slug, subdomain, subscriptionPlan, openTime, closeTime string, merchantTypeID *uuid.UUID) error {
	tenant, err := u.tenantRepo.FindByID(id)
	if err != nil {
		return errors.New("merchant not found")
	}
	if name != "" {
		tenant.Name = name
	}
	if slug != "" {
		tenant.Slug = slug
	}
	if subdomain != "" {
		tenant.Subdomain = subdomain
	}
	if subscriptionPlan != "" {
		tenant.SubscriptionPlan = subscriptionPlan
	}
	if openTime != "" {
		tenant.OpenTime = openTime
	}
	if closeTime != "" {
		tenant.CloseTime = closeTime
	}
	if merchantTypeID != nil {
		tenant.MerchantTypeID = merchantTypeID
	}
	return u.tenantRepo.Update(tenant)
}

// DeleteMerchant deletes a merchant by ID
func (u *SuperAdminUsecase) DeleteMerchant(id uuid.UUID) error {
	return u.tenantRepo.Delete(id)
}

// ========================
// Merchant Types
// ========================

// GetMerchantTypes lists all merchant types
func (u *SuperAdminUsecase) GetMerchantTypes() ([]domain.MerchantType, error) {
	return u.merchantTypeRepo.FindAll()
}

// CreateMerchantType adds a new merchant type
func (u *SuperAdminUsecase) CreateMerchantType(name, slug, icon string) (*domain.MerchantType, error) {
	existing, _ := u.merchantTypeRepo.FindBySlug(slug)
	if existing != nil {
		return nil, fmt.Errorf("merchant type '%s' already exists", slug)
	}

	mt := &domain.MerchantType{
		Name:     name,
		Slug:     slug,
		Icon:     icon,
		IsActive: true,
	}
	if err := u.merchantTypeRepo.Create(mt); err != nil {
		return nil, err
	}
	return mt, nil
}

// UpdateMerchantType updates an existing merchant type
func (u *SuperAdminUsecase) UpdateMerchantType(id uuid.UUID, name, icon string) error {
	mt, err := u.merchantTypeRepo.FindByID(id)
	if err != nil {
		return errors.New("merchant type not found")
	}
	mt.Name = name
	mt.Icon = icon
	return u.merchantTypeRepo.Update(mt)
}

// DeleteMerchantType soft-deletes a merchant type
func (u *SuperAdminUsecase) DeleteMerchantType(id uuid.UUID) error {
	return u.merchantTypeRepo.Delete(id)
}

// ========================
// Feature Flags
// ========================

// GetFeatureFlags returns all feature flags for a tenant
func (u *SuperAdminUsecase) GetFeatureFlags(tenantID uuid.UUID) ([]domain.FeatureFlag, error) {
	return u.featureFlagRepo.FindByTenantID(tenantID)
}

// ToggleFeatureFlag enables or disables a feature for a tenant
func (u *SuperAdminUsecase) ToggleFeatureFlag(tenantID uuid.UUID, featureKey string, enabled bool) error {
	return u.featureFlagRepo.Toggle(tenantID, featureKey, enabled)
}

// EnableAllFeatures enables all feature flags for a tenant (Pro upgrade)
func (u *SuperAdminUsecase) EnableAllFeatures(tenantID uuid.UUID) error {
	for _, key := range domain.AllFeatureKeys() {
		if err := u.featureFlagRepo.Toggle(tenantID, key, true); err != nil {
			return err
		}
	}
	return nil
}

// ========================
// Global Config
// ========================

// GetGlobalConfigs returns all global configs
func (u *SuperAdminUsecase) GetGlobalConfigs() ([]domain.GlobalConfig, error) {
	return u.globalConfigRepo.FindAll()
}

// SetGlobalConfig sets a global config value
func (u *SuperAdminUsecase) SetGlobalConfig(key, value, description string) error {
	existing, _ := u.globalConfigRepo.FindByKey(key)
	if existing != nil {
		existing.Value = value
		if description != "" {
			existing.Description = description
		}
		return u.globalConfigRepo.Update(existing)
	}

	config := &domain.GlobalConfig{
		Key:         key,
		Value:       value,
		Description: description,
	}
	return u.globalConfigRepo.Create(config)
}

// GetDefaultRevenueSharePct returns the global default revenue share
func (u *SuperAdminUsecase) GetDefaultRevenueSharePct() float64 {
	config, err := u.globalConfigRepo.FindByKey(domain.ConfigDefaultRevenueSharePct)
	if err != nil {
		return 10.0 // default
	}
	pct, err := strconv.ParseFloat(config.Value, 64)
	if err != nil {
		return 10.0
	}
	return pct
}

// ========================
// Role Permissions (RBAC)
// ========================

// GetRolePermissions returns all role permissions
func (u *SuperAdminUsecase) GetRolePermissions() ([]domain.RolePermission, error) {
	return u.rolePermRepo.FindAll()
}

// GetRolePermissionsByRole returns permissions for a specific role
func (u *SuperAdminUsecase) GetRolePermissionsByRole(role string) ([]domain.RolePermission, error) {
	return u.rolePermRepo.FindByRole(role)
}

// SetRolePermission sets a single role-action permission
func (u *SuperAdminUsecase) SetRolePermission(role, action string, allowed bool) error {
	return u.rolePermRepo.Upsert(role, action, allowed)
}

// BulkSetRolePermissions sets multiple permissions for a role
func (u *SuperAdminUsecase) BulkSetRolePermissions(role string, perms []struct {
	Action    string `json:"action"`
	IsAllowed bool   `json:"is_allowed"`
}) error {
	var rps []domain.RolePermission
	for _, p := range perms {
		rps = append(rps, domain.RolePermission{
			Role:      role,
			Action:    p.Action,
			IsAllowed: p.IsAllowed,
		})
	}
	return u.rolePermRepo.BulkUpsert(rps)
}
