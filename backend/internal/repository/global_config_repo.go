package repository

import (
	"github.com/codapos/backend/internal/domain"
	"gorm.io/gorm"
)

type globalConfigRepo struct {
	db *gorm.DB
}

func NewGlobalConfigRepository(db *gorm.DB) domain.GlobalConfigRepository {
	return &globalConfigRepo{db: db}
}

func (r *globalConfigRepo) Create(config *domain.GlobalConfig) error {
	return r.db.Create(config).Error
}

func (r *globalConfigRepo) FindByKey(key string) (*domain.GlobalConfig, error) {
	var config domain.GlobalConfig
	err := r.db.Where("key = ?", key).First(&config).Error
	if err != nil {
		return nil, err
	}
	return &config, nil
}

func (r *globalConfigRepo) FindAll() ([]domain.GlobalConfig, error) {
	var configs []domain.GlobalConfig
	err := r.db.Order("key ASC").Find(&configs).Error
	return configs, err
}

func (r *globalConfigRepo) Update(config *domain.GlobalConfig) error {
	return r.db.Save(config).Error
}

func (r *globalConfigRepo) Delete(key string) error {
	return r.db.Where("key = ?", key).Delete(&domain.GlobalConfig{}).Error
}
