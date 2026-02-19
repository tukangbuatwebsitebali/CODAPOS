package domain

import (
	"github.com/google/uuid"
)

// FeatureFlag controls per-tenant feature availability based on subscription
type FeatureFlag struct {
	BaseModel
	TenantID   uuid.UUID `json:"tenant_id" gorm:"type:uuid;not null;index:idx_feature_tenant_key,unique"`
	FeatureKey string    `json:"feature_key" gorm:"size:100;not null;index:idx_feature_tenant_key,unique"`
	IsEnabled  bool      `json:"is_enabled" gorm:"default:false"`

	// Relations
	Tenant *Tenant `json:"tenant,omitempty" gorm:"foreignKey:TenantID"`
}

func (FeatureFlag) TableName() string { return "feature_flags" }

// Feature key constants
const (
	FeatureCustomDomain       = "custom_domain"
	FeatureMultiRole          = "multi_role"
	FeatureAutomationOrdering = "automation_ordering"
	FeaturePaymentGateway     = "payment_gateway"
	FeatureDetailedReport     = "detailed_report"
	FeatureForecastAI         = "forecast_ai"
	FeatureKurirSendiri       = "kurir_sendiri"
	FeatureCustomHours        = "custom_hours"
	FeaturePrinterBluetooth   = "printer_bluetooth"
	FeatureCustomTemplate     = "custom_template"
)

// AllFeatureKeys returns all available feature keys
func AllFeatureKeys() []string {
	return []string{
		FeatureCustomDomain,
		FeatureMultiRole,
		FeatureAutomationOrdering,
		FeaturePaymentGateway,
		FeatureDetailedReport,
		FeatureForecastAI,
		FeatureKurirSendiri,
		FeatureCustomHours,
		FeaturePrinterBluetooth,
		FeatureCustomTemplate,
	}
}

// FeatureFlagRepository defines the interface for feature flag data access
type FeatureFlagRepository interface {
	Create(flag *FeatureFlag) error
	BulkCreate(flags []FeatureFlag) error
	FindByTenantID(tenantID uuid.UUID) ([]FeatureFlag, error)
	IsEnabled(tenantID uuid.UUID, featureKey string) (bool, error)
	Toggle(tenantID uuid.UUID, featureKey string, enabled bool) error
	DeleteByTenantID(tenantID uuid.UUID) error
}
