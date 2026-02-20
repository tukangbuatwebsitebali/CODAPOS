package handler

import (
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"github.com/codapos/backend/internal/domain"
	"github.com/codapos/backend/internal/middleware"
	"github.com/codapos/backend/pkg/response"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// AIHandler provides AI-powered endpoints for stock alerts and price suggestions
type AIHandler struct {
	db *gorm.DB
}

func NewAIHandler(db *gorm.DB) *AIHandler {
	return &AIHandler{db: db}
}

// GetStockAlerts analyzes sales velocity and predicts when stock will run out
func (h *AIHandler) GetStockAlerts(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)

	// 1. Get all products with stock tracking
	var products []domain.Product
	h.db.Where("tenant_id = ? AND track_stock = ? AND is_active = ?", tenantID, true, true).Find(&products)

	if len(products) == 0 {
		return response.Success(c, []domain.StockAlert{}, "")
	}

	// 2. Get all inventory records for this tenant's outlets
	var outlets []domain.Outlet
	h.db.Where("tenant_id = ?", tenantID).Find(&outlets)
	if len(outlets) == 0 {
		return response.Success(c, []domain.StockAlert{}, "")
	}
	// Use first outlet for simplicity
	outletID := outlets[0].ID

	var inventory []domain.Inventory
	h.db.Where("outlet_id = ?", outletID).Find(&inventory)

	// Build inventory map
	stockMap := make(map[string]float64)
	for _, inv := range inventory {
		stockMap[inv.ProductID.String()] = inv.Quantity
	}

	// 3. Calculate sales velocity from transactions (last 30 days)
	now := time.Now()
	thirtyDaysAgo := now.AddDate(0, 0, -30)
	sevenDaysAgo := now.AddDate(0, 0, -7)
	fourteenDaysAgo := now.AddDate(0, 0, -14)

	// Get sales per product in last 30 days
	type SalesData struct {
		ProductID string  `json:"product_id"`
		TotalQty  float64 `json:"total_qty"`
	}

	var salesLast30 []SalesData
	h.db.Raw(`
		SELECT ti.product_id, COALESCE(SUM(ti.quantity), 0) as total_qty
		FROM transaction_items ti
		JOIN transactions t ON t.id = ti.transaction_id
		WHERE t.tenant_id = ? AND t.created_at >= ? AND t.status = 'completed'
		GROUP BY ti.product_id
	`, tenantID, thirtyDaysAgo).Scan(&salesLast30)

	salesMap30 := make(map[string]float64)
	for _, s := range salesLast30 {
		salesMap30[s.ProductID] = s.TotalQty
	}

	// Get sales last 7 days (this week)
	var salesThisWeek []SalesData
	h.db.Raw(`
		SELECT ti.product_id, COALESCE(SUM(ti.quantity), 0) as total_qty
		FROM transaction_items ti
		JOIN transactions t ON t.id = ti.transaction_id
		WHERE t.tenant_id = ? AND t.created_at >= ? AND t.status = 'completed'
		GROUP BY ti.product_id
	`, tenantID, sevenDaysAgo).Scan(&salesThisWeek)

	salesMapThisWeek := make(map[string]float64)
	for _, s := range salesThisWeek {
		salesMapThisWeek[s.ProductID] = s.TotalQty
	}

	// Get sales previous week (7-14 days ago)
	var salesLastWeek []SalesData
	h.db.Raw(`
		SELECT ti.product_id, COALESCE(SUM(ti.quantity), 0) as total_qty
		FROM transaction_items ti
		JOIN transactions t ON t.id = ti.transaction_id
		WHERE t.tenant_id = ? AND t.created_at >= ? AND t.created_at < ? AND t.status = 'completed'
		GROUP BY ti.product_id
	`, tenantID, fourteenDaysAgo, sevenDaysAgo).Scan(&salesLastWeek)

	salesMapLastWeek := make(map[string]float64)
	for _, s := range salesLastWeek {
		salesMapLastWeek[s.ProductID] = s.TotalQty
	}

	// 4. Build alerts
	var alerts []domain.StockAlert
	for _, product := range products {
		pid := product.ID.String()
		currentStock := stockMap[pid]
		sales30 := salesMap30[pid]
		dailyAvg := sales30 / 30.0

		// W2W trend
		thisWeekSales := salesMapThisWeek[pid]
		lastWeekSales := salesMapLastWeek[pid]
		weeklyTrend := 0.0
		if lastWeekSales > 0 {
			weeklyTrend = ((thisWeekSales - lastWeekSales) / lastWeekSales) * 100
		}

		// Predict days left
		predictedDaysLeft := 999.0
		if dailyAvg > 0 {
			predictedDaysLeft = currentStock / dailyAvg
		}

		// Determine severity
		severity := "ok"
		message := ""
		if predictedDaysLeft <= 3 {
			severity = "critical"
			message = "⚠️ KRITIS: Stok " + product.Name + " tersisa " + formatStock(currentStock, product.Unit) + ", perkiraan habis dalam " + formatDays(predictedDaysLeft) + "!"
		} else if predictedDaysLeft <= 7 {
			severity = "warning"
			message = "⚠️ Stok " + product.Name + " tersisa " + formatStock(currentStock, product.Unit) + ", perkiraan habis dalam " + formatDays(predictedDaysLeft) + "."
		}

		if severity != "ok" {
			suggestedRestock := math.Ceil(dailyAvg * 30) // 1 month supply
			message += " Rekomendasi: tambah " + formatStock(suggestedRestock, product.Unit) + "."

			alerts = append(alerts, domain.StockAlert{
				ProductID:         pid,
				ProductName:       product.Name,
				ProductSKU:        product.SKU,
				ProductUnit:       product.Unit,
				CurrentStock:      currentStock,
				DailyAvgSales:     math.Round(dailyAvg*100) / 100,
				WeeklyTrend:       math.Round(weeklyTrend*100) / 100,
				PredictedDaysLeft: math.Round(predictedDaysLeft*100) / 100,
				SuggestedRestock:  suggestedRestock,
				Severity:          severity,
				Message:           message,
			})
		}
	}

	// Sort: critical first, then warning
	sort.Slice(alerts, func(i, j int) bool {
		if alerts[i].Severity == alerts[j].Severity {
			return alerts[i].PredictedDaysLeft < alerts[j].PredictedDaysLeft
		}
		return alerts[i].Severity == "critical"
	})

	return response.Success(c, alerts, "")
}

