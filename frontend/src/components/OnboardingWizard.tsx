"use client";

import { useState } from "react";
import {
    Sparkles, Store, Package, MapPin, PartyPopper,
    ArrowRight, ArrowLeft, Check, ChevronRight,
    ShoppingCart, BarChart3, Users, Rocket, Loader2,
    Coffee, UtensilsCrossed, ShoppingBag, Cake,
    Scissors, Pill, Shirt, Building2,
} from "lucide-react";
import { tenantAPI, productAPI, outletAPI } from "@/lib/api";

// ═══════════════════════════════════════════════════════════════
//  CODAPOS FTUX — First Time User Experience
//  Glassmorphism + Twitter Blue Design
// ═══════════════════════════════════════════════════════════════

interface OnboardingWizardProps {
    userName: string;
    onComplete: () => void;
}

const BUSINESS_TYPES = [
    { id: "coffee", label: "Kedai Kopi", icon: Coffee },
    { id: "restaurant", label: "Restoran", icon: UtensilsCrossed },
    { id: "retail", label: "Retail & Toko", icon: ShoppingBag },
    { id: "bakery", label: "Bakery & Kue", icon: Cake },
    { id: "salon", label: "Barbershop / Salon", icon: Scissors },
    { id: "pharmacy", label: "Apotek", icon: Pill },
    { id: "laundry", label: "Laundry", icon: Shirt },
    { id: "franchise", label: "Franchise", icon: Building2 },
];

const CATEGORIES = ["Makanan", "Minuman", "Snack", "Lainnya"];

