'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Globe, Save, Loader2, CheckCircle, AlertTriangle, Plus, Trash2, ChevronDown, X,
    Type, BarChart3, Zap, CreditCard, MessageCircle, HelpCircle, FileText, Sparkles,
} from 'lucide-react';
import { superAdminAPI } from '@/lib/api';

// ═══════════════════════════════════════════════════════════════
// CMS — "OFFICIAL WEB CODA"
// Manages landing page content via GlobalConfig (website_* keys)
// ═══════════════════════════════════════════════════════════════

type CMSTab = 'hero' | 'stats' | 'features' | 'pricing' | 'testimonials' | 'faq' | 'pages';

interface HeroData { badge: string; headline: string; subheadline: string; cta_primary: string; cta_secondary: string; }
interface StatItem { value: string; label: string; suffix: string; }
interface FeatureItem { title: string; desc: string; gradient: string; }
interface PricingItem { name: string; price: number; period: string; desc: string; features: string[]; highlight: boolean; }
interface TestimonialItem { name: string; role: string; text: string; rating: number; avatar: string; }
interface FAQItem { q: string; a: string; }

const DEFAULT_HERO: HeroData = {
    badge: "Platform POS #1 untuk UMKM Indonesia",
    headline: "Solusi Kasir Digital & Manajemen Bisnis Terdepan",
    subheadline: "Kelola kasir, inventori, laporan keuangan, dan toko online dalam satu platform terintegrasi.",
    cta_primary: "Mulai Gratis Sekarang",
    cta_secondary: "Lihat Demo",
};

const TABS: { key: CMSTab; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: 'hero', label: 'Hero Section', icon: <Type className="w-4 h-4" />, desc: 'Headline, sub-headline, CTA' },
    { key: 'stats', label: 'Statistik', icon: <BarChart3 className="w-4 h-4" />, desc: 'Angka-angka pencapaian' },
    { key: 'features', label: 'Fitur', icon: <Zap className="w-4 h-4" />, desc: 'Daftar fitur unggulan' },
    { key: 'pricing', label: 'Harga', icon: <CreditCard className="w-4 h-4" />, desc: 'Paket langganan' },
    { key: 'testimonials', label: 'Testimoni', icon: <MessageCircle className="w-4 h-4" />, desc: 'Ulasan pelanggan' },
    { key: 'faq', label: 'FAQ', icon: <HelpCircle className="w-4 h-4" />, desc: 'Pertanyaan umum' },
    { key: 'pages', label: 'Footer Pages', icon: <FileText className="w-4 h-4" />, desc: 'Konten halaman About, Terms, dll' },
];

const CONFIG_KEYS: Record<CMSTab, string> = {
    hero: 'website_hero',
    stats: 'website_stats',
    features: 'website_features',
    pricing: 'website_pricing',
    testimonials: 'website_testimonials',
    faq: 'website_faq',
    pages: 'website_pages',
};

function safeParseJSON<T>(json: string, fallback: T): T {
    try { return JSON.parse(json); } catch { return fallback; }
}

