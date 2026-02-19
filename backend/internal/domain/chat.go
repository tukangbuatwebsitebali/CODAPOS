package domain

import (
	"time"

	"github.com/google/uuid"
)

// ChatRoom links a delivery order to a conversation between merchant and customer
type ChatRoom struct {
	BaseModel
	TenantID      uuid.UUID  `json:"tenant_id" gorm:"type:uuid;not null;index"`
	DeliveryID    uuid.UUID  `json:"delivery_id" gorm:"type:uuid;not null;index"`
	CustomerID    uuid.UUID  `json:"customer_id" gorm:"type:uuid;not null;index"`
	Status        string     `json:"status" gorm:"size:20;not null;default:'open'"` // open, closed
	LastMessage   string     `json:"last_message" gorm:"size:500"`
	LastMessageAt *time.Time `json:"last_message_at,omitempty"`

	// Relations
	Customer      *Customer      `json:"customer,omitempty" gorm:"foreignKey:CustomerID"`
	DeliveryOrder *DeliveryOrder `json:"delivery_order,omitempty" gorm:"foreignKey:DeliveryID"`
	Messages      []ChatMessage  `json:"messages,omitempty" gorm:"foreignKey:RoomID"`
}

func (ChatRoom) TableName() string { return "chat_rooms" }

// ChatMessage is a single message in a chat room
type ChatMessage struct {
	BaseModel
	RoomID     uuid.UUID  `json:"room_id" gorm:"type:uuid;not null;index"`
	SenderType string     `json:"sender_type" gorm:"size:20;not null"` // "merchant" or "customer"
	SenderName string     `json:"sender_name" gorm:"size:100;not null"`
	Content    string     `json:"content" gorm:"type:text;not null"`
	ReadAt     *time.Time `json:"read_at,omitempty"`
}

func (ChatMessage) TableName() string { return "chat_messages" }

const (
	ChatRoomStatusOpen   = "open"
	ChatRoomStatusClosed = "closed"
	SenderTypeMerchant   = "merchant"
	SenderTypeCustomer   = "customer"
)

// DTOs
type SendMessageRequest struct {
	Content string `json:"content" validate:"required"`
}
