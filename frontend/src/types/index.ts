// =============================================
// CODAPOS - TypeScript Type Definitions
// =============================================

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    subscription_plan: string;
    subscription_status: string;
    subscription_expires_at?: string;
    settings: Record<string, unknown>;
    // Phase 1 fields
    merchant_type_id?: string;
    subdomain: string;
    open_time: string;
    close_time: string;
    revenue_share_pct: number;
    is_enabled: boolean;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_holder?: string;
    merchant_type?: MerchantType;
    created_at: string;
}

export interface User {
    id: string;
    tenant_id: string;
    email: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
    role: UserRole;
    outlet_id?: string;
    is_active: boolean;
    last_login_at?: string;
    tenant?: Tenant;
}

export type UserRole = 'super_admin' | 'owner' | 'admin' | 'finance' | 'outlet_manager' | 'cashier' | 'customer';

export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    tenant_name: string;
    tenant_slug: string;
    full_name: string;
    email: string;
    password: string;
    phone?: string;
    merchant_type_slug?: string;
}

// =============================================
// OUTLET & FRANCHISE
// =============================================

export interface Brand {
    id: string;
    tenant_id: string;
    name: string;
    logo_url?: string;
    description?: string;
}

export interface Region {
    id: string;
    tenant_id: string;
    name: string;
    parent_id?: string;
}

export interface Outlet {
    id: string;
    tenant_id: string;
    brand_id?: string;
    region_id?: string;
    name: string;
    code: string;
    address?: string;
    city?: string;
    province?: string;
    phone?: string;
    status: 'active' | 'inactive' | 'suspended';
    type: 'owned' | 'franchise';
    brand?: Brand;
    region?: Region;
    created_at: string;
}

// =============================================
// PRODUCTS
// =============================================

export interface Category {
    id: string;
    tenant_id: string;
    parent_id?: string;
    name: string;
    slug?: string;
    icon?: string;
    sort_order: number;
}

export interface Product {
    id: string;
    tenant_id: string;
    category_id?: string;
    sku?: string;
    barcode?: string;
    name: string;
    description?: string;
    image_url?: string;
    base_price: number;
    cost_price: number;
    tax_rate: number;
    is_active: boolean;
    track_stock: boolean;
    is_locked: boolean;
    sort_order: number;
    unit: string;
    stock_quantity?: number;
    category?: Category;
    variants?: ProductVariant[];
    modifier_groups?: ModifierGroup[];
}

export interface ProductVariant {
    id: string;
    product_id: string;
    name: string;
    sku?: string;
    additional_price: number;
    cost_price: number;
    is_active: boolean;
}

export interface ModifierGroup {
    id: string;
    tenant_id: string;
    name: string;
    is_required: boolean;
    min_select: number;
    max_select: number;
    modifiers?: Modifier[];
}

export interface Modifier {
    id: string;
    group_id: string;
    name: string;
    price: number;
    is_active: boolean;
}

// =============================================
// TRANSACTIONS
// =============================================

export interface Transaction {
    id: string;
    tenant_id: string;
    outlet_id: string;
    cashier_id: string;
    customer_id?: string;
    transaction_number: string;
    type: 'sale' | 'refund' | 'void';
    status: 'pending' | 'completed' | 'voided' | 'refunded';
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    notes?: string;
    refund_reason?: string;
    items?: TransactionItem[];
    payments?: TransactionPayment[];
    outlet?: Outlet;
    cashier?: User;
    customer?: Customer;
    reprint_count?: number;
    last_reprint_at?: string;
    created_at: string;
}

export interface TransactionItem {
    id: string;
    transaction_id: string;
    product_id: string;
    variant_id?: string;
    product_name: string;
    variant_name?: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    tax_amount: number;
    subtotal: number;
    modifiers?: { name: string; price: number }[];
    notes?: string;
}

export interface TransactionPayment {
    id: string;
    transaction_id: string;
    payment_method: string;
    amount: number;
    reference_number?: string;
    status: string;
}

export interface CheckoutRequest {
    outlet_id: string;
    customer_id?: string;
    items: CheckoutItem[];
    payments: PaymentInput[];
    promotion_id?: string;
    notes?: string;
}

export interface CheckoutItem {
    product_id: string;
    variant_id?: string;
    quantity: number;
    modifiers?: { name: string; price: number }[];
    notes?: string;
}

export interface PaymentInput {
    payment_method: string;
    amount: number;
    reference_number?: string;
}

// =============================================
// ACCOUNTING
// =============================================

