package domain

// PriceReference represents market price data for common products in Indonesia
type PriceReference struct {
	BaseModel
	Name     string  `json:"name" gorm:"size:255;not null;index"`
	Category string  `json:"category" gorm:"size:100;not null;index"`
	AvgPrice float64 `json:"avg_price" gorm:"type:decimal(15,2);not null"`
	MinPrice float64 `json:"min_price" gorm:"type:decimal(15,2);not null"`
	MaxPrice float64 `json:"max_price" gorm:"type:decimal(15,2);not null"`
	Source   string  `json:"source" gorm:"size:100;default:'market_data'"`
}

func (PriceReference) TableName() string { return "price_references" }

// StockAlert represents a smart stock notification
type StockAlert struct {
	ProductID         string  `json:"product_id"`
	ProductName       string  `json:"product_name"`
	ProductSKU        string  `json:"product_sku"`
	ProductUnit       string  `json:"product_unit"`
	CurrentStock      float64 `json:"current_stock"`
	DailyAvgSales     float64 `json:"daily_avg_sales"`
	WeeklyTrend       float64 `json:"weekly_trend"` // percentage change w2w
	PredictedDaysLeft float64 `json:"predicted_days_left"`
	SuggestedRestock  float64 `json:"suggested_restock"`
	Severity          string  `json:"severity"` // "warning", "critical", "ok"
	Message           string  `json:"message"`
}

// PriceSuggestion is the response for AI price recommendation
type PriceSuggestion struct {
	SuggestedPrice float64    `json:"suggested_price"`
	PriceRange     PriceRange `json:"price_range"`
	Source         string     `json:"source"`
	Confidence     float64    `json:"confidence"`
	MatchedName    string     `json:"matched_name"`
}

type PriceRange struct {
	Low  float64 `json:"low"`
	High float64 `json:"high"`
}
