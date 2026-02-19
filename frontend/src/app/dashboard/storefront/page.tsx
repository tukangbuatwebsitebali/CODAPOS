"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { tenantAPI, uploadAPI, userAPI } from "@/lib/api";
import { STORE_THEMES, DEFAULT_THEME_ID, type StoreTheme } from "@/lib/themes";
import {
    Palette, Check, ExternalLink, Loader2, Save, ShoppingBag, Sparkles,
    Tag, Clock, Globe, Search, Image, Navigation, Droplets, Lock, Crown,
    Plus, Trash2, GripVertical, Home, UtensilsCrossed, ShoppingCart, MapPin,
    Heart, X, Upload, Zap, Ticket, Star, TrendingUp, Package, Gift,
    MessageSquare, Truck, LayoutGrid, Store
} from "lucide-react";

interface BannerSlide { image_url: string; title?: string; link?: string; }
interface NavItem { icon: string; label: string; action: string; }
interface StoreMenuSection {
    id: string;
    label: string;
    icon: string;
    enabled: boolean;
    title?: string;
}

const DEFAULT_STORE_MENUS: StoreMenuSection[] = [
    { id: "flash_sale", label: "Flash Sale", icon: "zap", enabled: false, title: "⚡ Flash Sale" },
    { id: "voucher", label: "Voucher Toko", icon: "ticket", enabled: false, title: "🎟️ Voucher Spesial" },
    { id: "featured_categories", label: "Kategori Unggulan", icon: "grid", enabled: true, title: "Kategori Unggulan" },
    { id: "best_sellers", label: "Produk Terlaris", icon: "trending", enabled: false, title: "🔥 Produk Terlaris" },
    { id: "new_arrivals", label: "Produk Baru", icon: "package", enabled: false, title: "✨ Produk Baru" },
    { id: "bundle_deals", label: "Promo Bundling", icon: "gift", enabled: false, title: "🎁 Promo Bundling" },
    { id: "recommendations", label: "Rekomendasi", icon: "star", enabled: true, title: "Rekomendasi Untuk Kamu" },
    { id: "mid_banner", label: "Banner Tengah", icon: "image", enabled: false, title: "" },
    { id: "reviews", label: "Ulasan Pelanggan", icon: "message", enabled: false, title: "⭐ Ulasan Pelanggan" },
    { id: "free_shipping", label: "Gratis Ongkir", icon: "truck", enabled: false, title: "🚚 Gratis Ongkir" },
];

const defaultNavItems: NavItem[] = [
    { icon: "home", label: "Beranda", action: "home" },
    { icon: "menu", label: "Menu", action: "menu" },
    { icon: "cart", label: "Keranjang", action: "cart" },
    { icon: "info", label: "Info", action: "info" },
];

const navIconOptions = [
    { value: "home", label: "Home", icon: <Home className="w-4 h-4" /> },
    { value: "menu", label: "Menu", icon: <UtensilsCrossed className="w-4 h-4" /> },
    { value: "cart", label: "Cart", icon: <ShoppingCart className="w-4 h-4" /> },
    { value: "search", label: "Search", icon: <Search className="w-4 h-4" /> },
    { value: "info", label: "Info", icon: <MapPin className="w-4 h-4" /> },
    { value: "heart", label: "Favorit", icon: <Heart className="w-4 h-4" /> },
];

const menuIcons: Record<string, React.ReactNode> = {
    zap: <Zap className="w-4 h-4" />,
    ticket: <Ticket className="w-4 h-4" />,
    grid: <LayoutGrid className="w-4 h-4" />,
    trending: <TrendingUp className="w-4 h-4" />,
    package: <Package className="w-4 h-4" />,
    gift: <Gift className="w-4 h-4" />,
    star: <Star className="w-4 h-4" />,
    image: <Image className="w-4 h-4" />,
    message: <MessageSquare className="w-4 h-4" />,
    truck: <Truck className="w-4 h-4" />,
};

