package usecase

import (
	"errors"

	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserUsecase struct {
	userRepo   domain.UserRepository
	tenantRepo domain.TenantRepository
}

func NewUserUsecase(ur domain.UserRepository, tr domain.TenantRepository) *UserUsecase {
	return &UserUsecase{userRepo: ur, tenantRepo: tr}
}

// GetProfile returns the authenticated user's profile with tenant info
func (u *UserUsecase) GetProfile(userID uuid.UUID) (*domain.User, error) {
	user, err := u.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}
	// Load tenant info
	tenant, _ := u.tenantRepo.FindByID(user.TenantID)
	user.Tenant = tenant
	return user, nil
}

// GetTeamMembers returns all users for a tenant
func (u *UserUsecase) GetTeamMembers(tenantID uuid.UUID) ([]domain.User, error) {
	return u.userRepo.FindByTenantID(tenantID)
}

// InviteUser creates a new user within the same tenant
func (u *UserUsecase) InviteUser(tenantID uuid.UUID, req domain.InviteUserRequest) (*domain.User, error) {
	// Validate role
	validRoles := map[string]bool{
		domain.RoleAdmin:         true,
		domain.RoleFinance:       true,
		domain.RoleOutletManager: true,
		domain.RoleCashier:       true,
	}
	if !validRoles[req.Role] {
		return nil, errors.New("invalid role: must be admin, finance, outlet_manager, or cashier")
	}

	// Check if email already exists in this tenant
	existing, _ := u.userRepo.FindByEmail(tenantID, req.Email)
	if existing != nil {
		return nil, errors.New("user with this email already exists in your organization")
	}

	// Hash the temp password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.TempPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	var outletID *uuid.UUID
	if req.OutletID != "" {
		id, err := uuid.Parse(req.OutletID)
		if err == nil {
			outletID = &id
		}
	}

	user := &domain.User{
		TenantID:     tenantID,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		FullName:     req.FullName,
		Phone:        req.Phone,
		Role:         req.Role,
		OutletID:     outletID,
		IsActive:     true,
	}

	if err := u.userRepo.Create(user); err != nil {
		return nil, errors.New("failed to create user")
	}

	return user, nil
}

// UpdateUserRole changes a team member's role (owner only)
func (u *UserUsecase) UpdateUserRole(tenantID, userID uuid.UUID, newRole string) error {
	user, err := u.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	if user.TenantID != tenantID {
		return errors.New("user does not belong to your organization")
	}

	if user.Role == domain.RoleOwner {
		return errors.New("cannot change the owner's role")
	}

	validRoles := map[string]bool{
		domain.RoleAdmin:         true,
		domain.RoleFinance:       true,
		domain.RoleOutletManager: true,
		domain.RoleCashier:       true,
	}
	if !validRoles[newRole] {
		return errors.New("invalid role")
	}

	user.Role = newRole
	return u.userRepo.Update(user)
}

// DeactivateUser disables a team member (owner only)
func (u *UserUsecase) DeactivateUser(tenantID, userID uuid.UUID) error {
	user, err := u.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	if user.TenantID != tenantID {
		return errors.New("user does not belong to your organization")
	}

	if user.Role == domain.RoleOwner {
		return errors.New("cannot deactivate the owner")
	}

	user.IsActive = !user.IsActive // toggle
	return u.userRepo.Update(user)
}

// UpdateProfile updates the authenticated user's profile
func (u *UserUsecase) UpdateProfile(userID uuid.UUID, req domain.UpdateProfileRequest) (*domain.User, error) {
	user, err := u.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if req.FullName != "" {
		user.FullName = req.FullName
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.AvatarURL != "" {
		user.AvatarURL = req.AvatarURL
	}

	if err := u.userRepo.Update(user); err != nil {
		return nil, errors.New("failed to update profile")
	}

	// Reload with tenant info
	tenant, _ := u.tenantRepo.FindByID(user.TenantID)
	user.Tenant = tenant
	return user, nil
}

// ChangePassword changes the authenticated user's password
func (u *UserUsecase) ChangePassword(userID uuid.UUID, req domain.ChangePasswordRequest) error {
	if req.OldPassword == "" || req.NewPassword == "" {
		return errors.New("old and new passwords are required")
	}
	if len(req.NewPassword) < 6 {
		return errors.New("new password must be at least 6 characters")
	}

	user, err := u.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword)); err != nil {
		return errors.New("old password is incorrect")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("failed to hash password")
	}

	user.PasswordHash = string(hashed)
	return u.userRepo.Update(user)
}

// UpdateMerchant updates the tenant/merchant info for the authenticated user
func (u *UserUsecase) UpdateMerchant(tenantID uuid.UUID, req domain.UpdateMerchantRequest) (*domain.Tenant, error) {
	tenant, err := u.tenantRepo.FindByID(tenantID)
	if err != nil {
		return nil, errors.New("tenant not found")
	}

	if req.Name != "" {
		tenant.Name = req.Name
	}
	if req.LogoURL != "" {
		tenant.LogoURL = req.LogoURL
	}
	if req.OpenTime != "" {
		tenant.OpenTime = req.OpenTime
	}
	if req.CloseTime != "" {
		tenant.CloseTime = req.CloseTime
	}
	if req.BankName != "" {
		tenant.BankName = req.BankName
	}
	if req.BankAccountNumber != "" {
		tenant.BankAccountNumber = req.BankAccountNumber
	}
	if req.BankAccountHolder != "" {
		tenant.BankAccountHolder = req.BankAccountHolder
	}

	if err := u.tenantRepo.Update(tenant); err != nil {
		return nil, errors.New("failed to update merchant info")
	}
	return tenant, nil
}
