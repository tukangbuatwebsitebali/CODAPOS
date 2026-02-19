package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/codapos/backend/internal/config"
	"github.com/codapos/backend/internal/domain"
	"github.com/codapos/backend/internal/handler"
	"github.com/codapos/backend/internal/middleware"
	"github.com/codapos/backend/internal/migration"
	"github.com/codapos/backend/internal/repository"
	"github.com/codapos/backend/internal/usecase"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

func main() {
	// Load config
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	db, err := gorm.Open(postgres.Open(cfg.DB.DSN()), &gorm.Config{
		Logger:                                   gormlogger.Default.LogMode(gormlogger.Info),
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("✅ Connected to PostgreSQL")

	// Run migrations
	if err := migration.AutoMigrate(db); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	// Seed default subscription plans + merchant types
	seedSubscriptionPlans(db)
	seedMerchantTypes(db)
	seedGlobalConfigs(db)
	seedMidtransConfigs(db)
	seedDefaultRolePermissions(db)

	// Initialize repositories
	tenantRepo := repository.NewTenantRepository(db)
	userRepo := repository.NewUserRepository(db)

	// Initialize dynamic permission middleware
	middleware.InitPermissions(repository.NewRolePermissionRepository(db))
	outletRepo := repository.NewOutletRepository(db)
	brandRepo := repository.NewBrandRepository(db)
	regionRepo := repository.NewRegionRepository(db)
	productRepo := repository.NewProductRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	transactionRepo := repository.NewTransactionRepository(db)
	inventoryRepo := repository.NewInventoryRepository(db)
	accountingRepo := repository.NewAccountingRepository(db)
	// Phase 1 repositories
	merchantTypeRepo := repository.NewMerchantTypeRepository(db)
	featureFlagRepo := repository.NewFeatureFlagRepository(db)
	customerRepo := repository.NewCustomerRepository(db)
	globalConfigRepo := repository.NewGlobalConfigRepository(db)
	subscriptionRepo := repository.NewSubscriptionRepository(db)
	deliveryRepo := repository.NewDeliveryRepository(db)
	rolePermRepo := repository.NewRolePermissionRepository(db)
	chatRepo := repository.NewChatRepository(db)

	// Initialize usecases
	authUsecase := usecase.NewAuthUsecase(tenantRepo, userRepo, merchantTypeRepo, featureFlagRepo, cfg)
	posUsecase := usecase.NewPOSUsecase(transactionRepo, productRepo, inventoryRepo, accountingRepo)
	productUsecase := usecase.NewProductUsecase(productRepo, categoryRepo)
	inventoryUsecase := usecase.NewInventoryUsecase(inventoryRepo)
	outletUsecase := usecase.NewOutletUsecase(outletRepo, brandRepo, regionRepo)
	accountingUsecase := usecase.NewAccountingUsecase(accountingRepo)
	// Phase 1 usecases
	customerUsecase := usecase.NewCustomerUsecase(customerRepo, tenantRepo)
	superAdminUsecase := usecase.NewSuperAdminUsecase(tenantRepo, merchantTypeRepo, featureFlagRepo, globalConfigRepo, rolePermRepo)
	// Phase 2 usecases
	userUsecase := usecase.NewUserUsecase(userRepo, tenantRepo)
	// Phase 5 usecases
	subscriptionUsecase := usecase.NewSubscriptionUsecase(subscriptionRepo, tenantRepo, featureFlagRepo)
	// Phase 6 usecases
	forecastUsecase := usecase.NewForecastUsecase(transactionRepo)
	// Phase 7 usecases
	deliveryUsecase := usecase.NewDeliveryUsecase(deliveryRepo)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authUsecase, accountingUsecase, tenantRepo)
	posHandler := handler.NewPOSHandler(posUsecase)
	productHandler := handler.NewProductHandler(productUsecase)
	outletHandler := handler.NewOutletHandler(outletUsecase)
	accountingHandler := handler.NewAccountingHandler(accountingUsecase)
	inventoryHandler := handler.NewInventoryHandler(inventoryUsecase)
	// Phase 1 handlers
	customerHandler := handler.NewCustomerHandler(customerUsecase)
	superAdminHandler := handler.NewSuperAdminHandler(superAdminUsecase)
	// Phase 2 handlers
	userHandler := handler.NewUserHandler(userUsecase)
	// Phase 5 handlers
	subscriptionHandler := handler.NewSubscriptionHandler(subscriptionUsecase)
	// Phase 6 handlers
	forecastHandler := handler.NewForecastHandler(forecastUsecase)
	// Phase 7 handlers
	deliveryHandler := handler.NewDeliveryHandler(deliveryUsecase)
	chatHandler := handler.NewChatHandler(chatRepo, deliveryRepo)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "CODAPOS API",
		BodyLimit:    10 * 1024 * 1024, // 10MB for image uploads
		ErrorHandler: customErrorHandler,
	})

	// Global middleware
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "${time} | ${status} | ${latency} | ${method} ${path}\n",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "CODAPOS API",
			"version": "1.2.0",
		})
	})

	// Static file serving for uploads
	os.MkdirAll("uploads", 0755)
	app.Static("/uploads", "./uploads")

	// API v1 routes
	api := app.Group("/api/v1")

	// Auth routes (public)
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Get("/check-slug", authHandler.CheckSlug)

	// Public: merchant types (for registration form)
	api.Get("/merchant-types", func(c *fiber.Ctx) error {
		types, err := merchantTypeRepo.FindAll()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(fiber.Map{"success": true, "data": types})
	})

	// Public: Midtrans client config (no server key)
	api.Get("/payment/config", func(c *fiber.Ctx) error {
		modeConfig, _ := globalConfigRepo.FindByKey(domain.ConfigMidtransMode)
		clientKeyConfig, _ := globalConfigRepo.FindByKey(domain.ConfigMidtransClientKey)

		mode := "sandbox"
		if modeConfig != nil && modeConfig.Value != "" {
			mode = modeConfig.Value
		}
		clientKey := ""
		if clientKeyConfig != nil {
			clientKey = clientKeyConfig.Value
		}

		return c.JSON(fiber.Map{"success": true, "data": fiber.Map{"mode": mode, "client_key": clientKey}})
	})

	// Public: Midtrans payment creation
	api.Post("/payment/create", func(c *fiber.Ctx) error {
		var body struct {
			OrderID     string  `json:"order_id"`
			GrossAmount float64 `json:"gross_amount"`
			FirstName   string  `json:"first_name"`
			Email       string  `json:"email"`
			Phone       string  `json:"phone"`
		}
		if err := c.BodyParser(&body); err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": "Invalid request"})
		}

		// Load Midtrans config from DB
		modeConfig, _ := globalConfigRepo.FindByKey(domain.ConfigMidtransMode)
		serverKeyConfig, _ := globalConfigRepo.FindByKey(domain.ConfigMidtransServerKey)

		if serverKeyConfig == nil || serverKeyConfig.Value == "" {
			return c.Status(500).JSON(fiber.Map{"success": false, "error": "Midtrans belum dikonfigurasi"})
		}

		mode := "sandbox"
		if modeConfig != nil && modeConfig.Value == "production" {
			mode = "production"
		}

		// Midtrans Snap API URL
		snapURL := "https://app.sandbox.midtrans.com/snap/v1/transactions"
		if mode == "production" {
			snapURL = "https://app.midtrans.com/snap/v1/transactions"
		}

		// Build Snap request
		snapReq := map[string]interface{}{
			"transaction_details": map[string]interface{}{
				"order_id":     body.OrderID,
				"gross_amount": int64(body.GrossAmount),
			},
			"customer_details": map[string]interface{}{
				"first_name": body.FirstName,
				"email":      body.Email,
				"phone":      body.Phone,
			},
			"enabled_payments": []string{
				"credit_card", "bca_va", "bni_va", "bri_va", "permata_va",
				"other_va", "gopay", "shopeepay", "qris",
			},
			"credit_card": map[string]interface{}{
				"secure": true,
			},
		}

		jsonBody, _ := json.Marshal(snapReq)
		req, _ := http.NewRequest("POST", snapURL, bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json")
		req.Header.Set("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(serverKeyConfig.Value+":")))

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "error": "Gagal menghubungi Midtrans"})
		}
		defer resp.Body.Close()

		respBody, _ := io.ReadAll(resp.Body)
		var snapResp map[string]interface{}
		json.Unmarshal(respBody, &snapResp)

		if resp.StatusCode != 201 {
			return c.Status(resp.StatusCode).JSON(fiber.Map{"success": false, "error": "Midtrans error", "details": snapResp})
		}

		return c.JSON(fiber.Map{"success": true, "data": snapResp})
	})

	// Public: store page (mini app for each merchant)
	api.Get("/store/:slug", func(c *fiber.Ctx) error {
		slug := c.Params("slug")
		if slug == "" {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": "slug is required"})
		}

		tenant, err := tenantRepo.FindBySlug(slug)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"success": false, "error": "Toko tidak ditemukan"})
		}
		if !tenant.IsEnabled {
			return c.Status(403).JSON(fiber.Map{"success": false, "error": "Toko sedang tidak aktif"})
		}

		// Load merchant type
		if tenant.MerchantTypeID != nil {
			mt, _ := merchantTypeRepo.FindByID(*tenant.MerchantTypeID)
			tenant.MerchantType = mt
		}

		categories, _ := categoryRepo.FindByTenantID(tenant.ID)
		products, _ := productRepo.FindByTenantID(tenant.ID, "", nil)

		return c.JSON(fiber.Map{
			"success": true,
			"data": fiber.Map{
				"tenant":     tenant,
				"categories": categories,
				"products":   products,
			},
		})
	})

	// Public: store checkout — create customer + delivery order (after Midtrans payment)
	api.Post("/store/:slug/checkout", func(c *fiber.Ctx) error {
		slug := c.Params("slug")
		if slug == "" {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": "slug is required"})
		}

		tenant, err := tenantRepo.FindBySlug(slug)
		if err != nil || !tenant.IsEnabled {
			return c.Status(404).JSON(fiber.Map{"success": false, "error": "Toko tidak ditemukan"})
		}

		// Parse checkout request
		var req struct {
			Name          string  `json:"name"`
			Phone         string  `json:"phone"`
			FullAddress   string  `json:"full_address"`
			Latitude      float64 `json:"latitude"`
			Longitude     float64 `json:"longitude"`
			Notes         string  `json:"notes"`
			MidtransOrder string  `json:"midtrans_order_id"`
			TotalAmount   float64 `json:"total_amount"`
			ItemsSummary  string  `json:"items_summary"`
		}
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": "Invalid request body"})
		}
		if req.Name == "" || req.Phone == "" || req.FullAddress == "" {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": "Nama, No HP, dan Alamat wajib diisi"})
		}

		// 1) Create or find customer (upsert by phone)
		customer, err := customerUsecase.CreateCustomer(tenant.ID, domain.CreateCustomerRequest{
			Name:        req.Name,
			Phone:       req.Phone,
			FullAddress: req.FullAddress,
			Latitude:    req.Latitude,
			Longitude:   req.Longitude,
		})
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "error": "Gagal menyimpan data pelanggan"})
		}

		// 2) Build store pickup address from tenant settings
		var storeSettings map[string]interface{}
		if tenant.Settings != nil {
			json.Unmarshal(tenant.Settings, &storeSettings)
		}
		storeAddress := tenant.Name
		storePhone := ""
		if addr, ok := storeSettings["store_address"].(string); ok && addr != "" {
			storeAddress = addr
		}
		if ph, ok := storeSettings["store_phone"].(string); ok && ph != "" {
			storePhone = ph
		}

		// 3) Create delivery order
		deliveryOrder, err := deliveryUsecase.CreateOrder(tenant.ID, domain.CreateDeliveryRequest{
			CustomerID:     customer.ID.String(),
			PickupAddress:  storeAddress,
			PickupContact:  tenant.Name,
			PickupPhone:    storePhone,
			DropoffAddress: req.FullAddress,
			DropoffLat:     req.Latitude,
			DropoffLng:     req.Longitude,
			DropoffContact: req.Name,
			DropoffPhone:   req.Phone,
			PackageDesc:    req.ItemsSummary,
			Notes:          req.Notes,
		})
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "error": "Gagal membuat pesanan pengiriman"})
		}

		// Save extra fields on the delivery order
		deliveryOrder.MidtransOrderID = req.MidtransOrder
		deliveryOrder.TotalAmount = req.TotalAmount
		deliveryOrder.ItemsSummary = req.ItemsSummary
		deliveryRepo.UpdateOrder(deliveryOrder)

		// 4) Auto-create ChatRoom for this delivery
		chatRoom := &domain.ChatRoom{
			BaseModel:  domain.BaseModel{ID: uuid.New(), CreatedAt: time.Now(), UpdatedAt: time.Now()},
			TenantID:   tenant.ID,
			DeliveryID: deliveryOrder.ID,
			CustomerID: customer.ID,
			Status:     domain.ChatRoomStatusOpen,
		}
		chatRepo.CreateRoom(chatRoom)

		return c.Status(201).JSON(fiber.Map{
			"success": true,
			"data": fiber.Map{
				"customer_id":       customer.ID,
				"delivery_order_id": deliveryOrder.ID,
				"order_number":      deliveryOrder.OrderNumber,
				"chat_room_id":      chatRoom.ID,
				"message":           "Pesanan berhasil! Kurir akan segera mengantar pesanan Anda.",
			},
		})
	})

	// Public: customer order tracking
	api.Get("/store/:slug/orders/:orderId", func(c *fiber.Ctx) error {
		orderID, err := uuid.Parse(c.Params("orderId"))
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": "invalid order id"})
		}
		order, err := deliveryRepo.FindOrderByID(orderID)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"success": false, "error": "Pesanan tidak ditemukan"})
		}
		// Find chat room for this order
		room, _ := chatRepo.FindRoomByDeliveryID(orderID)
		var roomID *uuid.UUID
		if room != nil {
			roomID = &room.ID
		}
		return c.JSON(fiber.Map{
			"success": true,
			"data": fiber.Map{
				"order":        order,
				"chat_room_id": roomID,
			},
		})
	})

	// Public: customer chat endpoints
	api.Get("/store/:slug/chat/:roomId/messages", chatHandler.PublicGetMessages)
	api.Post("/store/:slug/chat/:roomId/messages", chatHandler.PublicSendMessage)

	// Public: customer self-registration (no auth required)
	customerHandler.RegisterPublicRoutes(api)

	// Public: subscription plans listing
	subscriptionHandler.RegisterPublicRoutes(api)

	// Public: website CMS config (for landing page)
	api.Get("/public/website-config", func(c *fiber.Ctx) error {
		configs, err := globalConfigRepo.FindAll()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to load config"})
		}
		// Only return website_* keys (public-safe)
		result := make(map[string]string)
		for _, cfg := range configs {
			if len(cfg.Key) > 8 && cfg.Key[:8] == "website_" {
				result[cfg.Key] = cfg.Value
			}
		}
		return c.JSON(fiber.Map{"data": result})
	})

	// Protected routes (authentication required)
	protected := api.Group("", middleware.AuthMiddleware(cfg))

	// Phase 2: User management + profile
	userHandler.RegisterRoutes(protected)

	// Phase 5: Subscription management
	subscriptionHandler.RegisterRoutes(protected)

	// Phase 6: AI Forecast
	forecastHandler.RegisterRoutes(protected)

	// Phase 7: MyKurir (Delivery)
	// Set active-count handler BEFORE RegisterRoutes so it's registered before :id wildcard
	deliveryHandler.SetActiveCountHandler(func(c *fiber.Ctx) error {
		tenantID := middleware.GetTenantID(c)
		var count int64
		db.Model(&domain.DeliveryOrder{}).Where(
			"tenant_id = ? AND status NOT IN (?, ?)",
			tenantID, domain.DeliveryStatusDelivered, domain.DeliveryStatusCancelled,
		).Count(&count)
		return c.JSON(fiber.Map{"success": true, "data": fiber.Map{"count": count}})
	})
	deliveryHandler.RegisterRoutes(protected)

	// File upload
	uploadHandler := handler.NewUploadHandler()
	uploadHandler.RegisterRoutes(protected)

	// Phase 7: Chat (merchant side)
	chatGroup := protected.Group("/chat")
	chatGroup.Get("/rooms", chatHandler.ListRooms)
	chatGroup.Get("/rooms/:roomId/messages", chatHandler.GetMessages)
	chatGroup.Post("/rooms/:roomId/messages", chatHandler.SendMessage)
	chatGroup.Put("/rooms/:roomId/read", chatHandler.MarkRead)

	// Phase 7: Set courier name on delivery order
	protected.Put("/delivery/orders/:id/courier", func(c *fiber.Ctx) error {
		orderID, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": "invalid id"})
		}
		var req struct {
			CourierName string `json:"courier_name"`
		}
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": "invalid body"})
		}
		order, err := deliveryRepo.FindOrderByID(orderID)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"success": false, "error": "order not found"})
		}
		order.CourierName = req.CourierName
		if err := deliveryRepo.UpdateOrder(order); err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "error": err.Error()})
		}
		return c.JSON(fiber.Map{"success": true, "data": order})
	})

	// Tenant settings (owner can update store theme etc.)
	protected.Put("/tenant/settings", func(c *fiber.Ctx) error {
		tenantID := middleware.GetTenantID(c)
		tenant, err := tenantRepo.FindByID(tenantID)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"success": false, "error": "Tenant not found"})
		}

		var incoming map[string]interface{}
		if err := c.BodyParser(&incoming); err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": "Invalid body"})
		}

		// Merge incoming keys into existing settings
		var existing map[string]interface{}
		if tenant.Settings != nil {
			json.Unmarshal(tenant.Settings, &existing)
		}
		if existing == nil {
			existing = make(map[string]interface{})
		}
		for k, v := range incoming {
			existing[k] = v
		}
		settingsJSON, _ := json.Marshal(existing)
		tenant.Settings = settingsJSON

		if err := tenantRepo.Update(tenant); err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "error": "Failed to update settings"})
		}
		return c.JSON(fiber.Map{"success": true, "data": tenant})
	})

	// Get own tenant info
	protected.Get("/tenant/me", func(c *fiber.Ctx) error {
		tenantID := middleware.GetTenantID(c)
		tenant, err := tenantRepo.FindByID(tenantID)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"success": false, "error": "Tenant not found"})
		}
		return c.JSON(fiber.Map{"success": true, "data": tenant})
	})

	// Outlets (owner + admin only)
	outlets := protected.Group("/outlets", middleware.PermissionMiddleware(middleware.ActionManageOutlets))
	outlets.Post("", outletHandler.CreateOutlet)
	outlets.Get("", outletHandler.GetOutlets)
	outlets.Get("/:id", outletHandler.GetOutlet)
	outlets.Put("/:id", outletHandler.UpdateOutlet)
	outlets.Delete("/:id", outletHandler.DeleteOutlet)

	// Products — read: broader access, write: restricted
	products := protected.Group("/products")
	products.Get("", middleware.PermissionMiddleware(middleware.ActionReadProducts), productHandler.GetProducts)
	products.Get("/:id", middleware.PermissionMiddleware(middleware.ActionReadProducts), productHandler.GetProduct)
	products.Post("", middleware.PermissionMiddleware(middleware.ActionManageProducts), productHandler.CreateProduct)
	products.Put("/:id", middleware.PermissionMiddleware(middleware.ActionManageProducts), productHandler.UpdateProduct)
	products.Delete("/:id", middleware.PermissionMiddleware(middleware.ActionManageProducts), productHandler.DeleteProduct)

	// Product image upload
	products.Post("/upload-image", middleware.PermissionMiddleware(middleware.ActionManageProducts), func(c *fiber.Ctx) error {
		file, err := c.FormFile("image")
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": "No image file provided"})
		}

		// Validate file type
		ext := strings.ToLower(filepath.Ext(file.Filename))
		if ext != ".webp" && ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": "Only webp, jpg, jpeg, png files are allowed"})
		}

		// Generate unique filename
		filename := fmt.Sprintf("product_%d%s", time.Now().UnixNano(), ext)
		savePath := filepath.Join("uploads", filename)

		if err := c.SaveFile(file, savePath); err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "error": "Failed to save image"})
		}

		// Return full URL
		imageURL := fmt.Sprintf("/uploads/%s", filename)
		return c.JSON(fiber.Map{"success": true, "data": fiber.Map{"image_url": imageURL}})
	})

	// Categories — same read/write split as products
	categories := protected.Group("/categories")
	categories.Get("", middleware.PermissionMiddleware(middleware.ActionReadProducts), productHandler.GetCategories)
	categories.Post("", middleware.PermissionMiddleware(middleware.ActionManageProducts), productHandler.CreateCategory)
	categories.Put("/:id", middleware.PermissionMiddleware(middleware.ActionManageProducts), productHandler.UpdateCategory)
	categories.Delete("/:id", middleware.PermissionMiddleware(middleware.ActionManageProducts), productHandler.DeleteCategory)

	// Inventory — stock management (same permission as products)
	inventory := protected.Group("/inventory", middleware.PermissionMiddleware(middleware.ActionManageProducts))
	inventory.Get("", inventoryHandler.GetStock)
	inventory.Get("/low-stock", inventoryHandler.GetLowStock)
	inventory.Post("/adjust", inventoryHandler.AdjustStock)
	inventory.Post("/set", inventoryHandler.SetStock)
	inventory.Get("/movements", inventoryHandler.GetMovements)

	// POS — checkout: broader, refund: restricted
	pos := protected.Group("/pos")
	pos.Post("/checkout", middleware.PermissionMiddleware(middleware.ActionPOSCheckout), posHandler.Checkout)
	pos.Post("/refund/:id", middleware.PermissionMiddleware(middleware.ActionPOSRefund), posHandler.Refund)
	pos.Get("/transactions", middleware.PermissionMiddleware(middleware.ActionReadTransactions), posHandler.GetTransactions)
	pos.Get("/transactions/:id", middleware.PermissionMiddleware(middleware.ActionReadTransactions), posHandler.GetTransaction)

	// Accounting (owner + finance only)
	accounting := protected.Group("/accounting", middleware.PermissionMiddleware(middleware.ActionManageAccounting))
	accounting.Get("/coa", accountingHandler.GetCOA)
	accounting.Get("/journals", accountingHandler.GetJournals)
	accounting.Get("/reports/trial-balance", accountingHandler.GetTrialBalance)
	accounting.Get("/reports/profit-loss", accountingHandler.GetProfitLoss)
	accounting.Get("/reports/balance-sheet", accountingHandler.GetBalanceSheet)

	// Customers (owner, admin, outlet_manager, cashier)
	customerHandler.RegisterRoutes(protected)

	// Super Admin routes (super_admin only)
	adminProtected := api.Group("", middleware.AuthMiddleware(cfg), middleware.RoleMiddleware(domain.RoleSuperAdmin))
	superAdminHandler.RegisterRoutes(adminProtected)

	// Start server
	port := fmt.Sprintf(":%s", cfg.AppPort)
	log.Printf("🚀 CODAPOS API starting on port %s", port)
	log.Fatal(app.Listen(port))
}

