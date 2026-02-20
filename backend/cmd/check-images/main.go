package main

import (
	"fmt"
	"log"

	"github.com/codapos/backend/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type ImageResult struct {
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

	var results []ImageResult
	db.Raw("SELECT id, name, image_url FROM products WHERE image_url IS NOT NULL AND image_url != '' ORDER BY name").Scan(&results)

	fmt.Printf("Found %d products with images:\n\n", len(results))
	for _, r := range results {
		fmt.Printf("  %s | %s\n", r.Name, r.ImageURL)
	}
}
