package domain

import (
	"time"

	"github.com/google/uuid"
)

// ChartOfAccount represents an account in the chart of accounts
type ChartOfAccount struct {
	BaseModel
	TenantID uuid.UUID  `json:"tenant_id" gorm:"type:uuid;not null;index"`
	ParentID *uuid.UUID `json:"parent_id,omitempty" gorm:"type:uuid"`
	Code     string     `json:"code" gorm:"size:20;not null;uniqueIndex:idx_coa_tenant_code"`
	Name     string     `json:"name" gorm:"size:255;not null"`
	Type     string     `json:"type" gorm:"size:50;not null"`
	SubType  string     `json:"sub_type,omitempty" gorm:"size:50"`
	IsSystem bool       `json:"is_system" gorm:"default:false"`
	IsActive bool       `json:"is_active" gorm:"default:true"`
	Balance  float64    `json:"balance" gorm:"type:decimal(15,2);default:0"`

	// Relations
	Parent   *ChartOfAccount  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children []ChartOfAccount `json:"children,omitempty" gorm:"foreignKey:ParentID"`
}

func (ChartOfAccount) TableName() string { return "chart_of_accounts" }

// COA Type constants
const (
	AccountTypeAsset     = "asset"
	AccountTypeLiability = "liability"
	AccountTypeEquity    = "equity"
	AccountTypeRevenue   = "revenue"
	AccountTypeExpense   = "expense"
)

// COA SubType constants
const (
	AccountSubTypeCash       = "cash"
	AccountSubTypeBank       = "bank"
	AccountSubTypeReceivable = "receivable"
	AccountSubTypePayable    = "payable"
	AccountSubTypeInventory  = "inventory"
	AccountSubTypeCOGS       = "cogs"
	AccountSubTypeSales      = "sales"
	AccountSubTypeTax        = "tax"
)

// JournalEntry represents a journal entry header
type JournalEntry struct {
	BaseModel
	TenantID      uuid.UUID  `json:"tenant_id" gorm:"type:uuid;not null;index"`
	OutletID      *uuid.UUID `json:"outlet_id,omitempty" gorm:"type:uuid"`
	EntryNumber   string     `json:"entry_number" gorm:"size:50;not null"`
	Date          time.Time  `json:"date" gorm:"type:date;not null"`
	Description   string     `json:"description,omitempty"`
	Source        string     `json:"source,omitempty" gorm:"size:50"`
	ReferenceType string     `json:"reference_type,omitempty" gorm:"size:50"`
	ReferenceID   *uuid.UUID `json:"reference_id,omitempty" gorm:"type:uuid"`
	Status        string     `json:"status" gorm:"size:20;default:'posted'"`
	TotalDebit    float64    `json:"total_debit" gorm:"type:decimal(15,2);not null;default:0"`
	TotalCredit   float64    `json:"total_credit" gorm:"type:decimal(15,2);not null;default:0"`
	CreatedBy     *uuid.UUID `json:"created_by,omitempty" gorm:"type:uuid"`
	ApprovedBy    *uuid.UUID `json:"approved_by,omitempty" gorm:"type:uuid"`

	// Relations
	Lines []JournalEntryLine `json:"lines,omitempty" gorm:"foreignKey:JournalEntryID"`
}

func (JournalEntry) TableName() string { return "journal_entries" }

// Journal source constants
const (
	JournalSourcePOSSale   = "pos_sale"
	JournalSourcePOSRefund = "pos_refund"
	JournalSourceInventory = "inventory"
	JournalSourceManual    = "manual"
	JournalSourceRoyalty   = "royalty"
)

// JournalEntryLine represents a debit/credit line in a journal
type JournalEntryLine struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	JournalEntryID uuid.UUID `json:"journal_entry_id" gorm:"type:uuid;not null;index"`
	AccountID      uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	Description    string    `json:"description,omitempty"`
	Debit          float64   `json:"debit" gorm:"type:decimal(15,2);default:0"`
	Credit         float64   `json:"credit" gorm:"type:decimal(15,2);default:0"`
	CreatedAt      time.Time `json:"created_at"`

	// Relations
	Account *ChartOfAccount `json:"account,omitempty" gorm:"foreignKey:AccountID"`
}

func (JournalEntryLine) TableName() string { return "journal_entry_lines" }

// FiscalPeriod represents an accounting period
type FiscalPeriod struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TenantID  uuid.UUID `json:"tenant_id" gorm:"type:uuid;not null;index"`
	Name      string    `json:"name" gorm:"size:100;not null"`
	StartDate time.Time `json:"start_date" gorm:"type:date;not null"`
	EndDate   time.Time `json:"end_date" gorm:"type:date;not null"`
	Status    string    `json:"status" gorm:"size:20;default:'open'"`
	CreatedAt time.Time `json:"created_at"`
}

func (FiscalPeriod) TableName() string { return "fiscal_periods" }

// TaxRate represents a tax configuration
type TaxRate struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TenantID  uuid.UUID `json:"tenant_id" gorm:"type:uuid;not null;index"`
	Name      string    `json:"name" gorm:"size:100;not null"`
	Rate      float64   `json:"rate" gorm:"type:decimal(5,2);not null"`
	Type      string    `json:"type" gorm:"size:20;default:'ppn'"`
	IsDefault bool      `json:"is_default" gorm:"default:false"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
}

func (TaxRate) TableName() string { return "tax_rates" }

// AccountingRepository defines the interface for accounting data access
type AccountingRepository interface {
	// Chart of Accounts
	CreateAccount(account *ChartOfAccount) error
	FindAccountByID(id uuid.UUID) (*ChartOfAccount, error)
	FindAccountsByTenantID(tenantID uuid.UUID) ([]ChartOfAccount, error)
	UpdateAccount(account *ChartOfAccount) error
	UpdateAccountBalance(accountID uuid.UUID, amount float64) error

	// Journal Entries
	CreateJournal(entry *JournalEntry) error
	FindJournalByID(id uuid.UUID) (*JournalEntry, error)
	FindJournalsByTenantID(tenantID uuid.UUID, startDate, endDate *time.Time, limit, offset int) ([]JournalEntry, int64, error)

	// Reports
	GetTrialBalance(tenantID uuid.UUID, asOfDate time.Time) ([]ChartOfAccount, error)
	GetProfitLoss(tenantID uuid.UUID, startDate, endDate time.Time) ([]ChartOfAccount, error)
	GetBalanceSheet(tenantID uuid.UUID, asOfDate time.Time) ([]ChartOfAccount, error)
}
