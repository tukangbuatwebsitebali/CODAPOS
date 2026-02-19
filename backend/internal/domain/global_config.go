package domain

// GlobalConfig stores platform-level configuration managed by Super Admin
type GlobalConfig struct {
	BaseModel
	Key         string `json:"key" gorm:"size:100;uniqueIndex;not null"`
	Value       string `json:"value" gorm:"type:text;not null"`
	Description string `json:"description,omitempty" gorm:"size:500"`
}

func (GlobalConfig) TableName() string { return "global_configs" }

// Global config key constants
const (
	ConfigDefaultRevenueSharePct = "default_revenue_share_pct"
	ConfigSMTPHost               = "smtp_host"
	ConfigSMTPPort               = "smtp_port"
	ConfigSMTPUser               = "smtp_user"
	ConfigSMTPPass               = "smtp_pass"
	ConfigGoogleMapsAPIKey       = "google_maps_api_key"

	// Midtrans payment gateway
	ConfigMidtransMode       = "midtrans_mode"
	ConfigMidtransMerchantID = "midtrans_merchant_id"
	ConfigMidtransClientKey  = "midtrans_client_key"
	ConfigMidtransServerKey  = "midtrans_server_key"
)

// GlobalConfigRepository defines the interface for global config data access
type GlobalConfigRepository interface {
	Create(config *GlobalConfig) error
	FindByKey(key string) (*GlobalConfig, error)
	FindAll() ([]GlobalConfig, error)
	Update(config *GlobalConfig) error
	Delete(key string) error
}
