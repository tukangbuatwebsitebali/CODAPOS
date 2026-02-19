package repository

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type inventoryRepo struct {
	db *gorm.DB
}

func NewInventoryRepository(db *gorm.DB) domain.InventoryRepository {
	return &inventoryRepo{db: db}
}

func (r *inventoryRepo) FindByOutlet(outletID uuid.UUID) ([]domain.Inventory, error) {
	var inventory []domain.Inventory
	err := r.db.Preload("Product").Preload("Variant").
		Where("outlet_id = ?", outletID).Find(&inventory).Error
	return inventory, err
}

func (r *inventoryRepo) FindByProduct(outletID, productID uuid.UUID) (*domain.Inventory, error) {
	var inv domain.Inventory
	err := r.db.Where("outlet_id = ? AND product_id = ?", outletID, productID).First(&inv).Error
	if err != nil {
		return nil, err
	}
	return &inv, nil
}

func (r *inventoryRepo) UpdateStock(outletID, productID uuid.UUID, variantID *uuid.UUID, quantity float64) error {
	query := r.db.Model(&domain.Inventory{}).
		Where("outlet_id = ? AND product_id = ?", outletID, productID)
	if variantID != nil {
		query = query.Where("variant_id = ?", *variantID)
	} else {
		query = query.Where("variant_id IS NULL")
	}
	result := query.UpdateColumn("quantity", gorm.Expr("quantity + ?", quantity))
	if result.RowsAffected == 0 {
		// Create new inventory record
		inv := domain.Inventory{
			OutletID:  outletID,
			ProductID: productID,
			VariantID: variantID,
			Quantity:  quantity,
		}
		return r.db.Create(&inv).Error
	}
	return result.Error
}

func (r *inventoryRepo) CreateMovement(movement *domain.InventoryMovement) error {
	return r.db.Create(movement).Error
}

func (r *inventoryRepo) GetLowStock(outletID uuid.UUID) ([]domain.Inventory, error) {
	var inventory []domain.Inventory
	err := r.db.Preload("Product").
		Where("outlet_id = ? AND quantity <= min_stock", outletID).
		Find(&inventory).Error
	return inventory, err
}

func (r *inventoryRepo) SetStock(outletID, productID uuid.UUID, variantID *uuid.UUID, absoluteQty float64) error {
	query := r.db.Model(&domain.Inventory{}).
		Where("outlet_id = ? AND product_id = ?", outletID, productID)
	if variantID != nil {
		query = query.Where("variant_id = ?", *variantID)
	} else {
		query = query.Where("variant_id IS NULL")
	}
	result := query.UpdateColumn("quantity", absoluteQty)
	if result.RowsAffected == 0 {
		inv := domain.Inventory{
			OutletID:  outletID,
			ProductID: productID,
			VariantID: variantID,
			Quantity:  absoluteQty,
		}
		return r.db.Create(&inv).Error
	}
	return result.Error
}

func (r *inventoryRepo) FindMovements(outletID uuid.UUID, productID *uuid.UUID, limit int) ([]domain.InventoryMovement, error) {
	var movements []domain.InventoryMovement
	q := r.db.Where("outlet_id = ?", outletID)
	if productID != nil {
		q = q.Where("product_id = ?", *productID)
	}
	if limit <= 0 {
		limit = 50
	}
	err := q.Order("created_at DESC").Limit(limit).Find(&movements).Error
	return movements, err
}