func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{
		"success": false,
		"error":   err.Error(),
	})
}

func seedSubscriptionPlans(db *gorm.DB) {
	var count int64
	db.Table("subscription_plans").Count(&count)

	// Always update plans to latest values
	if count > 0 {
		// Update Free Basic
		db.Table("subscription_plans").Where("slug = ?", "free-basic").Updates(map[string]interface{}{
			"name":          "Free",
			"price_monthly": 0,
			"price_yearly":  0,
			"max_outlets":   1,
			"max_users":     1,
			"max_products":  30,
			"features":      `{"trial_months":6,"hero_banner":false,"custom_nav":false,"custom_colors":false,"priority_support":false}`,
			"is_active":     true,
		})
		// Update Pro
		db.Table("subscription_plans").Where("slug = ?", "pro").Updates(map[string]interface{}{
			"name":          "Pro",
			"price_monthly": 167000,
			"price_yearly":  2000000,
			"max_outlets":   5,
			"max_users":     10,
			"max_products":  500,
			"features":      `{"trial_months":0,"hero_banner":true,"custom_nav":true,"custom_colors":true,"priority_support":true}`,
			"is_active":     true,
		})
		log.Println("✅ Subscription plans updated (Free + Pro Rp2jt/yr)")
		return
	}

	plans := []map[string]interface{}{
		{
			"name":          "Free",
			"slug":          "free-basic",
			"price_monthly": 0,
			"price_yearly":  0,
			"max_outlets":   1,
			"max_users":     1,
			"max_products":  30,
			"features":      `{"trial_months":6,"hero_banner":false,"custom_nav":false,"custom_colors":false,"priority_support":false}`,
			"is_active":     true,
		},
		{
			"name":          "Pro",
			"slug":          "pro",
			"price_monthly": 167000,
			"price_yearly":  2000000,
			"max_outlets":   5,
			"max_users":     10,
			"max_products":  500,
			"features":      `{"trial_months":0,"hero_banner":true,"custom_nav":true,"custom_colors":true,"priority_support":true}`,
			"is_active":     true,
		},
	}

	for _, plan := range plans {
		db.Table("subscription_plans").Create(plan)
	}
	log.Println("✅ CODAPOS subscription plans seeded (Free + Pro Rp2jt/yr)")
}