// SuggestPrice recommends a price based on product name matching against reference data
func (h *AIHandler) SuggestPrice(c *fiber.Ctx) error {
	var req struct {
		ProductName string `json:"product_name"`
		Category    string `json:"category"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if req.ProductName == "" {
		return response.BadRequest(c, "product_name is required")
	}

	name := strings.ToLower(req.ProductName)

	// Search price references with fuzzy matching
	var refs []domain.PriceReference
	h.db.Where("LOWER(name) LIKE ?", "%"+name+"%").Limit(5).Find(&refs)

	// If no exact match, try word-by-word
	if len(refs) == 0 {
		words := strings.Fields(name)
		for _, word := range words {
			if len(word) < 3 {
				continue
			}
			h.db.Where("LOWER(name) LIKE ?", "%"+word+"%").Limit(5).Find(&refs)
			if len(refs) > 0 {
				break
			}
		}
	}

	if len(refs) == 0 {
		return response.Success(c, nil, "no price suggestion available")
	}

	// Find best match
	bestRef := refs[0]
	bestScore := 0.0
	for _, ref := range refs {
		score := similarityScore(name, strings.ToLower(ref.Name))
		if score > bestScore {
			bestScore = score
			bestRef = ref
		}
	}

	suggestion := domain.PriceSuggestion{
		SuggestedPrice: bestRef.AvgPrice,
		PriceRange: domain.PriceRange{
			Low:  bestRef.MinPrice,
			High: bestRef.MaxPrice,
		},
		Source:      bestRef.Source,
		Confidence:  math.Min(bestScore, 1.0),
		MatchedName: bestRef.Name,
	}

	return response.Success(c, suggestion, "")
}

// simple similarity score based on common words
func similarityScore(a, b string) float64 {
	wordsA := strings.Fields(a)
	wordsB := strings.Fields(b)
	if len(wordsA) == 0 || len(wordsB) == 0 {
		return 0
	}

	matches := 0
	for _, wa := range wordsA {
		for _, wb := range wordsB {
			if strings.Contains(wb, wa) || strings.Contains(wa, wb) {
				matches++
				break
			}
		}
	}

	return float64(matches) / float64(maxInt(len(wordsA), len(wordsB)))
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func formatStock(qty float64, unit string) string {
	if qty == float64(int64(qty)) {
		return fmt.Sprintf("%d %s", int64(qty), unit)
	}
	return fmt.Sprintf("%.1f %s", qty, unit)
}

func formatDays(days float64) string {
	if days < 1 {
		return "kurang dari 1 hari"
	}
	d := int(math.Round(days))
	return fmt.Sprintf("%d hari", d)
}
