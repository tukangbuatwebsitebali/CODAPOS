package repository

import (
	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ChatRepository handles chat room and message persistence.
type ChatRepository struct {
	db *gorm.DB
}

// NewChatRepository creates a new ChatRepository.
func NewChatRepository(db *gorm.DB) *ChatRepository {
	return &ChatRepository{db: db}
}

// CreateRoom persists a new chat room.
func (r *ChatRepository) CreateRoom(room *domain.ChatRoom) error {
	return r.db.Create(room).Error
}

// FindRoomByID retrieves a room by ID with customer info.
func (r *ChatRepository) FindRoomByID(id uuid.UUID) (*domain.ChatRoom, error) {
	var room domain.ChatRoom
	err := r.db.Preload("Customer").Preload("DeliveryOrder").Where("id = ?", id).First(&room).Error
	return &room, err
}

// FindRoomByDeliveryID retrieves a room by its delivery order ID.
func (r *ChatRepository) FindRoomByDeliveryID(deliveryID uuid.UUID) (*domain.ChatRoom, error) {
	var room domain.ChatRoom
	err := r.db.Preload("Customer").Where("delivery_id = ?", deliveryID).First(&room).Error
	return &room, err
}

// FindRoomsByTenantID lists all rooms for a tenant.
func (r *ChatRepository) FindRoomsByTenantID(tenantID uuid.UUID) ([]domain.ChatRoom, error) {
	var rooms []domain.ChatRoom
	err := r.db.Preload("Customer").Preload("DeliveryOrder").
		Where("tenant_id = ?", tenantID).
		Order("last_message_at DESC NULLS LAST").
		Find(&rooms).Error
	return rooms, err
}

// CreateMessage persists a new chat message and updates the room.
func (r *ChatRepository) CreateMessage(msg *domain.ChatMessage) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(msg).Error; err != nil {
			return err
		}
		return tx.Model(&domain.ChatRoom{}).Where("id = ?", msg.RoomID).
			Updates(map[string]interface{}{
				"last_message":    msg.Content,
				"last_message_at": msg.CreatedAt,
			}).Error
	})
}

// FindMessagesByRoomID returns all messages in a room.
func (r *ChatRepository) FindMessagesByRoomID(roomID uuid.UUID, limit, offset int) ([]domain.ChatMessage, error) {
	var msgs []domain.ChatMessage
	err := r.db.Where("room_id = ?", roomID).
		Order("created_at ASC").
		Limit(limit).Offset(offset).
		Find(&msgs).Error
	return msgs, err
}

// MarkMessagesRead marks all messages from a specific sender type as read.
func (r *ChatRepository) MarkMessagesRead(roomID uuid.UUID, senderType string) error {
	return r.db.Model(&domain.ChatMessage{}).
		Where("room_id = ? AND sender_type = ? AND read_at IS NULL", roomID, senderType).
		Update("read_at", gorm.Expr("NOW()")).Error
}

// CountUnreadByRoom counts unread messages by sender type in a room.
func (r *ChatRepository) CountUnreadByRoom(roomID uuid.UUID, senderType string) (int64, error) {
	var count int64
	err := r.db.Model(&domain.ChatMessage{}).
		Where("room_id = ? AND sender_type = ? AND read_at IS NULL", roomID, senderType).
		Count(&count).Error
	return count, err
}
