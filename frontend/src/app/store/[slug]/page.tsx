"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { storeAPI, paymentAPI } from "@/lib/api";
import { Store, Clock, Globe, Search, ShoppingBag, ShoppingCart, ChevronRight, ChevronLeft, Sparkles, Tag, Plus, Minus, X, Trash2, Loader2, CheckCircle, CreditCard, User, Phone, FileText, Home, UtensilsCrossed, Heart, MapPin } from "lucide-react";
import { getThemeById, DEFAULT_THEME_ID, type StoreTheme } from "@/lib/themes";

/* ─── Type definitions ─── */
interface Tenant {
    id: string; name: string; slug: string; logo_url?: string;
    subdomain: string; open_time: string; close_time: string;
    subscription_plan: string;
    settings?: Record<string, unknown>;
    merchant_type?: { name: string; slug: string; icon: string };
}
interface Category { id: string; name: string; slug?: string; icon?: string; }
interface Variant { id: string; name: string; additional_price: number; }
interface Product {
    id: string; name: string; description?: string; image_url?: string;
    base_price: number; category_id?: string; category?: Category;
    variants?: Variant[];
}
interface CartItem {
    product: Product; variant?: Variant; quantity: number; unitPrice: number;
}
interface BannerSlide {
    image_url: string; title?: string; link?: string;
}
interface NavItem {
    icon: string; label: string; action: string;
}

function formatPrice(price: number) {
    return `Rp ${price.toLocaleString("id-ID")}`;
}

const typeIcons: Record<string, string> = { restaurant: "🍽️", "grosir-sembako": "🏪", pengrajin: "🎨", lainnya: "📦" };
const API_HOST = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080';

const defaultNavItems: NavItem[] = [
    { icon: "home", label: "Beranda", action: "home" },
    { icon: "menu", label: "Menu", action: "menu" },
    { icon: "cart", label: "Keranjang", action: "cart" },
    { icon: "info", label: "Info", action: "info" },
];

const defaultCategoryIcons: Record<string, string> = {
    makanan: "🍛", minuman: "🥤", snack: "🍟", dessert: "🍰",
    kopi: "☕", jus: "🧃", roti: "🍞", "ice cream": "🍦",
    nasi: "🍚", mie: "🍜", sate: "🍢", gorengan: "🧆",
};

const navIconMap: Record<string, React.ReactNode> = {
    home: <Home className="w-5 h-5" />,
    menu: <UtensilsCrossed className="w-5 h-5" />,
    cart: <ShoppingCart className="w-5 h-5" />,
    search: <Search className="w-5 h-5" />,
    info: <MapPin className="w-5 h-5" />,
    heart: <Heart className="w-5 h-5" />,
};

declare global {
    interface Window {
        snap?: {
            pay: (token: string, options: {
                onSuccess?: (result: Record<string, unknown>) => void;
                onPending?: (result: Record<string, unknown>) => void;
                onError?: (result: Record<string, unknown>) => void;
                onClose?: () => void;
            }) => void;
        };
    }
}

