"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ShoppingCart, BarChart3, Users, Package, CreditCard, Truck,
  Store, Star, ChevronDown, ArrowRight, Check, Zap, Menu, X,
  Globe, Shield, Clock, Printer, Brain, Palette, Mail, Phone,
  MapPin, Sparkles, Crown, Play, ChevronRight, Headphones,
  Award, TrendingUp, Layers, Monitor, Smartphone, Wifi,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
//  CODAPOS Landing Page — Premium Professional Design
// ═══════════════════════════════════════════════════════════════

// Default content (overridden by CMS via GlobalConfig)
const DEFAULT_HERO = {
  badge: "Platform POS #1 untuk UMKM Indonesia",
  headline: "Solusi Kasir Digital & Manajemen Bisnis Terdepan",
  subheadline: "Kelola kasir, inventori, laporan keuangan, dan toko online dalam satu platform terintegrasi. Gratis untuk UMKM, powerful untuk enterprise.",
  cta_primary: "Mulai Gratis Sekarang",
  cta_secondary: "Lihat Demo",
};

const DEFAULT_STATS = [
  { value: "10,000+", label: "UMKM Terdaftar", suffix: "" },
  { value: "500+", label: "Kota di Indonesia", suffix: "" },
  { value: "2.5", label: "Miliar Transaksi Diproses", suffix: "M+" },
  { value: "99.9", label: "Uptime Server", suffix: "%" },
];

const BUSINESS_TYPES = [
  { name: "Kedai Kopi", emoji: "☕", desc: "Manajemen menu, stok bahan, laporan harian" },
  { name: "Restoran", emoji: "🍽️", desc: "Multi-meja, split bill, kitchen display" },
  { name: "Retail & Toko", emoji: "🛍️", desc: "Barcode, inventori, supplier management" },
  { name: "Bakery & Kue", emoji: "🧁", desc: "Pre-order, resep, kalkulasi bahan" },
  { name: "Barbershop & Salon", emoji: "💈", desc: "Booking, membership, komisi stylist" },
  { name: "Apotek", emoji: "💊", desc: "Batch tracking, expired alert, resep" },
  { name: "Laundry", emoji: "👕", desc: "Status cucian, pickup/delivery, notifikasi" },
  { name: "Franchise", emoji: "🏪", desc: "Multi-outlet, royalti, standarisasi" },
];

const FEATURES = [
  { icon: ShoppingCart, title: "POS Kasir Ultra-Cepat", desc: "Proses transaksi dalam hitungan detik. Scan barcode, pilih payment, cetak struk — semua dalam 3 tap.", gradient: "from-emerald-500 to-teal-600" },
  { icon: Package, title: "Manajemen Inventori", desc: "Stok realtime, notifikasi stok menipis, transfer antar outlet, dan laporan pergerakan barang.", gradient: "from-blue-500 to-indigo-600" },
  { icon: BarChart3, title: "Analitik & Laporan", desc: "Dashboard realtime dengan grafik penjualan, produk terlaris, laba-rugi, dan export ke PDF/Excel.", gradient: "from-violet-500 to-purple-600" },
  { icon: CreditCard, title: "Multi-Payment Gateway", desc: "Terima QRIS, kartu kredit/debit, e-wallet, transfer bank via Midtrans. Rekonsiliasi otomatis.", gradient: "from-amber-500 to-orange-600" },
  { icon: Truck, title: "Delivery & MyKurir", desc: "Sistem kurir internal dengan tracking GPS realtime, auto-assign driver, dan estimasi ongkir.", gradient: "from-rose-500 to-pink-600" },
  { icon: Brain, title: "AI Forecasting", desc: "Prediksi penjualan dengan machine learning. Restock otomatis dan optimasi stok berdasarkan tren.", gradient: "from-cyan-500 to-blue-600" },
  { icon: Printer, title: "Printer Thermal", desc: "Cetak struk via Bluetooth & USB. Kompatibel 58mm & 80mm, template kustom, auto-print.", gradient: "from-sky-500 to-cyan-600" },
  { icon: Globe, title: "Toko Online Gratis", desc: "Storefront dengan 20+ tema premium. Custom domain, SEO friendly, checkout terintegrasi.", gradient: "from-indigo-500 to-violet-600" },
];

