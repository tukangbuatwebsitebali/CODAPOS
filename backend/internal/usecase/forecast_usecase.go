package usecase

import (
	"fmt"
	"math"
	"sort"
	"time"

	"github.com/codapos/backend/internal/domain"
	"github.com/google/uuid"
)

type ForecastUsecase struct {
	transactionRepo domain.TransactionRepository
}

func NewForecastUsecase(tr domain.TransactionRepository) *ForecastUsecase {
	return &ForecastUsecase{transactionRepo: tr}
}

// GenerateForecast creates a revenue and demand forecast based on historical transactions
func (u *ForecastUsecase) GenerateForecast(tenantID uuid.UUID, req domain.ForecastRequest) (*domain.ForecastResult, error) {
	forecastDays := req.Days
	if forecastDays <= 0 {
		forecastDays = 7
	}

	// Fetch recent transactions (last 90 days for analysis)
	txns, _, err := u.transactionRepo.FindByTenantID(tenantID, nil, 5000, 0)
	if err != nil {
		return nil, err
	}

	// Aggregate historical daily data
	historical := u.aggregateDailySales(txns, 30) // last 30 days

	// Generate daily forecasts using weighted moving average + trend
	dailyForecasts := u.forecastDaily(historical, forecastDays)

	// Calculate total predicted revenue
	var totalPredicted float64
	for _, df := range dailyForecasts {
		totalPredicted += df.PredictedRevenue
	}

	// Calculate trend
	trendDir, trendPct := u.calculateTrend(historical)

	// Confidence based on data volume
	confidence := u.calculateConfidence(len(txns), len(historical))

	// Product forecasts
	topProducts := u.forecastProducts(txns, forecastDays)

	// Generate insights
	insights := u.generateInsights(historical, trendDir, trendPct, topProducts)

	return &domain.ForecastResult{
		Period:          req.Period,
		GeneratedAt:     time.Now().Format(time.RFC3339),
		TotalPredicted:  math.Round(totalPredicted*100) / 100,
		TrendDirection:  trendDir,
		TrendPercentage: math.Round(trendPct*100) / 100,
		ConfidenceScore: confidence,
		DailyForecasts:  dailyForecasts,
		TopProducts:     topProducts,
		Insights:        insights,
		HistoricalData:  historical,
	}, nil
}

// aggregateDailySales groups transactions by date
func (u *ForecastUsecase) aggregateDailySales(txns []domain.Transaction, days int) []domain.DailySummary {
	cutoff := time.Now().AddDate(0, 0, -days)
	dailyMap := make(map[string]*domain.DailySummary)

	for _, tx := range txns {
		if tx.CreatedAt.Before(cutoff) || tx.Status != domain.TransactionStatusCompleted {
			continue
		}
		dateKey := tx.CreatedAt.Format("2006-01-02")
		if _, ok := dailyMap[dateKey]; !ok {
			dailyMap[dateKey] = &domain.DailySummary{Date: dateKey}
		}
		dailyMap[dateKey].Revenue += tx.TotalAmount
		dailyMap[dateKey].OrderCount++
	}

	// Fill gaps and sort
	var result []domain.DailySummary
	for d := 0; d < days; d++ {
		dateKey := time.Now().AddDate(0, 0, -days+d+1).Format("2006-01-02")
		if summary, ok := dailyMap[dateKey]; ok {
			if summary.OrderCount > 0 {
				summary.AvgOrder = math.Round(summary.Revenue/float64(summary.OrderCount)*100) / 100
			}
			result = append(result, *summary)
		} else {
			result = append(result, domain.DailySummary{Date: dateKey, Revenue: 0, OrderCount: 0, AvgOrder: 0})
		}
	}
	return result
}

