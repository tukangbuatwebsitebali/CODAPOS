package main

import (
	"fmt"
	"log"
	"os"

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

	log.Println("Connected! Dropping all tables...")
	res := db.Exec("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
	if res.Error != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", res.Error)
		os.Exit(1)
	}
	log.Println("✅ All tables dropped. Schema reset.")
}
