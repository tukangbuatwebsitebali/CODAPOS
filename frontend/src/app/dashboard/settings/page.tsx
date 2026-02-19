"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { subscriptionAPI, tenantAPI } from "@/lib/api";
import api from "@/lib/api";
import {
    Crown, Check, Zap, Store, Users, Package, ArrowRight, Shield, Star, Sparkles,
    Building2, Clock, Lock, Eye, EyeOff, ChevronDown, ChevronRight, Save, Loader2,
    Upload, AlertCircle, Settings, CreditCard, ToggleLeft, ToggleRight, X, CheckCircle2,
} from "lucide-react";

// ═════════════════════════ HARDCODED PLANS ═════════════════════════
interface PlanDef {
    slug: string;
    name: string;
    tagline: string;
    priceMonthly: number;
    priceYearly: number;
    maxOutlets: number;
    maxUsers: number;
    maxProducts: number;
    features: string[];
    highlight: boolean;
    icon: typeof Crown;
    gradient: string;
}

const PLANS: PlanDef[] = [
    {
        slug: "free-basic",
        name: "Free",
        tagline: "Mulai gratis, tingkatkan kapan saja",
        priceMonthly: 0,
        priceYearly: 0,
        maxOutlets: 1,
        maxUsers: 1,
        maxProducts: 30,
        features: [
            "POS Kasir Dasar",
            "Laporan Sederhana",
            "1 Template Toko",
            "Manajemen Produk Dasar",
            "6 Bulan Gratis",
        ],
        highlight: false,
        icon: Sparkles,
        gradient: "from-white/10 to-white/5",
    },
    {
        slug: "pro",
        name: "Pro",
        tagline: "Untuk bisnis berkembang & franchise",
        priceMonthly: 99000,
        priceYearly: 999000,
        maxOutlets: 5,
        maxUsers: 10,
        maxProducts: 999,
        features: [
            "Semua Fitur POS",
            "Multi-Role Tim",
            "Laporan Detail + AI Forecast",
            "Payment Gateway (Midtrans)",
            "Printer Bluetooth / Thermal",
            "Auto Ordering",
            "Template Custom (20+ tema)",
            "Kurir Sendiri (MyKurir)",
            "Jam Operasional Custom",
            "Custom Domain",
            "Prioritas Support 24/7",
        ],
        highlight: true,
        icon: Crown,
        gradient: "from-yellow-500/20 to-orange-500/10",
    },
];

const COMPARISON_FEATURES = [
    { label: "Outlet", free: "1", pro: "5" },
    { label: "User / Staf", free: "1", pro: "10" },
    { label: "Produk", free: "30", pro: "Unlimited" },
    { label: "POS Kasir", free: "✓", pro: "✓" },
    { label: "Laporan", free: "Sederhana", pro: "Detail + AI" },
    { label: "Template Toko", free: "1 tema", pro: "20+ tema" },
    { label: "Multi-Role Tim", free: "✗", pro: "✓" },
    { label: "Payment Gateway", free: "✗", pro: "✓" },
    { label: "Printer Bluetooth", free: "✗", pro: "✓" },
    { label: "Auto Ordering", free: "✗", pro: "✓" },
    { label: "Custom Domain", free: "✗", pro: "✓" },
    { label: "Kurir Sendiri", free: "✗", pro: "✓" },
    { label: "AI Forecast", free: "✗", pro: "✓" },
    { label: "Support", free: "Komunitas", pro: "Prioritas 24/7" },
];

const FEATURE_FLAGS = [
    { key: "custom_domain", label: "Custom Domain", desc: "Gunakan domain sendiri untuk toko online", icon: "🌐", pro: true },
    { key: "multi_role", label: "Multi-Role Tim", desc: "Atur hak akses per staf (kasir, admin, manager)", icon: "👥", pro: true },
    { key: "automation_ordering", label: "Auto Ordering", desc: "Pesanan otomatis dari supplier saat stok menipis", icon: "🤖", pro: true },
    { key: "payment_gateway", label: "Payment Gateway", desc: "Terima QRIS, kartu kredit via Midtrans", icon: "💳", pro: true },
    { key: "detailed_report", label: "Laporan Detail", desc: "Analisis penjualan, profit, dan tren", icon: "📊", pro: true },
    { key: "forecast_ai", label: "AI Forecast", desc: "Prediksi penjualan dengan machine learning", icon: "🧠", pro: true },
    { key: "kurir_sendiri", label: "Kurir Sendiri", desc: "Kelola armada kurir untuk pengiriman", icon: "🚚", pro: true },
    { key: "custom_hours", label: "Jam Operasional Custom", desc: "Atur jam buka-tutup per hari", icon: "⏰", pro: true },
    { key: "printer_bluetooth", label: "Printer Bluetooth", desc: "Cetak struk via Bluetooth thermal printer", icon: "🖨️", pro: true },
    { key: "custom_template", label: "Template Custom", desc: "Akses 20+ tema premium untuk toko online", icon: "🎨", pro: true },
];