/* ──────────────────────────────────────────── */
export default function StorefrontPage() {
    const params = useParams();
    const slug = params.slug as string;

    /* store data */
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [search, setSearch] = useState("");

    /* cart state */
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [showVariantPicker, setShowVariantPicker] = useState<Product | null>(null);

    /* checkout state */
    const [checkoutStep, setCheckoutStep] = useState<"cart" | "form" | "processing" | "success" | "error">("cart");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [customerLat, setCustomerLat] = useState(0);
    const [customerLng, setCustomerLng] = useState(0);
    const [customerNotes, setCustomerNotes] = useState("");
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [snapLoaded, setSnapLoaded] = useState(false);
    const [deliveryOrderNumber, setDeliveryOrderNumber] = useState("");
    const [deliveryOrderId, setDeliveryOrderId] = useState("");
    const [mapLoaded, setMapLoaded] = useState(false);
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<unknown>(null);
    const leafletMarkerRef = useRef<unknown>(null);

    /* banner slider */
    const [bannerIdx, setBannerIdx] = useState(0);
    const bannerRef = useRef<NodeJS.Timeout | null>(null);

    /* bottom nav active */
    const [activeNav, setActiveNav] = useState("home");
    const productsRef = useRef<HTMLDivElement>(null);

    /* ── Load store data ── */
    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        storeAPI.getBySlug(slug)
            .then((res) => {
                const data = res.data.data;
                setTenant(data.tenant);
                setProducts(data.products || []);
                setCategories(data.categories || []);
            })
            .catch((err) => setError(err?.response?.data?.error || "Toko tidak ditemukan"))
            .finally(() => setLoading(false));
    }, [slug]);

    /* ── Load Midtrans Snap.js ── */
    useEffect(() => {
        let cancelled = false;
        const loadSnap = async () => {
            try {
                const res = await paymentAPI.getConfig();
                const { mode, client_key } = res.data.data;
                if (!client_key || cancelled) return;
                const existingScript = document.getElementById('midtrans-snap');
                if (existingScript) { setSnapLoaded(true); return; }
                const snapUrl = mode === 'production' ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js';
                const script = document.createElement('script');
                script.id = 'midtrans-snap'; script.src = snapUrl;
                script.setAttribute('data-client-key', client_key);
                script.onload = () => { if (!cancelled) setSnapLoaded(true); };
                document.head.appendChild(script);
            } catch (e) { console.error('Failed to load Midtrans Snap', e); }
        };
        loadSnap();
        return () => { cancelled = true; };
    }, []);

    /* ── Derived data ── */
    const isPro = tenant?.subscription_plan === 'pro';
    const banners: BannerSlide[] = (tenant?.settings?.banners as BannerSlide[]) || [];
    const customNavItems: NavItem[] = (tenant?.settings?.bottom_nav as NavItem[]) || defaultNavItems;
    const customColor = (tenant?.settings?.custom_color as string) || '';

    const filteredProducts = useMemo(() => {
        let list = products;
        if (selectedCategory !== "all") list = list.filter(p => p.category_id === selectedCategory);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
        }
        return list;
    }, [products, selectedCategory, search]);

    /* ── Banner auto-cycle ── */
    useEffect(() => {
        if (banners.length <= 1) return;
        bannerRef.current = setInterval(() => setBannerIdx(prev => (prev + 1) % banners.length), 4000);
        return () => { if (bannerRef.current) clearInterval(bannerRef.current); };
    }, [banners.length]);

    /* ── Cart helpers ── */
    const cartKey = (p: Product, v?: Variant) => `${p.id}-${v?.id || 'base'}`;
    const addToCart = useCallback((product: Product, variant?: Variant) => {
        setCart(prev => {
            const key = cartKey(product, variant);
            const existing = prev.find(item => cartKey(item.product, item.variant) === key);
            if (existing) return prev.map(item => cartKey(item.product, item.variant) === key ? { ...item, quantity: item.quantity + 1 } : item);
            return [...prev, { product, variant, quantity: 1, unitPrice: product.base_price + (variant?.additional_price || 0) }];
        });
        setShowVariantPicker(null);
    }, []);
    const updateQty = useCallback((key: string, delta: number) => {
        setCart(prev => prev.map(item => { const k = cartKey(item.product, item.variant); if (k !== key) return item; const nq = item.quantity + delta; return nq <= 0 ? item : { ...item, quantity: nq }; }));
    }, []);
    const removeFromCart = useCallback((key: string) => setCart(prev => prev.filter(item => cartKey(item.product, item.variant) !== key)), []);
    const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [cart]);
    const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

    const handleAddClick = (product: Product) => {
        if (product.variants && product.variants.length > 0) setShowVariantPicker(product);
        else addToCart(product);
    };

    /* ── Leaflet map loader ── */
    useEffect(() => {
        if (checkoutStep !== 'form' || mapLoaded) return;
        // Load Leaflet CSS + JS dynamically
        const cssId = 'leaflet-css';
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId; link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
        const jsId = 'leaflet-js';
        const existing = document.getElementById(jsId);
        const initMap = () => {
            if (!mapRef.current || leafletMapRef.current) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const L = (window as any).L;
            if (!L) return;
            const defaultLat = -8.6500; // Bali center
            const defaultLng = 115.2167;
            const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap',
                maxZoom: 19,
            }).addTo(map);
            const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
            leafletMapRef.current = map;
            leafletMarkerRef.current = marker;
            // On marker drag
            marker.on('dragend', () => {
                const pos = marker.getLatLng();
                setCustomerLat(pos.lat);
                setCustomerLng(pos.lng);
            });
            // On map click
            map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
                marker.setLatLng(e.latlng);
                setCustomerLat(e.latlng.lat);
                setCustomerLng(e.latlng.lng);
            });
            // Try geolocation
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    const { latitude, longitude } = pos.coords;
                    map.setView([latitude, longitude], 16);
                    marker.setLatLng([latitude, longitude]);
                    setCustomerLat(latitude);
                    setCustomerLng(longitude);
                }, () => { /* user denied geolocation, use default */ });
            }
            setMapLoaded(true);
        };
        if (existing) { initMap(); }
        else {
            const script = document.createElement('script');
            script.id = jsId;
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => setTimeout(initMap, 100);
            document.head.appendChild(script);
        }
    }, [checkoutStep, mapLoaded]);

    // Cleanup map when leaving form
    useEffect(() => {
        if (checkoutStep !== 'form' && leafletMapRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (leafletMapRef.current as any).remove();
            leafletMapRef.current = null;
            leafletMarkerRef.current = null;
            setMapLoaded(false);
        }
    }, [checkoutStep]);

    /* ── Checkout with Midtrans ── */
    const handleCheckout = async () => {
        if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) return;
        setPaymentLoading(true); setCheckoutStep("processing");
        try {
            const orderId = `ORD-${slug}-${Date.now()}`;
            const itemsSummary = cart.map(i => `${i.product.name}${i.variant ? ` (${i.variant.name})` : ''} x${i.quantity}`).join(', ');
            const checkoutPayload = {
                name: customerName, phone: customerPhone,
                full_address: customerAddress,
                latitude: customerLat, longitude: customerLng,
                notes: customerNotes, midtrans_order_id: orderId,
                total_amount: cartTotal, items_summary: itemsSummary,
            };

            // 1) Try to create order first — but don't block payment if this fails
            try {
                const checkoutRes = await storeAPI.checkout(slug, checkoutPayload);
                const orderData = checkoutRes.data.data;
                setDeliveryOrderNumber(orderData?.order_number || '');
                setDeliveryOrderId(orderData?.delivery_order_id || '');
            } catch (e) {
                console.warn('Order pre-creation failed, will retry after payment:', e);
            }

            // 2) Create Midtrans Snap token & open payment popup
            const res = await paymentAPI.createSnap({ order_id: orderId, gross_amount: cartTotal, first_name: customerName, email: `${customerPhone}@customer.codapos.com`, phone: customerPhone });
            const snapToken = res.data.data.token;
            if (window.snap && snapToken) {
                window.snap.pay(snapToken, {
                    onSuccess: async () => {
                        // Retry order creation if it failed earlier
                        if (!deliveryOrderId) {
                            try {
                                const retryRes = await storeAPI.checkout(slug, checkoutPayload);
                                const od = retryRes.data.data;
                                setDeliveryOrderNumber(od?.order_number || '');
                                setDeliveryOrderId(od?.delivery_order_id || '');
                            } catch { /* ignore */ }
                        }
                        setCheckoutStep("success"); setCart([]);
                    },
                    onPending: async () => {
                        if (!deliveryOrderId) {
                            try {
                                const retryRes = await storeAPI.checkout(slug, checkoutPayload);
                                const od = retryRes.data.data;
                                setDeliveryOrderNumber(od?.order_number || '');
                                setDeliveryOrderId(od?.delivery_order_id || '');
                            } catch { /* ignore */ }
                        }
                        setCheckoutStep("success"); setCart([]);
                    },
                    onError: () => setCheckoutStep("error"),
                    onClose: () => { if (checkoutStep === "processing") setCheckoutStep("form"); },
                });
            } else setCheckoutStep("error");
        } catch { setCheckoutStep("error"); } finally { setPaymentLoading(false); }
    };

    /* ── Bottom nav handler ── */
    const handleNavAction = (action: string) => {
        setActiveNav(action);
        if (action === 'cart') setShowCart(true);
        if (action === 'menu' || action === 'home') { productsRef.current?.scrollIntoView({ behavior: 'smooth' }); }
        if (action === 'search') { /* focus search */ const el = document.getElementById('store-search'); el?.focus(); }
    };

    /* ── Theme ── */
    const themeId = (tenant?.settings?.store_theme as string) || DEFAULT_THEME_ID;
    const t: StoreTheme = getThemeById(themeId);
    const isDark = t.style === "shopee";
    const accent = customColor && isPro ? customColor : t.accent;
    const accentGradient = customColor && isPro ? `linear-gradient(135deg, ${customColor}, ${customColor}dd)` : t.accentGradient;

    /* ── Loading/Error ── */
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0f172a" }}>
            <div className="flex flex-col items-center gap-3 animate-pulse">
                <Store className="w-10 h-10 text-white/30" />
                <span className="text-white/30 text-sm">Memuat toko...</span>
            </div>
        </div>
    );
    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
            <div className="text-center"><ShoppingBag className="w-16 h-16 text-white/10 mx-auto mb-4" /><p className="text-white/40 text-lg">{error}</p></div>
        </div>
    );
    if (!tenant) return null;

    const merchantIcon = tenant.merchant_type ? typeIcons[tenant.merchant_type.slug] || "📦" : "🏪";
    const storeUrl = `${tenant.slug}.codapos.com`;

    return (
        <div className={`min-h-screen ${t.bodyClass}`} style={{ backgroundColor: t.bgBase }}>
            {/* background textures */}
            {!isDark && <div className="fixed inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }} />}
            <div className="fixed top-0 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none blur-[150px]" style={{ backgroundColor: t.bgGlow1, opacity: isDark ? 0.07 : 0.04 }} />
            <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none blur-[120px]" style={{ backgroundColor: t.bgGlow2, opacity: isDark ? 0.04 : 0.03 }} />

            {/* ════════ HERO BANNER SLIDER ════════ */}
            {banners.length > 0 && isPro && (
                <section className="relative w-full overflow-hidden" style={{ maxHeight: '240px' }}>
                    <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${bannerIdx * 100}%)` }}>
                        {banners.map((b, i) => (
                            <div key={i} className="min-w-full relative" style={{ height: '240px' }}>
                                <img
                                    src={b.image_url.startsWith('/') ? `${API_HOST}${b.image_url}` : b.image_url}
                                    alt={b.title || `Banner ${i + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                {b.title && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                        <p className="text-white font-bold text-lg drop-shadow-lg">{b.title}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Dots */}
                    {banners.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {banners.map((_, i) => (
                                <button key={i} onClick={() => setBannerIdx(i)}
                                    className={`w-2 h-2 rounded-full transition-all ${i === bannerIdx ? 'w-5' : 'opacity-40'}`}
                                    style={{ backgroundColor: i === bannerIdx ? accent : '#fff' }} />
                            ))}
                        </div>
                    )}
                    {/* Nav arrows */}
                    {banners.length > 1 && (
                        <>
                            <button onClick={() => setBannerIdx((bannerIdx - 1 + banners.length) % banners.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/50 transition-all">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setBannerIdx((bannerIdx + 1) % banners.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/50 transition-all">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </section>
            )}

            {/* ════════ STORE HEADER ════════ */}
            <header className="relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-b ${t.bgGradient}`} />
                <div className="max-w-5xl mx-auto px-4 pt-6 pb-5 relative">
                    <div className="flex items-start gap-4 animate-fade-in">
                        <div className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg overflow-hidden" style={{ background: accentGradient }}>
                            {tenant.logo_url ? <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full rounded-2xl object-cover" /> : <span>{merchantIcon}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight truncate ${t.textPrimary}`}>{tenant.name}</h1>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                {tenant.merchant_type && (
                                    <span className={`inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 ${isDark ? 'bg-white/5 border border-white/10 text-white/60' : 'bg-gray-100 border border-gray-200 text-gray-500'}`}>
                                        <Tag className="w-2.5 h-2.5" />{tenant.merchant_type.name}
                                    </span>
                                )}
                                <span className={`inline-flex items-center gap-1 text-[10px] ${t.textMuted}`}>
                                    <Clock className="w-2.5 h-2.5" />{tenant.open_time} – {tenant.close_time}
                                </span>
                                {isPro && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/90 text-amber-900">PRO</span>}
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="mt-4 relative animate-fade-in" style={{ animationDelay: "0.1s" }}>
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${t.textMuted}`} />
                        <input id="store-search" type="text" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 ${t.searchBg} border ${t.searchBorder} rounded-2xl text-sm ${isDark ? 'text-white' : 'text-gray-900'} ${t.searchPlaceholder} focus:outline-none ${t.searchFocus} focus:ring-2 transition-all`} />
                    </div>
                </div>
            </header>

            {/* ════════ ROUND CATEGORY ICONS (GoFood style) ════════ */}
            {categories.length > 0 && (
                <nav className="max-w-5xl mx-auto px-4 mb-5 animate-fade-in" style={{ animationDelay: "0.15s" }}>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none justify-start">
                        {/* All */}
                        <button onClick={() => setSelectedCategory("all")} className="flex flex-col items-center gap-1.5 shrink-0 min-w-[60px] group">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all shadow-md ${selectedCategory === 'all'
                                ? 'ring-2 scale-105'
                                : `${isDark ? 'bg-white/10' : 'bg-gray-100'} group-hover:scale-105`
                                }`} style={selectedCategory === 'all' ? { background: accentGradient, boxShadow: `0 4px 15px ${accent}30` } as React.CSSProperties : {}}>
                                {selectedCategory === 'all' ? <span className="text-white text-lg">✨</span> : <span>🏪</span>}
                            </div>
                            <span className={`text-[10px] font-medium text-center leading-tight ${selectedCategory === 'all' ? t.textPrimary : t.textMuted}`}>
                                Semua
                            </span>
                        </button>
                        {categories.map(cat => {
                            const count = products.filter(p => p.category_id === cat.id).length;
                            const isActive = selectedCategory === cat.id;
                            const icon = cat.icon || defaultCategoryIcons[cat.name.toLowerCase()] || "📦";
                            return (
                                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="flex flex-col items-center gap-1.5 shrink-0 min-w-[60px] group">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all shadow-md ${isActive
                                        ? 'ring-2 scale-105'
                                        : `${isDark ? 'bg-white/10' : 'bg-gray-100'} group-hover:scale-105`
                                        }`} style={isActive ? { background: accentGradient, boxShadow: `0 4px 15px ${accent}30` } as React.CSSProperties : {}}>
                                        {isActive ? <span className="text-white text-lg">{icon}</span> : <span>{icon}</span>}
                                    </div>
                                    <span className={`text-[10px] font-medium text-center leading-tight line-clamp-1 ${isActive ? t.textPrimary : t.textMuted}`}>
                                        {cat.name}
                                    </span>
                                    <span className={`text-[8px] -mt-1 ${t.textMuted}`}>{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>
            )}

            {/* ════════ PRODUCTS GRID ════════ */}
            <main ref={productsRef} className="max-w-5xl mx-auto px-4 pb-28">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-16 animate-fade-in">
                        <ShoppingBag className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-white/15' : 'text-gray-200'}`} />
                        <p className={`text-sm ${t.textMuted}`}>{search ? "Tidak ada produk yang cocok" : "Belum ada produk"}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {filteredProducts.map((product, index) => (
                            <div key={product.id}
                                className={`group ${t.cardBg} border ${t.cardBorder} rounded-2xl overflow-hidden ${t.cardHoverBorder} ${t.cardHoverBg} transition-all duration-300 hover:-translate-y-1 animate-fade-in`}
                                style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}>
                                <div className={`aspect-square relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-white/[0.03] to-white/[0.01]' : 'bg-gray-50'}`}>
                                    {product.image_url ? (
                                        <img src={product.image_url.startsWith('/') ? `${API_HOST}${product.image_url}` : product.image_url} alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><ShoppingBag className={`w-10 h-10 ${isDark ? 'text-white/10' : 'text-gray-200'}`} /></div>
                                    )}
                                    {product.category && (
                                        <div className={`absolute top-2 left-2 text-[10px] ${t.badgeBg} backdrop-blur-md ${t.badgeText} px-2 py-0.5 rounded-full border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                            {product.category.icon || defaultCategoryIcons[product.category.name.toLowerCase()] || '📦'} {product.category.name}
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 sm:p-4">
                                    <h3 className={`text-sm font-semibold truncate ${t.textPrimary}`}>{product.name}</h3>
                                    {product.description && <p className={`text-[11px] mt-0.5 line-clamp-2 ${t.textMuted}`}>{product.description}</p>}
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className={`text-sm font-bold`} style={{ color: accent }}>{formatPrice(product.base_price)}</span>
                                        <button onClick={() => handleAddClick(product)}
                                            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-lg text-white"
                                            style={{ background: accentGradient }}>
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {product.variants && product.variants.length > 0 && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${isDark ? 'text-white/30 bg-white/5' : 'text-gray-400 bg-gray-100'}`}>
                                            {product.variants.length} varian
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* ════════ VARIANT PICKER MODAL ════════ */}
            {showVariantPicker && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setShowVariantPicker(null)}>
                    <div className={`w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden animate-slide-up ${isDark ? 'bg-[#1a1f2e]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                        <div className={`p-5 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                            <div className="flex items-center justify-between">
                                <h3 className={`font-bold ${t.textPrimary}`}>Pilih Varian</h3>
                                <button onClick={() => setShowVariantPicker(null)} className={`${t.textMuted} hover:opacity-70`}><X className="w-5 h-5" /></button>
                            </div>
                            <p className={`text-sm mt-1 ${t.textMuted}`}>{showVariantPicker.name}</p>
                        </div>
                        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                            <button onClick={() => addToCart(showVariantPicker)} className={`w-full text-left p-3 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm font-medium ${t.textPrimary}`}>Original</span>
                                    <span className="text-sm font-bold" style={{ color: accent }}>{formatPrice(showVariantPicker.base_price)}</span>
                                </div>
                            </button>
                            {showVariantPicker.variants?.map(v => (
                                <button key={v.id} onClick={() => addToCart(showVariantPicker, v)} className={`w-full text-left p-3 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm font-medium ${t.textPrimary}`}>{v.name}</span>
                                        <span className="text-sm font-bold" style={{ color: accent }}>{formatPrice(showVariantPicker.base_price + v.additional_price)}</span>
                                    </div>
                                    {v.additional_price > 0 && <p className={`text-[10px] mt-0.5 ${t.textMuted}`}>+{formatPrice(v.additional_price)}</p>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ════════ CART DRAWER ════════ */}
            {showCart && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => { setShowCart(false); setCheckoutStep('cart'); }}>
                    <div className={`fixed right-0 top-0 bottom-0 w-full sm:w-[420px] ${isDark ? 'bg-[#111827]' : 'bg-white'} shadow-2xl flex flex-col animate-slide-in-right`} onClick={e => e.stopPropagation()}>
                        {/* Cart header */}
                        <div className={`p-5 border-b ${isDark ? 'border-white/10' : 'border-gray-100'} flex items-center justify-between shrink-0`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: accentGradient }}>
                                    <ShoppingCart className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className={`font-bold ${t.textPrimary}`}>
                                        {checkoutStep === 'cart' ? 'Keranjang' : checkoutStep === 'form' ? 'Checkout' : checkoutStep === 'processing' ? 'Memproses...' : checkoutStep === 'success' ? 'Berhasil!' : 'Gagal'}
                                    </h2>
                                    <p className={`text-xs ${t.textMuted}`}>{cartCount} item</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowCart(false); setCheckoutStep('cart'); }} className={`${t.textMuted} hover:opacity-70`}><X className="w-5 h-5" /></button>
                        </div>

                        {/* Success / Error / Processing */}
                        {checkoutStep === 'success' && (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: `${accent}15` }}>
                                    <CheckCircle className="w-10 h-10" style={{ color: accent }} />
                                </div>
                                <h3 className={`text-xl font-bold mb-2 ${t.textPrimary}`}>Pembayaran Berhasil! 🎉</h3>
                                <p className={`text-sm ${t.textMuted}`}>Terima kasih sudah berbelanja di {tenant.name}.</p>
                                {deliveryOrderNumber && (
                                    <div className={`mt-3 p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                        <p className={`text-xs ${t.textMuted}`}>No. Pengiriman</p>
                                        <p className={`text-lg font-bold font-mono ${t.textPrimary}`}>{deliveryOrderNumber}</p>
                                        <p className={`text-xs mt-1 ${t.textMuted}`}>Kurir akan segera mengantar pesanan Anda 🛵</p>
                                    </div>
                                )}
                                <button onClick={() => { setShowCart(false); setCheckoutStep('cart'); setDeliveryOrderNumber(''); }} className="mt-6 px-6 py-3 rounded-xl text-sm font-medium text-white" style={{ background: accentGradient }}>Kembali Belanja</button>
                            </div>
                        )}
                        {checkoutStep === 'error' && (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4"><X className="w-10 h-10 text-red-400" /></div>
                                <h3 className={`text-xl font-bold mb-2 ${t.textPrimary}`}>Pembayaran Gagal</h3>
                                <p className={`text-sm ${t.textMuted}`}>Silakan coba lagi.</p>
                                <button onClick={() => setCheckoutStep('form')} className="mt-6 px-6 py-3 rounded-xl text-sm font-medium text-white" style={{ background: accentGradient }}>Coba Lagi</button>
                            </div>
                        )}
                        {checkoutStep === 'processing' && (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: accent }} />
                                <p className={`text-sm ${t.textMuted}`}>Menghubungkan ke Midtrans...</p>
                            </div>
                        )}

                        {/* Cart items / checkout form */}
                        {checkoutStep === 'success' && (
                            <div className="flex-1 flex items-center justify-center p-6">
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                                        <ShoppingBag className="w-8 h-8 text-green-400" />
                                    </div>
                                    <h3 className={`text-xl font-bold ${t.textPrimary}`}>Pesanan Berhasil! 🎉</h3>
                                    {deliveryOrderNumber && (
                                        <p className={`text-sm ${t.textMuted}`}>No. Pesanan: <span className="font-mono font-bold" style={{ color: accent }}>{deliveryOrderNumber}</span></p>
                                    )}
                                    <p className={`text-sm ${t.textMuted}`}>Toko akan segera memproses pesanan Anda</p>
                                    {deliveryOrderId && (
                                        <a href={`/store/${slug}/order/${deliveryOrderId}`} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg"
                                            style={{ background: accentGradient }}>
                                            <MapPin className="w-4 h-4" /> Lacak Pesanan
                                        </a>
                                    )}
                                    <button onClick={() => { setShowCart(false); setCheckoutStep('cart'); }}
                                        className={`block mx-auto text-sm ${t.textMuted} hover:underline mt-2`}>Tutup</button>
                                </div>
                            </div>
                        )}
                        {checkoutStep === 'error' && (
                            <div className="flex-1 flex items-center justify-center p-6">
                                <div className="text-center space-y-3">
                                    <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
                                        <ShoppingBag className="w-8 h-8 text-red-400" />
                                    </div>
                                    <h3 className={`text-lg font-bold ${t.textPrimary}`}>Pembayaran Gagal</h3>
                                    <p className={`text-sm ${t.textMuted}`}>Silakan coba lagi</p>
                                    <button onClick={() => setCheckoutStep('form')}
                                        className="px-5 py-2 rounded-xl text-white text-sm font-semibold"
                                        style={{ background: accentGradient }}>Coba Lagi</button>
                                </div>
                            </div>
                        )}
                        {checkoutStep === 'processing' && (
                            <div className="flex-1 flex items-center justify-center p-6">
                                <div className="text-center space-y-3">
                                    <div className="w-10 h-10 mx-auto border-4 border-gray-300 border-t-emerald-500 rounded-full animate-spin" />
                                    <p className={`text-sm ${t.textMuted}`}>Memproses pembayaran...</p>
                                </div>
                            </div>
                        )}
                        {(checkoutStep === 'cart' || checkoutStep === 'form') && (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {cart.length === 0 ? (
                                        <div className="text-center py-16">
                                            <ShoppingBag className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-white/10' : 'text-gray-200'}`} />
                                            <p className={`text-sm ${t.textMuted}`}>Keranjang kosong</p>
                                        </div>
                                    ) : (
                                        <>
                                            {checkoutStep === 'cart' && cart.map(item => {
                                                const key = cartKey(item.product, item.variant);
                                                return (
                                                    <div key={key} className={`flex gap-3 p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                                                        <div className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                                            {item.product.image_url ? <img src={item.product.image_url.startsWith('/') ? `${API_HOST}${item.product.image_url}` : item.product.image_url} alt="" className="w-full h-full object-cover" /> :
                                                                <div className="w-full h-full flex items-center justify-center"><ShoppingBag className={`w-5 h-5 ${isDark ? 'text-white/10' : 'text-gray-300'}`} /></div>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className={`text-sm font-medium truncate ${t.textPrimary}`}>{item.product.name}</h4>
                                                            {item.variant && <p className={`text-[10px] ${t.textMuted}`}>Varian: {item.variant.name}</p>}
                                                            <p className="text-sm font-bold mt-0.5" style={{ color: accent }}>{formatPrice(item.unitPrice)}</p>
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                <button onClick={() => item.quantity === 1 ? removeFromCart(key) : updateQty(key, -1)} className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                                                                    {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3" />}
                                                                </button>
                                                                <span className={`text-sm font-semibold w-5 text-center ${t.textPrimary}`}>{item.quantity}</span>
                                                                <button onClick={() => updateQty(key, 1)} className="w-6 h-6 rounded-lg flex items-center justify-center text-white" style={{ background: accentGradient }}>
                                                                    <Plus className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="shrink-0 text-right">
                                                            <p className="text-sm font-bold" style={{ color: accent }}>{formatPrice(item.unitPrice * item.quantity)}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {checkoutStep === 'form' && (
                                                <div className="space-y-4">
                                                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                                                        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${t.textMuted}`}>Ringkasan</h4>
                                                        {cart.map(item => (
                                                            <div key={cartKey(item.product, item.variant)} className="flex justify-between text-sm py-0.5">
                                                                <span className={t.textMuted}>{item.product.name}{item.variant ? ` (${item.variant.name})` : ''} × {item.quantity}</span>
                                                                <span className={t.textPrimary}>{formatPrice(item.unitPrice * item.quantity)}</span>
                                                            </div>
                                                        ))}
                                                        <div className={`border-t mt-2 pt-2 flex justify-between ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                                            <span className={`text-sm font-bold ${t.textPrimary}`}>Total</span>
                                                            <span className="text-lg font-bold" style={{ color: accent }}>{formatPrice(cartTotal)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <h4 className={`text-xs font-semibold uppercase tracking-wider ${t.textMuted}`}>Info Pemesan & Pengiriman</h4>
                                                        <div className="relative">
                                                            <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${t.textMuted}`} />
                                                            <input type="text" placeholder="Nama Anda *" value={customerName} onChange={e => setCustomerName(e.target.value)}
                                                                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:outline-none`} />
                                                        </div>
                                                        <div className="relative">
                                                            <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${t.textMuted}`} />
                                                            <input type="tel" placeholder="No. HP / WhatsApp *" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                                                                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:outline-none`} />
                                                        </div>
                                                        <div className="relative">
                                                            <MapPin className={`absolute left-3 top-3 w-4 h-4 ${t.textMuted}`} />
                                                            <textarea placeholder="Alamat lengkap pengiriman *" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} rows={2}
                                                                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm resize-none ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:outline-none`} />
                                                        </div>

                                                        {/* Map Picker */}
                                                        <div className={`rounded-xl overflow-hidden border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                                            <div className={`px-3 py-2 flex items-center justify-between ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                                                <span className={`text-xs font-medium ${t.textMuted}`}>📍 Pilih Lokasi di Peta</span>
                                                                {customerLat !== 0 && (
                                                                    <span className={`text-[10px] ${t.textMuted}`}>
                                                                        {customerLat.toFixed(5)}, {customerLng.toFixed(5)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div ref={mapRef} style={{ height: 200, width: '100%' }} />
                                                            <div className={`px-3 py-1.5 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                                                <p className={`text-[10px] ${t.textMuted}`}>Tap/klik peta untuk menandai lokasi • Geser pin untuk koreksi</p>
                                                            </div>
                                                        </div>

                                                        <div className="relative">
                                                            <FileText className={`absolute left-3 top-3 w-4 h-4 ${t.textMuted}`} />
                                                            <textarea placeholder="Catatan tambahan (opsional)" value={customerNotes} onChange={e => setCustomerNotes(e.target.value)} rows={2}
                                                                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm resize-none ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:outline-none`} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Cart footer */}
                                {cart.length > 0 && (
                                    <div className={`p-5 border-t ${isDark ? 'border-white/10 bg-[#0f172a]' : 'border-gray-100 bg-gray-50'} shrink-0`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className={`text-sm ${t.textMuted}`}>Total</span>
                                            <span className="text-xl font-bold" style={{ color: accent }}>{formatPrice(cartTotal)}</span>
                                        </div>
                                        {checkoutStep === 'cart' ? (
                                            <button onClick={() => setCheckoutStep('form')}
                                                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
                                                style={{ background: accentGradient, boxShadow: `0 4px 20px ${accent}30` }}>
                                                <CreditCard className="w-4 h-4" /> Lanjut Checkout
                                            </button>
                                        ) : (
                                            <div className="space-y-2">
                                                <button onClick={handleCheckout}
                                                    disabled={!customerName.trim() || !customerPhone.trim() || !customerAddress.trim() || paymentLoading || !snapLoaded}
                                                    className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                                    style={{ background: accentGradient, boxShadow: `0 4px 20px ${accent}30` }}>
                                                    {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                                                    {paymentLoading ? 'Memproses...' : `Bayar ${formatPrice(cartTotal)}`}
                                                </button>
                                                <button onClick={() => setCheckoutStep('cart')} className={`w-full py-2 rounded-xl text-sm ${isDark ? 'text-white/50' : 'text-gray-400'}`}>← Kembali</button>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-center gap-2 mt-3">
                                            <span className={`text-[10px] ${t.textMuted}`}>Powered by Midtrans | QRIS • GoPay • VA • CC</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ════════ FLOATING CART BAR ════════ */}
            {cartCount > 0 && !showCart && (
                <div className="fixed bottom-20 left-4 right-4 z-40 max-w-5xl mx-auto animate-slide-up">
                    <button onClick={() => setShowCart(true)}
                        className="w-full py-3.5 px-5 rounded-2xl text-white font-medium flex items-center justify-between shadow-2xl active:scale-[0.98]"
                        style={{ background: accentGradient, boxShadow: `0 8px 30px ${accent}40` }}>
                        <div className="flex items-center gap-3">
                            <div className="relative"><ShoppingCart className="w-5 h-5" /><span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-[10px] font-bold rounded-full flex items-center justify-center" style={{ color: accent }}>{cartCount}</span></div>
                            <span className="text-sm">{cartCount} item</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-base font-bold">{formatPrice(cartTotal)}</span>
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </button>
                </div>
            )}

            {/* ════════ BOTTOM NAVIGATION BAR ════════ */}
            <nav className={`fixed bottom-0 left-0 right-0 z-30 border-t ${isDark ? 'bg-[#0a0a0f]/95 border-white/5' : 'bg-white/95 border-gray-100'} backdrop-blur-xl`}>
                <div className="max-w-5xl mx-auto flex items-center justify-around py-2">
                    {(isPro ? customNavItems : defaultNavItems).map((item, i) => {
                        const isAct = activeNav === item.action;
                        return (
                            <button key={i} onClick={() => handleNavAction(item.action)}
                                className="flex flex-col items-center gap-0.5 px-3 py-1 transition-all relative group min-w-[48px]">
                                <span style={{ color: isAct ? accent : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} className="transition-colors">
                                    {item.action === 'cart' ? (
                                        <div className="relative">
                                            {navIconMap[item.icon] || navIconMap.home}
                                            {cartCount > 0 && (
                                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[8px] font-bold rounded-full flex items-center justify-center text-white" style={{ background: accent }}>
                                                    {cartCount}
                                                </span>
                                            )}
                                        </div>
                                    ) : navIconMap[item.icon] || navIconMap.home}
                                </span>
                                <span className={`text-[9px] font-medium transition-colors`}
                                    style={{ color: isAct ? accent : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
                                    {item.label}
                                </span>
                                {isAct && <div className="absolute -bottom-2 w-4 h-0.5 rounded-full" style={{ background: accent }} />}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* CSS */}
            <style jsx global>{`
                @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
                @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
                .animate-slide-in-right { animation: slide-in-right 0.3s ease-out forwards; }
                .animate-fade-in { animation: fade-in 0.4s ease-out forwards; opacity: 0; }
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