const SHOWCASE = [
  { title: "Dashboard Analitik Realtime", desc: "Monitor omzet, penjualan, dan performa outlet dalam satu layar. Grafik interaktif dan insight AI.", features: ["Revenue harian/mingguan", "Produk terlaris", "Revenue per outlet", "Export PDF/Excel"], emoji: "📊" },
  { title: "POS Kasir Modern", desc: "Interface kasir super cepat dan intuitif. Barcode scanner, split bill, multi-payment — 3 detik per transaksi.", features: ["Scan barcode & QR", "Split bill & diskon", "Multi payment method", "Auto-print struk"], emoji: "🛒" },
  { title: "Multi-Outlet Manager", desc: "Kontrol semua cabang dari satu dashboard. Sinkronisasi real-time, harga per lokasi, transfer stok.", features: ["Sync stok antar outlet", "Harga berbeda per lokasi", "Transfer stok cabang", "Laporan per outlet"], emoji: "🏢" },
];

const TESTIMONIALS = [
  { name: "Rina Andayani", role: "Owner, Kopi Nusantara", text: "CODAPOS mengubah cara kami mengelola 3 outlet. Laporan realtime dan POS super cepat benar-benar menghemat waktu 2 jam per hari!", rating: 5, avatar: "RA", gradient: "from-emerald-400 to-teal-500" },
  { name: "Budi Santoso", role: "Manager, Toko Serba Ada", text: "Fitur inventory management-nya luar biasa. Notifikasi stok otomatis bikin kami tidak pernah kehabisan barang lagi. Revenue naik 30%!", rating: 5, avatar: "BS", gradient: "from-blue-400 to-indigo-500" },
  { name: "Maya Putri", role: "Owner, Bakery House", text: "Dari kasir manual ke CODAPOS, peningkatannya drastis! AI Forecast membantu kami prepare bahan dengan tepat. Zero waste!", rating: 5, avatar: "MP", gradient: "from-violet-400 to-purple-500" },
  { name: "Dimas Kurniawan", role: "CEO, Franchise Ayam Goreng", text: "Mengelola 12 outlet franchise jadi mudah. Royalti, standarisasi harga, semua otomatis. Sangat direkomendasikan!", rating: 5, avatar: "DK", gradient: "from-amber-400 to-orange-500" },
];

const PRICING = [
  {
    name: "Free", price: 0, period: "selamanya", desc: "Untuk bisnis baru yang baru memulai",
    features: ["1 Outlet", "1 User", "30 Produk", "POS Kasir Dasar", "Laporan Sederhana", "1 Template Toko"],
    highlight: false, icon: Sparkles,
  },
  {
    name: "Pro", price: 99000, period: "/bulan", desc: "Untuk bisnis berkembang & franchise",
    features: ["5 Outlet", "10 Users", "Unlimited Produk", "Semua Fitur POS", "Laporan Detail + AI", "20+ Template Premium", "Payment Gateway Midtrans", "Printer Bluetooth/USB", "MyKurir Delivery", "Custom Domain", "Support Prioritas 24/7"],
    highlight: true, icon: Crown,
  },
];

