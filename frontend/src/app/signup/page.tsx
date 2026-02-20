'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Store, Eye, EyeOff, ArrowRight, Sparkles, Check, X, Globe, Phone,
    Building2, ChevronRight, ChevronLeft, Crown, Zap, Shield, Users,
    BarChart3, Truck, Brain, Printer, ShoppingCart, Package, CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import { authAPI, merchantTypeAPI } from '@/lib/api';
import { useAuthStore } from '@/store';

interface MerchantType {
    id: string;
    name: string;
    slug: string;
    icon: string;
    is_active: boolean;
}

type Plan = 'free' | 'pro';

const FREE_FEATURES = [
    { icon: ShoppingCart, text: '1 Outlet' },
    { icon: Users, text: '1 User' },
    { icon: Package, text: '30 Produk' },
    { icon: BarChart3, text: 'Laporan Dasar' },
    { icon: CreditCard, text: 'POS Kasir Dasar' },
];

const PRO_FEATURES = [
    { icon: ShoppingCart, text: '5 Outlet' },
    { icon: Users, text: '10 Users' },
    { icon: Package, text: 'Produk Unlimited' },
    { icon: BarChart3, text: 'AI Report & Forecast' },
    { icon: CreditCard, text: 'Semua Metode Bayar' },
    { icon: Printer, text: 'Thermal Printer' },
    { icon: Truck, text: 'MyKurir Delivery' },
    { icon: Brain, text: 'AI Forecasting' },
    { icon: Globe, text: 'Custom Domain' },
    { icon: Shield, text: 'Priority Support' },
];

