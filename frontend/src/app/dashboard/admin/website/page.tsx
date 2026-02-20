'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
    Globe, Save, Loader2, CheckCircle, AlertTriangle, Plus, Trash2, X,
    Type, BarChart3, Zap, CreditCard, MessageCircle, HelpCircle, FileText, Sparkles,
    Upload, Palette, PenTool, Edit3, Newspaper,
} from 'lucide-react';
import { superAdminAPI, uploadAPI } from '@/lib/api';

// Lazy-load TinyMCE to avoid SSR issues
const TinyEditor = dynamic(() => import('@/components/TinyEditor'), { ssr: false, loading: () => <div className="h-[400px] bg-white/5 rounded-xl animate-pulse flex items-center justify-center text-white/30">Memuat editor...</div> });

// ═══════════════════════════════════════════════════════════════
// CMS — "OFFICIAL WEB CODA"
// Full CMS with hero banner, logo, pages, articles, and all sections
// ═══════════════════════════════════════════════════════════════

type CMSTab = 'hero' | 'branding' | 'stats' | 'features' | 'pricing' | 'testimonials' | 'faq' | 'pages' | 'blog';

interface HeroSlide {
    badge: string;
    headline: string;
    subheadline: string;
    gradient: string;
    bg_image_url: string;   // background image (replaces gradient when set)
    hero_image_url: string; // custom image for right side (replaces dashboard mockup)
}
interface HeroData {
    slides: HeroSlide[];
    cta_primary: string;
    cta_primary_link: string;
    cta_secondary: string;
    cta_secondary_link: string;
    trust_text: string;
    trust_rating: string;
    show_dashboard_mockup: boolean; // if false and hero_image_url set, show custom image
}
interface StatItem { value: string; label: string; suffix: string; }
interface FeatureItem { title: string; desc: string; gradient: string; }
interface PricingItem { name: string; price: number; period: string; desc: string; features: string[]; highlight: boolean; }
interface TestimonialItem { name: string; role: string; text: string; rating: number; avatar: string; }
interface FAQItem { q: string; a: string; }
interface BrandingData { logo_url: string; site_title: string; site_description: string; }
interface PageData { slug: string; title: string; content: string; }
interface ArticleData {
    id: string; title: string; slug: string; excerpt: string;
    content: string; featured_image: string;
    status: 'published' | 'draft';
    created_at: string; updated_at: string;
}

const DEFAULT_HERO: HeroData = {
    slides: [
        {
            badge: 'Platform POS #1 untuk UMKM Indonesia',
            headline: 'Solusi Kasir Digital & Manajemen Bisnis Terdepan',
            subheadline: 'Kelola kasir, inventori, laporan keuangan, dan toko online dalam satu platform terintegrasi.',
            gradient: 'from-[#0052D4] via-[#4364F7] to-[#6FB1FC]',
            bg_image_url: '',
            hero_image_url: '',
        },
    ],
    cta_primary: 'Mulai Gratis Sekarang',
    cta_primary_link: '/signup',
    cta_secondary: 'Lihat Demo',
    cta_secondary_link: '#fitur',
    trust_text: 'Dipercaya 10,000+ pemilik bisnis',
    trust_rating: '4.9/5',
    show_dashboard_mockup: true,
};

const DEFAULT_BRANDING: BrandingData = { logo_url: '', site_title: 'CODAPOS', site_description: 'Cloud POS & Merchant Platform' };

const DEFAULT_PAGES: PageData[] = [
    { slug: 'about', title: 'Tentang Kami', content: '<h2>Tentang CODAPOS</h2><p>CODAPOS adalah platform POS cloud terdepan untuk UMKM Indonesia.</p>' },
    { slug: 'careers', title: 'Karir', content: '<h2>Bergabung dengan Tim Kami</h2><p>Lihat posisi yang tersedia.</p>' },
    { slug: 'terms', title: 'Syarat & Ketentuan', content: '<h2>Syarat & Ketentuan</h2><p>Dengan menggunakan layanan CODAPOS, Anda menyetujui syarat berikut.</p>' },
    { slug: 'privacy', title: 'Kebijakan Privasi', content: '<h2>Kebijakan Privasi</h2><p>Kami menghargai privasi Anda.</p>' },
    { slug: 'help', title: 'Pusat Bantuan', content: '<h2>Pusat Bantuan</h2><p>Hubungi kami di support@codapos.com</p>' },
];

