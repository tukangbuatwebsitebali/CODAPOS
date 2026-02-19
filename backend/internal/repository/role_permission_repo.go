package repository

import (
	"github.com/codapos/backend/internal/domain"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type rolePermissionRepo struct {
	db *gorm.DB
}

func NewRolePermissionRepository(db *gorm.DB) domain.RolePermissionRepository {
	return &rolePermissionRepo{db: db}
}

func (r *rolePermissionRepo) FindAll() ([]domain.RolePermission, error) {
	var perms []domain.RolePermission
	err := r.db.Order("role, action").Find(&perms).Error
	return perms, err
}

func (r *rolePermissionRepo) FindByRole(role string) ([]domain.RolePermission, error) {
	var perms []domain.RolePermission
	err := r.db.Where("role = ?", role).Order("action").Find(&perms).Error
	return perms, err
}

func (r *rolePermissionRepo) IsAllowed(role, action string) (bool, error) {
	var perm domain.RolePermission
	err := r.db.Where("role = ? AND action = ?", role, action).First(&perm).Error
	if err != nil {
		return false, err
	}
	return perm.IsAllowed, nil
}

func (r *rolePermissionRepo) Upsert(role, action string, allowed bool) error {
	perm := domain.RolePermission{
		Role:      role,
		Action:    action,
		IsAllowed: allowed,
	}
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "role"}, {Name: "action"}},
		DoUpdates: clause.AssignmentColumns([]string{"is_allowed", "updated_at"}),
	}).Create(&perm).Error
}

func (r *rolePermissionRepo) BulkUpsert(perms []domain.RolePermission) error {
	if len(perms) == 0 {
		return nil
	}
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "role"}, {Name: "action"}},
		DoUpdates: clause.AssignmentColumns([]string{"is_allowed", "updated_at"}),
	}).Create(&perms).Error
}
