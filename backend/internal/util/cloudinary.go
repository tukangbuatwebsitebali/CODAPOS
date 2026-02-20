package util

import (
	"context"
	"fmt"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

// CloudinaryUpload uploads a multipart file to Cloudinary and returns the secure URL.
// Falls back to local file storage if CLOUDINARY_URL is not set.
func CloudinaryUpload(fileHeader *multipart.FileHeader) (string, error) {
	cloudURL := os.Getenv("CLOUDINARY_URL")
	if cloudURL == "" {
		// Fallback: save locally (for dev)
		return saveLocally(fileHeader)
	}

	// Strip angle brackets (common copy-paste issue from Cloudinary dashboard)
	cloudURL = strings.ReplaceAll(cloudURL, "<", "")
	cloudURL = strings.ReplaceAll(cloudURL, ">", "")

	cld, err := cloudinary.NewFromURL(cloudURL)
	if err != nil {
		log.Printf("⚠️ Cloudinary init failed: %v — falling back to local", err)
		return saveLocally(fileHeader)
	}

	// Open the file
	file, err := fileHeader.Open()
	if err != nil {
		return "", fmt.Errorf("cannot open file: %w", err)
	}
	defer file.Close()

	// Generate a unique public ID (no folder param to avoid double nesting)
	publicID := fmt.Sprintf("codapos/%d", time.Now().UnixNano())

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	uploadResult, err := cld.Upload.Upload(ctx, file, uploader.UploadParams{
		PublicID: publicID,
	})
	if err != nil {
		log.Printf("⚠️ Cloudinary upload failed: %v — falling back to local", err)
		return saveLocally(fileHeader)
	}

	return uploadResult.SecureURL, nil
}

// saveLocally saves the file to ./uploads and returns a URL using BASE_URL env
func saveLocally(fileHeader *multipart.FileHeader) (string, error) {
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)

	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("cannot create uploads dir: %w", err)
	}

	savePath := filepath.Join(uploadDir, filename)

	src, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	dst, err := os.Create(savePath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	buf := make([]byte, 1024*32)
	for {
		n, readErr := src.Read(buf)
		if n > 0 {
			if _, writeErr := dst.Write(buf[:n]); writeErr != nil {
				return "", writeErr
			}
		}
		if readErr != nil {
			break
		}
	}

	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}
	return fmt.Sprintf("%s/uploads/%s", baseURL, filename), nil
}
