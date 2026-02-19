package main

import (
	"log"

	"github.com/codapos/backend/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	cfg, _ := config.Load()
	db, err := gorm.Open(postgres.Open(cfg.DB.DSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("Cannot connect: %v", err)
	}

	// Fix: update ALL users with email admin@codapos.com to super_admin
	result := db.Exec(`UPDATE users SET role = 'super_admin' WHERE email = 'admin@codapos.com'`)
	if result.Error != nil {
		log.Fatalf("Failed to update: %v", result.Error)
	}
	log.Printf("✅ Updated %d user(s) to super_admin role", result.RowsAffected)
}