const TABS: { key: CMSTab; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: 'hero', label: 'Hero', icon: <Type className="w-4 h-4" />, desc: 'Banner, headline, CTA' },
    { key: 'branding', label: 'Logo & Branding', icon: <Palette className="w-4 h-4" />, desc: 'Logo, judul situs' },
    { key: 'stats', label: 'Statistik', icon: <BarChart3 className="w-4 h-4" />, desc: 'Angka pencapaian' },
    { key: 'features', label: 'Fitur', icon: <Zap className="w-4 h-4" />, desc: 'Fitur unggulan' },
    { key: 'pricing', label: 'Harga', icon: <CreditCard className="w-4 h-4" />, desc: 'Paket langganan' },
    { key: 'testimonials', label: 'Testimoni', icon: <MessageCircle className="w-4 h-4" />, desc: 'Ulasan pelanggan' },
    { key: 'faq', label: 'FAQ', icon: <HelpCircle className="w-4 h-4" />, desc: 'Pertanyaan umum' },
    { key: 'pages', label: 'Halaman', icon: <FileText className="w-4 h-4" />, desc: 'About, Terms, dll' },
    { key: 'blog', label: 'Blog', icon: <Newspaper className="w-4 h-4" />, desc: 'Artikel & post' },
];

const CONFIG_KEYS: Record<string, string> = {
    hero: 'website_hero', branding: 'website_branding',
    stats: 'website_stats', features: 'website_features',
    pricing: 'website_pricing', testimonials: 'website_testimonials',
    faq: 'website_faq', pages: 'website_pages', blog: 'website_articles',
};

function safeParseJSON<T>(json: string, fallback: T): T {
    try { return JSON.parse(json); } catch { return fallback; }
}

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ── Image Upload Component ──
function ImageUploader({ label, value, onChange, recommended }: { label: string; value: string; onChange: (url: string) => void; recommended?: string }) {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) return;
        setUploading(true);
        try {
            const res = await uploadAPI.upload(file);
            const url = res.data?.data?.url || res.data?.url || '';
            if (url) onChange(url);
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
    };

    return (
        <div className="space-y-2">
            <label className="text-xs text-white/50 mb-1 block">{label}</label>
            {recommended && <p className="text-[10px] text-emerald-400/60 -mt-1">📐 Ukuran yang disarankan: {recommended}</p>}
            <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${dragOver ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                        <span className="text-xs text-white/50">Mengupload...</span>
                    </div>
                ) : value ? (
                    <div className="space-y-3">
                        <img src={value} alt={label} className="max-h-40 mx-auto rounded-lg object-cover" />
                        <div className="flex items-center justify-center gap-2">
                            <button onClick={(e) => { e.stopPropagation(); onChange(''); }} className="text-xs text-red-400 hover:text-red-300 transition">Hapus</button>
                            <span className="text-xs text-white/30">|</span>
                            <span className="text-xs text-emerald-400">Klik untuk ganti</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-white/20" />
                        <span className="text-sm text-white/40">Klik atau drag & drop gambar</span>
                        <span className="text-xs text-white/20">PNG, JPG, WEBP (max 5MB)</span>
                    </div>
                )}
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
            </div>
            {value && (
                <div className="flex items-center gap-2">
                    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500/50 transition" placeholder="Atau masukkan URL gambar..." />
                </div>
            )}
        </div>
    );
}