export default function WebsiteCMSPage() {
    const [activeTab, setActiveTab] = useState<CMSTab>('hero');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Data states
    const [hero, setHero] = useState<HeroData>(DEFAULT_HERO);
    const [stats, setStats] = useState<StatItem[]>([
        { value: "10,000+", label: "UMKM Terdaftar", suffix: "" },
        { value: "500+", label: "Kota di Indonesia", suffix: "" },
        { value: "2.5M+", label: "Transaksi Diproses", suffix: "" },
        { value: "99.9%", label: "Uptime Server", suffix: "" },
    ]);
    const [features, setFeatures] = useState<FeatureItem[]>([
        { title: "POS Kasir Ultra-Cepat", desc: "Proses transaksi dalam 3 tap", gradient: "from-emerald-500 to-teal-600" },
        { title: "Manajemen Inventori", desc: "Stok realtime dan notifikasi otomatis", gradient: "from-blue-500 to-indigo-600" },
    ]);
    const [pricing, setPricing] = useState<PricingItem[]>([
        { name: "Free", price: 0, period: "selamanya", desc: "Untuk bisnis baru", features: ["1 Outlet", "30 Produk"], highlight: false },
        { name: "Pro", price: 99000, period: "/bulan", desc: "Untuk bisnis berkembang", features: ["5 Outlet", "Unlimited Produk"], highlight: true },
    ]);
    const [testimonials, setTestimonials] = useState<TestimonialItem[]>([
        { name: "Rina Andayani", role: "Owner, Kopi Nusantara", text: "CODAPOS mengubah cara kami mengelola outlet.", rating: 5, avatar: "RA" },
    ]);
    const [faq, setFaq] = useState<FAQItem[]>([
        { q: "Apakah CODAPOS benar-benar gratis?", a: "Ya! Paket Free bisa digunakan selamanya." },
    ]);

    // Configs map from backend
    const [configMap, setConfigMap] = useState<Record<string, string>>({});

    const loadConfigs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await superAdminAPI.getConfigs();
            const configs = res.data.data || [];
            const map: Record<string, string> = {};
            for (const cfg of configs) {
                if (cfg.key?.startsWith('website_')) {
                    map[cfg.key] = cfg.value;
                }
            }
            setConfigMap(map);

            // Parse stored values
            if (map.website_hero) setHero(safeParseJSON(map.website_hero, DEFAULT_HERO));
            if (map.website_stats) setStats(safeParseJSON(map.website_stats, stats));
            if (map.website_features) setFeatures(safeParseJSON(map.website_features, features));
            if (map.website_pricing) setPricing(safeParseJSON(map.website_pricing, pricing));
            if (map.website_testimonials) setTestimonials(safeParseJSON(map.website_testimonials, testimonials));
            if (map.website_faq) setFaq(safeParseJSON(map.website_faq, faq));
        } catch (err) {
            console.error('Failed to load CMS configs:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadConfigs(); }, [loadConfigs]);

    const handleSave = async () => {
        setSaving(true);
        setMsg(null);
        try {
            const key = CONFIG_KEYS[activeTab];
            let value = '';
            switch (activeTab) {
                case 'hero': value = JSON.stringify(hero); break;
                case 'stats': value = JSON.stringify(stats); break;
                case 'features': value = JSON.stringify(features); break;
                case 'pricing': value = JSON.stringify(pricing); break;
                case 'testimonials': value = JSON.stringify(testimonials); break;
                case 'faq': value = JSON.stringify(faq); break;
                default: return;
            }
            await superAdminAPI.setConfig(key, value, `CMS: ${activeTab} section content`);
            setMsg({ type: 'success', text: `Berhasil menyimpan ${activeTab}! ✅ Landing page akan auto-update.` });
            setTimeout(() => setMsg(null), 3000);
        } catch {
            setMsg({ type: 'error', text: 'Gagal menyimpan. Coba lagi.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/20">
                    <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Official Web CODA</h1>
                    <p className="text-sm text-white/50">Kelola konten landing page codapos.com</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => { setActiveTab(tab.key); setMsg(null); }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                            : 'glass-card text-white/70 hover:text-white'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Message */}
            {msg && (
                <div className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${msg.type === 'success'
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {msg.text}
                </div>
            )}

            {loading ? (
                <div className="glass-card p-12 text-center text-white/50 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Memuat data CMS...
                </div>
            ) : (
                <div className="space-y-4">
                    {/* ── HERO ── */}
                    {activeTab === 'hero' && (
                        <div className="glass-card p-6 space-y-5">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-400" /> Hero Section</h3>
                            {[
                                { label: "Badge Text", key: "badge" as keyof HeroData, placeholder: "Platform POS #1..." },
                                { label: "Headline", key: "headline" as keyof HeroData, placeholder: "Solusi Kasir Digital..." },
                                { label: "Sub-headline", key: "subheadline" as keyof HeroData, placeholder: "Kelola kasir, inventori..." },
                                { label: "CTA Primary", key: "cta_primary" as keyof HeroData, placeholder: "Mulai Gratis Sekarang" },
                                { label: "CTA Secondary", key: "cta_secondary" as keyof HeroData, placeholder: "Lihat Demo" },
                            ].map(field => (
                                <div key={field.key}>
                                    <label className="text-xs text-white/50 mb-1.5 block">{field.label}</label>
                                    {field.key === 'subheadline' ? (
                                        <textarea
                                            value={hero[field.key]}
                                            onChange={e => setHero(h => ({ ...h, [field.key]: e.target.value }))}
                                            rows={3}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all resize-none"
                                            placeholder={field.placeholder}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={hero[field.key]}
                                            onChange={e => setHero(h => ({ ...h, [field.key]: e.target.value }))}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                                            placeholder={field.placeholder}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── STATS ── */}
                    {activeTab === 'stats' && (
                        <div className="glass-card p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Statistik Pencapaian</h3>
                                <button onClick={() => setStats(s => [...s, { value: "", label: "", suffix: "" }])} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition flex items-center gap-1"><Plus className="w-3 h-3" /> Tambah</button>
                            </div>
                            {stats.map((stat, i) => (
                                <div key={i} className="grid grid-cols-12 gap-3 items-end p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="col-span-3">
                                        <label className="text-xs text-white/40 mb-1 block">Nilai</label>
                                        <input type="text" value={stat.value} onChange={e => { const n = [...stats]; n[i].value = e.target.value; setStats(n); }} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" />
                                    </div>
                                    <div className="col-span-5">
                                        <label className="text-xs text-white/40 mb-1 block">Label</label>
                                        <input type="text" value={stat.label} onChange={e => { const n = [...stats]; n[i].label = e.target.value; setStats(n); }} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="text-xs text-white/40 mb-1 block">Suffix</label>
                                        <input type="text" value={stat.suffix} onChange={e => { const n = [...stats]; n[i].suffix = e.target.value; setStats(n); }} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" />
                                    </div>
                                    <div className="col-span-1">
                                        <button onClick={() => setStats(s => s.filter((_, j) => j !== i))} className="p-2 text-red-400/50 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── FEATURES ── */}
                    {activeTab === 'features' && (
                        <div className="glass-card p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Fitur Unggulan</h3>
                                <button onClick={() => setFeatures(f => [...f, { title: "", desc: "", gradient: "from-emerald-500 to-teal-600" }])} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition flex items-center gap-1"><Plus className="w-3 h-3" /> Tambah</button>
                            </div>
                            {features.map((feat, i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/40">Fitur #{i + 1}</span>
                                        <button onClick={() => setFeatures(f => f.filter((_, j) => j !== i))} className="text-red-400/50 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    <input type="text" value={feat.title} onChange={e => { const n = [...features]; n[i].title = e.target.value; setFeatures(n); }} placeholder="Judul fitur" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" />
                                    <textarea value={feat.desc} onChange={e => { const n = [...features]; n[i].desc = e.target.value; setFeatures(n); }} placeholder="Deskripsi fitur" rows={2} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition resize-none" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── PRICING ── */}
                    {activeTab === 'pricing' && (
                        <div className="glass-card p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-white">Paket Harga</h3>
                            {pricing.map((plan, i) => (
                                <div key={i} className={`p-4 rounded-xl border space-y-3 ${plan.highlight ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-white">{plan.name || `Paket ${i + 1}`}</span>
                                        <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
                                            <input type="checkbox" checked={plan.highlight} onChange={e => { const n = [...pricing]; n[i].highlight = e.target.checked; setPricing(n); }} className="accent-emerald-500" />
                                            Highlight
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-white/40 mb-1 block">Nama</label>
                                            <input type="text" value={plan.name} onChange={e => { const n = [...pricing]; n[i].name = e.target.value; setPricing(n); }} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/40 mb-1 block">Harga (Rp)</label>
                                            <input type="number" value={plan.price} onChange={e => { const n = [...pricing]; n[i].price = Number(e.target.value); setPricing(n); }} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/40 mb-1 block">Deskripsi</label>
                                        <input type="text" value={plan.desc} onChange={e => { const n = [...pricing]; n[i].desc = e.target.value; setPricing(n); }} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/40 mb-1 block">Fitur (satu per baris)</label>
                                        <textarea value={plan.features.join('\n')} onChange={e => { const n = [...pricing]; n[i].features = e.target.value.split('\n'); setPricing(n); }} rows={4} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-emerald-500/50 transition resize-none" />
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => setPricing(p => [...p, { name: "", price: 0, period: "/bulan", desc: "", features: [], highlight: false }])} className="w-full py-3 border border-dashed border-white/20 rounded-xl text-white/40 hover:text-white/70 hover:border-white/40 transition text-sm flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Tambah Paket</button>
                        </div>
                    )}

                    {/* ── TESTIMONIALS ── */}
                    {activeTab === 'testimonials' && (
                        <div className="glass-card p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Testimoni Pelanggan</h3>
                                <button onClick={() => setTestimonials(t => [...t, { name: "", role: "", text: "", rating: 5, avatar: "" }])} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition flex items-center gap-1"><Plus className="w-3 h-3" /> Tambah</button>
                            </div>
                            {testimonials.map((t, i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/40">Testimoni #{i + 1}</span>
                                        <button onClick={() => setTestimonials(ts => ts.filter((_, j) => j !== i))} className="text-red-400/50 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <input type="text" value={t.name} onChange={e => { const n = [...testimonials]; n[i].name = e.target.value; setTestimonials(n); }} placeholder="Nama" className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" />
                                        <input type="text" value={t.role} onChange={e => { const n = [...testimonials]; n[i].role = e.target.value; setTestimonials(n); }} placeholder="Jabatan" className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" />
                                        <input type="text" value={t.avatar} onChange={e => { const n = [...testimonials]; n[i].avatar = e.target.value; setTestimonials(n); }} placeholder="Initials (RA)" className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" />
                                    </div>
                                    <textarea value={t.text} onChange={e => { const n = [...testimonials]; n[i].text = e.target.value; setTestimonials(n); }} placeholder="Isi testimoni..." rows={2} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition resize-none" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── FAQ ── */}
                    {activeTab === 'faq' && (
                        <div className="glass-card p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Pertanyaan Umum (FAQ)</h3>
                                <button onClick={() => setFaq(f => [...f, { q: "", a: "" }])} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition flex items-center gap-1"><Plus className="w-3 h-3" /> Tambah</button>
                            </div>
                            {faq.map((item, i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/40">FAQ #{i + 1}</span>
                                        <button onClick={() => setFaq(f => f.filter((_, j) => j !== i))} className="text-red-400/50 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    <input type="text" value={item.q} onChange={e => { const n = [...faq]; n[i].q = e.target.value; setFaq(n); }} placeholder="Pertanyaan" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" />
                                    <textarea value={item.a} onChange={e => { const n = [...faq]; n[i].a = e.target.value; setFaq(n); }} placeholder="Jawaban..." rows={3} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition resize-none" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── PAGES ── */}
                    {activeTab === 'pages' && (
                        <div className="glass-card p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-white">Footer Pages</h3>
                            <p className="text-sm text-white/40">Halaman-halaman ini tersedia di footer landing page. Kontennya secara default sudah terisi, Anda bisa mengeditnya nanti melalui CMS yang lebih lengkap.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    { name: "Tentang Kami", path: "/about", icon: "🏢" },
                                    { name: "Karir", path: "/careers", icon: "💼" },
                                    { name: "Blog", path: "/blog", icon: "📝" },
                                    { name: "Pusat Bantuan", path: "/help", icon: "🎧" },
                                    { name: "Syarat & Ketentuan", path: "/terms", icon: "📜" },
                                    { name: "Kebijakan Privasi", path: "/privacy", icon: "🔒" },
                                ].map((page, i) => (
                                    <a key={i} href={page.path} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-emerald-500/20 transition cursor-pointer group">
                                        <span className="text-2xl">{page.icon}</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition">{page.name}</p>
                                            <p className="text-xs text-white/30">{page.path}</p>
                                        </div>
                                        <span className="text-xs text-emerald-500 opacity-0 group-hover:opacity-100 transition">Buka →</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    {activeTab !== 'pages' && (
                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 flex items-center gap-2 transition-all disabled:opacity-50 hover:-translate-y-0.5"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