// forecastDaily uses exponential moving average with trend
func (u *ForecastUsecase) forecastDaily(historical []domain.DailySummary, forecastDays int) []domain.DailyForecast {
	if len(historical) == 0 {
		forecasts := make([]domain.DailyForecast, forecastDays)
		for i := 0; i < forecastDays; i++ {
			date := time.Now().AddDate(0, 0, i+1).Format("2006-01-02")
			forecasts[i] = domain.DailyForecast{Date: date}
		}
		return forecasts
	}

	// Calculate EMA (Exponential Moving Average)
	alpha := 0.3 // smoothing factor
	revenues := make([]float64, len(historical))
	orders := make([]int, len(historical))
	for i, h := range historical {
		revenues[i] = h.Revenue
		orders[i] = h.OrderCount
	}

	ema := revenues[0]
	for i := 1; i < len(revenues); i++ {
		ema = alpha*revenues[i] + (1-alpha)*ema
	}

	// Calculate trend from last 7 days vs previous 7
	var recentAvg, prevAvg float64
	recentCount, prevCount := 0, 0
	for i := len(revenues) - 1; i >= 0 && recentCount < 7; i-- {
		recentAvg += revenues[i]
		recentCount++
	}
	for i := len(revenues) - 8; i >= 0 && prevCount < 7; i-- {
		prevAvg += revenues[i]
		prevCount++
	}
	if recentCount > 0 {
		recentAvg /= float64(recentCount)
	}
	if prevCount > 0 {
		prevAvg /= float64(prevCount)
	}
	dailyTrend := 0.0
	if prevAvg > 0 {
		dailyTrend = (recentAvg - prevAvg) / float64(7)
	}

	// Avg orders
	totalOrders := 0
	for _, o := range orders {
		totalOrders += o
	}
	avgOrders := totalOrders / max(len(orders), 1)

	// Generate forecasts
	forecasts := make([]domain.DailyForecast, forecastDays)
	for i := 0; i < forecastDays; i++ {
		predicted := ema + dailyTrend*float64(i+1)
		if predicted < 0 {
			predicted = ema * 0.5
		}
		predicted = math.Round(predicted*100) / 100

		// Day-of-week seasonality factor
		forecastDate := time.Now().AddDate(0, 0, i+1)
		dayFactor := u.dayOfWeekFactor(forecastDate.Weekday())
		predicted *= dayFactor

		// Confidence interval (wider for further out)
		spread := ema * 0.15 * float64(i+1) / float64(forecastDays)

		forecasts[i] = domain.DailyForecast{
			Date:             forecastDate.Format("2006-01-02"),
			PredictedRevenue: math.Round(predicted*100) / 100,
			PredictedOrders:  int(math.Round(float64(avgOrders) * dayFactor)),
			LowerBound:       math.Round((predicted-spread)*100) / 100,
			UpperBound:       math.Round((predicted+spread)*100) / 100,
		}
	}
	return forecasts
}

// dayOfWeekFactor returns seasonality multiplier
func (u *ForecastUsecase) dayOfWeekFactor(day time.Weekday) float64 {
	factors := map[time.Weekday]float64{
		time.Monday:    0.85,
		time.Tuesday:   0.90,
		time.Wednesday: 0.95,
		time.Thursday:  1.00,
		time.Friday:    1.15,
		time.Saturday:  1.30,
		time.Sunday:    1.20,
	}
	if f, ok := factors[day]; ok {
		return f
	}
	return 1.0
}

// calculateTrend determines overall trend direction and percentage
func (u *ForecastUsecase) calculateTrend(historical []domain.DailySummary) (string, float64) {
	if len(historical) < 7 {
		return "stable", 0
	}

	halfPoint := len(historical) / 2
	var firstHalf, secondHalf float64
	for i := 0; i < halfPoint; i++ {
		firstHalf += historical[i].Revenue
	}
	for i := halfPoint; i < len(historical); i++ {
		secondHalf += historical[i].Revenue
	}

	firstHalf /= float64(halfPoint)
	secondHalf /= float64(len(historical) - halfPoint)

	if firstHalf == 0 {
		return "stable", 0
	}

	pctChange := ((secondHalf - firstHalf) / firstHalf) * 100

	direction := "stable"
	if pctChange > 5 {
		direction = "up"
	} else if pctChange < -5 {
		direction = "down"
	}
	return direction, pctChange
}

// calculateConfidence returns 0-1 confidence based on data quality
func (u *ForecastUsecase) calculateConfidence(txnCount, dayCount int) float64 {
	// More data = higher confidence
	dataCoverage := math.Min(float64(dayCount)/30.0, 1.0)
	volumeScore := math.Min(float64(txnCount)/100.0, 1.0)
	return math.Round((dataCoverage*0.6+volumeScore*0.4)*100) / 100
}

