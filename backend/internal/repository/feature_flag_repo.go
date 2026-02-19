package repository

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type featureFlagRepo struct {
	db *gorm.DB
}

func NewFeatureFlagRepository(db *gorm.DB) domain.FeatureFlagRepository {
	return &featureFlagRepo{db: db}
}

func (r *featureFlagRepo) Create(flag *domain.FeatureFlag) error {
	return r.db.Create(flag).Error
}

func (r *featureFlagRepo) BulkCreate(flags []domain.FeatureFlag) error {
	return r.db.Create(&flags).Error
}

func (r *featureFlagRepo) FindByTenantID(tenantID uuid.UUID) ([]domain.FeatureFlag, error) {
	var flags []domain.FeatureFlag
	err := r.db.Where("tenant_id = ?", tenantID).Order("feature_key ASC").Find(&flags).Error
	return flags, err
}

func (r *featureFlagRepo) IsEnabled(tenantID uuid.UUID, featureKey string) (bool, error) {
	var flag domain.FeatureFlag
	err := r.db.Where("tenant_id = ? AND feature_key = ?", tenantID, featureKey).First(&flag).Error
	if err != nil {
		return false, err
	}
	return flag.IsEnabled, nil
}

func (r *featureFlagRepo) Toggle(tenantID uuid.UUID, featureKey string, enabled bool) error {
	return r.db.Model(&domain.FeatureFlag{}).
		Where("tenant_id = ? AND feature_key = ?", tenantID, featureKey).
		Update("is_enabled", enabled).Error
}

func (r *featureFlagRepo) DeleteByTenantID(tenantID uuid.UUID) error {
	return r.db.Where("tenant_id = ?", tenantID).Delete(&domain.FeatureFlag{}).Error
}
