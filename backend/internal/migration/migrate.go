package migration

import (
	"fmt"
	"log"

	"github.com/codapos/backend/internal/domain"
	"gorm.io/gorm"
)

// AutoMigrate runs GORM auto-migration for all domain models.
// DisableForeignKeyConstraintWhenMigrating must be set to true in the GORM config
// to avoid circular-FK issues (User ↔ Outlet).
func AutoMigrate(db *gorm.DB) error {
	log.Println("🔄 Running database migrations...")

	err := db.AutoMigrate(
		// Core
		&domain.Tenant{},
		&domain.User{},
		&domain.AuditLog{},

		// Phase 1: Core Architecture
		&domain.MerchantType{},
		&domain.Customer{},
		&domain.CustomerAddress{},
		&domain.FeatureFlag{},
		&domain.GlobalConfig{},

		// Franchise & Outlet
		&domain.Brand{},
		&domain.Region{},
		&domain.Outlet{},
		&domain.RoyaltyRule{},
		&domain.RoyaltyInvoice{},

		// Products & POS
		&domain.Category{},
		&domain.Product{},
		&domain.ProductVariant{},
		&domain.ModifierGroup{},
		&domain.Modifier{},
		&domain.OutletPrice{},
		&domain.Promotion{},

		// Inventory
		&domain.Inventory{},
		&domain.InventoryMovement{},
		&domain.StockTransfer{},
		&domain.StockTransferItem{},

		// Transactions
		&domain.Transaction{},
		&domain.TransactionItem{},
		&domain.TransactionPayment{},
		&domain.SplitBill{},

		// Accounting
		&domain.ChartOfAccount{},
		&domain.JournalEntry{},
		&domain.JournalEntryLine{},
		&domain.FiscalPeriod{},
		&domain.TaxRate{},

		// SaaS
		&domain.SubscriptionPlan{},
		&domain.Subscription{},
		&domain.BillingInvoice{},

		// Delivery (Phase 7)
		&domain.DeliveryOrder{},
		&domain.DeliveryDriver{},

		// Chat (Phase 7)
		&domain.ChatRoom{},
		&domain.ChatMessage{},

		// RBAC
		&domain.RolePermission{},

		// Business Units (units per merchant type)
		&domain.BusinessUnit{},

		// AI Price References
		&domain.PriceReference{},
	)

	if err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}

	log.Println("✅ Database migrations completed successfully!")
	return nil
}
