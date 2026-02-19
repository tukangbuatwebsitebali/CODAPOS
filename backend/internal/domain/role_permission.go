package domain

// RolePermission defines which actions are allowed for each role.
// Super Admin always bypasses these checks.
type RolePermission struct {
	BaseModel
	Role      string `json:"role" gorm:"size:50;not null;uniqueIndex:idx_role_action"`
	Action    string `json:"action" gorm:"size:100;not null;uniqueIndex:idx_role_action"`
	IsAllowed bool   `json:"is_allowed" gorm:"default:false"`
}

func (RolePermission) TableName() string { return "role_permissions" }

// Action constants (same as middleware)
const (
	ActionManageUsers      = "manage_users"
	ActionManageProducts   = "manage_products"
	ActionReadProducts     = "read_products"
	ActionManageOutlets    = "manage_outlets"
	ActionPOSCheckout      = "pos_checkout"
	ActionPOSRefund        = "pos_refund"
	ActionReadTransactions = "read_transactions"
	ActionManageAccounting = "manage_accounting"
	ActionManageCustomers  = "manage_customers"
	ActionManageSettings   = "manage_settings"
)

// AllActions returns all available action keys
func AllActions() []string {
	return []string{
		ActionManageUsers,
		ActionManageProducts,
		ActionReadProducts,
		ActionManageOutlets,
		ActionPOSCheckout,
		ActionPOSRefund,
		ActionReadTransactions,
		ActionManageAccounting,
		ActionManageCustomers,
		ActionManageSettings,
	}
}

// ActionLabels returns human-readable labels for actions
func ActionLabels() map[string]string {
	return map[string]string{
		ActionManageUsers:      "Kelola Pengguna",
		ActionManageProducts:   "Kelola Produk",
		ActionReadProducts:     "Lihat Produk",
		ActionManageOutlets:    "Kelola Outlet",
		ActionPOSCheckout:      "POS Checkout",
		ActionPOSRefund:        "POS Refund",
		ActionReadTransactions: "Lihat Transaksi",
		ActionManageAccounting: "Kelola Akuntansi",
		ActionManageCustomers:  "Kelola Pelanggan",
		ActionManageSettings:   "Kelola Pengaturan",
	}
}

// AllMerchantRoles returns all non-super-admin roles
func AllMerchantRoles() []string {
	return []string{
		RoleOwner,
		RoleAdmin,
		RoleFinance,
		RoleOutletManager,
		RoleCashier,
		RoleCustomer,
	}
}

// RoleLabels returns human-readable labels for roles
func RoleLabels() map[string]string {
	return map[string]string{
		RoleOwner:         "Owner",
		RoleAdmin:         "Admin",
		RoleFinance:       "Finance",
		RoleOutletManager: "Outlet Manager",
		RoleCashier:       "Kasir",
		RoleCustomer:      "Customer",
	}
}

// RolePermissionRepository defines the interface for role permission data access
type RolePermissionRepository interface {
	FindAll() ([]RolePermission, error)
	FindByRole(role string) ([]RolePermission, error)
	IsAllowed(role, action string) (bool, error)
	Upsert(role, action string, allowed bool) error
	BulkUpsert(perms []RolePermission) error
}
