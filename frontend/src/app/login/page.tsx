"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authAPI, merchantTypeAPI } from "@/lib/api";
import { useAuthStore } from "@/store";
import { Store, Eye, EyeOff, ArrowRight, Sparkles, Check, X, Globe, Phone, Building2, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface MerchantType {
    id: string;
    name: string;
    slug: string;
    icon: string;
    is_active: boolean;
}

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [isRegister, setIsRegister] = useState(false);
    const [regStep, setRegStep] = useState(1); // 1: business info, 2: personal info
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Merchant types
    const [merchantTypes, setMerchantTypes] = useState<MerchantType[]>([]);
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

    const [form, setForm] = useState({
        email: "",
        password: "",
        full_name: "",
        tenant_name: "",
        tenant_slug: "",
        phone: "",
        merchant_type_slug: "",
    });

    // Load merchant types when switching to register
    useEffect(() => {
        if (isRegister && merchantTypes.length === 0) {
            merchantTypeAPI.getAll()
                .then(res => setMerchantTypes(res.data.data || []))
                .catch(() => { });
        }
    }, [isRegister, merchantTypes.length]);

    // Check slug availability with debounce
    const checkSlug = useCallback(async (slug: string) => {
        if (!slug || slug.length < 2) {
            setSlugStatus('idle');
            return;
        }
        setSlugStatus('checking');
        try {
            const res = await authAPI.checkSlug(slug);
            setSlugStatus(res.data.available ? 'available' : 'taken');
        } catch {
            setSlugStatus('idle');
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (form.tenant_slug) {
                checkSlug(form.tenant_slug);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [form.tenant_slug, checkSlug]);

    const handleTenantNameChange = (name: string) => {
        const slug = name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        setForm({ ...form, tenant_name: name, tenant_slug: slug });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (isRegister) {
                const res = await authAPI.register({
                    email: form.email,
                    password: form.password,
                    full_name: form.full_name,
                    tenant_name: form.tenant_name,
                    tenant_slug: form.tenant_slug,
                    phone: form.phone,
                    merchant_type_slug: form.merchant_type_slug || undefined,
                });
                login(res.data.data.user, res.data.data.token);
            } else {
                const res = await authAPI.login({
                    email: form.email,
                    password: form.password,
                });
                login(res.data.data.user, res.data.data.token);
            }
            router.push("/dashboard");
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            setError(axiosErr.response?.data?.error || "Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    const canProceedStep1 = form.tenant_name && form.tenant_slug && slugStatus !== 'taken';

    // Merchant type icon map
    const typeIcons: Record<string, string> = {
        'restaurant': '🍽️',
        'grosir-sembako': '🏪',
        'pengrajin': '🎨',
        'lainnya': '📦',
    };

    return (
        <div className="min-h-screen bg-gradient-mesh bg-pattern flex items-center justify-center p-4">
            {/* Background glow effects */}
            <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-[#1DA1F2] rounded-full opacity-10 blur-[120px] pointer-events-none" />
            <div className="fixed bottom-1/4 right-1/4 w-64 h-64 bg-[#A7D8FF] rounded-full opacity-5 blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#1DA1F2] to-[#A7D8FF] mb-4 shadow-lg shadow-blue-900/30"
                        style={{ animation: 'pulse-glow 3s infinite' }}>
                        <Store className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        CODA<span className="text-[#1DA1F2]">POS</span>
                    </h1>
                    <p className="text-sm mt-1 opacity-50">Cloud POS &amp; Merchant Platform</p>
                </div>

                {/* Form Card */}
                <div className="glass-strong p-8">
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => { setIsRegister(false); setError(""); setRegStep(1); }}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${!isRegister
                                ? "bg-gradient-to-r from-[#1DA1F2] to-[#4DB5F5] text-white shadow-lg shadow-blue-900/30"
                                : "text-white/50 hover:text-white/80"
                                }`}
                        >
                            Masuk
                        </button>
                        <button
                            onClick={() => { setIsRegister(true); setError(""); }}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${isRegister
                                ? "bg-gradient-to-r from-[#1DA1F2] to-[#4DB5F5] text-white shadow-lg shadow-blue-900/30"
                                : "text-white/50 hover:text-white/80"
                                }`}
                        >
                            Daftar
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* LOGIN FORM */}
                    {!isRegister && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Email</label>
                                <input
                                    type="email"
                                    className="input-glass"
                                    placeholder="email@contoh.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="input-glass pr-12"
                                        placeholder="Minimal 6 karakter"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition z-10"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Masuk
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <div className="mt-4 text-center">
                                <Link href="/signup" className="text-xs text-[#1DA1F2]/60 hover:text-[#1DA1F2] transition-colors">
                                    Daftar Merchant Gratis →
                                </Link>
                            </div>
                        </form>
                    )}

                    {/* REGISTER STEP 1: Business Info */}
                    {isRegister && regStep === 1 && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-[#1DA1F2] flex items-center justify-center text-white text-xs font-bold">1</div>
                                <span className="text-xs text-white/40">Info Bisnis</span>
                                <ChevronRight className="w-3 h-3 text-white/20" />
                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-xs">2</div>
                                <span className="text-xs text-white/30">Akun</span>
                            </div>

                            {/* Merchant Type Selector */}
                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5" /> Tipe Bisnis
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {merchantTypes.map(mt => (
                                        <button
                                            key={mt.slug}
                                            type="button"
                                            onClick={() => setForm({ ...form, merchant_type_slug: mt.slug })}
                                            className={`p-3 rounded-xl border text-left transition-all ${form.merchant_type_slug === mt.slug
                                                ? 'border-[#1DA1F2] bg-[#1DA1F2]/10 shadow-lg shadow-blue-900/20'
                                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="text-xl mb-1">{typeIcons[mt.slug] || '📦'}</div>
                                            <div className={`text-xs font-medium ${form.merchant_type_slug === mt.slug ? 'text-[#1DA1F2]' : 'text-white/70'}`}>
                                                {mt.name}
                                            </div>
                                        </button>
                                    ))}
                                    {merchantTypes.length === 0 && (
                                        <div className="col-span-2 text-center py-4 text-white/30 text-sm">Memuat tipe bisnis...</div>
                                    )}
                                </div>
                            </div>

                            {/* Business Name */}
                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Nama Bisnis *</label>
                                <input
                                    type="text"
                                    className="input-glass"
                                    placeholder="Contoh: Warung Bali Indah"
                                    value={form.tenant_name}
                                    onChange={(e) => handleTenantNameChange(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Auto Subdomain Preview */}
                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5" /> Subdomain (URL Bisnis) *
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className={`input-glass pr-10 ${slugStatus === 'available' ? 'border-green-500/30' : slugStatus === 'taken' ? 'border-red-500/30' : ''}`}
                                        placeholder="warung-bali-indah"
                                        value={form.tenant_slug}
                                        onChange={(e) => setForm({ ...form, tenant_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                        required
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {slugStatus === 'checking' && <div className="w-4 h-4 border-2 border-white/20 border-t-[#1DA1F2] rounded-full animate-spin" />}
                                        {slugStatus === 'available' && <Check className="w-4 h-4 text-green-400" />}
                                        {slugStatus === 'taken' && <X className="w-4 h-4 text-red-400" />}
                                    </div>
                                </div>
                                <div className="mt-1.5 flex items-center justify-between">
                                    <p className="text-[10px] text-white/30">
                                        {form.tenant_slug ? `${form.tenant_slug}.codapos.com` : 'nama-bisnis.codapos.com'}
                                    </p>
                                    {slugStatus === 'taken' && <p className="text-[10px] text-red-400">Subdomain sudah digunakan</p>}
                                    {slugStatus === 'available' && <p className="text-[10px] text-green-400">Tersedia ✓</p>}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!form.tenant_name || !form.tenant_slug) {
                                        setError("Nama bisnis dan subdomain wajib diisi");
                                        return;
                                    }
                                    if (slugStatus === 'taken') {
                                        setError("Subdomain sudah digunakan, pilih yang lain");
                                        return;
                                    }
                                    setError("");
                                    setRegStep(2);
                                }}
                                disabled={!canProceedStep1}
                                className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Selanjutnya <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* REGISTER STEP 2: Account Info */}
                    {isRegister && regStep === 2 && (
                        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs"><Check className="w-3 h-3" /></div>
                                <span className="text-xs text-white/40">Info Bisnis</span>
                                <ChevronRight className="w-3 h-3 text-white/20" />
                                <div className="w-6 h-6 rounded-full bg-[#1DA1F2] flex items-center justify-center text-white text-xs font-bold">2</div>
                                <span className="text-xs text-white/40">Akun</span>
                            </div>

                            {/* Business summary */}
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white">{form.tenant_name}</p>
                                    <p className="text-[10px] text-white/40">{form.tenant_slug}.codapos.com
                                        {form.merchant_type_slug && ` • ${merchantTypes.find(m => m.slug === form.merchant_type_slug)?.name || form.merchant_type_slug}`}
                                    </p>
                                </div>
                                <button type="button" onClick={() => setRegStep(1)} className="text-xs text-[#1DA1F2] hover:underline flex items-center gap-1">
                                    <ChevronLeft className="w-3 h-3" /> Ubah
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Nama Lengkap *</label>
                                <input
                                    type="text"
                                    className="input-glass"
                                    placeholder="Nama lengkap Anda"
                                    value={form.full_name}
                                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5" /> No. Telepon
                                </label>
                                <input
                                    type="tel"
                                    className="input-glass"
                                    placeholder="08xxxxxxxxxx"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Email *</label>
                                <input
                                    type="email"
                                    className="input-glass"
                                    placeholder="email@contoh.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Password *</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="input-glass pr-12"
                                        placeholder="Minimal 6 karakter"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition z-10"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Daftar Sekarang
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {!isRegister && (
                        <div className="mt-6 text-center">
                            <p className="text-white/30 text-xs flex items-center justify-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Free Basic 6 bulan — tanpa kartu kredit
                            </p>
                        </div>
                    )}

                    {isRegister && (
                        <div className="mt-6 text-center">
                            <p className="text-white/30 text-xs flex items-center justify-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Gratis 6 bulan • Upgrade kapan saja
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