// forecastProducts predicts top product demand
func (u *ForecastUsecase) forecastProducts(txns []domain.Transaction, forecastDays int) []domain.ProductForecast {
	type productAgg struct {
		name      string
		recentQty float64
		olderQty  float64
		totalQty  float64
	}

	cutoffRecent := time.Now().AddDate(0, 0, -7)
	cutoffOlder := time.Now().AddDate(0, 0, -14)
	products := make(map[string]*productAgg)

	for _, tx := range txns {
		if tx.Status != domain.TransactionStatusCompleted {
			continue
		}
		for _, item := range tx.Items {
			pid := item.ProductID.String()
			if _, ok := products[pid]; !ok {
				products[pid] = &productAgg{name: item.ProductName}
			}
			products[pid].totalQty += item.Quantity
			if tx.CreatedAt.After(cutoffRecent) {
				products[pid].recentQty += item.Quantity
			} else if tx.CreatedAt.After(cutoffOlder) {
				products[pid].olderQty += item.Quantity
			}
		}
	}

	// Sort by recent qty descending
	type productEntry struct {
		id  string
		agg *productAgg
	}
	var entries []productEntry
	for id, agg := range products {
		entries = append(entries, productEntry{id, agg})
	}
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].agg.recentQty > entries[j].agg.recentQty
	})

	// Top 5
	limit := 5
	if len(entries) < limit {
		limit = len(entries)
	}

	result := make([]domain.ProductForecast, limit)
	for i := 0; i < limit; i++ {
		e := entries[i]
		trendDir := "stable"
		trendPct := 0.0
		if e.agg.olderQty > 0 {
			trendPct = ((e.agg.recentQty - e.agg.olderQty) / e.agg.olderQty) * 100
			if trendPct > 10 {
				trendDir = "up"
			} else if trendPct < -10 {
				trendDir = "down"
			}
		}

		predictedQty := e.agg.recentQty * float64(forecastDays) / 7
		recommendedStock := int(math.Ceil(predictedQty * 1.2))

		result[i] = domain.ProductForecast{
			ProductID:        e.id,
			ProductName:      e.agg.name,
			PredictedQty:     math.Round(predictedQty*10) / 10,
			TrendDirection:   trendDir,
			TrendPercentage:  math.Round(trendPct*10) / 10,
			RecommendedStock: recommendedStock,
		}
	}
	return result
}

// generateInsights creates AI-style insights
func (u *ForecastUsecase) generateInsights(historical []domain.DailySummary, trendDir string, trendPct float64, products []domain.ProductForecast) []domain.ForecastInsight {
	var insights []domain.ForecastInsight

	// Trend insight
	switch trendDir {
	case "up":
		insights = append(insights, domain.ForecastInsight{
			Type:    "success",
			Title:   "Tren Positif",
			Message: fmt.Sprintf("Pendapatan menunjukkan tren naik %.1f%% dibanding periode sebelumnya. Pertahankan momentum!", trendPct),
			Icon:    "trending_up",
		})
	case "down":
		insights = append(insights, domain.ForecastInsight{
			Type:    "warning",
			Title:   "Tren Menurun",
			Message: fmt.Sprintf("Pendapatan turun %.1f%% dibanding periode sebelumnya. Pertimbangkan promosi atau campaign.", math.Abs(trendPct)),
			Icon:    "trending_down",
		})
	default:
		insights = append(insights, domain.ForecastInsight{
			Type:    "info",
			Title:   "Pendapatan Stabil",
			Message: "Pendapatan Anda konsisten. Pertimbangkan strategi untuk pertumbuhan.",
			Icon:    "trending_flat",
		})
	}

	// Weekend insight
	insights = append(insights, domain.ForecastInsight{
		Type:    "info",
		Title:   "Pola Mingguan",
		Message: "Hari Jumat dan Sabtu biasanya memiliki penjualan tertinggi. Pastikan stok dan tenaga kerja cukup.",
		Icon:    "calendar",
	})

	// Product insight
	for _, p := range products {
		if p.TrendDirection == "up" && p.TrendPercentage > 20 {
			insights = append(insights, domain.ForecastInsight{
				Type:    "success",
				Title:   fmt.Sprintf("%s Laris", p.ProductName),
				Message: fmt.Sprintf("Produk ini naik %.0f%%. Pertimbangkan tambah stok %d unit untuk periode mendatang.", p.TrendPercentage, p.RecommendedStock),
				Icon:    "star",
			})
			break
		}
	}

	// Low data warning
	if len(historical) < 14 {
		insights = append(insights, domain.ForecastInsight{
			Type:    "warning",
			Title:   "Data Terbatas",
			Message: "Prediksi akan lebih akurat dengan lebih banyak data transaksi. Terus gunakan POS untuk meningkatkan akurasi.",
			Icon:    "info",
		})
	}

	return insights
}
