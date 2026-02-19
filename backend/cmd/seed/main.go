package main

import (
	"fmt"
	"log"

	"github.com/codapos/backend/internal/config"
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	cfg, _ := config.Load()
	db, err := gorm.Open(postgres.Open(cfg.DB.DSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("Cannot connect: %v", err)
	}

	// Check if tenant already exists
	var tenantID uuid.UUID
	var existingTenant domain.Tenant
	var count int64
	db.Table("tenants").Where("slug = ?", "codapos-demo").Count(&count)
	if count > 0 {
		db.Where("slug = ?", "codapos-demo").First(&existingTenant)
		tenantID = existingTenant.ID
		log.Printf("ℹ️  Tenant 'codapos-demo' already exists (ID: %s). Will seed products if missing.", tenantID)
	} else {
		// Create tenant
		tenantID = uuid.New()
		tenant := domain.Tenant{
			BaseModel: domain.BaseModel{ID: tenantID},
			Name:      "CODAPOS Demo",
			Slug:      "codapos-demo",
		}
		if err := db.Create(&tenant).Error; err != nil {
			log.Fatalf("Failed to create tenant: %v", err)
		}
		log.Printf("✅ Tenant created: %s (ID: %s)", tenant.Name, tenant.ID)
	}

	// Always ensure superadmin user exists
	var userCount int64
	db.Table("users").Where("tenant_id = ? AND email = ?", tenantID, "admin@codapos.com").Count(&userCount)
	if userCount == 0 {
		// Hash password
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)

		// Create superadmin user
		user := domain.User{
			BaseModel:    domain.BaseModel{ID: uuid.New()},
			TenantID:     tenantID,
			Email:        "admin@codapos.com",
			PasswordHash: string(hashedPassword),
			FullName:     "Super Admin",
			Phone:        "081234567890",
			Role:         domain.RoleSuperAdmin,
			IsActive:     true,
		}
		if err := db.Create(&user).Error; err != nil {
			log.Fatalf("Failed to create user: %v", err)
		}
		log.Printf("✅ Super Admin created: %s", user.Email)
	} else {
		// Reset password to ensure it matches
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		db.Table("users").Where("tenant_id = ? AND email = ?", tenantID, "admin@codapos.com").
			Updates(map[string]interface{}{
				"password_hash": string(hashedPassword),
				"is_active":     true,
				"role":          domain.RoleSuperAdmin,
			})
		log.Printf("✅ Super Admin password reset: admin@codapos.com")
	}

	// ==========================================
	// Seed Categories (skip if already exist)
	// ==========================================
	var catCount int64
	db.Table("categories").Where("tenant_id = ?", tenantID).Count(&catCount)
	if catCount > 0 {
		log.Printf("ℹ️  Categories already exist (%d found). Skipping category seed.", catCount)

		// Still need to check products
		var prodCount int64
		db.Table("products").Where("tenant_id = ?", tenantID).Count(&prodCount)
		if prodCount > 0 {
			log.Printf("ℹ️  Products already exist (%d found). Skipping product seed.", prodCount)
			fmt.Println("\n📧 Login credentials:")
			fmt.Println("   Email:    admin@codapos.com")
			fmt.Println("   Password: admin123")
			fmt.Println("\n🚀 Everything is already seeded!")
			return
		}
	}

	catMakanan := domain.Category{
		BaseModel: domain.BaseModel{ID: uuid.New()},
		TenantID:  tenantID,
		Name:      "Makanan",
		Slug:      "makanan",
		Icon:      "🍛",
		SortOrder: 1,
	}
	catMinuman := domain.Category{
		BaseModel: domain.BaseModel{ID: uuid.New()},
		TenantID:  tenantID,
		Name:      "Minuman",
		Slug:      "minuman",
		Icon:      "🥤",
		SortOrder: 2,
	}
	catSnack := domain.Category{
		BaseModel: domain.BaseModel{ID: uuid.New()},
		TenantID:  tenantID,
		Name:      "Snack",
		Slug:      "snack",
		Icon:      "🍿",
		SortOrder: 3,
	}

	if catCount == 0 {
		for _, cat := range []*domain.Category{&catMakanan, &catMinuman, &catSnack} {
			if err := db.Create(cat).Error; err != nil {
				log.Fatalf("Failed to create category %s: %v", cat.Name, err)
			}
			log.Printf("✅ Category created: %s", cat.Name)
		}
	}

	// ==========================================
	// Seed Products - Makanan (10 items)
	// ==========================================
	makananProducts := []domain.Product{
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMakanan.ID, Name: "Nasi Goreng Bali", SKU: "MKN-001", Description: "Nasi goreng khas Bali dengan bumbu lengkap", BasePrice: 28000, CostPrice: 12000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 1},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMakanan.ID, Name: "Mie Goreng Spesial", SKU: "MKN-002", Description: "Mie goreng dengan telur dan sayuran segar", BasePrice: 25000, CostPrice: 10000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 2},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMakanan.ID, Name: "Ayam Betutu", SKU: "MKN-003", Description: "Ayam betutu khas Bali dengan bumbu rempah", BasePrice: 45000, CostPrice: 22000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 3},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMakanan.ID, Name: "Sate Lilit", SKU: "MKN-004", Description: "Sate lilit ikan khas Bali", BasePrice: 30000, CostPrice: 15000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 4},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMakanan.ID, Name: "Bebek Goreng Crispy", SKU: "MKN-005", Description: "Bebek goreng renyah dengan sambal matah", BasePrice: 42000, CostPrice: 20000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 5},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMakanan.ID, Name: "Nasi Campur Bali", SKU: "MKN-006", Description: "Nasi campur dengan lauk tradisional Bali", BasePrice: 32000, CostPrice: 14000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 6},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMakanan.ID, Name: "Lawar Bali", SKU: "MKN-007", Description: "Lawar sayur campur daging khas Bali", BasePrice: 25000, CostPrice: 11000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 7},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMakanan.ID, Name: "Bakso Urat Jumbo", SKU: "MKN-008", Description: "Bakso urat jumbo dengan kuah kaldu sapi", BasePrice: 22000, CostPrice: 9000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 8},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMakanan.ID, Name: "Gado-Gado", SKU: "MKN-009", Description: "Gado-gado sayuran segar dengan bumbu kacang", BasePrice: 20000, CostPrice: 8000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 9},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMakanan.ID, Name: "Nasi Jinggo", SKU: "MKN-010", Description: "Nasi bungkus khas Bali dengan lauk lengkap", BasePrice: 10000, CostPrice: 4000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 10},
	}

	// ==========================================
	// Seed Products - Minuman (10 items)
	// ==========================================
	minumanProducts := []domain.Product{
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMinuman.ID, Name: "Es Teh Manis", SKU: "MNM-001", Description: "Es teh manis segar", BasePrice: 8000, CostPrice: 2000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 1},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMinuman.ID, Name: "Jus Alpukat", SKU: "MNM-002", Description: "Jus alpukat segar dengan susu coklat", BasePrice: 18000, CostPrice: 7000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 2},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMinuman.ID, Name: "Kopi Bali", SKU: "MNM-003", Description: "Kopi tubruk khas Bali", BasePrice: 12000, CostPrice: 3000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 3},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMinuman.ID, Name: "Es Jeruk Segar", SKU: "MNM-004", Description: "Es jeruk peras segar", BasePrice: 10000, CostPrice: 3000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 4},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMinuman.ID, Name: "Lemon Tea", SKU: "MNM-005", Description: "Lemon tea dingin menyegarkan", BasePrice: 12000, CostPrice: 3500, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 5},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMinuman.ID, Name: "Jus Mangga", SKU: "MNM-006", Description: "Jus mangga harum manis segar", BasePrice: 15000, CostPrice: 5000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 6},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMinuman.ID, Name: "Milkshake Coklat", SKU: "MNM-007", Description: "Milkshake coklat premium", BasePrice: 22000, CostPrice: 8000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 7},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMinuman.ID, Name: "Es Kelapa Muda", SKU: "MNM-008", Description: "Es kelapa muda asli", BasePrice: 15000, CostPrice: 5000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 8},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMinuman.ID, Name: "Matcha Latte", SKU: "MNM-009", Description: "Matcha latte dengan susu segar", BasePrice: 25000, CostPrice: 9000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 9},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catMinuman.ID, Name: "Air Mineral", SKU: "MNM-010", Description: "Air mineral kemasan 600ml", BasePrice: 5000, CostPrice: 1500, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 10},
	}

	// ==========================================
	// Seed Products - Snack (10 items)
	// ==========================================
	snackProducts := []domain.Product{
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catSnack.ID, Name: "Pisang Goreng", SKU: "SNK-001", Description: "Pisang goreng crispy dengan madu", BasePrice: 12000, CostPrice: 4000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 1},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catSnack.ID, Name: "Kentang Goreng", SKU: "SNK-002", Description: "Kentang goreng renyah dengan saus", BasePrice: 18000, CostPrice: 6000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 2},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catSnack.ID, Name: "Tahu Crispy", SKU: "SNK-003", Description: "Tahu goreng crispy dengan sambal kecap", BasePrice: 10000, CostPrice: 3000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 3},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catSnack.ID, Name: "Lumpia Sayur", SKU: "SNK-004", Description: "Lumpia sayur goreng renyah", BasePrice: 12000, CostPrice: 4000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 4},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catSnack.ID, Name: "Cireng Isi", SKU: "SNK-005", Description: "Cireng isi ayam dengan bumbu rujak", BasePrice: 10000, CostPrice: 3500, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 5},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catSnack.ID, Name: "Dimsum Ayam", SKU: "SNK-006", Description: "Dimsum ayam kukus isi 5 pcs", BasePrice: 20000, CostPrice: 8000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 6},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catSnack.ID, Name: "Roti Bakar", SKU: "SNK-007", Description: "Roti bakar coklat keju", BasePrice: 15000, CostPrice: 5000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 7},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catSnack.ID, Name: "Nachos Cheese", SKU: "SNK-008", Description: "Nachos dengan saus keju premium", BasePrice: 22000, CostPrice: 8000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 8},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catSnack.ID, Name: "Singkong Keju", SKU: "SNK-009", Description: "Singkong goreng dengan taburan keju", BasePrice: 12000, CostPrice: 4000, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 9},
		{BaseModel: domain.BaseModel{ID: uuid.New()}, TenantID: tenantID, CategoryID: &catSnack.ID, Name: "Onde-Onde", SKU: "SNK-010", Description: "Onde-onde isi kacang hijau", BasePrice: 8000, CostPrice: 2500, TaxRate: 11, IsActive: true, TrackStock: true, SortOrder: 10},
	}

	// Insert all products
	allProducts := append(append(makananProducts, minumanProducts...), snackProducts...)
	for _, p := range allProducts {
		if err := db.Create(&p).Error; err != nil {
			log.Printf("⚠️  Failed to create product %s: %v", p.Name, err)
		}
	}
	log.Printf("✅ %d products seeded (10 Makanan + 10 Minuman + 10 Snack)", len(allProducts))

	fmt.Println("\n📧 Login credentials:")
	fmt.Println("   Email:    admin@codapos.com")
	fmt.Println("   Password: admin123")
	fmt.Println("\n🚀 You can now log in to CODAPOS!")
}
