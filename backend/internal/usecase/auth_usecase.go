package usecase

import (
	"errors"
	"strings"
	"time"

	"github.com/codapos/backend/internal/config"
	"github.com/codapos/backend/internal/domain"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthUsecase struct {
	tenantRepo       domain.TenantRepository
	userRepo         domain.UserRepository
	merchantTypeRepo domain.MerchantTypeRepository
	featureFlagRepo  domain.FeatureFlagRepository
	cfg              *config.Config
}

func NewAuthUsecase(
	tr domain.TenantRepository,
	ur domain.UserRepository,
	mtr domain.MerchantTypeRepository,
	ffr domain.FeatureFlagRepository,
	cfg *config.Config,
) *AuthUsecase {
	return &AuthUsecase{
		tenantRepo:       tr,
		userRepo:         ur,
		merchantTypeRepo: mtr,
		featureFlagRepo:  ffr,
		cfg:              cfg,
	}
}

// Register creates a new tenant and admin user with merchant type and feature flags
func (u *AuthUsecase) Register(req domain.RegisterRequest) (*domain.AuthResponse, error) {
	slug := strings.ToLower(strings.ReplaceAll(req.TenantSlug, " ", "-"))
	existing, _ := u.tenantRepo.FindBySlug(slug)
	if existing != nil {
		return nil, errors.New("tenant slug already exists")
	}

	// Resolve merchant type
	var merchantTypeID *uuid.UUID
	if req.MerchantTypeSlug != "" {
		mt, err := u.merchantTypeRepo.FindBySlug(req.MerchantTypeSlug)
		if err == nil && mt != nil {
			merchantTypeID = &mt.ID
		}
	}

	// Free Basic plan: 6 months
	expiresAt := time.Now().AddDate(0, 6, 0)

	tenant := &domain.Tenant{
		Name:                  req.TenantName,
		Slug:                  slug,
		Subdomain:             slug,
		MerchantTypeID:        merchantTypeID,
		SubscriptionPlan:      "free-basic",
		SubscriptionExpiresAt: &expiresAt,
		OpenTime:              "09:00",
		CloseTime:             "17:00",
		RevenueSharePct:       10.0,
		IsEnabled:             true,
	}
	if err := u.tenantRepo.Create(tenant); err != nil {
		return nil, errors.New("failed to create tenant")
	}

	// Create default feature flags (all disabled for Free Basic)
	var flags []domain.FeatureFlag
	for _, key := range domain.AllFeatureKeys() {
		flags = append(flags, domain.FeatureFlag{
			TenantID:   tenant.ID,
			FeatureKey: key,
			IsEnabled:  false,
		})
	}
	_ = u.featureFlagRepo.BulkCreate(flags)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	user := &domain.User{
		TenantID:     tenant.ID,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		FullName:     req.FullName,
		Phone:        req.Phone,
		Role:         domain.RoleOwner,
		IsActive:     true,
	}
	if err := u.userRepo.Create(user); err != nil {
		return nil, errors.New("failed to create user")
	}

	token, err := u.generateToken(user)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	user.Tenant = tenant

	return &domain.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

// Login authenticates a user
func (u *AuthUsecase) Login(req domain.LoginRequest) (*domain.AuthResponse, error) {
	user, err := u.userRepo.FindByEmailGlobal(req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	if !user.IsActive {
		return nil, errors.New("user account is inactive")
	}

	now := time.Now()
	user.LastLoginAt = &now
	_ = u.userRepo.Update(user)

	token, err := u.generateToken(user)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &domain.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (u *AuthUsecase) generateToken(user *domain.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id":   user.ID.String(),
		"tenant_id": user.TenantID.String(),
		"email":     user.Email,
		"role":      user.Role,
		"exp":       time.Now().Add(time.Hour * time.Duration(u.cfg.JWT.ExpiryHours)).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(u.cfg.JWT.Secret))
}

// GetUserByID returns a user by ID
func (u *AuthUsecase) GetUserByID(id uuid.UUID) (*domain.User, error) {
	return u.userRepo.FindByID(id)
}