const FAQS = [
    { q: "Apakah data saya hilang jika Free habis?", a: "Tidak. Data Anda tetap aman. Anda hanya perlu upgrade untuk mengakses fitur premium." },
    { q: "Bisa downgrade dari Pro ke Free?", a: "Ya, setelah masa aktif Pro berakhir, akun otomatis kembali ke Free." },
    { q: "Apakah ada biaya tersembunyi?", a: "Tidak ada. Harga sudah termasuk semua fitur pada paket tersebut." },
    { q: "Bagaimana cara membayar?", a: "Kami mendukung transfer bank, QRIS, dan kartu kredit melalui Midtrans." },
];

const TABS = [
    { id: "business", label: "Profil Bisnis", icon: Building2 },
    { id: "subscription", label: "Langganan", icon: CreditCard },
    { id: "features", label: "Fitur", icon: ToggleRight },
    { id: "operations", label: "Operasional", icon: Clock },
    { id: "security", label: "Keamanan", icon: Lock },
] as const;
type TabId = typeof TABS[number]["id"];

// ═════════════════════════ COMPONENT ═════════════════════════
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabId>("business");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Business Profile
    const [tenant, setTenant] = useState<Record<string, unknown>>({});
    const [profile, setProfile] = useState<Record<string, unknown>>({});

    // Subscription
    const [currentPlan, setCurrentPlan] = useState("free-basic");
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [features, setFeatures] = useState<Record<string, boolean>>({});
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [upgrading, setUpgrading] = useState(false);

    // Operations
    const [openTime, setOpenTime] = useState("09:00");
    const [closeTime, setCloseTime] = useState("17:00");

    // Security
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showOldPw, setShowOldPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    // Business form
    const [businessName, setBusinessName] = useState("");
    const [slug, setSlug] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [bankName, setBankName] = useState("");
    const [bankAccount, setBankAccount] = useState("");
    const [bankHolder, setBankHolder] = useState("");
    const [logoUrl, setLogoUrl] = useState("");

    // FAQ accordion
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    // File ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Load Data ──
    const loadData = useCallback(async () => {
        try {
            const [tenantRes, statusRes, profileRes] = await Promise.all([
                tenantAPI.getMe(),
                subscriptionAPI.getStatus().catch(() => ({ data: { data: null } })),
                api.get("/me").catch(() => ({ data: { data: null } })),
            ]);

            const t = tenantRes.data.data || {};
            setTenant(t);
            setBusinessName(t.name || "");
            setSlug(t.slug || "");
            setPhone(t.phone || "");
            setAddress(t.address || "");
            setBankName(t.bank_name || "");
            setBankAccount(t.bank_account_number || "");
            setBankHolder(t.bank_account_holder || "");
            setLogoUrl(t.logo_url || "");
            setOpenTime(t.open_time || "09:00");
            setCloseTime(t.close_time || "17:00");

            const s = statusRes.data.data;
            if (s) {
                setCurrentPlan((s as Record<string, unknown>).current_plan as string || "free-basic");
                setExpiresAt((s as Record<string, unknown>).subscription_expires as string || null);
                setFeatures((s as Record<string, unknown>).features as Record<string, boolean> || {});
            }

            const p = profileRes.data.data;
            if (p) setProfile(p as Record<string, unknown>);
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (type: "success" | "error", text: string) => setToast({ type, text });

    // ── Save Business Profile ──
    const handleSaveBusiness = async () => {
        setSaving(true);
        try {
            await api.put("/me/merchant", {
                name: businessName,
                phone,
                address,
                bank_name: bankName,
                bank_account_number: bankAccount,
                bank_account_holder: bankHolder,
                logo_url: logoUrl,
            });
            showToast("success", "Profil bisnis berhasil disimpan!");
        } catch {
            showToast("error", "Gagal menyimpan profil bisnis");
        } finally {
            setSaving(false);
        }
    };

    // ── Save Operations ──
    const handleSaveOperations = async () => {
        setSaving(true);
        try {
            await tenantAPI.updateSettings({ open_time: openTime, close_time: closeTime });
            showToast("success", "Jam operasional berhasil disimpan!");
        } catch {
            showToast("error", "Gagal menyimpan jam operasional");
        } finally {
            setSaving(false);
        }
    };

    // ── Change Password ──
    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            showToast("error", "Password baru dan konfirmasi tidak sama");
            return;
        }
        if (newPassword.length < 6) {
            showToast("error", "Password minimal 6 karakter");
            return;
        }
        setSaving(true);
        try {
            await api.put("/me/password", {
                old_password: oldPassword,
                new_password: newPassword,
            });
            showToast("success", "Password berhasil diubah!");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch {
            showToast("error", "Gagal mengubah password. Cek password lama Anda.");
        } finally {
            setSaving(false);
        }
    };

    // ── Upgrade subscription ──
    const handleUpgrade = async (planSlug: string) => {
        setUpgrading(true);
        try {
            // Find plan ID from backend — or just use slug
            await subscriptionAPI.upgrade(planSlug, billingCycle);
            showToast("success", "Paket berhasil di-upgrade! 🎉");
            await loadData();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            showToast("error", axiosErr.response?.data?.error || "Gagal upgrade paket");
        } finally {
            setUpgrading(false);
        }
    };

    // ── Logo Upload ──
    const handleLogoUpload = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const url = (res.data as Record<string, unknown>).url as string ||
                (res.data as Record<string, Record<string, string>>).data?.url || "";
            if (url) {
                setLogoUrl(url);
                showToast("success", "Logo berhasil diupload!");
            }
        } catch {
            showToast("error", "Gagal upload logo");
        }
    };

    const formatPrice = (amount: number) => {
        if (amount === 0) return "Gratis";
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
    };

    const isPro = currentPlan === "pro";

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-white/20 border-t-[#1DA1F2] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            {/* ─── Toast ─── */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl animate-slide-in-right ${toast.type === "success"
                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                    }`}>
                    {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span className="text-sm font-medium">{toast.text}</span>
                    <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* ─── Header ─── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1DA1F2] to-[#A7D8FF] flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        Pengaturan
                    </h1>
                    <p className="text-white/40 text-sm mt-1">Kelola bisnis, langganan, dan keamanan akun Anda</p>
                </div>
                {isPro && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                        <Crown className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs font-semibold text-yellow-400">PRO</span>
                    </div>
                )}
            </div>

            {/* ─── Tabs ─── */}
            <div className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/5 overflow-x-auto">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${isActive
                                ? "bg-[#1DA1F2] text-white shadow-lg shadow-blue-500/25"
                                : "text-white/40 hover:text-white/70 hover:bg-white/5"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ─── Tab Content ─── */}
            <div className="animate-fade-in" key={activeTab}>
                {/* ═══════ TAB 1: PROFIL BISNIS ═══════ */}
                {activeTab === "business" && (
                    <div className="space-y-6">
                        {/* Logo */}
                        <div className="glass-strong p-6 rounded-2xl">
                            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Logo Usaha</h3>
                            <div className="flex items-center gap-6">
                                <div
                                    className="w-24 h-24 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#1DA1F2]/40 transition-all group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {logoUrl ? (
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8080"}${logoUrl}`}
                                            alt="Logo"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Upload className="w-8 h-8 text-white/20 group-hover:text-[#1DA1F2]/60 transition" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-white/70">Klik untuk upload logo</p>
                                    <p className="text-xs text-white/30 mt-1">PNG, JPG, maks 2MB</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) handleLogoUpload(f);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Business Info */}
                        <div className="glass-strong p-6 rounded-2xl">
                            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Informasi Bisnis</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Nama Usaha</label>
                                    <input className="input-glass w-full" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Nama usaha Anda" />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Slug / Subdomain</label>
                                    <input className="input-glass w-full" value={slug} disabled placeholder="auto-generated" />
                                    <p className="text-[10px] text-white/20 mt-1">Slug tidak dapat diubah</p>
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Telepon</label>
                                    <input className="input-glass w-full" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs text-white/40 mb-1 block">Alamat</label>
                                    <textarea className="input-glass w-full min-h-[80px] resize-none" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat lengkap usaha" />
                                </div>
                            </div>
                        </div>

                        {/* Bank Info */}
                        <div className="glass-strong p-6 rounded-2xl">
                            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Informasi Bank</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Nama Bank</label>
                                    <input className="input-glass w-full" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="BCA, Mandiri, dll" />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">No. Rekening</label>
                                    <input className="input-glass w-full" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="1234567890" />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Pemegang Rekening</label>
                                    <input className="input-glass w-full" value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} placeholder="Nama sesuai rekening" />
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSaveBusiness} disabled={saving} className="btn-primary flex items-center gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan Profil Bisnis
                        </button>
                    </div>
                )}

                {/* ═══════ TAB 2: LANGGANAN ═══════ */}
                {activeTab === "subscription" && (
                    <div className="space-y-8">
                        {/* Current Status */}
                        <div className="glass-strong p-6 rounded-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#1DA1F2]/5 to-transparent pointer-events-none" />
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wider">Paket Saat Ini</p>
                                    <p className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                                        {isPro ? <Crown className="w-5 h-5 text-yellow-400" /> : <Sparkles className="w-5 h-5 text-[#1DA1F2]" />}
                                        {isPro ? "Pro" : "Free"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-white/40">Berlaku hingga</p>
                                    <p className="text-sm font-medium text-white/80">
                                        {expiresAt ? new Date(expiresAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center gap-3">
                            <span className={`text-sm ${billingCycle === "monthly" ? "text-white font-semibold" : "text-white/40"}`}>Bulanan</span>
                            <button
                                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                                className={`relative w-14 h-7 rounded-full transition-all ${billingCycle === "yearly" ? "bg-[#1DA1F2]" : "bg-white/20"}`}
                            >
                                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${billingCycle === "yearly" ? "translate-x-7" : "translate-x-0.5"}`} />
                            </button>
                            <span className={`text-sm ${billingCycle === "yearly" ? "text-white font-semibold" : "text-white/40"}`}>
                                Tahunan
                                <span className="ml-1 text-xs text-green-400 font-medium">Hemat 16%</span>
                            </span>
                        </div>

                        {/* Pricing Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {PLANS.map((plan) => {
                                const isCurrentPlan = currentPlan === plan.slug;
                                const Icon = plan.icon;
                                const price = billingCycle === "yearly" && plan.priceYearly > 0 ? plan.priceYearly : plan.priceMonthly;

                                return (
                                    <div
                                        key={plan.slug}
                                        className={`relative p-6 rounded-2xl border transition-all ${plan.highlight
                                            ? "border-[#1DA1F2]/40 bg-gradient-to-b from-[#1DA1F2]/10 to-transparent shadow-lg shadow-blue-900/20"
                                            : "border-white/10 bg-white/5"
                                            } ${isCurrentPlan ? "ring-2 ring-[#1DA1F2]" : ""}`}
                                    >
                                        {plan.highlight && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#1DA1F2] to-[#4DB5F5] rounded-full text-xs font-semibold text-white shadow-lg">
                                                ⭐ Rekomendasi
                                            </div>
                                        )}

                                        {isCurrentPlan && (
                                            <div className="absolute -top-3 right-4 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-medium text-green-400">
                                                ✓ Paket Anda
                                            </div>
                                        )}

                                        <div className="flex items-start gap-3 mb-4 mt-2">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${plan.gradient}`}>
                                                <Icon className={`w-6 h-6 ${plan.highlight ? "text-yellow-400" : "text-white/60"}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                                                <p className="text-xs text-white/40">{plan.tagline}</p>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-bold text-white">{formatPrice(price)}</span>
                                                {price > 0 && <span className="text-sm text-white/40">/{billingCycle === "yearly" ? "tahun" : "bulan"}</span>}
                                            </div>
                                            {billingCycle === "yearly" && plan.priceMonthly > 0 && (
                                                <p className="text-xs text-white/30 mt-1 line-through">{formatPrice(plan.priceMonthly * 12)}/tahun</p>
                                            )}
                                        </div>

                                        {/* Limits */}
                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            <div className="bg-white/5 rounded-lg p-2 text-center">
                                                <Store className="w-4 h-4 mx-auto text-white/40 mb-1" />
                                                <p className="text-sm font-semibold text-white">{plan.maxOutlets}</p>
                                                <p className="text-[10px] text-white/40">Outlet</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-2 text-center">
                                                <Users className="w-4 h-4 mx-auto text-white/40 mb-1" />
                                                <p className="text-sm font-semibold text-white">{plan.maxUsers}</p>
                                                <p className="text-[10px] text-white/40">User</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-2 text-center">
                                                <Package className="w-4 h-4 mx-auto text-white/40 mb-1" />
                                                <p className="text-sm font-semibold text-white">{plan.maxProducts === 999 ? "∞" : plan.maxProducts}</p>
                                                <p className="text-[10px] text-white/40">Produk</p>
                                            </div>
                                        </div>

                                        {/* Feature list */}
                                        <ul className="space-y-2 mb-6">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm">
                                                    <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-[#1DA1F2]" : "text-white/40"}`} />
                                                    <span className="text-white/70">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {isCurrentPlan ? (
                                            <button disabled className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 text-sm font-medium cursor-not-allowed">
                                                Paket Aktif
                                            </button>
                                        ) : plan.highlight ? (
                                            <button
                                                onClick={() => handleUpgrade(plan.slug)}
                                                disabled={upgrading}
                                                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 relative overflow-hidden group"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                                {upgrading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Zap className="w-4 h-4" />
                                                        Upgrade ke Pro
                                                        <ArrowRight className="w-4 h-4" />
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <div className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-center text-white/50 text-sm">
                                                Paket Dasar
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Comparison Table */}
                        <div className="glass-strong rounded-2xl overflow-hidden">
                            <div className="p-6 pb-3">
                                <h3 className="text-lg font-bold text-white">Perbandingan Fitur</h3>
                                <p className="text-xs text-white/40 mt-1">Lihat semua perbedaan antara Free dan Pro</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="text-left text-xs text-white/40 font-medium px-6 py-3">Fitur</th>
                                            <th className="text-center text-xs font-medium px-6 py-3 text-white/60">Free</th>
                                            <th className="text-center text-xs font-medium px-6 py-3 text-[#1DA1F2]">Pro</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {COMPARISON_FEATURES.map((row, i) => (
                                            <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                                                <td className="px-6 py-3 text-sm text-white/70">{row.label}</td>
                                                <td className={`px-6 py-3 text-sm text-center ${row.free === "✗" ? "text-white/20" : "text-white/60"}`}>{row.free}</td>
                                                <td className={`px-6 py-3 text-sm text-center font-medium ${row.pro === "✓" ? "text-[#1DA1F2]" : "text-white/80"}`}>{row.pro}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* FAQ */}
                        <div className="glass-strong p-6 rounded-2xl">
                            <h3 className="text-lg font-bold text-white mb-4">Pertanyaan Umum</h3>
                            <div className="space-y-2">
                                {FAQS.map((faq, i) => (
                                    <div key={i} className="rounded-xl border border-white/5 overflow-hidden transition-all">
                                        <button
                                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                            className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.03] transition"
                                        >
                                            <span className="text-sm font-medium text-white/80">{faq.q}</span>
                                            {openFaq === i ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
                                        </button>
                                        {openFaq === i && (
                                            <div className="px-4 pb-4 animate-fade-in">
                                                <p className="text-xs text-white/40 leading-relaxed">{faq.a}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════ TAB 3: FITUR ═══════ */}
                {activeTab === "features" && (
                    <div className="space-y-6">
                        <div className="glass-strong p-4 rounded-2xl flex items-center gap-3 border border-[#1DA1F2]/20">
                            <Shield className="w-5 h-5 text-[#1DA1F2]" />
                            <div>
                                <p className="text-sm text-white/80 font-medium">
                                    Paket Anda: <span className={isPro ? "text-yellow-400" : "text-[#1DA1F2]"}>{isPro ? "Pro" : "Free"}</span>
                                </p>
                                <p className="text-xs text-white/40">
                                    {isPro ? "Semua fitur aktif" : "Upgrade ke Pro untuk membuka semua fitur"}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {FEATURE_FLAGS.map((feat) => {
                                const isEnabled = features[feat.key] || false;
                                const isLocked = feat.pro && !isPro;

                                return (
                                    <div
                                        key={feat.key}
                                        className={`relative p-5 rounded-2xl border transition-all ${isEnabled
                                            ? "border-green-500/20 bg-green-500/5"
                                            : isLocked
                                                ? "border-white/5 bg-white/[0.02] opacity-60"
                                                : "border-white/10 bg-white/5"
                                            }`}
                                    >
                                        {isLocked && (
                                            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                                <Lock className="w-3 h-3 text-yellow-400" />
                                                <span className="text-[10px] text-yellow-400 font-semibold">PRO</span>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">{feat.icon}</span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-semibold text-white">{feat.label}</h4>
                                                    {isEnabled && !isLocked && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">Aktif</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-white/40 mt-1">{feat.desc}</p>
                                            </div>
                                            <div className="mt-1">
                                                {isLocked ? (
                                                    <ToggleLeft className="w-8 h-8 text-white/10" />
                                                ) : isEnabled ? (
                                                    <ToggleRight className="w-8 h-8 text-green-400" />
                                                ) : (
                                                    <ToggleLeft className="w-8 h-8 text-white/20" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {!isPro && (
                            <div className="text-center py-6">
                                <button
                                    onClick={() => setActiveTab("subscription")}
                                    className="btn-primary inline-flex items-center gap-2"
                                >
                                    <Zap className="w-4 h-4" />
                                    Upgrade ke Pro untuk Semua Fitur
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════ TAB 4: OPERASIONAL ═══════ */}
                {activeTab === "operations" && (
                    <div className="space-y-6">
                        {/* Operating Hours */}
                        <div className="glass-strong p-6 rounded-2xl">
                            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Jam Operasional
                            </h3>
                            <p className="text-xs text-white/30 mb-4">Atur jam buka dan tutup toko Anda</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Jam Buka</label>
                                    <input
                                        type="time"
                                        className="input-glass w-full"
                                        value={openTime}
                                        onChange={(e) => setOpenTime(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Jam Tutup</label>
                                    <input
                                        type="time"
                                        className="input-glass w-full"
                                        value={closeTime}
                                        onChange={(e) => setCloseTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-xs text-white/50">
                                        Toko buka: <span className="text-white/80 font-medium">{openTime}</span> – <span className="text-white/80 font-medium">{closeTime}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Revenue Share Info */}
                        <div className="glass-strong p-6 rounded-2xl">
                            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Star className="w-4 h-4" />
                                Revenue Share
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1DA1F2]/20 to-[#1DA1F2]/5 flex items-center justify-center">
                                    <span className="text-xl font-bold text-[#1DA1F2]">{(tenant as Record<string, unknown>).revenue_share_pct as number || 10}%</span>
                                </div>
                                <div>
                                    <p className="text-sm text-white/70">Platform fee untuk setiap transaksi</p>
                                    <p className="text-xs text-white/30 mt-1">Hubungi admin untuk negosiasi tarif</p>
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSaveOperations} disabled={saving} className="btn-primary flex items-center gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan Operasional
                        </button>
                    </div>
                )}

                {/* ═══════ TAB 5: KEAMANAN ═══════ */}
                {activeTab === "security" && (
                    <div className="space-y-6">
                        {/* Account Info */}
                        <div className="glass-strong p-6 rounded-2xl">
                            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Informasi Akun
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <p className="text-xs text-white/30">Email</p>
                                    <p className="text-sm text-white/80 mt-1">{(profile as Record<string, unknown>).email as string || "—"}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <p className="text-xs text-white/30">Nama</p>
                                    <p className="text-sm text-white/80 mt-1">{(profile as Record<string, unknown>).full_name as string || (profile as Record<string, unknown>).name as string || "—"}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <p className="text-xs text-white/30">Role</p>
                                    <p className="text-sm text-white/80 mt-1 capitalize">{(profile as Record<string, unknown>).role as string || "—"}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <p className="text-xs text-white/30">Bergabung</p>
                                    <p className="text-sm text-white/80 mt-1">
                                        {(profile as Record<string, unknown>).created_at
                                            ? new Date((profile as Record<string, unknown>).created_at as string).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
                                            : "—"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Change Password */}
                        <div className="glass-strong p-6 rounded-2xl">
                            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Ganti Password
                            </h3>
                            <div className="space-y-4 max-w-md">
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Password Lama</label>
                                    <div className="relative">
                                        <input
                                            type={showOldPw ? "text" : "password"}
                                            className="input-glass w-full pr-10"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            placeholder="Masukkan password lama"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowOldPw(!showOldPw)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
                                        >
                                            {showOldPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Password Baru</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPw ? "text" : "password"}
                                            className="input-glass w-full pr-10"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Masukkan password baru"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPw(!showNewPw)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
                                        >
                                            {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Konfirmasi Password Baru</label>
                                    <input
                                        type="password"
                                        className="input-glass w-full"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Ulangi password baru"
                                    />
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-xs text-red-400 mt-1">Password tidak sama</p>
                                    )}
                                </div>

                                <button
                                    onClick={handleChangePassword}
                                    disabled={saving || !oldPassword || !newPassword || !confirmPassword}
                                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                    Ubah Password
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
