package domain

import (
	"time"

	"github.com/google/uuid"
)

// User represents a system user within a tenant
type User struct {
	BaseModel
	TenantID     uuid.UUID  `json:"tenant_id" gorm:"type:uuid;not null;index"`
	Email        string     `json:"email" gorm:"size:255;not null"`
	PasswordHash string     `json:"-" gorm:"size:255;not null"`
	FullName     string     `json:"full_name" gorm:"size:255;not null"`
	Phone        string     `json:"phone,omitempty" gorm:"size:50"`
	AvatarURL    string     `json:"avatar_url,omitempty"`
	Role         string     `json:"role" gorm:"size:50;not null;default:'cashier'"`
	OutletID     *uuid.UUID `json:"outlet_id,omitempty" gorm:"type:uuid"`
	IsActive     bool       `json:"is_active" gorm:"default:true"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty"`

	// Relations
	Tenant *Tenant `json:"tenant,omitempty" gorm:"foreignKey:TenantID"`
	Outlet *Outlet `json:"outlet,omitempty" gorm:"foreignKey:OutletID"`
}

func (User) TableName() string { return "users" }

// UserRole constants
const (
	RoleSuperAdmin    = "super_admin"
	RoleOwner         = "owner"
	RoleAdmin         = "admin"
	RoleFinance       = "finance"
	RoleOutletManager = "outlet_manager"
	RoleCashier       = "cashier"
	RoleCustomer      = "customer"
)

// AuditLog records all system actions (immutable)
type AuditLog struct {
	ID         uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TenantID   uuid.UUID  `json:"tenant_id" gorm:"type:uuid;not null;index"`
	UserID     *uuid.UUID `json:"user_id,omitempty" gorm:"type:uuid"`
	Action     string     `json:"action" gorm:"size:100;not null"`
	EntityType string     `json:"entity_type" gorm:"size:100;not null"`
	EntityID   *uuid.UUID `json:"entity_id,omitempty" gorm:"type:uuid"`
	OldData    JSON       `json:"old_data,omitempty" gorm:"type:jsonb"`
	NewData    JSON       `json:"new_data,omitempty" gorm:"type:jsonb"`
	IPAddress  string     `json:"ip_address,omitempty" gorm:"size:45"`
	UserAgent  string     `json:"user_agent,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

func (AuditLog) TableName() string { return "audit_logs" }

// LoginRequest is the DTO for login
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

// RegisterRequest is the DTO for registering a new tenant + admin user
type RegisterRequest struct {
	TenantName       string `json:"tenant_name" validate:"required,min=2"`
	TenantSlug       string `json:"tenant_slug" validate:"required,min=2,max=100"`
	FullName         string `json:"full_name" validate:"required,min=2"`
	Email            string `json:"email" validate:"required,email"`
	Password         string `json:"password" validate:"required,min=6"`
	Phone            string `json:"phone,omitempty"`
	MerchantTypeSlug string `json:"merchant_type_slug,omitempty"`
}

// AuthResponse is returned after successful auth
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// InviteUserRequest is the DTO for inviting a team member
type InviteUserRequest struct {
	Email        string `json:"email" validate:"required,email"`
	FullName     string `json:"full_name" validate:"required,min=2"`
	Phone        string `json:"phone,omitempty"`
	Role         string `json:"role" validate:"required"`
	TempPassword string `json:"temp_password" validate:"required,min=6"`
	OutletID     string `json:"outlet_id,omitempty"`
}

// UpdateProfileRequest is the DTO for updating user profile
type UpdateProfileRequest struct {
	FullName  string `json:"full_name"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatar_url"`
}

// ChangePasswordRequest is the DTO for changing password
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" validate:"required,min=6"`
	NewPassword string `json:"new_password" validate:"required,min=6"`
}

// UpdateMerchantRequest is the DTO for updating merchant/tenant info
type UpdateMerchantRequest struct {
	Name              string `json:"name"`
	LogoURL           string `json:"logo_url"`
	OpenTime          string `json:"open_time"`
	CloseTime         string `json:"close_time"`
	BankName          string `json:"bank_name"`
	BankAccountNumber string `json:"bank_account_number"`
	BankAccountHolder string `json:"bank_account_holder"`
}

// UserRepository defines the interface for user data access
type UserRepository interface {
	Create(user *User) error
	FindByID(id uuid.UUID) (*User, error)
	FindByEmail(tenantID uuid.UUID, email string) (*User, error)
	FindByEmailGlobal(email string) (*User, error)
	FindByTenantID(tenantID uuid.UUID) ([]User, error)
	Update(user *User) error
	Delete(id uuid.UUID) error
}

// AuditLogRepository defines the interface for audit log data access
type AuditLogRepository interface {
	Create(log *AuditLog) error
	FindByTenantID(tenantID uuid.UUID, limit, offset int) ([]AuditLog, error)
}
