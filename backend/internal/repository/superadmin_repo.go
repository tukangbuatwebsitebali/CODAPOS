package repository

import (
	"time"

	"github.com/codapos/backend/internal/domain"
	"gorm.io/gorm"
)

type superAdminRepository struct {
	db *gorm.DB
}

func NewSuperAdminRepository(db *gorm.DB) domain.SuperAdminRepository {
	return &superAdminRepository{db: db}
}

func (r *superAdminRepository) GetRevenueStats() (*domain.AppRevenueStats, error) {
	var stats domain.AppRevenueStats

	// Total Revenue (all fee_codapos) & Total MDR
	r.db.Model(&domain.Transaction{}).Select("COALESCE(SUM(fee_codapos), 0) as total_revenue, COALESCE(SUM(total_mdr_merchant), 0) as total_mdr, COUNT(id) as total_transactions").Scan(&stats)

	// Total Penalty
	r.db.Model(&domain.TenantBilling{}).Select("COALESCE(SUM(penalty_fee), 0) as total_penalty").Scan(&stats)

	// Revenue This Month
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	r.db.Model(&domain.Transaction{}).
		Where("created_at >= ?", startOfMonth).
		Select("COALESCE(SUM(fee_codapos), 0)").Scan(&stats.RevenueThisMonth)

	// Active Merchants
	r.db.Model(&domain.Tenant{}).Where("is_enabled = ?", true).Count(&stats.ActiveMerchants)

	// Top Payment Method
	var topMethod struct {
		PaymentMethod string
		Count         int
	}
	r.db.Model(&domain.Transaction{}).
		Select("payment_method, count(id) as count").
		Where("payment_method != '' AND payment_method IS NOT NULL").
		Group("payment_method").
		Order("count desc").
		Limit(1).
		Scan(&topMethod)
	stats.TopPaymentMethod = topMethod.PaymentMethod

	return &stats, nil
}

func (r *superAdminRepository) GetRevenueByMerchant(limit, offset int) ([]domain.AppRevenueMerchant, int64, error) {
	var results []domain.AppRevenueMerchant
	var total int64

	// Count distinct tenants with transactions
	r.db.Model(&domain.Transaction{}).Select("COUNT(DISTINCT tenant_id)").Scan(&total)

	// Query to get grouped stats per tenant + join tenant name + sum penalty from tenant_billings
	query := `
		SELECT 
			t.id as tenant_id,
			t.name as tenant_name,
			COUNT(trx.id) as total_transactions,
			COALESCE(SUM(trx.fee_codapos), 0) as total_revenue_contributed,
			COALESCE(SUM(trx.total_mdr_merchant), 0) as total_mdr,
			(SELECT COALESCE(SUM(penalty_fee), 0) FROM tenant_billings tb WHERE tb.tenant_id = t.id) as total_penalty,
			MAX(trx.created_at) as last_transaction_date
		FROM tenants t
		JOIN transactions trx ON trx.tenant_id = t.id
		GROUP BY t.id, t.name
		ORDER BY total_revenue_contributed DESC
		LIMIT ? OFFSET ?
	`
	err := r.db.Raw(query, limit, offset).Scan(&results).Error
	if err != nil {
		return nil, 0, err
	}

	return results, total, nil
}
