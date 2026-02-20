package handler

import (
	"path/filepath"
	"strings"

	"github.com/codapos/backend/internal/util"
	"github.com/gofiber/fiber/v2"
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

	// Upload to Cloudinary (or local fallback)
	publicURL, err := util.CloudinaryUpload(file)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to upload file: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"url":      publicURL,
			"filename": filepath.Base(publicURL),
		},
		"message": "File uploaded successfully",
	})
}
