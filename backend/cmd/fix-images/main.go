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

type ProductRow struct {
	ID       string `gorm:"column:id"`
	Name     string `gorm:"column:name"`
	ImageURL string `gorm:"column:image_url"`
}

func main() {
	cfg, _ := config.Load()
	db, err := gorm.Open(postgres.Open(cfg.DB.DSN()), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}
	log.Println("✅ Connected to DB")

	cloudURL := os.Getenv("CLOUDINARY_URL")
	cloudURL = strings.ReplaceAll(cloudURL, "<", "")
	cloudURL = strings.ReplaceAll(cloudURL, ">", "")

	cld, err := cloudinary.NewFromURL(cloudURL)
	if err != nil {
		log.Fatalf("❌ Cloudinary init failed: %v", err)
	}
	log.Println("✅ Cloudinary initialized")

	// Get all products that have images (Cloudinary or broken)
	var products []ProductRow
	db.Raw("SELECT id, name, image_url FROM products WHERE image_url IS NOT NULL AND image_url != '' ORDER BY name").Scan(&products)
	log.Printf("📋 Products with images: %d", len(products))

	// Get local product images
	uploadsDir := "./uploads"
	entries, _ := os.ReadDir(uploadsDir)
	var localFiles []string
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		ext := strings.ToLower(filepath.Ext(e.Name()))
		if ext == ".webp" || ext == ".jpg" || ext == ".jpeg" || ext == ".png" {
			if strings.HasPrefix(e.Name(), "product_") {
				localFiles = append(localFiles, e.Name())
			}
		}
	}
	log.Printf("📁 Local product images: %d", len(localFiles))

	// Re-upload each local image with a CLEAN public ID and assign to products
	count := len(products)
	if count > len(localFiles) {
		count = len(localFiles)
	}

	for i := 0; i < count; i++ {
		product := products[i]
		localFile := localFiles[i]
		localPath := filepath.Join(uploadsDir, localFile)

		file, err := os.Open(localPath)
		if err != nil {
			log.Printf("❌ Cannot open %s", localFile)
			continue
		}

		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)

		// Clean public ID — just use timestamp, no double prefix
		publicID := fmt.Sprintf("codapos/img_%d", time.Now().UnixNano())

		result, err := cld.Upload.Upload(ctx, file, uploader.UploadParams{
			PublicID:  publicID,
			Overwrite: boolPtr(true),
		})
		cancel()
		file.Close()

		if err != nil {
			log.Printf("❌ Upload failed %s: %v", localFile, err)
			continue
		}

		db.Exec("UPDATE products SET image_url = ? WHERE id = ?", result.SecureURL, product.ID)
		log.Printf("✅ %s → %s", product.Name, result.SecureURL)

		// Small delay to avoid rate limits
		time.Sleep(200 * time.Millisecond)
	}

	// Clear remaining products with non-cloudinary URLs
	db.Exec("UPDATE products SET image_url = '' WHERE image_url != '' AND image_url NOT LIKE 'https://res.cloudinary.com%'")

	log.Printf("\n🎉 Done! Fixed %d products", count)
}

func boolPtr(b bool) *bool {
	return &b
}
