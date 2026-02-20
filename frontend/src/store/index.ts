import { create } from 'zustand';
import { User, CartItem, Product, ProductVariant } from '@/types';

// =============================================
// AUTH STORE
// =============================================

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,

    login: (user: User, token: string) => {
        localStorage.setItem('codapos_token', token);
        localStorage.setItem('codapos_user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('codapos_token');
        localStorage.removeItem('codapos_user');
        set({ user: null, token: null, isAuthenticated: false });
    },

    loadFromStorage: () => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('codapos_token');
            const userStr = localStorage.getItem('codapos_user');
            if (token && userStr) {
                try {
                    const user = JSON.parse(userStr);
                    set({ user, token, isAuthenticated: true });
                } catch {
                    set({ user: null, token: null, isAuthenticated: false });
                }
            }
        }
    },
}));

// =============================================
// CART / POS STORE
// =============================================

interface CartState {
    items: CartItem[];
    selectedOutletId: string | null;
    addItem: (product: Product, variant?: ProductVariant, modifiers?: { name: string; price: number }[]) => void;
    removeItem: (index: number) => void;
    updateQuantity: (index: number, quantity: number) => void;
    updateNote: (index: number, notes: string) => void;
    clearCart: () => void;
    setOutlet: (outletId: string) => void;
    getSubtotal: () => number;
    getTax: () => number;
    getTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    selectedOutletId: null,

    addItem: (product, variant, modifiers = []) => {
        const items = get().items;
        const existingIndex = items.findIndex(
            (item) => item.product.id === product.id && item.variant?.id === variant?.id
        );

        const unitPrice = product.base_price + (variant?.additional_price || 0) +
            modifiers.reduce((sum, m) => sum + m.price, 0);

        if (existingIndex >= 0) {
            const newItems = [...items];
            newItems[existingIndex].quantity += 1;
            set({ items: newItems });
        } else {
            set({
                items: [...items, { product, variant, quantity: 1, modifiers, unitPrice }],
            });
        }
    },

    removeItem: (index) => {
        set({ items: get().items.filter((_, i) => i !== index) });
    },

    updateQuantity: (index, quantity) => {
        if (quantity <= 0) {
            get().removeItem(index);
            return;
        }
        const newItems = [...get().items];
        newItems[index].quantity = quantity;
        set({ items: newItems });
    },

    updateNote: (index, notes) => {
        const newItems = [...get().items];
        newItems[index].notes = notes;
        set({ items: newItems });
    },

    clearCart: () => set({ items: [] }),

    setOutlet: (outletId) => set({ selectedOutletId: outletId }),

    getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    },

    getTax: () => {
        return get().items.reduce((sum, item) => {
            const itemTotal = item.unitPrice * item.quantity;
            return sum + itemTotal * (item.product.tax_rate / 100);
        }, 0);
    },

    getTotal: () => {
        return get().getSubtotal() + get().getTax();
    },

    getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
    },
}));