func seedMerchantTypes(db *gorm.DB) {
	var count int64
	db.Table("merchant_types").Count(&count)
	if count > 0 {
		return
	}

	types := []map[string]interface{}{
		{"name": "Restaurant / Cafe", "slug": "restaurant", "icon": "🍽️", "is_active": true},
		{"name": "Grosir Sembako", "slug": "grosir-sembako", "icon": "🏪", "is_active": true},
		{"name": "Pengrajin / UMKM", "slug": "pengrajin", "icon": "🎨", "is_active": true},
		{"name": "Lainnya", "slug": "lainnya", "icon": "📦", "is_active": true},
	}

	for _, mt := range types {
		db.Table("merchant_types").Create(mt)
	}
	log.Println("✅ Default merchant types seeded")
}

func seedGlobalConfigs(db *gorm.DB) {
	var count int64
	db.Table("global_configs").Count(&count)
	if count > 0 {
		return
	}

	configs := []map[string]interface{}{
		{"key": "default_revenue_share_pct", "value": "10", "description": "Default revenue share percentage for new merchants"},
		{"key": "smtp_host", "value": "", "description": "SMTP host for email sending"},
		{"key": "smtp_port", "value": "587", "description": "SMTP port"},
		{"key": "smtp_user", "value": "", "description": "SMTP username"},
		{"key": "smtp_pass", "value": "", "description": "SMTP password"},
		{"key": "google_maps_api_key", "value": "", "description": "Google Maps API key for customer pin koordinat"},
	}

	for _, cfg := range configs {
		db.Table("global_configs").Create(cfg)
	}
	log.Println("✅ Global configs seeded")
}

