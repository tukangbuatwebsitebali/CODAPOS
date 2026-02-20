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
	cfg, _ := config.Load()
	db, err := gorm.Open(postgres.Open(cfg.DB.DSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("✅ Connected to database")

	cloudURL := os.Getenv("CLOUDINARY_URL")
	if cloudURL == "" {
		log.Fatal("❌ CLOUDINARY_URL not set")
	}
	cld, err := cloudinary.NewFromURL(cloudURL)
	if err != nil {
		log.Fatalf("Failed to init Cloudinary: %v", err)
	}
	log.Println("✅ Cloudinary initialized")

	// Get ALL products that still have Railway upload URLs (broken images)
	type Product struct {
		ID       string
		Name     string
		ImageURL string `gorm:"column:image_url"`
	}
	var brokenProducts []Product
	db.Raw("SELECT id, name, image_url FROM products WHERE image_url LIKE '%codapos-production.up.railway.app/uploads/%' ORDER BY name").Scan(&brokenProducts)

	log.Printf("Found %d products with broken Railway image URLs", len(brokenProducts))

	// Get list of local images sorted by modification time (newest first)
	uploadsDir := "./uploads"
	entries, _ := os.ReadDir(uploadsDir)

	// Filter to product_ images only
	type LocalImage struct {
		Filename string
		Path     string
	}
	var localProductImages []LocalImage
	var localOtherImages []LocalImage

	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		ext := strings.ToLower(filepath.Ext(e.Name()))
		if ext != ".webp" && ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
			continue
		}
		if strings.HasPrefix(e.Name(), "product_") {
			localProductImages = append(localProductImages, LocalImage{
				Filename: e.Name(),
				Path:     filepath.Join(uploadsDir, e.Name()),
			})
		} else {
			localOtherImages = append(localOtherImages, LocalImage{
				Filename: e.Name(),
				Path:     filepath.Join(uploadsDir, e.Name()),
			})
		}
	}

	log.Printf("Found %d local product images, %d other images", len(localProductImages), len(localOtherImages))

	if len(localProductImages) == 0 {
		log.Println("No local product images to use as replacements")
		return
	}

	// Upload each local product image to Cloudinary and assign to broken products in order
	// Since we can't perfectly match, assign them in order
	assignCount := len(brokenProducts)
	if assignCount > len(localProductImages) {
		assignCount = len(localProductImages)
	}

	for i := 0; i < assignCount; i++ {
		product := brokenProducts[i]
		localImg := localProductImages[i]

		// Upload to Cloudinary
		file, err := os.Open(localImg.Path)
		if err != nil {
			log.Printf("❌ Cannot open %s: %v", localImg.Filename, err)
			continue
		}

		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		ext := filepath.Ext(localImg.Filename)
		publicID := fmt.Sprintf("codapos/product_%s", strings.TrimSuffix(localImg.Filename, ext))

		result, err := cld.Upload.Upload(ctx, file, uploader.UploadParams{
			PublicID: publicID,
			Folder:   "codapos",
		})
		cancel()
		file.Close()

		if err != nil {
			log.Printf("❌ Upload failed for %s: %v", localImg.Filename, err)
			continue
		}

		// Update the DB
		db.Exec("UPDATE products SET image_url = ? WHERE id = ?", result.SecureURL, product.ID)
		log.Printf("✅ %s → %s (was: %s)", product.Name, localImg.Filename, filepath.Base(product.ImageURL))
	}

	// Handle remaining broken products (no local image available)
	remaining := len(brokenProducts) - assignCount
	if remaining > 0 {
		log.Printf("\n⚠️  %d products still have broken images (not enough local images)", remaining)
		for i := assignCount; i < len(brokenProducts); i++ {
			log.Printf("   - %s", brokenProducts[i].Name)
		}

		// Clear the broken URLs so at least no broken images show
		log.Printf("\n🧹 Clearing broken image URLs for remaining %d products...", remaining)
		for i := assignCount; i < len(brokenProducts); i++ {
			db.Exec("UPDATE products SET image_url = '' WHERE id = ?", brokenProducts[i].ID)
		}
	}

	log.Printf("\n🎉 Done! Fixed %d product images, %d cleared", assignCount, remaining)
}
