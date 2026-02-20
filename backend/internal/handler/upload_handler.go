package handler

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// UploadHandler handles file upload requests
type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

func (h *UploadHandler) RegisterRoutes(api fiber.Router) {
	api.Post("/upload", h.Upload)
}

// Upload handles single file upload (logo, banner, etc.)
func (h *UploadHandler) Upload(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "No file uploaded",
		})
	}

	// Max 5MB
	if file.Size > 5*1024*1024 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "File too large (max 5MB)",
		})
	}

	// Validate extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true}
	if !allowed[ext] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid file type. Allowed: jpg, png, webp, gif",
		})
	}

	// Ensure uploads directory exists
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to create upload directory",
		})
	}

	// Generate unique filename
	filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	savePath := filepath.Join(uploadDir, filename)

	// Save file
	if err := c.SaveFile(file, savePath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to save file",
		})
	}

	// Build public URL — prefer BASE_URL env var (for Railway/production)
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = c.BaseURL()
	}
	publicURL := fmt.Sprintf("%s/uploads/%s", baseURL, filename)

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"url":      publicURL,
			"filename": filename,
		},
		"message": "File uploaded successfully",
	})
}