// ── CMS Input Component ──
function CmsInput({ label, value, onChange, placeholder, type = 'text', rows }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; rows?: number }) {
    const cls = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all";
    return (
        <div>
            <label className="text-xs text-white/50 mb-1.5 block">{label}</label>
            {rows ? (
                <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className={cls + " resize-none"} placeholder={placeholder} />
            ) : (
                <input type={type} value={value} onChange={e => onChange(e.target.value)} className={cls} placeholder={placeholder} />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// MAIN CMS PAGE
// ═══════════════════════════════════════════════════════════════

export default function WebsiteCMSPage() {
    const [activeTab, setActiveTab] = useState<CMSTab>('hero');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // All data states
    const [hero, setHero] = useState<HeroData>(DEFAULT_HERO);
    const [branding, setBranding] = useState<BrandingData>(DEFAULT_BRANDING);
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
    const [pages, setPages] = useState<PageData[]>(DEFAULT_PAGES);
    const [editingPageSlug, setEditingPageSlug] = useState<string | null>(null);
    const [articles, setArticles] = useState<ArticleData[]>([]);
    const [editingArticle, setEditingArticle] = useState<ArticleData | null>(null);

    // Load all configs
    const loadConfigs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await superAdminAPI.getConfigs();
            const configs = res.data.data || [];
            const map: Record<string, string> = {};
            for (const cfg of configs) {
                if (cfg.key?.startsWith('website_')) map[cfg.key] = cfg.value;
            }

            if (map.website_hero) {
                const raw = safeParseJSON(map.website_hero, DEFAULT_HERO);
                // Migrate old flat format → new slides format
                const normalized: HeroData = {
                    ...DEFAULT_HERO,
                    ...raw,
                    slides: Array.isArray(raw.slides) && raw.slides.length > 0
                        ? raw.slides
                        : [{
                            badge: raw.badge || DEFAULT_HERO.slides[0].badge,
                            headline: raw.headline || DEFAULT_HERO.slides[0].headline,
                            subheadline: raw.subheadline || DEFAULT_HERO.slides[0].subheadline,
                            gradient: DEFAULT_HERO.slides[0].gradient,
                            bg_image_url: '',
                            hero_image_url: raw.banner_url || '',
                        }],
                };
                setHero(normalized);
            }
            if (map.website_branding) setBranding(safeParseJSON(map.website_branding, DEFAULT_BRANDING));
            if (map.website_stats) setStats(safeParseJSON(map.website_stats, stats));
            if (map.website_features) setFeatures(safeParseJSON(map.website_features, features));
            if (map.website_pricing) setPricing(safeParseJSON(map.website_pricing, pricing));
            if (map.website_testimonials) setTestimonials(safeParseJSON(map.website_testimonials, testimonials));
            if (map.website_faq) setFaq(safeParseJSON(map.website_faq, faq));
            if (map.website_pages) setPages(safeParseJSON(map.website_pages, DEFAULT_PAGES));
            if (map.website_articles) setArticles(safeParseJSON(map.website_articles, []));
        } catch (err) {
            console.error('Failed to load CMS configs:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadConfigs(); }, [loadConfigs]);

    // Save active tab data
    const handleSave = async (overrideKey?: string, overrideValue?: string) => {
        setSaving(true); setMsg(null);
        try {
            const key = overrideKey || CONFIG_KEYS[activeTab];
            let value = overrideValue || '';
            if (!overrideValue) {
                switch (activeTab) {
                    case 'hero': value = JSON.stringify(hero); break;
                    case 'branding': value = JSON.stringify(branding); break;
                    case 'stats': value = JSON.stringify(stats); break;
                    case 'features': value = JSON.stringify(features); break;
                    case 'pricing': value = JSON.stringify(pricing); break;
                    case 'testimonials': value = JSON.stringify(testimonials); break;
                    case 'faq': value = JSON.stringify(faq); break;
                    case 'pages': value = JSON.stringify(pages); break;
                    case 'blog': value = JSON.stringify(articles); break;
                    default: return;
                }
            }
            await superAdminAPI.setConfig(key, value, `CMS: ${activeTab} content`);
            setMsg({ type: 'success', text: `Berhasil disimpan! ✅` });
            setTimeout(() => setMsg(null), 3000);
        } catch {
            setMsg({ type: 'error', text: 'Gagal menyimpan. Coba lagi.' });
        } finally {
            setSaving(false);
        }
    };

    // Article helpers
    const createArticle = () => {
        const newArticle: ArticleData = {
            id: generateId(),
            title: '', slug: '', excerpt: '', content: '',
            featured_image: '', status: 'draft',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setEditingArticle(newArticle);
    };

    const saveArticle = () => {
        if (!editingArticle) return;
        const updated = { ...editingArticle, updated_at: new Date().toISOString() };
        if (!updated.slug && updated.title) {
            updated.slug = updated.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        const existing = articles.findIndex(a => a.id === updated.id);
        let newArticles: ArticleData[];
        if (existing >= 0) {
            newArticles = [...articles];
            newArticles[existing] = updated;
        } else {
            newArticles = [...articles, updated];
        }
        setArticles(newArticles);
        setEditingArticle(null);
        // Auto-save to backend
        handleSave('website_articles', JSON.stringify(newArticles));
    };

    const deleteArticle = (id: string) => {
        const newArticles = articles.filter(a => a.id !== id);
        setArticles(newArticles);
        handleSave('website_articles', JSON.stringify(newArticles));
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
                    <p className="text-sm text-white/50">Kelola konten landing page, logo, halaman, dan artikel blog</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => { setActiveTab(tab.key); setMsg(null); setEditingPageSlug(null); setEditingArticle(null); }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                            : 'bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Status Message */}
            {msg && (
                <div className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${msg.type === 'success'
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {msg.text}
                </div>
            )}

            {loading ? (
                <div className="glass p-12 text-center text-white/50 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Memuat data CMS...
                </div>
            ) : (
                <div className="space-y-4">

                    {/* ══════════ HERO SECTION ══════════ */}
                    {activeTab === 'hero' && (
                        <div className="space-y-4">
                            {/* Global Hero Settings */}
                            <div className="glass p-6 space-y-5">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-400" /> Hero Section — Pengaturan Global</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <CmsInput label="CTA Primary (teks tombol)" value={hero.cta_primary} onChange={v => setHero(h => ({ ...h, cta_primary: v }))} placeholder="Mulai Gratis Sekarang" />
                                    <CmsInput label="CTA Primary Link (URL)" value={hero.cta_primary_link} onChange={v => setHero(h => ({ ...h, cta_primary_link: v }))} placeholder="/signup" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <CmsInput label="CTA Secondary (teks tombol)" value={hero.cta_secondary} onChange={v => setHero(h => ({ ...h, cta_secondary: v }))} placeholder="Lihat Demo" />
                                    <CmsInput label="CTA Secondary Link (URL)" value={hero.cta_secondary_link} onChange={v => setHero(h => ({ ...h, cta_secondary_link: v }))} placeholder="#fitur" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <CmsInput label="Rating Trust" value={hero.trust_rating} onChange={v => setHero(h => ({ ...h, trust_rating: v }))} placeholder="4.9/5" />
                                    <CmsInput label="Teks Trust" value={hero.trust_text} onChange={v => setHero(h => ({ ...h, trust_text: v }))} placeholder="Dipercaya 10,000+ pemilik bisnis" />
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hero.show_dashboard_mockup}
                                        onChange={e => setHero(h => ({ ...h, show_dashboard_mockup: e.target.checked }))}
                                        className="accent-emerald-500 w-4 h-4"
                                    />
                                    <span className="text-sm text-white/70">Tampilkan Dashboard Mockup (jika dimatikan, hero image slide akan dipakai)</span>
                                </label>
                            </div>

                            {/* Slides */}
                            <div className="glass p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-white">Hero Slides ({hero.slides.length})</h3>
                                    <button
                                        onClick={() => setHero(h => ({ ...h, slides: [...h.slides, { badge: '', headline: '', subheadline: '', gradient: 'from-[#0052D4] via-[#4364F7] to-[#6FB1FC]', bg_image_url: '', hero_image_url: '' }] }))}
                                        className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Tambah Slide
                                    </button>
                                </div>

                                {hero.slides.map((slide, i) => (
                                    <div key={i} className="p-5 bg-white/5 rounded-xl border border-white/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-white">Slide #{i + 1}</span>
                                            {hero.slides.length > 1 && (
                                                <button
                                                    onClick={() => setHero(h => ({ ...h, slides: h.slides.filter((_, j) => j !== i) }))}
                                                    className="text-red-400/50 hover:text-red-400 transition"
                                                ><Trash2 className="w-4 h-4" /></button>
                                            )}
                                        </div>

                                        <CmsInput
                                            label="Badge Text"
                                            value={slide.badge}
                                            onChange={v => { const n = { ...hero, slides: [...hero.slides] }; n.slides[i] = { ...n.slides[i], badge: v }; setHero(n); }}
                                            placeholder="Platform POS #1..."
                                        />
                                        <CmsInput
                                            label="Headline"
                                            value={slide.headline}
                                            onChange={v => { const n = { ...hero, slides: [...hero.slides] }; n.slides[i] = { ...n.slides[i], headline: v }; setHero(n); }}
                                            placeholder="Solusi Kasir Digital..."
                                        />
                                        <CmsInput
                                            label="Sub-headline"
                                            value={slide.subheadline}
                                            onChange={v => { const n = { ...hero, slides: [...hero.slides] }; n.slides[i] = { ...n.slides[i], subheadline: v }; setHero(n); }}
                                            placeholder="Kelola kasir, inventori..."
                                            rows={2}
                                        />
                                        <CmsInput
                                            label="Background Gradient (CSS)"
                                            value={slide.gradient}
                                            onChange={v => { const n = { ...hero, slides: [...hero.slides] }; n.slides[i] = { ...n.slides[i], gradient: v }; setHero(n); }}
                                            placeholder="from-[#0052D4] via-[#4364F7] to-[#6FB1FC]"
                                        />
                                        {/* Gradient Preview — only if no bg image */}
                                        {!slide.bg_image_url && (
                                            <div className={`h-8 rounded-lg bg-gradient-to-r ${slide.gradient}`} />
                                        )}

                                        <ImageUploader
                                            label="Background Image (menggantikan gradient jika diisi)"
                                            value={slide.bg_image_url || ''}
                                            onChange={(url) => { const n = { ...hero, slides: [...hero.slides] }; n.slides[i] = { ...n.slides[i], bg_image_url: url }; setHero(n); }}
                                            recommended="1920 × 800 px (gambar latar belakang slide)"
                                        />
                                        {slide.bg_image_url && (
                                            <p className="text-xs text-amber-400/80">⚠ Background image aktif — gradient tidak akan digunakan untuk slide ini.</p>
                                        )}

                                        <ImageUploader
                                            label="Hero Image (kanan slide)"
                                            value={slide.hero_image_url}
                                            onChange={(url) => { const n = { ...hero, slides: [...hero.slides] }; n.slides[i] = { ...n.slides[i], hero_image_url: url }; setHero(n); }}
                                            recommended="800 × 600 px (akan ditampilkan di sebelah kanan teks)"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ══════════ BRANDING ══════════ */}
                    {activeTab === 'branding' && (
                        <div className="glass p-6 space-y-5">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Palette className="w-5 h-5 text-emerald-400" /> Logo & Branding</h3>

                            <ImageUploader
                                label="Logo Website"
                                value={branding.logo_url}
                                onChange={(url) => setBranding(b => ({ ...b, logo_url: url }))}
                                recommended="400 × 120 px (PNG transparan)"
                            />

                            <CmsInput label="Judul Situs" value={branding.site_title} onChange={v => setBranding(b => ({ ...b, site_title: v }))} placeholder="CODAPOS" />
                            <CmsInput label="Deskripsi Situs" value={branding.site_description} onChange={v => setBranding(b => ({ ...b, site_description: v }))} placeholder="Cloud POS & Merchant Platform" rows={2} />
                        </div>
                    )}

                    {/* ══════════ STATS ══════════ */}
                    {activeTab === 'stats' && (
                        <div className="glass p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Statistik Pencapaian</h3>
                                <button onClick={() => setStats(s => [...s, { value: "", label: "", suffix: "" }])} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition flex items-center gap-1"><Plus className="w-3 h-3" /> Tambah</button>
                            </div>
                            {stats.map((stat, i) => (
                                <div key={i} className="grid grid-cols-12 gap-3 items-end p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="col-span-3"><label className="text-xs text-white/40 mb-1 block">Nilai</label><input type="text" value={stat.value} onChange={e => { const n = [...stats]; n[i].value = e.target.value; setStats(n); }} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" /></div>
                                    <div className="col-span-5"><label className="text-xs text-white/40 mb-1 block">Label</label><input type="text" value={stat.label} onChange={e => { const n = [...stats]; n[i].label = e.target.value; setStats(n); }} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" /></div>
                                    <div className="col-span-3"><label className="text-xs text-white/40 mb-1 block">Suffix</label><input type="text" value={stat.suffix} onChange={e => { const n = [...stats]; n[i].suffix = e.target.value; setStats(n); }} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" /></div>
                                    <div className="col-span-1"><button onClick={() => setStats(s => s.filter((_, j) => j !== i))} className="p-2 text-red-400/50 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ══════════ FEATURES ══════════ */}
                    {activeTab === 'features' && (
                        <div className="glass p-6 space-y-4">
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

                    {/* ══════════ PRICING ══════════ */}
                    {activeTab === 'pricing' && (
                        <div className="glass p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-white">Paket Harga</h3>
                            {pricing.map((plan, i) => (
                                <div key={i} className={`p-4 rounded-xl border space-y-3 ${plan.highlight ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-white">{plan.name || `Paket ${i + 1}`}</span>
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer"><input type="checkbox" checked={plan.highlight} onChange={e => { const n = [...pricing]; n[i].highlight = e.target.checked; setPricing(n); }} className="accent-emerald-500" /> Highlight</label>
                                            <button onClick={() => setPricing(p => p.filter((_, j) => j !== i))} className="text-red-400/50 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="text-xs text-white/40 mb-1 block">Nama</label><input type="text" value={plan.name} onChange={e => { const n = [...pricing]; n[i].name = e.target.value; setPricing(n); }} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" /></div>
                                        <div><label className="text-xs text-white/40 mb-1 block">Harga (Rp)</label><input type="number" value={plan.price} onChange={e => { const n = [...pricing]; n[i].price = Number(e.target.value); setPricing(n); }} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" /></div>
                                    </div>
                                    <div><label className="text-xs text-white/40 mb-1 block">Deskripsi</label><input type="text" value={plan.desc} onChange={e => { const n = [...pricing]; n[i].desc = e.target.value; setPricing(n); }} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition" /></div>
                                    <div><label className="text-xs text-white/40 mb-1 block">Fitur (satu per baris)</label><textarea value={plan.features.join('\n')} onChange={e => { const n = [...pricing]; n[i].features = e.target.value.split('\n'); setPricing(n); }} rows={4} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-emerald-500/50 transition resize-none" /></div>
                                </div>
                            ))}
                            <button onClick={() => setPricing(p => [...p, { name: "", price: 0, period: "/bulan", desc: "", features: [], highlight: false }])} className="w-full py-3 border border-dashed border-white/20 rounded-xl text-white/40 hover:text-white/70 hover:border-white/40 transition text-sm flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Tambah Paket</button>
                        </div>
                    )}

                    {/* ══════════ TESTIMONIALS ══════════ */}
                    {activeTab === 'testimonials' && (
                        <div className="glass p-6 space-y-4">
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

                    {/* ══════════ FAQ ══════════ */}
                    {activeTab === 'faq' && (
                        <div className="glass p-6 space-y-4">
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

                    {/* ══════════ PAGES (Editable with TinyMCE) ══════════ */}
                    {activeTab === 'pages' && (
                        <div className="space-y-4">
                            <div className="glass p-6">
                                <h3 className="text-lg font-semibold text-white mb-1">Halaman Website</h3>
                                <p className="text-sm text-white/40 mb-4">Klik tombol "Edit" untuk mengedit konten halaman menggunakan editor visual.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {pages.map((page) => (
                                        <div key={page.slug} className={`flex items-center gap-3 p-4 rounded-xl border transition ${editingPageSlug === page.slug ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                                            <span className="text-2xl">{
                                                page.slug === 'about' ? '🏢' :
                                                    page.slug === 'careers' ? '💼' :
                                                        page.slug === 'terms' ? '📜' :
                                                            page.slug === 'privacy' ? '🔒' :
                                                                page.slug === 'help' ? '🎧' : '📄'
                                            }</span>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-white">{page.title}</p>
                                                <p className="text-xs text-white/30">/{page.slug}</p>
                                            </div>
                                            <button
                                                onClick={() => setEditingPageSlug(editingPageSlug === page.slug ? null : page.slug)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${editingPageSlug === page.slug ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                                            >
                                                {editingPageSlug === page.slug ? <><X className="w-3 h-3" /> Tutup</> : <><Edit3 className="w-3 h-3" /> Edit</>}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Page Editor */}
                            {editingPageSlug && (() => {
                                const pageIndex = pages.findIndex(p => p.slug === editingPageSlug);
                                const page = pages[pageIndex];
                                if (!page) return null;
                                return (
                                    <div className="glass p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                <PenTool className="w-5 h-5 text-emerald-400" />
                                                Edit: {page.title}
                                            </h3>
                                        </div>
                                        <CmsInput
                                            label="Judul Halaman"
                                            value={page.title}
                                            onChange={(v) => { const n = [...pages]; n[pageIndex].title = v; setPages(n); }}
                                            placeholder="Judul halaman..."
                                        />
                                        <div>
                                            <label className="text-xs text-white/50 mb-2 block">Konten Halaman</label>
                                            <TinyEditor
                                                value={page.content}
                                                onChange={(content) => { const n = [...pages]; n[pageIndex].content = content; setPages(n); }}
                                                height={500}
                                            />
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* ══════════ BLOG / ARTICLES ══════════ */}
                    {activeTab === 'blog' && !editingArticle && (
                        <div className="glass p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Blog & Artikel</h3>
                                    <p className="text-xs text-white/40">Tulis artikel dan konten blog seperti pengalaman WordPress</p>
                                </div>
                                <button onClick={createArticle} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition flex items-center gap-2 shadow-lg shadow-emerald-900/30">
                                    <Plus className="w-4 h-4" /> Tulis Artikel
                                </button>
                            </div>

                            {articles.length === 0 ? (
                                <div className="text-center py-12">
                                    <Newspaper className="w-12 h-12 text-white/10 mx-auto mb-3" />
                                    <p className="text-white/30 text-sm">Belum ada artikel</p>
                                    <p className="text-white/20 text-xs mt-1">Klik &quot;Tulis Artikel&quot; untuk memulai</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {articles.map((article) => (
                                        <div key={article.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/8 transition group">
                                            {article.featured_image ? (
                                                <img src={article.featured_image} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                                            ) : (
                                                <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="w-6 h-6 text-white/15" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-white truncate">{article.title || 'Tanpa Judul'}</p>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${article.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                        {article.status === 'published' ? 'Published' : 'Draft'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-white/30 truncate mt-0.5">{article.excerpt || 'Belum ada excerpt'}</p>
                                                <p className="text-[10px] text-white/20 mt-1">{new Date(article.updated_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                                <button onClick={() => setEditingArticle(article)} className="p-2 text-emerald-400/50 hover:text-emerald-400 transition" title="Edit"><Edit3 className="w-4 h-4" /></button>
                                                <button onClick={() => deleteArticle(article.id)} className="p-2 text-red-400/50 hover:text-red-400 transition" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Article Editor ── */}
                    {activeTab === 'blog' && editingArticle && (
                        <div className="space-y-4">
                            {/* Toolbar */}
                            <div className="glass p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setEditingArticle(null)} className="p-2 text-white/40 hover:text-white transition rounded-lg hover:bg-white/5">
                                        <X className="w-5 h-5" />
                                    </button>
                                    <h3 className="text-lg font-semibold text-white">
                                        {articles.find(a => a.id === editingArticle.id) ? 'Edit Artikel' : 'Artikel Baru'}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={editingArticle.status}
                                        onChange={(e) => setEditingArticle({ ...editingArticle, status: e.target.value as 'published' | 'draft' })}
                                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500/50 transition"
                                    >
                                        <option value="draft" className="bg-[#1a1a2e]">📝 Draft</option>
                                        <option value="published" className="bg-[#1a1a2e]">✅ Published</option>
                                    </select>
                                    <button onClick={saveArticle} className="px-5 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition flex items-center gap-2 shadow-lg shadow-emerald-900/30">
                                        <Save className="w-4 h-4" /> Simpan Artikel
                                    </button>
                                </div>
                            </div>

                            {/* Article Fields */}
                            <div className="glass p-6 space-y-4">
                                <CmsInput label="Judul Artikel" value={editingArticle.title} onChange={v => setEditingArticle({ ...editingArticle, title: v })} placeholder="Judul artikel yang menarik..." />
                                <div className="grid grid-cols-2 gap-4">
                                    <CmsInput label="Slug (URL)" value={editingArticle.slug} onChange={v => setEditingArticle({ ...editingArticle, slug: v })} placeholder="judul-artikel-url" />
                                    <CmsInput label="Excerpt (ringkasan)" value={editingArticle.excerpt} onChange={v => setEditingArticle({ ...editingArticle, excerpt: v })} placeholder="Ringkasan singkat artikel..." />
                                </div>
                                <ImageUploader
                                    label="Featured Image"
                                    value={editingArticle.featured_image}
                                    onChange={(url) => setEditingArticle({ ...editingArticle, featured_image: url })}
                                    recommended="1200 × 630 px (rasio 1.91:1)"
                                />
                            </div>

                            {/* Content Editor */}
                            <div className="glass p-6">
                                <label className="text-xs text-white/50 mb-2 block">Konten Artikel</label>
                                <TinyEditor
                                    value={editingArticle.content}
                                    onChange={(content) => setEditingArticle({ ...editingArticle, content })}
                                    height={600}
                                    placeholder="Mulai menulis artikel..."
                                />
                            </div>
                        </div>
                    )}

                    {/* ══════════ SAVE BUTTON ══════════ */}
                    {activeTab !== 'blog' && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => handleSave()}
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