export default function MerchantSignUpPage() {
    const router = useRouter();
    const { login } = useAuthStore();

    // Steps: 1 = Package selection, 2 = Business Info, 3 = Account Info
    const [step, setStep] = useState(1);
    const [selectedPlan, setSelectedPlan] = useState<Plan>('free');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [merchantTypes, setMerchantTypes] = useState<MerchantType[]>([]);
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

    const [form, setForm] = useState({
        email: '',
        password: '',
        full_name: '',
        tenant_name: '',
        tenant_slug: '',
        phone: '',
        merchant_type_slug: '',
    });

    // Load merchant types
    useEffect(() => {
        if (step >= 2 && merchantTypes.length === 0) {
            merchantTypeAPI.getAll()
                .then(res => setMerchantTypes(res.data.data || []))
                .catch(() => { });
        }
    }, [step, merchantTypes.length]);

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
        setError('');

        try {
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
            router.push('/dashboard');
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            setError(axiosErr.response?.data?.error || 'Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const canProceedStep2 = form.tenant_name && form.tenant_slug && slugStatus !== 'taken';

    const typeIcons: Record<string, string> = {
        'restaurant': '🍽️',
        'grosir-sembako': '🏪',
        'pengrajin': '🎨',
        'lainnya': '📦',
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] bg-pattern flex items-center justify-center p-4">
            {/* Background glow effects */}
            <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-[#1DA1F2] rounded-full opacity-10 blur-[120px] pointer-events-none" />
            <div className="fixed bottom-1/4 right-1/4 w-64 h-64 bg-[#A7D8FF] rounded-full opacity-5 blur-[100px] pointer-events-none" />

            <div className="w-full max-w-4xl animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#1DA1F2] to-[#A7D8FF] mb-4 shadow-lg shadow-blue-900/30"
                        style={{ animation: 'pulse-glow 3s infinite' }}>
                        <Store className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        CODA<span className="text-[#1DA1F2]">POS</span>
                    </h1>
                    <p className="text-sm mt-1 text-white/50">Daftar Merchant — Mulai Bisnis Anda</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[
                        { num: 1, label: 'Pilih Paket' },
                        { num: 2, label: 'Info Bisnis' },
                        { num: 3, label: 'Buat Akun' },
                    ].map((s, i) => (
                        <div key={s.num} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > s.num ? 'bg-green-500 text-white' :
                                step === s.num ? 'bg-[#1DA1F2] text-white shadow-lg shadow-blue-900/30' :
                                    'bg-white/10 text-white/40'
                                }`}>
                                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                            </div>
                            <span className={`text-xs hidden sm:inline ${step >= s.num ? 'text-white/60' : 'text-white/30'}`}>{s.label}</span>
                            {i < 2 && <ChevronRight className="w-3.5 h-3.5 text-white/20" />}
                        </div>
                    ))}
                </div>

                {/* ═══════ STEP 1: Package Selection ═══════ */}
                {step === 1 && (
                    <div className="animate-fade-in">
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-bold text-white">Pilih Paket yang Tepat untuk Bisnis Anda</h2>
                            <p className="text-sm text-white/40 mt-2">Mulai gratis, upgrade kapan saja</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                            {/* FREE Package */}
                            <button
                                onClick={() => setSelectedPlan('free')}
                                className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-300 ${selectedPlan === 'free'
                                    ? 'border-[#1DA1F2] bg-[#1DA1F2]/10 shadow-xl shadow-blue-900/20'
                                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                                    }`}
                            >
                                {selectedPlan === 'free' && (
                                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#1DA1F2] flex items-center justify-center">
                                        <Check className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-white/70" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Free</h3>
                                        <p className="text-xs text-white/40">Untuk memulai bisnis</p>
                                    </div>
                                </div>
                                <div className="mb-5">
                                    <span className="text-3xl font-black text-white">Gratis</span>
                                    <span className="text-sm text-white/40 ml-1">selamanya</span>
                                </div>
                                <ul className="space-y-2.5">
                                    {FREE_FEATURES.map((f, i) => {
                                        const Icon = f.icon;
                                        return (
                                            <li key={i} className="flex items-center gap-2.5 text-sm text-white/60">
                                                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                                    <Icon className="w-3 h-3 text-white/50" />
                                                </div>
                                                {f.text}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </button>

                            {/* PRO Package */}
                            <button
                                onClick={() => setSelectedPlan('pro')}
                                className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-300 ${selectedPlan === 'pro'
                                    ? 'border-[#1DA1F2] bg-[#1DA1F2]/10 shadow-xl shadow-blue-900/20'
                                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                                    }`}
                            >
                                {/* Popular badge */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#1DA1F2] to-[#4DB5F5] rounded-full text-[10px] font-bold text-white shadow-lg shadow-blue-900/30 whitespace-nowrap">
                                    ⭐ PALING POPULER
                                </div>
                                {selectedPlan === 'pro' && (
                                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#1DA1F2] flex items-center justify-center">
                                        <Check className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}
                                <div className="flex items-center gap-3 mb-4 mt-1">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1DA1F2] to-[#A7D8FF] flex items-center justify-center shadow-lg shadow-blue-900/20">
                                        <Crown className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Pro</h3>
                                        <p className="text-xs text-white/40">Untuk bisnis berkembang</p>
                                    </div>
                                </div>
                                <div className="mb-5">
                                    <span className="text-3xl font-black text-white">Rp 99rb</span>
                                    <span className="text-sm text-white/40 ml-1">/bulan</span>
                                </div>
                                <ul className="space-y-2.5">
                                    {PRO_FEATURES.map((f, i) => {
                                        const Icon = f.icon;
                                        return (
                                            <li key={i} className="flex items-center gap-2.5 text-sm text-white/60">
                                                <div className="w-5 h-5 rounded-full bg-[#1DA1F2]/20 flex items-center justify-center flex-shrink-0">
                                                    <Icon className="w-3 h-3 text-[#1DA1F2]" />
                                                </div>
                                                {f.text}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </button>
                        </div>

                        <div className="flex justify-center mt-8">
                            <button
                                onClick={() => setStep(2)}
                                className="btn-primary flex items-center gap-2 px-10 py-3.5 text-base"
                            >
                                Lanjutkan dengan {selectedPlan === 'free' ? 'Free' : 'Pro'}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-center text-xs text-white/30 mt-4">
                            Sudah punya akun?{' '}
                            <Link href="/login" className="text-[#1DA1F2] hover:underline">Masuk di sini</Link>
                        </p>
                    </div>
                )}

                {/* ═══════ STEP 2: Business Info ═══════ */}
                {step === 2 && (
                    <div className="max-w-md mx-auto animate-fade-in">
                        <div className="glass-strong p-8">
                            {/* Selected plan badge */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    {selectedPlan === 'pro' ? (
                                        <Crown className="w-4 h-4 text-[#1DA1F2]" />
                                    ) : (
                                        <Sparkles className="w-4 h-4 text-white/50" />
                                    )}
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedPlan === 'pro'
                                        ? 'bg-[#1DA1F2]/20 text-[#1DA1F2]'
                                        : 'bg-white/10 text-white/60'
                                        }`}>
                                        Paket {selectedPlan === 'pro' ? 'Pro' : 'Free'}
                                    </span>
                                </div>
                                <button onClick={() => setStep(1)} className="text-xs text-[#1DA1F2] hover:underline flex items-center gap-1">
                                    <ChevronLeft className="w-3 h-3" /> Ubah Paket
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
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

                                {/* Subdomain */}
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
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!form.tenant_name || !form.tenant_slug) {
                                        setError('Nama bisnis dan subdomain wajib diisi');
                                        return;
                                    }
                                    if (slugStatus === 'taken') {
                                        setError('Subdomain sudah digunakan, pilih yang lain');
                                        return;
                                    }
                                    setError('');
                                    setStep(3);
                                }}
                                disabled={!canProceedStep2}
                                className="btn-primary w-full flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Selanjutnya <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════ STEP 3: Account Info ═══════ */}
                {step === 3 && (
                    <div className="max-w-md mx-auto animate-fade-in">
                        <div className="glass-strong p-8">
                            {/* Business summary */}
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-sm font-medium text-white">{form.tenant_name}</p>
                                    <p className="text-[10px] text-white/40">
                                        {form.tenant_slug}.codapos.com
                                        {form.merchant_type_slug && ` • ${merchantTypes.find(m => m.slug === form.merchant_type_slug)?.name || form.merchant_type_slug}`}
                                        {' • '}
                                        <span className={selectedPlan === 'pro' ? 'text-[#1DA1F2]' : 'text-white/50'}>
                                            Paket {selectedPlan === 'pro' ? 'Pro' : 'Free'}
                                        </span>
                                    </p>
                                </div>
                                <button type="button" onClick={() => setStep(2)} className="text-xs text-[#1DA1F2] hover:underline flex items-center gap-1">
                                    <ChevronLeft className="w-3 h-3" /> Ubah
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
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
                                            type={showPassword ? 'text' : 'password'}
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
                                            Daftar Merchant {selectedPlan === 'pro' ? 'Pro' : 'Free'}
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-white/30 text-xs flex items-center justify-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    {selectedPlan === 'pro' ? 'Trial 14 hari gratis • Bisa downgrade kapan saja' : 'Gratis selamanya • Upgrade kapan saja'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <p className="text-center text-xs text-white/30 mt-6">
                    © 2026 CODAPOS. All rights reserved.
                </p>
            </div>
        </div>
    );
}
