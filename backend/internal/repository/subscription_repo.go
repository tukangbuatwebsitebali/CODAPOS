package repository

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type subscriptionRepo struct {
	db *gorm.DB
}

func NewSubscriptionRepository(db *gorm.DB) domain.SubscriptionRepository {
	return &subscriptionRepo{db: db}
}

func (r *subscriptionRepo) CreatePlan(plan *domain.SubscriptionPlan) error {
	return r.db.Create(plan).Error
}

func (r *subscriptionRepo) FindAllPlans() ([]domain.SubscriptionPlan, error) {
	var plans []domain.SubscriptionPlan
	err := r.db.Where("is_active = ?", true).Find(&plans).Error
	return plans, err
}

func (r *subscriptionRepo) FindPlanByID(id uuid.UUID) (*domain.SubscriptionPlan, error) {
	var plan domain.SubscriptionPlan
	err := r.db.Where("id = ?", id).First(&plan).Error
	if err != nil {
		return nil, err
	}
	return &plan, nil
}

func (r *subscriptionRepo) CreateSubscription(sub *domain.Subscription) error {
	return r.db.Create(sub).Error
}

func (r *subscriptionRepo) FindByTenantID(tenantID uuid.UUID) (*domain.Subscription, error) {
	var sub domain.Subscription
	err := r.db.Preload("Plan").Where("tenant_id = ? AND status = ?", tenantID, "active").First(&sub).Error
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

func (r *subscriptionRepo) UpdateSubscription(sub *domain.Subscription) error {
	return r.db.Save(sub).Error
}
