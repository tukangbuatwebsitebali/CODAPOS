package handler

import (
	"strconv"
	"time"

	"github.com/codapos/backend/internal/domain"
	"github.com/codapos/backend/internal/middleware"
	"github.com/codapos/backend/internal/repository"
	"github.com/codapos/backend/pkg/response"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// ChatHandler provides REST endpoints for chat rooms and messages.
type ChatHandler struct {
	chatRepo     *repository.ChatRepository
	deliveryRepo *repository.DeliveryRepository
}

// NewChatHandler creates a new ChatHandler.
func NewChatHandler(chatRepo *repository.ChatRepository, deliveryRepo *repository.DeliveryRepository) *ChatHandler {
	return &ChatHandler{chatRepo: chatRepo, deliveryRepo: deliveryRepo}
}

// ListRooms returns all chat rooms for the authenticated tenant.
func (h *ChatHandler) ListRooms(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	rooms, err := h.chatRepo.FindRoomsByTenantID(tenantID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	// Count unread messages from customers for each room
	type RoomWithUnread struct {
		domain.ChatRoom
		UnreadCount int64 `json:"unread_count"`
	}
	result := make([]RoomWithUnread, len(rooms))
	for i, room := range rooms {
		unread, _ := h.chatRepo.CountUnreadByRoom(room.ID, domain.SenderTypeCustomer)
		result[i] = RoomWithUnread{ChatRoom: room, UnreadCount: unread}
	}
	return response.Success(c, result, "chat rooms loaded")
}

// GetMessages returns messages for a chat room.
func (h *ChatHandler) GetMessages(c *fiber.Ctx) error {
	roomID, err := uuid.Parse(c.Params("roomId"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "invalid room id")
	}
	limit, _ := strconv.Atoi(c.Query("limit", "100"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	msgs, err := h.chatRepo.FindMessagesByRoomID(roomID, limit, offset)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, msgs, "messages loaded")
}

// SendMessage sends a message from the merchant.
func (h *ChatHandler) SendMessage(c *fiber.Ctx) error {
	roomID, err := uuid.Parse(c.Params("roomId"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "invalid room id")
	}

	var req domain.SendMessageRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "invalid body")
	}
	if req.Content == "" {
		return response.Error(c, fiber.StatusBadRequest, "content is required")
	}

	// Get sender name from auth context
	userName := "Merchant"
	if name := c.Get("X-User-Name"); name != "" {
		userName = name
	}

	now := time.Now()
	msg := &domain.ChatMessage{
		BaseModel:  domain.BaseModel{ID: uuid.New(), CreatedAt: now, UpdatedAt: now},
		RoomID:     roomID,
		SenderType: domain.SenderTypeMerchant,
		SenderName: userName,
		Content:    req.Content,
	}
	if err := h.chatRepo.CreateMessage(msg); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, msg, "message sent")
}

// MarkRead marks all customer messages as read (merchant viewed them).
func (h *ChatHandler) MarkRead(c *fiber.Ctx) error {
	roomID, err := uuid.Parse(c.Params("roomId"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "invalid room id")
	}
	if err := h.chatRepo.MarkMessagesRead(roomID, domain.SenderTypeCustomer); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, nil, "messages marked as read")
}

// --- Public endpoints (for customer, no auth) ---

// PublicGetMessages returns messages for a room (customer side).
func (h *ChatHandler) PublicGetMessages(c *fiber.Ctx) error {
	roomID, err := uuid.Parse(c.Params("roomId"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "invalid room id")
	}

	msgs, err := h.chatRepo.FindMessagesByRoomID(roomID, 200, 0)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	// Mark merchant messages as read
	_ = h.chatRepo.MarkMessagesRead(roomID, domain.SenderTypeMerchant)

	return response.Success(c, msgs, "messages loaded")
}

// PublicSendMessage sends a message from the customer.
func (h *ChatHandler) PublicSendMessage(c *fiber.Ctx) error {
	roomID, err := uuid.Parse(c.Params("roomId"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "invalid room id")
	}

	var req domain.SendMessageRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "invalid body")
	}
	if req.Content == "" {
		return response.Error(c, fiber.StatusBadRequest, "content is required")
	}

	// Get customer name from room
	room, err := h.chatRepo.FindRoomByID(roomID)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, "room not found")
	}
	senderName := "Customer"
	if room.Customer != nil {
		senderName = room.Customer.Name
	}

	now := time.Now()
	msg := &domain.ChatMessage{
		BaseModel:  domain.BaseModel{ID: uuid.New(), CreatedAt: now, UpdatedAt: now},
		RoomID:     roomID,
		SenderType: domain.SenderTypeCustomer,
		SenderName: senderName,
		Content:    req.Content,
	}
	if err := h.chatRepo.CreateMessage(msg); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, msg, "message sent")
}