const FAQS = [
  { q: "Apakah CODAPOS benar-benar gratis?", a: "Ya! Paket Free bisa digunakan selamanya tanpa biaya. Anda hanya perlu upgrade ke Pro jika membutuhkan fitur lebih seperti multi-outlet dan payment gateway." },
  { q: "Apakah data saya aman?", a: "100% aman. Kami menggunakan enkripsi end-to-end, server yang tersertifikasi ISO 27001, dan backup otomatis setiap hari. Uptime 99.9% guaranteed." },
  { q: "Bisa dipakai di HP dan tablet?", a: "Ya, CODAPOS berjalan di browser modern dan responsive untuk semua ukuran layar. Bisa diakses dari smartphone, tablet, maupun desktop." },
  { q: "Bagaimana cara migrasi dari POS lain?", a: "Tim kami akan membantu migrasi data Anda secara gratis. Import data via CSV/Excel. Proses biasanya selesai dalam 1-2 hari kerja." },
  { q: "Apakah bisa pakai printer struk?", a: "Ya, CODAPOS mendukung printer thermal 58mm & 80mm via Bluetooth dan USB. Struk bisa di-customize dengan logo dan informasi toko Anda." },
];

const FOOTER_LINKS = {
  Produk: [
    { label: "POS Kasir", href: "/about" },
    { label: "Manajemen Stok", href: "/about" },
    { label: "Laporan", href: "/about" },
    { label: "Toko Online", href: "/about" },
    { label: "Delivery", href: "/about" },
  ],
  Perusahaan: [
    { label: "Tentang Kami", href: "/about" },
    { label: "Karir", href: "/careers" },
    { label: "Blog", href: "/blog" },
    { label: "Press Kit", href: "/about" },
  ],
  Support: [
    { label: "Pusat Bantuan", href: "/help" },
    { label: "Dokumentasi API", href: "/help" },
    { label: "Status Sistem", href: "/help" },
    { label: "Hubungi Kami", href: "/help" },
  ],
  Legal: [
    { label: "Syarat & Ketentuan", href: "/terms" },
    { label: "Kebijakan Privasi", href: "/privacy" },
    { label: "SLA", href: "/terms" },
  ],
};

// Animated counter hook
function useCounter(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const startTime = Date.now();
        const tick = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * end));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, startOnView]);

  return { count, ref };
}