export interface ChartOfAccount {
    id: string;
    tenant_id: string;
    parent_id?: string;
    code: string;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    sub_type?: string;
    is_system: boolean;
    is_active: boolean;
    balance: number;
}

export interface JournalEntry {
    id: string;
    tenant_id: string;
    outlet_id?: string;
    entry_number: string;
    date: string;
    description?: string;
    source?: string;
    status: string;
    total_debit: number;
    total_credit: number;
    lines?: JournalEntryLine[];
    created_at: string;
}

export interface JournalEntryLine {
    id: string;
    journal_entry_id: string;
    account_id: string;
    description?: string;
    debit: number;
    credit: number;
    account?: ChartOfAccount;
}

// =============================================
// API RESPONSE
// =============================================

export interface APIResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    meta?: PaginationMeta;
}

export interface PaginationMeta {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
}

// =============================================
// CART (Frontend-only)
// =============================================

export interface CartItem {
    product: Product;
    variant?: ProductVariant;
    quantity: number;
    modifiers: { name: string; price: number }[];
    notes?: string;
    unitPrice: number;
}

// =============================================
// PHASE 1: CORE ARCHITECTURE
// =============================================

export interface MerchantType {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    is_active: boolean;
}

export interface Customer {
    id: string;
    tenant_id: string;
    name: string;
    phone: string;
    email?: string;
    notes?: string;
    is_active: boolean;
    addresses?: CustomerAddress[];
    tenant?: Tenant;
    created_at: string;
}

export interface CustomerAddress {
    id: string;
    customer_id: string;
    label: string;
    full_address: string;
    city?: string;
    province?: string;
    postal_code?: string;
    latitude: number;
    longitude: number;
    is_default: boolean;
}

export interface FeatureFlag {
    id: string;
    tenant_id: string;
    feature_key: string;
    is_enabled: boolean;
}

export interface RolePermission {
    id: string;
    role: string;
    action: string;
    is_allowed: boolean;
}

export interface RolePermissionsResponse {
    data: RolePermission[];
    roles: string[];
    actions: string[];
    role_labels: Record<string, string>;
    action_labels: Record<string, string>;
}

export interface InventoryItem {
    id: string;
    outlet_id: string;
    product_id: string;
    variant_id?: string;
    quantity: number;
    min_stock: number;
    product?: Product;
    variant?: { id: string; name: string; sku?: string };
}

export interface InventoryMovement {
    id: string;
    outlet_id: string;
    product_id: string;
    variant_id?: string;
    type: string;
    quantity: number;
    reference_type?: string;
    reference_id?: string;
    notes?: string;
    created_by?: string;
    created_at: string;
}

export interface GlobalConfig {
    id: string;
    key: string;
    value: string;
    description?: string;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    slug: string;
    price_monthly: number;
    price_yearly?: number;
    max_outlets: number;
    max_users: number;
    max_products: number;
    features: Record<string, unknown>;
    is_active: boolean;
}

export interface Subscription {
    id: string;
    tenant_id: string;
    plan_id: string;
    status: string;
    started_at: string;
    expires_at: string;
    cancelled_at?: string;
    plan?: SubscriptionPlan;
}

export interface CreateCustomerRequest {
    name: string;
    phone: string;
    email?: string;
    notes?: string;
    full_address?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
}

export interface CustomerSignUpRequest {
    tenant_slug: string;
    name: string;
    phone: string;
    email?: string;
    full_address?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
}

export interface AddAddressRequest {
    label: string;
    full_address: string;
    city?: string;
    province?: string;
    postal_code?: string;
    latitude: number;
    longitude: number;
    is_default?: boolean;
}

export interface UpdateCustomerRequest {
    name?: string;
    phone?: string;
    email?: string;
    notes?: string;
}

// =============================================
// AI FEATURES
// =============================================

export interface StockAlert {
    product_id: string;
    product_name: string;
    product_sku: string;
    product_unit: string;
    current_stock: number;
    daily_avg_sales: number;
    weekly_trend: number;
    predicted_days_left: number;
    suggested_restock: number;
    severity: 'warning' | 'critical' | 'ok';
    message: string;
}

export interface PriceSuggestion {
    suggested_price: number;
    price_range: { low: number; high: number };
    source: string;
    confidence: number;
    matched_name: string;
}

export interface BusinessUnit {
    id: string;
    merchant_type_id: string;
    name: string;
    label: string;
    sort_order: number;
    merchant_type?: MerchantType;
}