export default function OnboardingWizard({ userName, onComplete }: OnboardingWizardProps) {
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState<"next" | "back">("next");
    const [animating, setAnimating] = useState(false);

    // Step 2: Business Profile
    const [bizName, setBizName] = useState("");
    const [bizType, setBizType] = useState("");
    const [bizPhone, setBizPhone] = useState("");
    const [bizAddress, setBizAddress] = useState("");

    // Step 3: First Product
    const [prodName, setProdName] = useState("");
    const [prodPrice, setProdPrice] = useState("");
    const [prodCategory, setProdCategory] = useState("Makanan");

    // Step 4: Outlet
    const [outletName, setOutletName] = useState("");
    const [outletAddress, setOutletAddress] = useState("");
    const [outletHours, setOutletHours] = useState("08:00 - 22:00");

    // Confetti & saving
    const [showConfetti, setShowConfetti] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [saved, setSaved] = useState(false);

    const totalSteps = 5;

    const goNext = () => {
        if (animating) return;
        setDirection("next");
        setAnimating(true);
        setTimeout(() => {
            setStep((s) => Math.min(s + 1, totalSteps - 1));
            setAnimating(false);
            if (step + 1 === totalSteps - 1) {
                setShowConfetti(true);
                // Auto-save data when reaching final step
                saveAllData();
            }
        }, 300);
    };

    const goBack = () => {
        if (animating || step === 0) return;
        setDirection("back");
        setAnimating(true);
        setTimeout(() => {
            setStep((s) => Math.max(s - 1, 0));
            setAnimating(false);
        }, 300);
    };

    // ── Save all collected data to backend ──
    const saveAllData = async () => {
        setSaving(true);
        setSaveError("");
        try {
            // 1. Save business profile via tenant settings
            if (bizName) {
                await tenantAPI.updateSettings({
                    name: bizName,
                    business_type: bizType,
                    phone: bizPhone,
                    address: bizAddress,
                });
            }

            // 2. Create first product
            if (prodName && prodPrice) {
                await productAPI.create({
                    name: prodName,
                    base_price: parseInt(prodPrice) || 0,
                    sku: prodName.toLowerCase().replace(/\s+/g, "-").slice(0, 20),
                    is_active: true,
                    tax_rate: 0,
                });
            }

            // 3. Create first outlet
            if (outletName) {
                await outletAPI.create({
                    name: outletName,
                    address: outletAddress,
                    phone: "",
                } as Record<string, unknown>);
            }

            setSaved(true);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setSaveError(error.response?.data?.message || "Gagal menyimpan data, tapi kamu tetap bisa melanjutkan.");
        } finally {
            setSaving(false);
        }
    };

    const handleFinish = () => {
        localStorage.setItem("codapos_ftux_done", "true");
        onComplete();
    };

    const firstName = userName?.split(" ")[0] || "Partner";

    // Step labels for progress
    const stepLabels = ["Welcome", "Profil Bisnis", "Produk", "Outlet", "Selesai"];
    const stepIcons = [Sparkles, Store, Package, MapPin, PartyPopper];

    return (
        <div className="ftux-overlay">
            {/* Floating Background Orbs */}
            <div className="ftux-orb ftux-orb-1" />
            <div className="ftux-orb ftux-orb-2" />
            <div className="ftux-orb ftux-orb-3" />

            {/* Confetti */}
            {showConfetti && (
                <div className="ftux-confetti-container">
                    {Array.from({ length: 50 }).map((_, i) => (
                        <div
                            key={i}
                            className="ftux-confetti-piece"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 3}s`,
                                backgroundColor: ["#1DA1F2", "#A7D8FF", "#FFD700", "#FF6B6B", "#00CEC9", "#A29BFE"][Math.floor(Math.random() * 6)],
                                width: `${6 + Math.random() * 8}px`,
                                height: `${6 + Math.random() * 8}px`,
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="ftux-content">
                {/* Progress Bar */}
                <div className="ftux-progress-container">
                    <div className="ftux-progress-bar">
                        <div
                            className="ftux-progress-fill"
                            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                        />
                    </div>
                    <div className="ftux-progress-steps">
                        {stepLabels.map((label, i) => {
                            const Icon = stepIcons[i];
                            return (
                                <div key={i} className={`ftux-progress-step ${i <= step ? "ftux-step-active" : ""}`}>
                                    <div className={`ftux-step-dot ${i < step ? "ftux-step-done" : i === step ? "ftux-step-current" : ""}`}>
                                        {i < step ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                                    </div>
                                    <span className="ftux-step-label">{label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Card */}
                <div className={`ftux-card ${animating ? (direction === "next" ? "ftux-slide-out-left" : "ftux-slide-out-right") : "ftux-slide-in"}`}>

                    {/* ─── Step 0: Welcome ─── */}
                    {step === 0 && (
                        <div className="ftux-step-content text-center">
                            <div className="ftux-welcome-icon">
                                <div className="ftux-welcome-icon-inner">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                                <div className="ftux-welcome-ring" />
                                <div className="ftux-welcome-ring ftux-welcome-ring-2" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-white mt-8 mb-3">
                                Selamat Datang, <span className="text-[#1DA1F2]">{firstName}</span>! 👋
                            </h2>
                            <p className="text-white/50 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                                Ayo siapkan bisnis kamu di CODAPOS dalam beberapa langkah mudah.
                                Proses ini hanya membutuhkan waktu <span className="text-[#1DA1F2] font-semibold">2 menit</span>.
                            </p>
                            <div className="grid grid-cols-3 gap-4 mt-8 max-w-sm mx-auto">
                                {[
                                    { icon: ShoppingCart, label: "POS Kasir" },
                                    { icon: BarChart3, label: "Analitik" },
                                    { icon: Users, label: "Pelanggan" },
                                ].map((f, i) => (
                                    <div key={i} className="ftux-mini-card">
                                        <f.icon className="w-5 h-5 text-[#1DA1F2] mx-auto mb-1.5" />
                                        <span className="text-[10px] text-white/40 font-medium">{f.label}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={goNext} className="ftux-btn-primary mt-8">
                                Mulai Setup <Rocket className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* ─── Step 1: Business Profile ─── */}
                    {step === 1 && (
                        <div className="ftux-step-content">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1DA1F2] to-[#0d8ecf] flex items-center justify-center shadow-lg shadow-blue-900/30">
                                    <Store className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Profil Bisnis</h2>
                                    <p className="text-xs text-white/40">Beritahu kami tentang bisnis kamu</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-white/50 mb-1.5">Nama Bisnis *</label>
                                    <input
                                        value={bizName}
                                        onChange={(e) => setBizName(e.target.value)}
                                        placeholder="contoh: Warung Kopi Bali"
                                        className="ftux-input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-white/50 mb-2">Jenis Bisnis *</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {BUSINESS_TYPES.map((bt) => {
                                            const Icon = bt.icon;
                                            return (
                                                <button
                                                    key={bt.id}
                                                    onClick={() => setBizType(bt.id)}
                                                    className={`ftux-type-btn ${bizType === bt.id ? "ftux-type-active" : ""}`}
                                                >
                                                    <Icon className="w-5 h-5 mx-auto mb-1" />
                                                    <span className="text-[10px] leading-tight">{bt.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm text-white/50 mb-1.5">No. Telepon</label>
                                        <input
                                            value={bizPhone}
                                            onChange={(e) => setBizPhone(e.target.value)}
                                            placeholder="08xxxxxxxxxx"
                                            className="ftux-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-white/50 mb-1.5">Alamat</label>
                                        <input
                                            value={bizAddress}
                                            onChange={(e) => setBizAddress(e.target.value)}
                                            placeholder="Jl. Raya Ubud No.1"
                                            className="ftux-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-8">
                                <button onClick={goBack} className="ftux-btn-ghost">
                                    <ArrowLeft className="w-4 h-4" /> Kembali
                                </button>
                                <button onClick={goNext} className="ftux-btn-primary" disabled={!bizName || !bizType}>
                                    Selanjutnya <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ─── Step 2: First Product ─── */}
                    {step === 2 && (
                        <div className="ftux-step-content">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1DA1F2] to-[#0d8ecf] flex items-center justify-center shadow-lg shadow-blue-900/30">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Produk Pertama</h2>
                                    <p className="text-xs text-white/40">Tambah contoh produk pertama kamu</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-white/50 mb-1.5">Nama Produk *</label>
                                    <input
                                        value={prodName}
                                        onChange={(e) => setProdName(e.target.value)}
                                        placeholder="contoh: Nasi Goreng Spesial"
                                        className="ftux-input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-white/50 mb-1.5">Harga (Rp) *</label>
                                    <input
                                        type="number"
                                        value={prodPrice}
                                        onChange={(e) => setProdPrice(e.target.value)}
                                        placeholder="25000"
                                        className="ftux-input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-white/50 mb-2">Kategori</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {CATEGORIES.map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => setProdCategory(cat)}
                                                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${prodCategory === cat
                                                    ? "bg-[#1DA1F2] text-white shadow-lg shadow-blue-900/30"
                                                    : "bg-white/5 text-white/50 border border-white/10 hover:border-[#1DA1F2]/30"
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Preview card */}
                                {prodName && (
                                    <div className="ftux-preview-card">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1DA1F2]/20 to-[#A7D8FF]/10 flex items-center justify-center">
                                            <Package className="w-5 h-5 text-[#1DA1F2]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">{prodName}</p>
                                            <p className="text-xs text-white/30">{prodCategory}</p>
                                        </div>
                                        <p className="text-sm font-bold text-[#1DA1F2]">
                                            {prodPrice ? `Rp ${parseInt(prodPrice).toLocaleString()}` : "-"}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-8">
                                <button onClick={goBack} className="ftux-btn-ghost">
                                    <ArrowLeft className="w-4 h-4" /> Kembali
                                </button>
                                <div className="flex items-center gap-3">
                                    <button onClick={goNext} className="ftux-btn-ghost text-white/30 hover:text-white/60">
                                        Lewati <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <button onClick={goNext} className="ftux-btn-primary" disabled={!prodName || !prodPrice}>
                                        Selanjutnya <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Step 3: Setup Outlet ─── */}
                    {step === 3 && (
                        <div className="ftux-step-content">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1DA1F2] to-[#0d8ecf] flex items-center justify-center shadow-lg shadow-blue-900/30">
                                    <MapPin className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Setup Outlet</h2>
                                    <p className="text-xs text-white/40">Tambah outlet pertama kamu</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-white/50 mb-1.5">Nama Outlet *</label>
                                    <input
                                        value={outletName}
                                        onChange={(e) => setOutletName(e.target.value)}
                                        placeholder="contoh: Cabang Utama"
                                        className="ftux-input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-white/50 mb-1.5">Alamat Outlet</label>
                                    <input
                                        value={outletAddress}
                                        onChange={(e) => setOutletAddress(e.target.value)}
                                        placeholder="Jl. Sunset Road No. 88, Kuta"
                                        className="ftux-input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-white/50 mb-1.5">Jam Operasional</label>
                                    <input
                                        value={outletHours}
                                        onChange={(e) => setOutletHours(e.target.value)}
                                        placeholder="08:00 - 22:00"
                                        className="ftux-input"
                                    />
                                </div>

                                {/* Outlet preview */}
                                {outletName && (
                                    <div className="ftux-preview-card">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1DA1F2]/20 to-[#A7D8FF]/10 flex items-center justify-center">
                                            <MapPin className="w-5 h-5 text-[#1DA1F2]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">{outletName}</p>
                                            <p className="text-xs text-white/30 truncate">{outletAddress || "Belum ada alamat"}</p>
                                        </div>
                                        <span className="text-[10px] text-[#1DA1F2] bg-[#1DA1F2]/10 px-2 py-1 rounded-lg font-medium whitespace-nowrap">
                                            {outletHours}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-8">
                                <button onClick={goBack} className="ftux-btn-ghost">
                                    <ArrowLeft className="w-4 h-4" /> Kembali
                                </button>
                                <div className="flex items-center gap-3">
                                    <button onClick={goNext} className="ftux-btn-ghost text-white/30 hover:text-white/60">
                                        Lewati <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <button onClick={goNext} className="ftux-btn-primary" disabled={!outletName}>
                                        Selanjutnya <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Step 4: All Done ─── */}
                    {step === 4 && (
                        <div className="ftux-step-content text-center">
                            <div className="ftux-success-icon">
                                <div className="ftux-success-icon-inner">
                                    <PartyPopper className="w-10 h-10 text-white" />
                                </div>
                                <div className="ftux-success-ring" />
                            </div>

                            <h2 className="text-2xl md:text-3xl font-black text-white mt-8 mb-3">
                                Semuanya <span className="text-[#1DA1F2]">Siap!</span> 🎉
                            </h2>

                            {/* Saving status */}
                            {saving && (
                                <div className="flex items-center justify-center gap-2 text-[#1DA1F2] text-sm mt-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Menyimpan data bisnis...
                                </div>
                            )}
                            {saveError && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-red-400 text-xs mt-2 max-w-md mx-auto">
                                    {saveError}
                                </div>
                            )}
                            {saved && !saving && (
                                <div className="flex items-center justify-center gap-2 text-green-400 text-sm mt-2">
                                    <Check className="w-4 h-4" />
                                    Data berhasil disimpan!
                                </div>
                            )}

                            <p className="text-white/50 text-sm max-w-md mx-auto leading-relaxed mt-3">
                                Bisnis kamu sudah siap dikelola dengan CODAPOS.
                                Mulai terima transaksi dan pantau performa bisnis dari dashboard.
                            </p>

                            {/* Quick summary */}
                            <div className="ftux-summary-grid mt-8">
                                {[
                                    { label: "Bisnis", value: bizName || "—", icon: Store },
                                    { label: "Produk", value: prodName || "—", icon: Package },
                                    { label: "Outlet", value: outletName || "—", icon: MapPin },
                                ].map((item, i) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={i} className="ftux-summary-item">
                                            <Icon className="w-5 h-5 text-[#1DA1F2] mb-2" />
                                            <p className="text-xs text-white/30">{item.label}</p>
                                            <p className="text-sm font-bold text-white truncate">{item.value}</p>
                                        </div>
                                    );
                                })}
                            </div>

                            <button onClick={handleFinish} className="ftux-btn-primary mt-8 text-base" disabled={saving}>
                                {saving ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...</>
                                ) : (
                                    <>Masuk ke Dashboard <ArrowRight className="w-5 h-5" /></>
                                )}
                            </button>

                            <p className="text-xs text-white/20 mt-4">
                                Kamu bisa mengubah semua pengaturan ini nanti di dashboard
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="ftux-footer">
                    <p className="text-xs text-white/20">
                        CODAPOS — Cloud POS & Merchant Platform
                    </p>
                </div>
            </div>
        </div>
    );
}
