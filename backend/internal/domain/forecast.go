package domain

// ForecastRequest is the DTO for requesting a forecast
type ForecastRequest struct {
	Period    string `json:"period"`     // "daily", "weekly", "monthly"
	Days      int    `json:"days"`       // how many days to forecast (default 7)
	ProductID string `json:"product_id"` // optional: specific product
}

// ForecastResult represents the AI forecast output
type ForecastResult struct {
	Period          string            `json:"period"`
	GeneratedAt     string            `json:"generated_at"`
	TotalPredicted  float64           `json:"total_predicted_revenue"`
	TrendDirection  string            `json:"trend_direction"`  // "up", "down", "stable"
	TrendPercentage float64           `json:"trend_percentage"` // e.g. +12.5
	ConfidenceScore float64           `json:"confidence_score"` // 0.0 - 1.0
	DailyForecasts  []DailyForecast   `json:"daily_forecasts"`
	TopProducts     []ProductForecast `json:"top_products"`
	Insights        []ForecastInsight `json:"insights"`
	HistoricalData  []DailySummary    `json:"historical_data"`
}

// DailyForecast is a single day prediction
type DailyForecast struct {
	Date             string  `json:"date"`
	PredictedRevenue float64 `json:"predicted_revenue"`
	PredictedOrders  int     `json:"predicted_orders"`
	LowerBound       float64 `json:"lower_bound"`
	UpperBound       float64 `json:"upper_bound"`
}

// ProductForecast is prediction for a specific product
type ProductForecast struct {
	ProductID        string  `json:"product_id"`
	ProductName      string  `json:"product_name"`
	PredictedQty     float64 `json:"predicted_qty"`
	TrendDirection   string  `json:"trend_direction"`
	TrendPercentage  float64 `json:"trend_percentage"`
	RecommendedStock int     `json:"recommended_stock"`
}

// ForecastInsight is an AI-generated insight
type ForecastInsight struct {
	Type    string `json:"type"` // "info", "warning", "success"
	Title   string `json:"title"`
	Message string `json:"message"`
	Icon    string `json:"icon"`
}

// DailySummary is historical daily aggregation
type DailySummary struct {
	Date       string  `json:"date"`
	Revenue    float64 `json:"revenue"`
	OrderCount int     `json:"order_count"`
	AvgOrder   float64 `json:"avg_order"`
}