func seedMidtransConfigs(db *gorm.DB) {
	var count int64
	db.Table("global_configs").Where("key = ?", "midtrans_mode").Count(&count)
	if count > 0 {
		return
	}

	configs := []map[string]interface{}{
		{"key": "midtrans_mode", "value": "sandbox", "description": "Midtrans environment: sandbox atau production"},
		{"key": "midtrans_merchant_id", "value": "G844553457", "description": "Midtrans Merchant ID"},
		{"key": "midtrans_client_key", "value": "SB-Mid-client-prNE7fZQqPkwPS3-", "description": "Midtrans Client Key"},
		{"key": "midtrans_server_key", "value": "SB-Mid-server-D1ufi6mPcGH38M_F80hgi4qS", "description": "Midtrans Server Key"},
	}

	for _, cfg := range configs {
		db.Table("global_configs").Create(cfg)
	}
	log.Println("✅ Midtrans configs seeded (Sandbox mode)")
}

func seedDefaultRolePermissions(db *gorm.DB) {
	var count int64
	db.Table("role_permissions").Count(&count)
	if count > 0 {
		return
	}

	// Default permissions matching the previous hardcoded permissionMap
	defaults := []map[string]interface{}{
		// manage_users: owner
		{"role": "owner", "action": "manage_users", "is_allowed": true},
		{"role": "admin", "action": "manage_users", "is_allowed": false},
		{"role": "finance", "action": "manage_users", "is_allowed": false},
		{"role": "outlet_manager", "action": "manage_users", "is_allowed": false},
		{"role": "cashier", "action": "manage_users", "is_allowed": false},
		{"role": "customer", "action": "manage_users", "is_allowed": false},

		// manage_products: owner, admin, outlet_manager
		{"role": "owner", "action": "manage_products", "is_allowed": true},
		{"role": "admin", "action": "manage_products", "is_allowed": true},
		{"role": "finance", "action": "manage_products", "is_allowed": false},
		{"role": "outlet_manager", "action": "manage_products", "is_allowed": true},
		{"role": "cashier", "action": "manage_products", "is_allowed": false},
		{"role": "customer", "action": "manage_products", "is_allowed": false},

		// read_products: owner, admin, outlet_manager, cashier
		{"role": "owner", "action": "read_products", "is_allowed": true},
		{"role": "admin", "action": "read_products", "is_allowed": true},
		{"role": "finance", "action": "read_products", "is_allowed": false},
		{"role": "outlet_manager", "action": "read_products", "is_allowed": true},
		{"role": "cashier", "action": "read_products", "is_allowed": true},
		{"role": "customer", "action": "read_products", "is_allowed": false},

		// manage_outlets: owner, admin
		{"role": "owner", "action": "manage_outlets", "is_allowed": true},
		{"role": "admin", "action": "manage_outlets", "is_allowed": true},
		{"role": "finance", "action": "manage_outlets", "is_allowed": false},
		{"role": "outlet_manager", "action": "manage_outlets", "is_allowed": false},
		{"role": "cashier", "action": "manage_outlets", "is_allowed": false},
		{"role": "customer", "action": "manage_outlets", "is_allowed": false},

		// pos_checkout: owner, admin, outlet_manager, cashier
		{"role": "owner", "action": "pos_checkout", "is_allowed": true},
		{"role": "admin", "action": "pos_checkout", "is_allowed": true},
		{"role": "finance", "action": "pos_checkout", "is_allowed": false},
		{"role": "outlet_manager", "action": "pos_checkout", "is_allowed": true},
		{"role": "cashier", "action": "pos_checkout", "is_allowed": true},
		{"role": "customer", "action": "pos_checkout", "is_allowed": false},

		// pos_refund: owner, admin, outlet_manager
		{"role": "owner", "action": "pos_refund", "is_allowed": true},
		{"role": "admin", "action": "pos_refund", "is_allowed": true},
		{"role": "finance", "action": "pos_refund", "is_allowed": false},
		{"role": "outlet_manager", "action": "pos_refund", "is_allowed": true},
		{"role": "cashier", "action": "pos_refund", "is_allowed": false},
		{"role": "customer", "action": "pos_refund", "is_allowed": false},

		// read_transactions: owner, admin, finance, outlet_manager, cashier
		{"role": "owner", "action": "read_transactions", "is_allowed": true},
		{"role": "admin", "action": "read_transactions", "is_allowed": true},
		{"role": "finance", "action": "read_transactions", "is_allowed": true},
		{"role": "outlet_manager", "action": "read_transactions", "is_allowed": true},
		{"role": "cashier", "action": "read_transactions", "is_allowed": true},
		{"role": "customer", "action": "read_transactions", "is_allowed": false},

		// manage_accounting: owner, finance
		{"role": "owner", "action": "manage_accounting", "is_allowed": true},
		{"role": "admin", "action": "manage_accounting", "is_allowed": false},
		{"role": "finance", "action": "manage_accounting", "is_allowed": true},
		{"role": "outlet_manager", "action": "manage_accounting", "is_allowed": false},
		{"role": "cashier", "action": "manage_accounting", "is_allowed": false},
		{"role": "customer", "action": "manage_accounting", "is_allowed": false},

		// manage_customers: owner, admin, outlet_manager, cashier
		{"role": "owner", "action": "manage_customers", "is_allowed": true},
		{"role": "admin", "action": "manage_customers", "is_allowed": true},
		{"role": "finance", "action": "manage_customers", "is_allowed": false},
		{"role": "outlet_manager", "action": "manage_customers", "is_allowed": true},
		{"role": "cashier", "action": "manage_customers", "is_allowed": true},
		{"role": "customer", "action": "manage_customers", "is_allowed": false},

		// manage_settings: owner
		{"role": "owner", "action": "manage_settings", "is_allowed": true},
		{"role": "admin", "action": "manage_settings", "is_allowed": false},
		{"role": "finance", "action": "manage_settings", "is_allowed": false},
		{"role": "outlet_manager", "action": "manage_settings", "is_allowed": false},
		{"role": "cashier", "action": "manage_settings", "is_allowed": false},
		{"role": "customer", "action": "manage_settings", "is_allowed": false},
	}

	for _, rp := range defaults {
		db.Table("role_permissions").Create(rp)
	}
	log.Println("✅ Default role permissions seeded")
}
