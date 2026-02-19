package usecase

import (
	"time"

	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
)

type InventoryUsecase struct {
	inventoryRepo domain.InventoryRepository
}

func NewInventoryUsecase(ir domain.InventoryRepository) *InventoryUsecase {
	return &InventoryUsecase{inventoryRepo: ir}
}

// GetStockByOutlet returns all inventory records for an outlet
func (u *InventoryUsecase) GetStockByOutlet(outletID uuid.UUID) ([]domain.Inventory, error) {
	return u.inventoryRepo.FindByOutlet(outletID)
}

// GetStockByProduct returns the stock for a specific product at an outlet
func (u *InventoryUsecase) GetStockByProduct(outletID, productID uuid.UUID) (*domain.Inventory, error) {
	return u.inventoryRepo.FindByProduct(outletID, productID)
}

// GetLowStock returns products below their minimum stock level
func (u *InventoryUsecase) GetLowStock(outletID uuid.UUID) ([]domain.Inventory, error) {
	return u.inventoryRepo.GetLowStock(outletID)
}

// AdjustStock adjusts stock by a delta amount (+/-) and records the movement
func (u *InventoryUsecase) AdjustStock(outletID, productID uuid.UUID, variantID *uuid.UUID, delta float64, notes string, userID *uuid.UUID) error {
	if err := u.inventoryRepo.UpdateStock(outletID, productID, variantID, delta); err != nil {
		return err
	}

	movement := &domain.InventoryMovement{
		ID:        uuid.New(),
		OutletID:  outletID,
		ProductID: productID,
		VariantID: variantID,
		Type:      domain.MovementAdjustment,
		Quantity:  delta,
		Notes:     notes,
		CreatedBy: userID,
		CreatedAt: time.Now(),
	}
	return u.inventoryRepo.CreateMovement(movement)
}

// SetStock sets the absolute stock value and records the movement
func (u *InventoryUsecase) SetStock(outletID, productID uuid.UUID, variantID *uuid.UUID, absoluteQty float64, notes string, userID *uuid.UUID) error {
	// Get current stock to calculate delta for movement record
	var oldQty float64
	existing, err := u.inventoryRepo.FindByProduct(outletID, productID)
	if err == nil && existing != nil {
		oldQty = existing.Quantity
	}

	if err := u.inventoryRepo.SetStock(outletID, productID, variantID, absoluteQty); err != nil {
		return err
	}

	movement := &domain.InventoryMovement{
		ID:        uuid.New(),
		OutletID:  outletID,
		ProductID: productID,
		VariantID: variantID,
		Type:      domain.MovementAdjustment,
		Quantity:  absoluteQty - oldQty,
		Notes:     "Set stok: " + notes,
		CreatedBy: userID,
		CreatedAt: time.Now(),
	}
	return u.inventoryRepo.CreateMovement(movement)
}

// GetMovements returns recent stock movements
func (u *InventoryUsecase) GetMovements(outletID uuid.UUID, productID *uuid.UUID, limit int) ([]domain.InventoryMovement, error) {
	return u.inventoryRepo.FindMovements(outletID, productID, limit)
}
