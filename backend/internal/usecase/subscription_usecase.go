package usecase

import (
	"errors"
	"fmt"
	"time"

	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
)

type SubscriptionUsecase struct {
	subRepo     domain.SubscriptionRepository
	tenantRepo  domain.TenantRepository
	featureRepo domain.FeatureFlagRepository
}

func NewSubscriptionUsecase(
	sr domain.SubscriptionRepository,
	tr domain.TenantRepository,
	fr domain.FeatureFlagRepository,
) *SubscriptionUsecase {
	return &SubscriptionUsecase{subRepo: sr, tenantRepo: tr, featureRepo: fr}
}

// GetPlans returns all available subscription plans
func (u *SubscriptionUsecase) GetPlans() ([]domain.SubscriptionPlan, error) {
	return u.subRepo.FindAllPlans()
}

// GetCurrentSubscription returns current tenant subscription
func (u *SubscriptionUsecase) GetCurrentSubscription(tenantID uuid.UUID) (*domain.Subscription, error) {
	return u.subRepo.FindByTenantID(tenantID)
}

// GetSubscriptionStatus returns combined subscription info for a tenant
func (u *SubscriptionUsecase) GetSubscriptionStatus(tenantID uuid.UUID) (map[string]interface{}, error) {
	tenant, err := u.tenantRepo.FindByID(tenantID)
	if err != nil {
		return nil, errors.New("tenant not found")
	}

	sub, _ := u.subRepo.FindByTenantID(tenantID)
	features, _ := u.featureRepo.FindByTenantID(tenantID)

	// Build features map
	featureMap := make(map[string]bool)
	for _, f := range features {
		featureMap[f.FeatureKey] = f.IsEnabled
	}

	result := map[string]interface{}{
		"tenant_id":            tenant.ID,
		"tenant_name":          tenant.Name,
		"current_plan":         tenant.SubscriptionPlan,
		"subscription_status":  tenant.SubscriptionStatus,
		"subscription_expires": tenant.SubscriptionExpiresAt,
		"features":             featureMap,
	}

	if sub != nil {
		result["subscription"] = sub
	}

	return result, nil
}

// UpgradePlan handles plan upgrade (creates subscription record)
func (u *SubscriptionUsecase) UpgradePlan(tenantID uuid.UUID, planID uuid.UUID, billingCycle string) (*domain.Subscription, error) {
	// Find the plan
	plan, err := u.subRepo.FindPlanByID(planID)
	if err != nil {
		return nil, errors.New("plan not found")
	}

	if !plan.IsActive {
		return nil, errors.New("plan is not available")
	}

	// Find tenant
	tenant, err := u.tenantRepo.FindByID(tenantID)
	if err != nil {
		return nil, errors.New("tenant not found")
	}

	// Calculate expiry
	now := time.Now()
	var expiresAt time.Time
	if billingCycle == "yearly" {
		expiresAt = now.AddDate(1, 0, 0)
	} else {
		expiresAt = now.AddDate(0, 1, 0)
	}

	// Cancel existing active subscription
	existingSub, _ := u.subRepo.FindByTenantID(tenantID)
	if existingSub != nil {
		existingSub.Status = "cancelled"
		existingSub.CancelledAt = &now
		_ = u.subRepo.UpdateSubscription(existingSub)
	}

	// Create new subscription
	sub := &domain.Subscription{
		TenantID:  tenantID,
		PlanID:    plan.ID,
		Status:    "active",
		StartedAt: now,
		ExpiresAt: expiresAt,
	}

	if err := u.subRepo.CreateSubscription(sub); err != nil {
		return nil, errors.New("failed to create subscription")
	}

	// Update tenant plan info
	tenant.SubscriptionPlan = plan.Slug
	tenant.SubscriptionStatus = "active"
	tenant.SubscriptionExpiresAt = &expiresAt
	if err := u.tenantRepo.Update(tenant); err != nil {
		return nil, errors.New("failed to update tenant plan")
	}

	// Enable features based on plan
	u.enableFeaturesForPlan(tenantID, plan.Slug)

	// Generate invoice
	u.createInvoice(tenantID, sub.ID, plan, billingCycle)

	sub.Plan = plan
	return sub, nil
}

// enableFeaturesForPlan enables features for a plan
func (u *SubscriptionUsecase) enableFeaturesForPlan(tenantID uuid.UUID, planSlug string) {
	// Free basic: minimal features
	// Pro: all features enabled
	proFeatures := []string{
		domain.FeatureMultiRole,
		domain.FeatureDetailedReport,
		domain.FeaturePaymentGateway,
		domain.FeatureCustomHours,
		domain.FeaturePrinterBluetooth,
		domain.FeatureAutomationOrdering,
		domain.FeatureCustomTemplate,
	}

	if planSlug == "pro" {
		for _, key := range proFeatures {
			_ = u.featureRepo.Toggle(tenantID, key, true)
		}
	}
}

// createInvoice generates a billing invoice (placeholder for payment integration)
func (u *SubscriptionUsecase) createInvoice(tenantID uuid.UUID, subID uuid.UUID, plan *domain.SubscriptionPlan, billingCycle string) {
	var amount float64
	if billingCycle == "yearly" && plan.PriceYearly != nil {
		amount = *plan.PriceYearly
	} else {
		amount = plan.PriceMonthly
	}

	// For now, just log. In production, integrate with payment gateway
	_ = amount
	_ = fmt.Sprintf("INV-%s-%d", tenantID.String()[:8], time.Now().Unix())
}
