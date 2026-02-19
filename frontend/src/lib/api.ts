import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 second timeout to prevent stuck loading states
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('codapos_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('codapos_token');
                localStorage.removeItem('codapos_user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

// ======= AUTH =======
export const authAPI = {
    register: (data: import('@/types').RegisterRequest) =>
        api.post('/auth/register', data),
    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),
    checkSlug: (slug: string) =>
        api.get(`/auth/check-slug?slug=${encodeURIComponent(slug)}`),
};

// ======= MERCHANT TYPES (Public) =======
export const merchantTypeAPI = {
    getAll: () => api.get('/merchant-types'),
};

// ======= TENANT =======
export const tenantAPI = {
    getMe: () => api.get('/tenant/me'),
    updateSettings: (data: Record<string, unknown>) => api.put('/tenant/settings', data),
};

// ======= PUBLIC STORE =======
export const storeAPI = {
    getBySlug: (slug: string) => api.get(`/store/${slug}`),
    checkout: (slug: string, data: {
        name: string; phone: string; full_address: string;
        latitude: number; longitude: number; notes: string;
        midtrans_order_id: string; total_amount: number; items_summary: string;
    }) => api.post(`/store/${slug}/checkout`, data),
};

// ======= PAYMENT (Midtrans) =======
export const paymentAPI = {
    getConfig: () => api.get('/payment/config'),
    createSnap: (data: { order_id: string; gross_amount: number; first_name: string; email: string; phone: string }) =>
        api.post('/payment/create', data),
};

// ======= OUTLETS =======
export const outletAPI = {
    getAll: () => api.get('/outlets'),
    getById: (id: string) => api.get(`/outlets/${id}`),
    create: (data: Partial<import('@/types').Outlet>) => api.post('/outlets', data),
    update: (id: string, data: Partial<import('@/types').Outlet>) => api.put(`/outlets/${id}`, data),
    delete: (id: string) => api.delete(`/outlets/${id}`),
};

// ======= PRODUCTS =======
export const productAPI = {
    getAll: (search?: string, categoryId?: string) => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (categoryId) params.set('category_id', categoryId);
        return api.get(`/products?${params.toString()}`);
    },
    getById: (id: string) => api.get(`/products/${id}`),
    create: (data: Partial<import('@/types').Product>) => api.post('/products', data),
    update: (id: string, data: Partial<import('@/types').Product>) => api.put(`/products/${id}`, data),
    delete: (id: string) => api.delete(`/products/${id}`),
    uploadImage: (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        return api.post('/products/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// ======= CATEGORIES =======
export const categoryAPI = {
    getAll: () => api.get('/categories'),
    create: (data: { name: string; slug?: string; icon?: string }) => api.post('/categories', data),
    update: (id: string, data: { name: string; slug?: string; icon?: string }) => api.put(`/categories/${id}`, data),
    delete: (id: string) => api.delete(`/categories/${id}`),
};

// ======= POS =======
export const posAPI = {
    checkout: (data: import('@/types').CheckoutRequest) => api.post('/pos/checkout', data),
    refund: (id: string, reason: string) => api.post(`/pos/refund/${id}`, { reason }),
    getTransactions: (page?: number, outletId?: string) => {
        const params = new URLSearchParams();
        if (page) params.set('page', page.toString());
        if (outletId) params.set('outlet_id', outletId);
        return api.get(`/pos/transactions?${params.toString()}`);
    },
    getTransaction: (id: string) => api.get(`/pos/transactions/${id}`),
};

// ======= ACCOUNTING =======
export const accountingAPI = {
    getCOA: () => api.get('/accounting/coa'),
    getJournals: () => api.get('/accounting/journals'),
    getTrialBalance: () => api.get('/accounting/reports/trial-balance'),
    getProfitLoss: () => api.get('/accounting/reports/profit-loss'),
    getBalanceSheet: () => api.get('/accounting/reports/balance-sheet'),
};

// ======= CUSTOMERS (Phase 1 + Phase 3) =======
export const customerAPI = {
    create: (data: import('@/types').CreateCustomerRequest) => api.post('/customers', data),
    getAll: (limit = 20, offset = 0) => api.get(`/customers?limit=${limit}&offset=${offset}`),
    getById: (id: string) => api.get(`/customers/${id}`),
    update: (id: string, data: import('@/types').UpdateCustomerRequest) => api.put(`/customers/${id}`, data),
    // Public signup (no auth)
    signup: (data: import('@/types').CustomerSignUpRequest) => api.post('/customers/signup', data),
    // Addresses
    getAddresses: (customerId: string) => api.get(`/customers/${customerId}/addresses`),
    addAddress: (customerId: string, data: import('@/types').AddAddressRequest) => api.post(`/customers/${customerId}/addresses`, data),
    updateAddress: (addressId: string, data: import('@/types').AddAddressRequest) => api.put(`/customers/addresses/${addressId}`, data),
    deleteAddress: (addressId: string) => api.delete(`/customers/addresses/${addressId}`),
};

// ======= SUPER ADMIN (Phase 1) =======
export const superAdminAPI = {
    // Merchants
    getMerchants: (limit = 20, offset = 0) => api.get(`/admin/merchants?limit=${limit}&offset=${offset}`),
    getMerchant: (id: string) => api.get(`/admin/merchants/${id}`),
    toggleMerchant: (id: string, enabled: boolean) => api.put(`/admin/merchants/${id}/toggle`, { enabled }),
    updateRevenueShare: (id: string, pct: number) => api.put(`/admin/merchants/${id}/revenue-share`, { pct }),
    updateMerchant: (id: string, data: Record<string, unknown>) => api.put(`/admin/merchants/${id}`, data),
    deleteMerchant: (id: string) => api.delete(`/admin/merchants/${id}`),

    // Merchant Types
    getMerchantTypes: () => api.get('/admin/merchant-types'),
    createMerchantType: (data: { name: string; slug: string; icon: string }) => api.post('/admin/merchant-types', data),
    updateMerchantType: (id: string, data: { name: string; icon: string }) => api.put(`/admin/merchant-types/${id}`, data),
    deleteMerchantType: (id: string) => api.delete(`/admin/merchant-types/${id}`),

    // Feature Flags
    getFeatureFlags: (merchantId: string) => api.get(`/admin/merchants/${merchantId}/features`),
    toggleFeatureFlag: (merchantId: string, featureKey: string, enabled: boolean) =>
        api.put(`/admin/merchants/${merchantId}/features`, { feature_key: featureKey, enabled }),
    enableAllFeatures: (merchantId: string) => api.put(`/admin/merchants/${merchantId}/features/enable-all`),

    // Global Config
    getConfigs: () => api.get('/admin/config'),
    setConfig: (key: string, value: string, description?: string) =>
        api.put('/admin/config', { key, value, description }),

    // Role Permissions (RBAC)
    getRolePermissions: () => api.get('/admin/role-permissions'),
    getRolePermissionsByRole: (role: string) => api.get(`/admin/role-permissions/${role}`),
    setRolePermission: (role: string, action: string, is_allowed: boolean) =>
        api.put('/admin/role-permissions', { role, action, is_allowed }),
    bulkSetRolePermissions: (role: string, permissions: { action: string; is_allowed: boolean }[]) =>
        api.put('/admin/role-permissions/bulk', { role, permissions }),
};

// ======= INVENTORY =======
export const inventoryAPI = {
    getStock: (outletId: string) => api.get(`/inventory?outlet_id=${outletId}`),
    getLowStock: (outletId: string) => api.get(`/inventory/low-stock?outlet_id=${outletId}`),
    adjustStock: (data: { outlet_id: string; product_id: string; variant_id?: string; delta: number; notes: string }) =>
        api.post('/inventory/adjust', data),
    setStock: (data: { outlet_id: string; product_id: string; variant_id?: string; quantity: number; notes: string }) =>
        api.post('/inventory/set', data),
    getMovements: (outletId: string, productId?: string, limit?: number) => {
        const params = new URLSearchParams({ outlet_id: outletId });
        if (productId) params.set('product_id', productId);
        if (limit) params.set('limit', limit.toString());
        return api.get(`/inventory/movements?${params.toString()}`);
    },
};

// ======= USER / TEAM (Phase 2) =======
export const userAPI = {
    getProfile: () => api.get('/me'),
    updateProfile: (data: { full_name?: string; phone?: string; email?: string; avatar_url?: string }) =>
        api.put('/me', data),
    changePassword: (data: { old_password: string; new_password: string }) =>
        api.put('/me/password', data),
    updateMerchant: (data: {
        name?: string; logo_url?: string; open_time?: string; close_time?: string;
        bank_name?: string; bank_account_number?: string; bank_account_holder?: string;
    }) => api.put('/me/merchant', data),
    getTeam: () => api.get('/users'),
    invite: (data: { email: string; full_name: string; role: string; temp_password: string; phone?: string; outlet_id?: string }) =>
        api.post('/users/invite', data),
    updateRole: (userId: string, role: string) => api.put(`/users/${userId}/role`, { role }),
    toggleActive: (userId: string) => api.put(`/users/${userId}/toggle`),
};

// ======= SUBSCRIPTION (Phase 5) =======
export const subscriptionAPI = {
    getPlans: () => api.get('/plans'),
    getStatus: () => api.get('/subscription/status'),
    upgrade: (planId: string, billingCycle: string) =>
        api.post('/subscription/upgrade', { plan_id: planId, billing_cycle: billingCycle }),
};

// ======= FORECAST (Phase 6) =======
export const forecastAPI = {
    generate: (data?: { period?: string; days?: number; product_id?: string }) =>
        api.post('/forecast/generate', data || { period: 'daily', days: 7 }),
};

// ======= DELIVERY / MYKURIR (Phase 7) =======
export const deliveryAPI = {
    createOrder: (data: Record<string, unknown>) => api.post('/delivery/orders', data),
    getOrders: (status?: string, limit?: number, offset?: number) =>
        api.get('/delivery/orders', { params: { status, limit: limit || 50, offset: offset || 0 } }),
    getOrder: (id: string) => api.get(`/delivery/orders/${id}`),
    getActiveCount: () => api.get('/delivery/orders/active-count'),
    updateStatus: (id: string, data: { status: string; driver_lat?: number; driver_lng?: number; cancel_reason?: string }) =>
        api.put(`/delivery/orders/${id}/status`, data),
    setCourier: (id: string, courierName: string) =>
        api.put(`/delivery/orders/${id}/courier`, { courier_name: courierName }),
    assignDriver: (orderId: string, driverId: string) =>
        api.put(`/delivery/orders/${orderId}/assign`, { driver_id: driverId }),
    getDrivers: () => api.get('/delivery/drivers'),
    getAvailableDrivers: () => api.get('/delivery/drivers/available'),
    registerDriver: (data: { user_id: string; vehicle_type?: string; plate_number?: string }) =>
        api.post('/delivery/drivers', data),
    toggleOnline: () => api.put('/delivery/drivers/toggle-online'),
    updateLocation: (lat: number, lng: number) =>
        api.put('/delivery/drivers/location', { lat, lng }),
};

// ======= CHAT (Phase 7) =======
export const chatAPI = {
    getRooms: () => api.get('/chat/rooms'),
    getMessages: (roomId: string, limit?: number, offset?: number) =>
        api.get(`/chat/rooms/${roomId}/messages`, { params: { limit: limit || 100, offset: offset || 0 } }),
    sendMessage: (roomId: string, content: string) =>
        api.post(`/chat/rooms/${roomId}/messages`, { content }),
    markRead: (roomId: string) =>
        api.put(`/chat/rooms/${roomId}/read`),
};

// ======= FILE UPLOAD =======
export const uploadAPI = {
    upload: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// ======= WEBSITE CMS (Public) =======
export const websiteAPI = {
    getConfig: () => api.get('/public/website-config'),
};