export default function StorefrontSettingsPage() {
    const [currentTheme, setCurrentTheme] = useState(DEFAULT_THEME_ID);
    const [selectedTheme, setSelectedTheme] = useState(DEFAULT_THEME_ID);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [slug, setSlug] = useState("");
    const [subscriptionPlan, setSubscriptionPlan] = useState("free-basic");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<"theme" | "banner" | "nav" | "color" | "menu">("theme");

    // Logo
    const [logoUrl, setLogoUrl] = useState("");
    const [origLogoUrl, setOrigLogoUrl] = useState("");
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // PRO settings
    const [banners, setBanners] = useState<BannerSlide[]>([]);
    const [bottomNav, setBottomNav] = useState<NavItem[]>(defaultNavItems);
    const [customColor, setCustomColor] = useState("");
    const [storeMenus, setStoreMenus] = useState<StoreMenuSection[]>(DEFAULT_STORE_MENUS);

    // Originals for dirty tracking
    const [origBanners, setOrigBanners] = useState<string>("");
    const [origNav, setOrigNav] = useState<string>("");
    const [origColor, setOrigColor] = useState("");
    const [origMenus, setOrigMenus] = useState<string>("");

    // Upload refs
    const [uploadingBanner, setUploadingBanner] = useState<number | null>(null);

    const isPro = subscriptionPlan === "pro";

    useEffect(() => {
        tenantAPI.getMe().then((res) => {
            const tenant = res.data.data;
            const theme = tenant?.settings?.store_theme || DEFAULT_THEME_ID;
            setCurrentTheme(theme);
            setSelectedTheme(theme);
            setSlug(tenant?.slug || "");
            setSubscriptionPlan(tenant?.subscription_plan || "free-basic");
            setLogoUrl(tenant?.logo_url || "");
            setOrigLogoUrl(tenant?.logo_url || "");

            const b = (tenant?.settings?.banners as BannerSlide[]) || [];
            const n = (tenant?.settings?.bottom_nav as NavItem[]) || defaultNavItems;
            const c = (tenant?.settings?.custom_color as string) || "";
            const m = (tenant?.settings?.store_menu as StoreMenuSection[]) || DEFAULT_STORE_MENUS;
            setBanners(b);
            setBottomNav(n);
            setCustomColor(c);
            setStoreMenus(m);
            setOrigBanners(JSON.stringify(b));
            setOrigNav(JSON.stringify(n));
            setOrigColor(c);
            setOrigMenus(JSON.stringify(m));
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const isDirty =
        selectedTheme !== currentTheme ||
        JSON.stringify(banners) !== origBanners ||
        JSON.stringify(bottomNav) !== origNav ||
        customColor !== origColor ||
        logoUrl !== origLogoUrl ||
        JSON.stringify(storeMenus) !== origMenus;

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const settings: Record<string, unknown> = { store_theme: selectedTheme };
            if (isPro) {
                settings.banners = banners;
                settings.bottom_nav = bottomNav;
                settings.custom_color = customColor;
                settings.store_menu = storeMenus;
            }
            await tenantAPI.updateSettings(settings);
            // Also save logo if changed
            if (logoUrl !== origLogoUrl) {
                await userAPI.updateMerchant({ logo_url: logoUrl });
            }
            setCurrentTheme(selectedTheme);
            setOrigBanners(JSON.stringify(banners));
            setOrigNav(JSON.stringify(bottomNav));
            setOrigColor(customColor);
            setOrigLogoUrl(logoUrl);
            setOrigMenus(JSON.stringify(storeMenus));
            setMessage({ type: "success", text: "Semua pengaturan berhasil disimpan! ✨" });
            setTimeout(() => setMessage(null), 3000);
        } catch {
            setMessage({ type: "error", text: "Gagal menyimpan pengaturan" });
        } finally {
            setSaving(false);
        }
    };

    const shopeeThemes = STORE_THEMES.filter((t) => t.style === "shopee");
    const gofoodThemes = STORE_THEMES.filter((t) => t.style === "gofood");
    const activeTheme = STORE_THEMES.find((t) => t.id === selectedTheme) || STORE_THEMES[0];

    /* ── File upload helper ── */
    const handleFileUpload = useCallback(async (
        file: File,
        onSuccess: (url: string) => void,
        onStart?: () => void,
        onEnd?: () => void,
    ) => {
        if (!file.type.startsWith("image/")) {
            setMessage({ type: "error", text: "File harus berupa gambar (JPG, PNG, WEBP)" });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: "error", text: "Ukuran file maksimal 5MB" });
            return;
        }
        onStart?.();
        try {
            const res = await uploadAPI.upload(file);
            onSuccess(res.data.data.url);
        } catch {
            setMessage({ type: "error", text: "Gagal mengupload file" });
        } finally {
            onEnd?.();
        }
    }, []);

    /* ── Banner helpers ── */
    const addBanner = () => setBanners(prev => [...prev, { image_url: "", title: "" }]);
    const removeBanner = (idx: number) => setBanners(prev => prev.filter((_, i) => i !== idx));
    const updateBanner = (idx: number, field: keyof BannerSlide, value: string) => {
        setBanners(prev => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b));
    };

    /* ── Nav helpers ── */
    const addNavItem = () => {
        if (bottomNav.length >= 5) return;
        setBottomNav(prev => [...prev, { icon: "home", label: "New", action: "home" }]);
    };
    const removeNavItem = (idx: number) => setBottomNav(prev => prev.filter((_, i) => i !== idx));
    const updateNavItem = (idx: number, field: keyof NavItem, value: string) => {
        setBottomNav(prev => prev.map((n, i) => i === idx ? { ...n, [field]: value } : n));
    };

    /* ── Store menu helpers ── */
    const toggleMenu = (id: string) => {
        setStoreMenus(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
    };
    const updateMenuTitle = (id: string, title: string) => {
        setStoreMenus(prev => prev.map(m => m.id === id ? { ...m, title } : m));
    };

    /* ── FileDropZone component ── */
    const FileDropZone = ({ onFile, uploading, currentUrl, label, className = "" }: {
        onFile: (f: File) => void; uploading: boolean; currentUrl?: string; label: string; className?: string;
    }) => {
        const [dragOver, setDragOver] = useState(false);
        const inputRef = useRef<HTMLInputElement>(null);
        return (
            <div
                className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer ${dragOver ? 'border-[#C40000] bg-[#C40000]/5' : 'border-white/15 hover:border-white/30'} ${className}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); }}
                onClick={() => inputRef.current?.click()}
            >
                <input ref={inputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} />
                {uploading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <Loader2 className="w-8 h-8 text-[#C40000] animate-spin" />
                        <span className="text-xs text-white/40">Mengupload...</span>
                    </div>
                ) : currentUrl ? (
                    <div className="relative group">
                        <img src={currentUrl} alt={label} className="w-full h-full object-cover rounded-xl" style={{ minHeight: 80, maxHeight: 160 }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                            <div className="text-center">
                                <Upload className="w-6 h-6 text-white mx-auto mb-1" />
                                <span className="text-xs text-white">Ganti {label}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                            <Upload className="w-5 h-5 text-white/30" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-white/50">Klik atau seret {label}</p>
                            <p className="text-[10px] text-white/25 mt-0.5">JPG, PNG, WEBP • Maks 5MB</p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Mini preview of a theme
    const ThemePreview = ({ theme, selected }: { theme: StoreTheme; selected: boolean }) => {
        const isDark = theme.style === "shopee";
        return (
            <button
                onClick={() => setSelectedTheme(theme.id)}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 theme-card-hover group ${selected
                    ? 'border-[#C40000] shadow-lg shadow-[#C40000]/20 ring-2 ring-[#C40000]/30'
                    : 'border-white/10 hover:border-white/30'
                    }`}
            >
                <div className="aspect-[3/4] p-2.5 flex flex-col" style={{ backgroundColor: theme.bgBase }}>
                    <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-6 h-6 rounded-lg flex-shrink-0" style={{ background: theme.accentGradient }} />
                        <div className="flex-1 min-w-0">
                            <div className={`h-2 rounded-full w-16 ${isDark ? 'bg-white/20' : 'bg-gray-200'}`} />
                            <div className={`h-1.5 rounded-full w-10 mt-1 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
                        </div>
                    </div>
                    <div className={`h-5 rounded-lg mb-2 ${theme.searchBg} border ${theme.searchBorder}`} />
                    <div className="flex gap-1 mb-2 justify-center">
                        <div className="w-5 h-5 rounded-full" style={{ background: theme.accentGradient }} />
                        <div className={`w-5 h-5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
                        <div className={`w-5 h-5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-1 flex-1">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className={`rounded-lg ${theme.cardBg} border ${theme.cardBorder} overflow-hidden`}>
                                <div className={`aspect-square ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`} />
                                <div className="p-1">
                                    <div className={`h-1.5 rounded-full w-full ${isDark ? 'bg-white/15' : 'bg-gray-200'}`} />
                                    <div className="h-1.5 rounded-full w-8 mt-0.5" style={{ backgroundColor: theme.accent + '40' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={`h-5 rounded-lg mt-2 flex items-center justify-around ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: i === 0 ? theme.accent : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') }} />
                        ))}
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <span className="text-base">{theme.preview}</span>
                            <span className="text-[11px] font-medium text-white truncate">{theme.name}</span>
                        </div>
                        {selected && (
                            <div className="w-5 h-5 rounded-full bg-[#C40000] flex items-center justify-center animate-pulse-glow">
                                <Check className="w-3 h-3 text-white" />
                            </div>
                        )}
                    </div>
                </div>
                {theme.id === currentTheme && (
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-[#C40000] rounded-full text-[9px] font-bold text-white">AKTIF</div>
                )}
            </button>
        );
    };

    // Live preview
    const LivePreview = () => {
        const t = activeTheme;
        const isDark = t.style === "shopee";
        const previewAccent = isPro && customColor ? customColor : t.accent;
        const previewGradient = isPro && customColor ? `linear-gradient(135deg, ${customColor}, ${customColor}dd)` : t.accentGradient;
        const enabledMenus = storeMenus.filter(m => m.enabled);
        return (
            <div className="rounded-2xl overflow-hidden border border-white/10" style={{ backgroundColor: t.bgBase }}>
                {!isDark && (
                    <div className="absolute inset-0 pointer-events-none opacity-30 rounded-2xl"
                        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                )}
                {/* Banner */}
                {isPro && banners.length > 0 && (
                    <div className="h-16 w-full bg-gradient-to-r from-gray-600 to-gray-500 flex items-center justify-center overflow-hidden">
                        {banners[0].image_url ? (
                            <img src={banners[0].image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[9px] text-white/60">🖼️ Hero Banner</span>
                        )}
                    </div>
                )}
                <div className="relative p-4">
                    <div className={`absolute inset-0 bg-gradient-to-b ${t.bgGradient}`} />
                    <div className="relative flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 overflow-hidden" style={{ background: previewGradient }}>
                            {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : "🏪"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className={`text-base font-bold truncate ${t.textPrimary}`}>Toko Saya</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center gap-1 text-[10px] ${t.textMuted}`}><Clock className="w-2.5 h-2.5" /> 09:00 – 17:00</span>
                                {isPro && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/90 text-amber-900">PRO</span>}
                            </div>
                        </div>
                    </div>
                    <div className="relative mt-3">
                        <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 ${t.textMuted}`} />
                        <div className={`w-full pl-7 pr-3 py-2 ${t.searchBg} border ${t.searchBorder} rounded-xl text-[10px] ${isDark ? 'text-white/25' : 'text-gray-300'}`}>Cari produk...</div>
                    </div>
                </div>
                {/* Category icons */}
                <div className="px-4 flex gap-3 pb-3 justify-center">
                    {["🏪", "🍛", "🥤", "🍟"].map((icon, i) => (
                        <div key={i} className="flex flex-col items-center gap-0.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${i === 0 ? '' : isDark ? 'bg-white/10' : 'bg-gray-100'}`}
                                style={i === 0 ? { background: previewGradient } : {}}>
                                {i === 0 ? <span className="text-white text-[8px]">{icon}</span> : icon}
                            </div>
                            <span className={`text-[7px] ${i === 0 ? t.textPrimary : t.textMuted}`}>{["Semua", "Makan", "Minum", "Snack"][i]}</span>
                        </div>
                    ))}
                </div>
                {/* Store menu previews */}
                {isPro && enabledMenus.length > 0 && (
                    <div className="px-4 pb-2 space-y-1">
                        {enabledMenus.slice(0, 3).map(m => (
                            <div key={m.id} className={`px-2 py-1 rounded-md text-[7px] font-medium ${isDark ? 'bg-white/5 text-white/40' : 'bg-gray-50 text-gray-400'}`}>
                                {m.title || m.label}
                            </div>
                        ))}
                    </div>
                )}
                {/* Products */}
                <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                    {["Nasi Goreng", "Es Teh", "Mie Ayam", "Jus Jeruk"].map((name, i) => (
                        <div key={i} className={`${t.cardBg} border ${t.cardBorder} rounded-xl overflow-hidden`}>
                            <div className={`aspect-square flex items-center justify-center ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                                <ShoppingBag className={`w-6 h-6 ${isDark ? 'text-white/10' : 'text-gray-200'}`} />
                            </div>
                            <div className="p-2">
                                <p className={`text-[11px] font-semibold truncate ${t.textPrimary}`}>{name}</p>
                                <div className="flex items-center justify-between mt-0.5">
                                    <p className="text-[10px] font-bold" style={{ color: previewAccent }}>Rp 15.000</p>
                                    <div className="w-4 h-4 rounded-md flex items-center justify-center" style={{ background: previewGradient }}>
                                        <Plus className="w-2 h-2 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Bottom nav */}
                <div className={`px-4 py-2 ${t.footerBg} border-t ${t.footerBorder} flex items-center justify-around`}>
                    {(isPro ? bottomNav : defaultNavItems).slice(0, 4).map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-0.5">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: i === 0 ? previewAccent : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'), }} />
                            <span className="text-[6px]" style={{ color: i === 0 ? previewAccent : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') }}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // PRO lock overlay
    const ProLock = ({ feature }: { feature: string }) => (
        <div className="glass p-6 flex flex-col items-center justify-center text-center space-y-3 border border-amber-400/20 bg-amber-400/5 rounded-xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg animate-float">
                <Crown className="w-7 h-7 text-white" />
            </div>
            <div>
                <h3 className="text-white font-bold text-lg">Fitur PRO</h3>
                <p className="text-white/40 text-sm mt-1">{feature}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 w-full max-w-sm space-y-2">
                {["Hero Banner Slider", "Custom Bottom Navigation", "Custom Warna Aksen", "Menu Toko Marketplace", "500 Produk · 5 Outlet · 10 User"].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-white/60 text-xs">
                        <Check className="w-3 h-3 text-amber-400" /> {f}
                    </div>
                ))}
            </div>
            <div className="text-center">
                <p className="text-amber-400 font-bold text-2xl">Rp 2.000.000<span className="text-sm font-normal text-white/40">/tahun</span></p>
                <p className="text-white/30 text-xs mt-1">Setara Rp 167.000/bulan — hemat & lengkap!</p>
            </div>
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all">
                <Lock className="w-4 h-4 inline mr-2" />Upgrade ke PRO
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-[#C40000] animate-spin" />
            </div>
        );
    }

    const tabs = [
        { id: "theme", label: "Template", icon: <Palette className="w-4 h-4" /> },
        { id: "banner", label: "Banner & Logo", icon: <Image className="w-4 h-4" />, pro: true },
        { id: "menu", label: "Menu Toko", icon: <Store className="w-4 h-4" />, pro: true },
        { id: "nav", label: "Navigasi", icon: <Navigation className="w-4 h-4" />, pro: true },
        { id: "color", label: "Warna", icon: <Droplets className="w-4 h-4" />, pro: true },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C40000] to-[#FF4444] flex items-center justify-center">
                            <Palette className="w-5 h-5 text-white" />
                        </div>
                        Template Toko
                        {isPro && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white">PRO</span>}
                    </h1>
                    <p className="text-white/40 text-sm mt-1">Kelola tampilan toko online Anda</p>
                </div>
                <div className="flex items-center gap-3">
                    {slug && (
                        <a href={`/store/${slug}`} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1.5 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" /> Lihat Toko
                        </a>
                    )}
                    <button onClick={handleSave} disabled={!isDirty || saving}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${isDirty
                            ? 'bg-gradient-to-r from-[#C40000] to-[#FF4444] text-white shadow-lg shadow-red-900/30 hover:shadow-red-900/50'
                            : 'bg-white/5 text-white/20 cursor-not-allowed'
                            }`}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium animate-slide-in-up ${message.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit flex-wrap">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                            ? 'bg-[#C40000] text-white shadow-lg'
                            : 'text-white/40 hover:text-white/70'
                            }`}>
                        {tab.icon}
                        {tab.label}
                        {tab.pro && !isPro && <Lock className="w-3 h-3 text-amber-400" />}
                        {tab.pro && isPro && <Crown className="w-3 h-3 text-amber-400" />}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: Tab content */}
                <div className="xl:col-span-2 space-y-6">
                    {/* THEME TAB */}
                    {activeTab === "theme" && (
                        <>
                            <div className="glass p-5 animate-slide-in-up">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center"><span className="text-sm">🌙</span></div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-white">Dark Mode — {shopeeThemes.length} Template</h2>
                                        <p className="text-[11px] text-white/30">Background gelap dengan warna aksen dinamis</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                    {shopeeThemes.map((theme, i) => (
                                        <div key={theme.id} className={`animate-slide-in-up stagger-${Math.min(i + 1, 10)}`}>
                                            <ThemePreview theme={theme} selected={selectedTheme === theme.id} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="glass p-5 animate-slide-in-up stagger-3">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center"><span className="text-sm">☀️</span></div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-white">Light Mode — {gofoodThemes.length} Template</h2>
                                        <p className="text-[11px] text-white/30">Background putih bertexture dengan warna identitas</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                    {gofoodThemes.map((theme, i) => (
                                        <div key={theme.id} className={`animate-slide-in-up stagger-${Math.min(i + 1, 10)}`}>
                                            <ThemePreview theme={theme} selected={selectedTheme === theme.id} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* BANNER & LOGO TAB */}
                    {activeTab === "banner" && (
                        isPro ? (
                            <div className="space-y-6 animate-slide-in-up">
                                {/* Logo Section */}
                                <div className="glass p-5 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#C40000] to-[#FF4444] flex items-center justify-center"><Store className="w-3.5 h-3.5 text-white" /></div>
                                        <div>
                                            <h2 className="text-sm font-semibold text-white">Logo Toko</h2>
                                            <p className="text-[11px] text-white/30">Upload logo dari perangkat Anda</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-24 h-24 flex-shrink-0">
                                            <FileDropZone
                                                label="logo"
                                                uploading={uploadingLogo}
                                                currentUrl={logoUrl}
                                                onFile={(f) => handleFileUpload(f, (url) => setLogoUrl(url), () => setUploadingLogo(true), () => setUploadingLogo(false))}
                                                className="w-24 h-24"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <p className="text-xs text-white/50">Logo toko akan ditampilkan di header toko online Anda.</p>
                                            <p className="text-[10px] text-white/25">Rekomendasi: 200x200px, format PNG transparan</p>
                                            {logoUrl && (
                                                <button onClick={() => setLogoUrl("")} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                                                    <Trash2 className="w-3 h-3" /> Hapus logo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Banner Section */}
                                <div className="glass p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"><Image className="w-3.5 h-3.5 text-white" /></div>
                                            <div>
                                                <h2 className="text-sm font-semibold text-white">Hero Banner Slider</h2>
                                                <p className="text-[11px] text-white/30">Upload dari perangkat, auto-slide setiap 4 detik</p>
                                            </div>
                                        </div>
                                        <button onClick={addBanner} className="px-3 py-2 rounded-lg bg-[#C40000] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#A00000] transition-colors">
                                            <Plus className="w-3 h-3" /> Tambah
                                        </button>
                                    </div>
                                    {banners.length === 0 ? (
                                        <div className="text-center py-10 bg-white/5 rounded-xl border border-dashed border-white/10">
                                            <Image className="w-10 h-10 text-white/10 mx-auto mb-3" />
                                            <p className="text-white/30 text-sm">Belum ada banner</p>
                                            <p className="text-white/15 text-xs mt-1">Klik &quot;Tambah&quot; untuk menambahkan slide banner</p>
                                        </div>
                                    ) : (
                                        banners.map((banner, idx) => (
                                            <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3 animate-slide-in-up">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <GripVertical className="w-4 h-4 text-white/20" />
                                                        <span className="text-xs font-medium text-white/60">Slide {idx + 1}</span>
                                                    </div>
                                                    <button onClick={() => removeBanner(idx)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Gambar Banner *</label>
                                                        <FileDropZone
                                                            label="gambar banner"
                                                            uploading={uploadingBanner === idx}
                                                            currentUrl={banner.image_url}
                                                            onFile={(f) => handleFileUpload(f, (url) => updateBanner(idx, 'image_url', url), () => setUploadingBanner(idx), () => setUploadingBanner(null))}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Judul (opsional)</label>
                                                        <input type="text" value={banner.title || ''} onChange={e => updateBanner(idx, 'title', e.target.value)}
                                                            placeholder="Promo Spesial!" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-[#C40000]" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : <ProLock feature="Upload logo & banner dari perangkat Anda" />
                    )}

                    {/* MENU TOKO TAB */}
                    {activeTab === "menu" && (
                        isPro ? (
                            <div className="glass p-5 space-y-4 animate-slide-in-up">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"><Store className="w-3.5 h-3.5 text-white" /></div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-white">Menu & Section Toko</h2>
                                        <p className="text-[11px] text-white/30">Atur section toko seperti Tokopedia, Shopee & Blibli</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {storeMenus.map((menu, i) => (
                                        <div key={menu.id} className={`bg-white/5 rounded-xl p-4 border transition-all animate-slide-in-up stagger-${Math.min(i + 1, 10)} ${menu.enabled ? 'border-[#C40000]/30 bg-[#C40000]/5' : 'border-white/10'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${menu.enabled ? 'bg-[#C40000]/20 text-[#FF4444]' : 'bg-white/5 text-white/30'}`}>
                                                        {menuIcons[menu.icon]}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-medium ${menu.enabled ? 'text-white' : 'text-white/50'}`}>{menu.label}</p>
                                                        <p className="text-[10px] text-white/25">{menu.enabled ? 'Aktif — akan ditampilkan di toko' : 'Nonaktif'}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => toggleMenu(menu.id)}
                                                    className={`relative w-11 h-6 rounded-full transition-all ${menu.enabled ? 'bg-[#C40000]' : 'bg-white/10'}`}>
                                                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${menu.enabled ? 'left-5.5' : 'left-0.5'}`}
                                                        style={{ left: menu.enabled ? 22 : 2 }} />
                                                </button>
                                            </div>
                                            {menu.enabled && (
                                                <div className="mt-3 pt-3 border-t border-white/5">
                                                    <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Judul Section</label>
                                                    <input type="text" value={menu.title || ''} onChange={e => updateMenuTitle(menu.id, e.target.value)}
                                                        placeholder={menu.label} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-[#C40000]" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : <ProLock feature="Atur menu & section toko seperti marketplace" />
                    )}

                    {/* NAV TAB */}
                    {activeTab === "nav" && (
                        isPro ? (
                            <div className="glass p-5 space-y-4 animate-slide-in-up">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"><Navigation className="w-3.5 h-3.5 text-white" /></div>
                                        <div>
                                            <h2 className="text-sm font-semibold text-white">Menu Navigasi Bawah</h2>
                                            <p className="text-[11px] text-white/30">Maksimal 5 item navigasi di bottom bar</p>
                                        </div>
                                    </div>
                                    {bottomNav.length < 5 && (
                                        <button onClick={addNavItem} className="px-3 py-2 rounded-lg bg-[#C40000] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#A00000] transition-colors">
                                            <Plus className="w-3 h-3" /> Tambah
                                        </button>
                                    )}
                                </div>
                                {bottomNav.map((item, idx) => (
                                    <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <GripVertical className="w-4 h-4 text-white/20" />
                                                <span className="text-xs font-medium text-white/60">Item {idx + 1}</span>
                                            </div>
                                            {bottomNav.length > 2 && (
                                                <button onClick={() => removeNavItem(idx)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Icon</label>
                                                <select value={item.icon} onChange={e => { updateNavItem(idx, 'icon', e.target.value); updateNavItem(idx, 'action', e.target.value); }}
                                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#C40000]">
                                                    {navIconOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Label</label>
                                                <input type="text" value={item.label} onChange={e => updateNavItem(idx, 'label', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-[#C40000]" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Aksi</label>
                                                <select value={item.action} onChange={e => updateNavItem(idx, 'action', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#C40000]">
                                                    <option value="home">Beranda</option>
                                                    <option value="menu">Menu</option>
                                                    <option value="cart">Keranjang</option>
                                                    <option value="search">Cari</option>
                                                    <option value="info">Info</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                                            <span className="text-white/40">{navIconOptions.find(o => o.value === item.icon)?.icon}</span>
                                            <span className="text-xs text-white/60">{item.label}</span>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => setBottomNav(defaultNavItems)} className="text-xs text-white/30 hover:text-white/50 transition-colors">
                                    ↻ Reset ke default
                                </button>
                            </div>
                        ) : <ProLock feature="Ubah menu navigasi bawah toko Anda" />
                    )}

                    {/* COLOR TAB */}
                    {activeTab === "color" && (
                        isPro ? (
                            <div className="glass p-5 space-y-4 animate-slide-in-up">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"><Droplets className="w-3.5 h-3.5 text-white" /></div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-white">Warna Aksen Custom</h2>
                                        <p className="text-[11px] text-white/30">Override warna utama dari template yang dipilih</p>
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <input type="color" value={customColor || activeTheme.accent} onChange={e => setCustomColor(e.target.value)}
                                                className="w-14 h-14 rounded-xl border-2 border-white/10 cursor-pointer bg-transparent" style={{ padding: 2 }} />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Hex Color</label>
                                            <div className="flex gap-2">
                                                <input type="text" value={customColor || ''} onChange={e => setCustomColor(e.target.value)} placeholder={activeTheme.accent}
                                                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white font-mono placeholder:text-white/15 focus:outline-none focus:border-[#C40000]" />
                                                {customColor && (
                                                    <button onClick={() => setCustomColor('')} className="px-3 py-2 rounded-lg bg-white/5 text-white/40 hover:text-white/70 text-xs border border-white/10">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-white/30 mb-2">Warna populer:</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {['#C40000', '#EE4D2D', '#00AA5B', '#1DA1F2', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#6366F1', '#10B981'].map(color => (
                                                <button key={color} onClick={() => setCustomColor(color)}
                                                    className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${customColor === color ? 'border-white shadow-lg' : 'border-white/10'}`}
                                                    style={{ backgroundColor: color }} />
                                            ))}
                                        </div>
                                    </div>
                                    {customColor && (
                                        <div className="flex items-center gap-3 bg-black/20 rounded-lg p-3">
                                            <div className="w-8 h-8 rounded-lg" style={{ background: `linear-gradient(135deg, ${customColor}, ${customColor}dd)` }} />
                                            <div>
                                                <p className="text-xs text-white/60">Warna aksen akan diterapkan pada tombol, harga, dan navigasi</p>
                                                <p className="text-[10px] text-white/30 font-mono mt-0.5">{customColor}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : <ProLock feature="Ubah warna aksen toko sesuai brand Anda" />
                    )}
                </div>

                {/* Right: Live Preview */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">Preview Live</h3>
                        <span className="text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded-full">
                            {activeTheme.preview} {activeTheme.name}
                        </span>
                    </div>
                    <LivePreview />

                    {/* Plan info */}
                    <div className={`rounded-xl p-4 border ${isPro ? 'bg-amber-400/5 border-amber-400/20' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            {isPro ? <Crown className="w-4 h-4 text-amber-400" /> : <Tag className="w-4 h-4 text-white/30" />}
                            <span className={`text-xs font-semibold ${isPro ? 'text-amber-400' : 'text-white/60'}`}>
                                {isPro ? 'Paket PRO' : 'Paket Free'}
                            </span>
                        </div>
                        <p className={`text-[11px] ${isPro ? 'text-amber-400/60' : 'text-white/30'}`}>
                            {isPro
                                ? 'Semua fitur aktif: Banner, Logo, Menu Toko, Navigasi, Warna'
                                : 'Template dasar aktif. Upgrade ke PRO untuk fitur premium.'
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
