package repository

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type userRepo struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) domain.UserRepository {
	return &userRepo{db: db}
}

func (r *userRepo) Create(user *domain.User) error {
	return r.db.Create(user).Error
}

func (r *userRepo) FindByID(id uuid.UUID) (*domain.User, error) {
	var user domain.User
	err := r.db.Preload("Tenant").Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepo) FindByEmail(tenantID uuid.UUID, email string) (*domain.User, error) {
	var user domain.User
	err := r.db.Preload("Tenant").Where("tenant_id = ? AND email = ?", tenantID, email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByEmailGlobal finds a user by email across all tenants
func (r *userRepo) FindByEmailGlobal(email string) (*domain.User, error) {
	var user domain.User
	err := r.db.Preload("Tenant").Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepo) FindByTenantID(tenantID uuid.UUID) ([]domain.User, error) {
	var users []domain.User
	err := r.db.Where("tenant_id = ?", tenantID).Find(&users).Error
	return users, err
}

func (r *userRepo) Update(user *domain.User) error {
	return r.db.Save(user).Error
}

func (r *userRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&domain.User{}, id).Error
}