// ═══════════════════════════════════════════════════════════════
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeShowcase, setActiveShowcase] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActiveShowcase((p) => (p + 1) % SHOWCASE.length), 5000);
    return () => clearInterval(interval);
  }, []);

  const stat1 = useCounter(10000, 2500);
  const stat2 = useCounter(500, 2000);
  const stat3 = useCounter(2500, 2500);
  const stat4 = useCounter(999, 2000);

  return (
    <div className="landing-page font-sans">
      {/* ═══════ NAVBAR ═══════ */}
      <nav className={`landing-nav ${scrolled ? "landing-nav-scrolled" : ""}`}>
        <div className="landing-container flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2.5 z-10">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00B894] to-[#00CEC9] flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                CODA<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00CEC9]">POS</span>
              </span>
              <p className="text-[9px] text-gray-400 -mt-1 font-medium tracking-wider">CLOUD POS PLATFORM</p>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {[{ l: "Fitur", h: "#fitur" }, { l: "Harga", h: "#harga" }, { l: "Bisnis", h: "#bisnis" }, { l: "Testimoni", h: "#testimoni" }].map(n => (
              <a key={n.h} href={n.h} className="text-sm font-medium text-gray-500 hover:text-[#00B894] transition-colors relative group">
                {n.l}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#00B894] to-[#00CEC9] group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition px-5 py-2.5 rounded-xl hover:bg-gray-50">Masuk</Link>
            <Link href="/signup" className="landing-btn-primary text-sm">Coba Gratis <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition z-10">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-2xl">
            <div className="landing-container py-4 space-y-1">
              {[{ l: "Fitur", h: "#fitur" }, { l: "Harga", h: "#harga" }, { l: "Bisnis", h: "#bisnis" }, { l: "Testimoni", h: "#testimoni" }].map(n => (
                <a key={n.h} href={n.h} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl">{n.l}</a>
              ))}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <Link href="/login" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl">Masuk</Link>
                <Link href="/signup" className="block px-4 py-3 text-center bg-gradient-to-r from-[#00B894] to-[#00CEC9] text-white rounded-xl font-bold">Coba Gratis</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="landing-hero">
        <div className="landing-hero-bg" />
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-[#00B894]/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-[#00CEC9]/8 rounded-full blur-3xl animate-float-delay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#00B894]/5 to-[#00CEC9]/5 rounded-full blur-3xl" />

        <div className="landing-container relative z-10 pt-32 md:pt-44 pb-24 md:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-emerald-200/50 text-sm text-emerald-700 font-semibold mb-8 shadow-sm hover:shadow-md transition-shadow">
                <Zap className="w-4 h-4 text-emerald-500" />
                {DEFAULT_HERO.badge}
                <ChevronRight className="w-3.5 h-3.5" />
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black text-gray-900 leading-[1.1] tracking-tight">
                {DEFAULT_HERO.headline.split("&").map((part, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00957a]">&amp; </span>}
                    {part}
                  </span>
                ))}
              </h1>

              <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {DEFAULT_HERO.subheadline}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center lg:justify-start">
                <Link href="/signup" className="landing-btn-primary text-base px-8 py-4 shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/60">
                  {DEFAULT_HERO.cta_primary}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#fitur" className="landing-btn-secondary text-base px-8 py-4">
                  <Play className="w-5 h-5" />
                  {DEFAULT_HERO.cta_secondary}
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 mt-10 justify-center lg:justify-start">
                <div className="flex -space-x-3">
                  {["RA", "BS", "MP", "DK", "AS"].map((init, i) => (
                    <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00B894] to-[#00CEC9] border-[3px] border-white flex items-center justify-center text-[10px] text-white font-bold shadow-sm">{init}</div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                    <span className="text-sm font-bold text-gray-700 ml-1">4.9/5</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Dipercaya 10,000+ pelaku usaha</p>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center gap-4 mt-6 justify-center lg:justify-start text-xs text-gray-400">
                <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-emerald-500" /> SSL Secured</span>
                <span className="flex items-center gap-1"><Wifi className="w-3.5 h-3.5 text-emerald-500" /> 99.9% Uptime</span>
                <span className="flex items-center gap-1"><Headphones className="w-3.5 h-3.5 text-emerald-500" /> Support 24/7</span>
              </div>
            </div>

            {/* Hero Visual — Premium Dashboard Mockup */}
            <div className="relative hidden lg:block">
              <div className="landing-hero-visual">
                {/* Floating revenue card */}
                <div className="absolute -top-8 -left-8 w-56 bg-white rounded-2xl shadow-2xl shadow-gray-200/60 p-5 border border-gray-100 z-20 animate-float">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium">Omzet Hari Ini</p>
                      <p className="text-base font-extrabold text-gray-900">Rp 4.850.000</p>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-[78%] bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" />
                  </div>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +23% vs kemarin</p>
                </div>

                {/* Floating orders card */}
                <div className="absolute -bottom-6 -right-6 w-52 bg-white rounded-2xl shadow-2xl shadow-gray-200/60 p-4 border border-gray-100 z-20 animate-float-delay">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-violet-600" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Transaksi Baru</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900">127</p>
                  <p className="text-[10px] text-gray-400">order hari ini</p>
                </div>

                {/* Main Dashboard */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-gray-300/30 border border-gray-200/80 p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00B894] via-[#00CEC9] to-[#00B894]" />
                  {/* Browser dots */}
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <div className="flex-1 mx-4 h-7 bg-gray-50 rounded-lg border border-gray-100 flex items-center px-3">
                      <span className="text-[9px] text-gray-400">app.codapos.com/dashboard</span>
                    </div>
                  </div>
                  {/* Metric cards */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[{ label: "Revenue", val: "Rp 12.5M", color: "emerald" }, { label: "Orders", val: "847 trx", color: "blue" }, { label: "Success", val: "98.2%", color: "violet" }].map((m, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <p className="text-[9px] text-gray-400 font-medium">{m.label}</p>
                        <p className="text-sm font-extrabold text-gray-800 mt-0.5">{m.val}</p>
                      </div>
                    ))}
                  </div>
                  {/* Chart */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-gray-700">Penjualan Mingguan</span>
                      <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">+12.5%</span>
                    </div>
                    <div className="flex items-end gap-2 h-16">
                      {[35, 55, 42, 75, 48, 85, 62, 90, 55, 95, 70, 88].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-sm transition-all duration-500" style={{ height: `${h}%`, background: `linear-gradient(to top, #00B894, #00CEC9)`, opacity: 0.6 + i * 0.03 }} />
                      ))}
                    </div>
                  </div>
                  {/* Product list */}
                  <div className="space-y-2">
                    {["Nasi Goreng Special", "Es Kopi Susu", "Mie Ayam Bakso"].map((p, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${["from-orange-100 to-amber-200", "from-blue-100 to-cyan-200", "from-purple-100 to-pink-200"][i]}`} />
                        <div className="flex-1">
                          <p className="text-[10px] font-semibold text-gray-700">{p}</p>
                          <p className="text-[9px] text-gray-400">{["32 sold", "28 sold", "24 sold"][i]}</p>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{["Rp 25K", "Rp 18K", "Rp 22K"][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="landing-wave">
          <svg viewBox="0 0 1440 100" fill="none"><path d="M0,80L60,70C120,60,240,40,360,35C480,30,600,40,720,55C840,70,960,90,1080,88C1200,86,1320,62,1380,50L1440,38V100H0Z" fill="white" /></svg>
        </div>
      </section>

      {/* ═══════ TRUSTED BY BRANDS ═══════ */}
      <section className="py-10 bg-white border-b border-gray-50">
        <div className="landing-container">
          <p className="text-center text-xs font-semibold text-gray-300 uppercase tracking-[0.2em] mb-6">Dipercaya oleh brand terkemuka</p>
          <div className="flex items-center justify-center gap-12 opacity-30 flex-wrap">
            {["☕ Kopi Kenangan", "🍽️ Warteg Modern", "🛒 TokoMart", "🧁 BakeryHQ", "💈 BarberKing"].map((brand, i) => (
              <span key={i} className="text-sm font-bold text-gray-600 whitespace-nowrap">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <section className="py-20 bg-white">
        <div className="landing-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { ref: stat1.ref, count: stat1.count, suffix: "+", label: "UMKM Terdaftar", icon: Store },
              { ref: stat2.ref, count: stat2.count, suffix: "+", label: "Kota di Indonesia", icon: MapPin },
              { ref: stat3.ref, count: stat3.count, suffix: "M+", label: "Transaksi Diproses", icon: CreditCard },
              { ref: stat4.ref, count: `99.${stat4.count % 10}`, suffix: "%", label: "Uptime Server", icon: Shield },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} ref={s.ref} className="landing-stat-card group text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00B894]/10 to-[#00CEC9]/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-[#00B894]" />
                  </div>
                  <p className="text-3xl md:text-4xl font-black text-gray-900">
                    {typeof s.count === 'number' ? s.count.toLocaleString() : s.count}{s.suffix}
                  </p>
                  <p className="text-sm text-gray-500 mt-1 font-medium">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ BUSINESS TYPES ═══════ */}
      <section id="bisnis" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="landing-container">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">Untuk Semua Jenis Bisnis</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Solusi Tepat untuk <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00957a]">Bisnis Anda</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {BUSINESS_TYPES.map((biz, i) => (
              <div key={i} className="landing-biz-card group">
                <span className="text-4xl mb-3 block group-hover:scale-125 group-hover:rotate-6 transition-all duration-300">{biz.emoji}</span>
                <p className="font-bold text-gray-800 group-hover:text-[#00B894] transition-colors">{biz.name}</p>
                <p className="text-xs text-gray-400 mt-1">{biz.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section id="fitur" className="py-24 bg-white">
        <div className="landing-container">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">Fitur Lengkap</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Semua yang Bisnis Anda <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00957a]">Butuhkan</span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">Dari kasir sampai delivery, dari stok sampai laporan keuangan — terintegrasi dalam satu platform cloud</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="landing-feature-card group">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ APP SHOWCASE ═══════ */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
        <div className="landing-container">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">Tampilan Aplikasi</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Didesain untuk <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00957a]">Kecepatan</span> & Kemudahan
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              {SHOWCASE.map((item, i) => (
                <button key={i} onClick={() => setActiveShowcase(i)} className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 ${activeShowcase === i ? "border-[#00B894] bg-gradient-to-r from-emerald-50/80 to-teal-50/80 shadow-lg shadow-emerald-100/50" : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md"}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{item.emoji}</span>
                    <h3 className={`font-bold text-lg ${activeShowcase === i ? "text-emerald-700" : "text-gray-900"}`}>{item.title}</h3>
                  </div>
                  {activeShowcase === i && (
                    <div className="animate-slide-down">
                      <p className="text-sm text-gray-500 mb-3 ml-10">{item.desc}</p>
                      <ul className="grid grid-cols-2 gap-1.5 ml-10">
                        {item.features.map((f, j) => (
                          <li key={j} className="flex items-center gap-1.5 text-xs text-gray-600"><Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-200/80 p-8 overflow-hidden">
                <div className="text-center py-12">
                  <span className="text-8xl block mb-6 animate-float">{SHOWCASE[activeShowcase].emoji}</span>
                  <h3 className="text-2xl font-black text-gray-800">{SHOWCASE[activeShowcase].title}</h3>
                  <p className="text-sm text-gray-400 mt-3 max-w-sm mx-auto leading-relaxed">{SHOWCASE[activeShowcase].desc}</p>
                  <div className="flex justify-center gap-2 mt-6">
                    {SHOWCASE.map((_, i) => (
                      <div key={i} className={`h-2 rounded-full transition-all duration-300 ${activeShowcase === i ? "w-8 bg-gradient-to-r from-[#00B894] to-[#00CEC9]" : "w-2 bg-gray-200"}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-[#00B894]/15 to-transparent rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gradient-to-br from-[#00CEC9]/15 to-transparent rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="py-24 bg-white">
        <div className="landing-container">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">Mudah & Cepat</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Mulai dalam <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00957a]">3 Langkah</span> Mudah
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Daftar Gratis", desc: "Buat akun dalam 30 detik. Tanpa kartu kredit, tanpa kontrak.", icon: Users, color: "from-emerald-500 to-teal-600" },
              { step: "02", title: "Setup Bisnis", desc: "Tambah produk, atur harga, pilih template toko online Anda.", icon: Layers, color: "from-blue-500 to-indigo-600" },
              { step: "03", title: "Mulai Jualan!", desc: "Langsung terima transaksi, monitor analytics, dan kembangkan bisnis.", icon: TrendingUp, color: "from-violet-500 to-purple-600" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="text-center relative">
                  {i < 2 && <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-gray-200 to-transparent" />}
                  <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-5 shadow-xl`}>
                    <Icon className="w-9 h-9 text-white" />
                  </div>
                  <span className="text-xs font-black text-emerald-500 tracking-widest">{s.step}</span>
                  <h3 className="text-lg font-bold text-gray-900 mt-1">{s.title}</h3>
                  <p className="text-sm text-gray-500 mt-2">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      <section id="harga" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="landing-container">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">Harga Transparan</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Pilih Paket yang <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00957a]">Sesuai</span>
            </h2>
            <p className="mt-3 text-gray-500">Mulai gratis, upgrade kapan saja. Tanpa biaya tersembunyi.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {PRICING.map((plan) => {
              const Icon = plan.icon;
              return (
                <div key={plan.name} className={`landing-pricing-card ${plan.highlight ? "landing-pricing-highlight" : ""}`}>
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-[#00B894] to-[#00CEC9] rounded-full text-xs font-bold text-white shadow-lg shadow-emerald-200/60">
                      ⭐ Paling Populer
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-6 mt-2">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${plan.highlight ? "bg-gradient-to-br from-[#00B894] to-[#00CEC9] shadow-lg shadow-emerald-200/50" : "bg-gray-100"}`}>
                      <Icon className={`w-7 h-7 ${plan.highlight ? "text-white" : "text-gray-500"}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-400">{plan.desc}</p>
                    </div>
                  </div>
                  <div className="my-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-gray-900">{plan.price === 0 ? "Gratis" : `Rp ${(plan.price / 1000).toFixed(0)}rb`}</span>
                      {plan.price > 0 && <span className="text-gray-400 text-sm">{plan.period}</span>}
                    </div>
                    {plan.price === 0 && <p className="text-xs text-gray-400 mt-1">{plan.period}</p>}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlight ? "bg-emerald-100" : "bg-gray-100"}`}>
                          <Check className={`w-3 h-3 ${plan.highlight ? "text-emerald-600" : "text-gray-400"}`} />
                        </div>
                        <span className="text-gray-600">{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className={`w-full inline-flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all text-base ${plan.highlight ? "bg-gradient-to-r from-[#00B894] to-[#00CEC9] text-white shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/60 hover:-translate-y-1" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                    {plan.highlight ? "Upgrade ke Pro" : "Mulai Gratis"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section id="testimoni" className="py-24 bg-white">
        <div className="landing-container">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">Testimoni</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Cerita <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00957a]">Sukses</span> Pengguna
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="landing-testimonial-card group">
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xs font-bold shadow-md`}>{t.avatar}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="py-24 bg-gray-50">
        <div className="landing-container max-w-3xl">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Pertanyaan Umum</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="landing-faq-card">
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className="font-bold text-gray-800 pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${activeFaq === i ? "rotate-180" : ""}`} />
                </button>
                {activeFaq === i && (
                  <div className="px-5 pb-5 animate-slide-down"><p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="landing-cta-bg" />
        <div className="landing-container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur text-white text-sm font-semibold mb-8">
            <Zap className="w-4 h-4" /> Gratis selamanya untuk UMKM
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight max-w-3xl mx-auto">
            Kelola Bisnis Anda dengan <span className="text-yellow-300">CODAPOS</span> Sekarang!
          </h2>
          <p className="mt-5 text-white/70 text-lg max-w-xl mx-auto">
            Daftar gratis dalam 30 detik. Tanpa kartu kredit, tanpa kontrak, tanpa risiko.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-emerald-700 font-black rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all text-lg">
              Daftar Gratis Sekarang <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#harga" className="inline-flex items-center justify-center gap-2 px-10 py-5 border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-lg">
              Lihat Harga
            </a>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-gray-900 pt-20 pb-8">
        <div className="landing-container">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00B894] to-[#00CEC9] flex items-center justify-center shadow-lg">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-black text-white">CODAPOS</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">Platform POS & manajemen bisnis cloud #1 untuk UMKM Indonesia.</p>
              <div className="flex gap-3">
                {[Mail, Phone, MapPin].map((Icon, i) => (
                  <a key={i} href={["/help", "/help", "/about"][i]} className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#00B894] transition-all">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
            {Object.entries(FOOTER_LINKS).map(([title, links]) => (
              <div key={title}>
                <h4 className="text-sm font-bold text-white mb-5">{title}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">&copy; 2025 CODAPOS. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-300 transition">Privacy Policy</Link>
              <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-300 transition">Terms of Service</Link>
              <div className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-bold">SSL Secured</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
