package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/codapos/backend/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Load env
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	db, err := gorm.Open(postgres.Open(cfg.DB.DSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("✅ Connected to database")

	// Init Cloudinary
	cloudURL := os.Getenv("CLOUDINARY_URL")
	if cloudURL == "" {
		log.Fatal("❌ CLOUDINARY_URL environment variable is not set")
	}

	cld, err := cloudinary.NewFromURL(cloudURL)
	if err != nil {
		log.Fatalf("Failed to init Cloudinary: %v", err)
	}
	log.Println("✅ Cloudinary initialized")

	// Scan uploads directory
	uploadsDir := "./uploads"
	entries, err := os.ReadDir(uploadsDir)
	if err != nil {
		log.Fatalf("Failed to read uploads dir: %v", err)
	}

	successCount := 0
	failCount := 0

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		filename := entry.Name()
		ext := strings.ToLower(filepath.Ext(filename))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" && ext != ".gif" {
			continue
		}

		localPath := filepath.Join(uploadsDir, filename)

		// Open file
		file, err := os.Open(localPath)
		if err != nil {
			log.Printf("❌ Cannot open %s: %v", filename, err)
			failCount++
			continue
		}

		// Upload to Cloudinary
		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		publicID := fmt.Sprintf("codapos/%s", strings.TrimSuffix(filename, ext))

		result, err := cld.Upload.Upload(ctx, file, uploader.UploadParams{
			PublicID: publicID,
			Folder:   "codapos",
		})
		cancel()
		file.Close()

		if err != nil {
			log.Printf("❌ Upload failed for %s: %v", filename, err)
			failCount++
			continue
		}

		secureURL := result.SecureURL
		log.Printf("✅ Uploaded %s → %s", filename, secureURL)

		// Update products table — match by filename in image_url
		res := db.Exec(
			"UPDATE products SET image_url = ? WHERE image_url LIKE ?",
			secureURL,
			"%"+filename+"%",
		)
		if res.RowsAffected > 0 {
			log.Printf("   📝 Updated %d product(s) in DB", res.RowsAffected)
		}

		// Also update tenants table — match by filename in logo_url
		res = db.Exec(
			"UPDATE tenants SET logo_url = ? WHERE logo_url LIKE ?",
			secureURL,
			"%"+filename+"%",
		)
		if res.RowsAffected > 0 {
			log.Printf("   📝 Updated %d tenant(s) logo in DB", res.RowsAffected)
		}

		// Update storefront_settings — banner_url
		res = db.Exec(
			"UPDATE storefront_settings SET banner_url = ? WHERE banner_url LIKE ?",
			secureURL,
			"%"+filename+"%",
		)
		if res.RowsAffected > 0 {
			log.Printf("   📝 Updated %d storefront banner(s) in DB", res.RowsAffected)
		}

		successCount++
	}

	log.Printf("\n🎉 Done! Uploaded %d images, %d failed", successCount, failCount)
}
