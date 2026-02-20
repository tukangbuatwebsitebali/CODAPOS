package domain

type AppRevenueStats struct {
	TotalRevenue      float64 `json:"total_revenue"`
	TotalMDR          float64 `json:"total_mdr"`
	TotalPenalty      float64 `json:"total_penalty"`
	RevenueThisMonth  float64 `json:"revenue_this_month"`
	ActiveMerchants   int64   `json:"active_merchants"`
	TotalTransactions int64   `json:"total_transactions"`
	TopPaymentMethod  string  `json:"top_payment_method"`
}

type AppRevenueMerchant struct {
	TenantID                string  `json:"tenant_id"`
	TenantName              string  `json:"tenant_name"`
	TotalTransactions       int64   `json:"total_transactions"`
	TotalRevenueContributed float64 `json:"total_revenue_contributed"`
	TotalMDR                float64 `json:"total_mdr"`
	TotalPenalty            float64 `json:"total_penalty"`
	LastTransactionDate     string  `json:"last_transaction_date"`
}

type SuperAdminRepository interface {
	GetRevenueStats() (*AppRevenueStats, error)
	GetRevenueByMerchant(limit, offset int) ([]AppRevenueMerchant, int64, error)
}
