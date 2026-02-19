"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingCart, BarChart3, Users, Package, CreditCard, Truck,
  Store, Star, ChevronDown, ArrowRight, Check, Zap, Menu, X,
  Globe, Shield, Clock, Printer, Brain, Palette, Mail, Phone,
  MapPin, Sparkles, Crown, Play, ChevronRight, Headphones,
  Award, TrendingUp, Layers, Monitor, Smartphone, Wifi,
  ChevronLeft, Languages,
} from "lucide-react";
import { useLanguageStore, useT, type Lang } from "@/lib/i18n";

// ═══════════════════════════════════════════════════════════════
//  CODAPOS Landing Page — Premium Professional Design
// ═══════════════════════════════════════════════════════════════

const HERO_SLIDES = [
  {
    badgeKey: "hero.slide1.badge",
    headlineKey: "hero.slide1.headline",
    subKey: "hero.slide1.sub",
    visual: "📊",
    visualLabel: "Dashboard Analytics",
    gradient: "from-[#0052D4] via-[#4364F7] to-[#6FB1FC]",
  },
  {
    badgeKey: "hero.slide2.badge",
    headlineKey: "hero.slide2.headline",
    subKey: "hero.slide2.sub",
    visual: "🛒",
    visualLabel: "POS System",
    gradient: "from-[#0066FF] via-[#0099FF] to-[#00CCFF]",
  },
  {
    badgeKey: "hero.slide3.badge",
    headlineKey: "hero.slide3.headline",
    subKey: "hero.slide3.sub",
    visual: "🏢",
    visualLabel: "Multi-Outlet",
    gradient: "from-[#0052D4] via-[#0088CC] to-[#00B4D8]",
  },
];

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
  const [heroSlide, setHeroSlide] = useState(0);
  const [langDropdown, setLangDropdown] = useState(false);
  const t = useT();
  const { lang, setLang, loadFromStorage } = useLanguageStore();

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActiveShowcase((p) => (p + 1) % 3), 5000);
    return () => clearInterval(interval);
  }, []);

  // Hero auto-slide
  useEffect(() => {
    const interval = setInterval(() => setHeroSlide((p) => (p + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(interval);
  }, []);

  const goSlide = useCallback((dir: number) => {
    setHeroSlide((p) => (p + dir + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  // Close lang dropdown on outside click
  useEffect(() => {
    if (!langDropdown) return;
    const close = () => setLangDropdown(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [langDropdown]);

  const stat1 = useCounter(10000, 2500);
  const stat2 = useCounter(500, 2000);
  const stat3 = useCounter(2500, 2500);
  const stat4 = useCounter(999, 2000);

  // ─── Translated Data Arrays ───
  const BUSINESS_TYPES = [
    { nameKey: "biz.coffee.name", emoji: "☕", descKey: "biz.coffee.desc" },
    { nameKey: "biz.restaurant.name", emoji: "🍽️", descKey: "biz.restaurant.desc" },
    { nameKey: "biz.retail.name", emoji: "🛍️", descKey: "biz.retail.desc" },
    { nameKey: "biz.bakery.name", emoji: "🧁", descKey: "biz.bakery.desc" },
    { nameKey: "biz.barbershop.name", emoji: "💈", descKey: "biz.barbershop.desc" },
    { nameKey: "biz.pharmacy.name", emoji: "💊", descKey: "biz.pharmacy.desc" },
    { nameKey: "biz.laundry.name", emoji: "👕", descKey: "biz.laundry.desc" },
    { nameKey: "biz.franchise.name", emoji: "🏪", descKey: "biz.franchise.desc" },
  ];

  const FEATURES = [
    { icon: ShoppingCart, titleKey: "feat.pos.title", descKey: "feat.pos.desc", gradient: "from-emerald-500 to-teal-600" },
    { icon: Package, titleKey: "feat.inventory.title", descKey: "feat.inventory.desc", gradient: "from-blue-500 to-indigo-600" },
    { icon: BarChart3, titleKey: "feat.analytics.title", descKey: "feat.analytics.desc", gradient: "from-violet-500 to-purple-600" },
    { icon: CreditCard, titleKey: "feat.payment.title", descKey: "feat.payment.desc", gradient: "from-amber-500 to-orange-600" },
    { icon: Truck, titleKey: "feat.delivery.title", descKey: "feat.delivery.desc", gradient: "from-rose-500 to-pink-600" },
    { icon: Brain, titleKey: "feat.ai.title", descKey: "feat.ai.desc", gradient: "from-cyan-500 to-blue-600" },
    { icon: Printer, titleKey: "feat.printer.title", descKey: "feat.printer.desc", gradient: "from-sky-500 to-cyan-600" },
    { icon: Globe, titleKey: "feat.store.title", descKey: "feat.store.desc", gradient: "from-indigo-500 to-violet-600" },
  ];

  const SHOWCASE = [
    {
      titleKey: "showcase.dashboard.title", descKey: "showcase.dashboard.desc",
      featureKeys: ["showcase.dashboard.f1", "showcase.dashboard.f2", "showcase.dashboard.f3", "showcase.dashboard.f4"],
      emoji: "📊",
    },
    {
      titleKey: "showcase.pos.title", descKey: "showcase.pos.desc",
      featureKeys: ["showcase.pos.f1", "showcase.pos.f2", "showcase.pos.f3", "showcase.pos.f4"],
      emoji: "🛒",
    },
    {
      titleKey: "showcase.multi.title", descKey: "showcase.multi.desc",
      featureKeys: ["showcase.multi.f1", "showcase.multi.f2", "showcase.multi.f3", "showcase.multi.f4"],
      emoji: "🏢",
    },
  ];

  const TESTIMONIALS = [
    { name: "Rina Andayani", role: "Owner, Kopi Nusantara", textKey: "testi.1.text", rating: 5, avatar: "RA", gradient: "from-emerald-400 to-teal-500" },
    { name: "Budi Santoso", role: "Manager, Toko Serba Ada", textKey: "testi.2.text", rating: 5, avatar: "BS", gradient: "from-blue-400 to-indigo-500" },
    { name: "Maya Putri", role: "Owner, Bakery House", textKey: "testi.3.text", rating: 5, avatar: "MP", gradient: "from-violet-400 to-purple-500" },
    { name: "Dimas Kurniawan", role: "CEO, Franchise Ayam Goreng", textKey: "testi.4.text", rating: 5, avatar: "DK", gradient: "from-amber-400 to-orange-500" },
  ];

  const PRICING_FREE_FEATURES = [
    "pricing.feat.1outlet", "pricing.feat.1user", "pricing.feat.30products",
    "pricing.feat.basic_pos", "pricing.feat.simple_report", "pricing.feat.1template",
  ];
  const PRICING_PRO_FEATURES = [
    "pricing.feat.5outlet", "pricing.feat.10users", "pricing.feat.unlimited",
    "pricing.feat.all_pos", "pricing.feat.ai_report", "pricing.feat.premium_template",
    "pricing.feat.midtrans", "pricing.feat.printer", "pricing.feat.delivery",
    "pricing.feat.domain", "pricing.feat.support",
  ];

  const FAQS = [
    { qKey: "faq.1.q", aKey: "faq.1.a" },
    { qKey: "faq.2.q", aKey: "faq.2.a" },
    { qKey: "faq.3.q", aKey: "faq.3.a" },
    { qKey: "faq.4.q", aKey: "faq.4.a" },
    { qKey: "faq.5.q", aKey: "faq.5.a" },
  ];

  const FOOTER_LINKS = [
    {
      titleKey: "footer.col.product",
      links: [
        { labelKey: "footer.pos", href: "/about" },
        { labelKey: "footer.stock", href: "/about" },
        { labelKey: "footer.report", href: "/about" },
        { labelKey: "footer.online_store", href: "/about" },
        { labelKey: "footer.delivery", href: "/about" },
      ],
    },
    {
      titleKey: "footer.col.company",
      links: [
        { labelKey: "footer.about", href: "/about" },
        { labelKey: "footer.careers", href: "/careers" },
        { labelKey: "footer.blog", href: "/blog" },
        { labelKey: "footer.press", href: "/about" },
      ],
    },
    {
      titleKey: "footer.col.support",
      links: [
        { labelKey: "footer.help", href: "/help" },
        { labelKey: "footer.api", href: "/help" },
        { labelKey: "footer.status", href: "/help" },
        { labelKey: "footer.contact", href: "/help" },
      ],
    },
    {
      titleKey: "footer.col.legal",
      links: [
        { labelKey: "footer.terms", href: "/terms" },
        { labelKey: "footer.privacy", href: "/privacy" },
        { labelKey: "footer.sla", href: "/terms" },
      ],
    },
  ];

  return (
    <div className="landing-page font-sans" style={{ overflowX: "hidden" }}>
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
            {[
              { l: t("nav.features"), h: "#fitur" },
              { l: t("nav.pricing"), h: "#harga" },
              { l: t("nav.business"), h: "#bisnis" },
              { l: t("nav.testimonials"), h: "#testimoni" },
            ].map(n => (
              <a key={n.h} href={n.h} className="text-sm font-medium text-gray-500 hover:text-[#00B894] transition-colors relative group">
                {n.l}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#00B894] to-[#00CEC9] group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition px-5 py-2.5 rounded-xl hover:bg-gray-50">
              {t("nav.login")}
            </Link>
            <Link href="/signup" className="landing-btn-primary text-sm">
              {t("nav.try_free")} <ArrowRight className="w-4 h-4" />
            </Link>
            {/* Language Switcher */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setLangDropdown(!langDropdown)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition"
              >
                <Languages className="w-4 h-4" />
                {lang.toUpperCase()}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${langDropdown ? "rotate-180" : ""}`} />
              </button>
              {langDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 min-w-[140px]">
                  {([["id", "🇮🇩 Indonesia"], ["en", "🇬🇧 English"]] as const).map(([code, label]) => (
                    <button
                      key={code}
                      onClick={() => { setLang(code as Lang); setLangDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition ${lang === code ? "font-bold text-[#00B894]" : "text-gray-600"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition z-10">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-2xl">
            <div className="px-4 py-4 space-y-1">
              {[
                { l: t("nav.features"), h: "#fitur" },
                { l: t("nav.pricing"), h: "#harga" },
                { l: t("nav.business"), h: "#bisnis" },
                { l: t("nav.testimonials"), h: "#testimoni" },
              ].map(n => (
                <a key={n.h} href={n.h} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl">{n.l}</a>
              ))}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <Link href="/login" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl">{t("nav.login")}</Link>
                <Link href="/signup" className="block px-4 py-3 text-center bg-gradient-to-r from-[#00B894] to-[#00CEC9] text-white rounded-xl font-bold">{t("nav.try_free")}</Link>
                <div className="flex items-center gap-2 px-4 py-2">
                  <Languages className="w-4 h-4 text-gray-400" />
                  {([["id", "ID"], ["en", "EN"]] as const).map(([code, label]) => (
                    <button
                      key={code}
                      onClick={() => setLang(code as Lang)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${lang === code ? "bg-[#00B894] text-white" : "bg-gray-100 text-gray-600"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════ HERO CAROUSEL ═══════ */}
      <section className="hero-carousel">
        <div className="hero-slides-wrapper">
          {HERO_SLIDES.map((slide, i) => (
            <div
              key={i}
              className={`hero-slide bg-gradient-to-br ${slide.gradient} ${i === heroSlide ? "hero-slide-active" : "hero-slide-hidden"}`}
            >
              <div className="landing-container relative z-10 h-full flex items-center">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full pt-24 md:pt-28 pb-20">
                  {/* Left: Text Content */}
                  <div className="text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-sm text-white font-semibold mb-6 md:mb-8">
                      <Zap className="w-4 h-4" />
                      {t(slide.badgeKey)}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>

                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.15] tracking-tight">
                      {t(slide.headlineKey)}
                    </h1>

                    <p className="mt-4 md:mt-6 text-base md:text-lg text-white/80 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                      {t(slide.subKey)}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-8 md:mt-10 justify-center lg:justify-start">
                      <Link href="/signup" className="hero-btn-primary">
                        {t("hero.cta_primary")}
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                      <a href="#fitur" className="hero-btn-secondary">
                        <Play className="w-5 h-5" />
                        {t("hero.cta_secondary")}
                      </a>
                    </div>

                    {/* Trust */}
                    <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-8 md:mt-10 justify-center lg:justify-start">
                      <div className="flex -space-x-3">
                        {["RA", "BS", "MP", "DK", "AS"].map((init, j) => (
                          <div key={j} className="w-9 h-9 rounded-full bg-white/20 border-[3px] border-white/40 flex items-center justify-center text-[10px] text-white font-bold backdrop-blur-sm">{init}</div>
                        ))}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                          <span className="text-sm font-bold text-white ml-1">4.9/5</span>
                        </div>
                        <p className="text-xs text-white/60 mt-0.5">{t("hero.trust")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Visual Dashboard Mockup */}
                  <div className="hidden lg:block relative">
                    <div className="hero-visual-card animate-float">
                      {/* Main Dashboard Card */}
                      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00B894] via-[#00CEC9] to-[#0099FF] rounded-t-3xl" />
                        {/* Browser dots */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-3 h-3 rounded-full bg-red-400" />
                          <div className="w-3 h-3 rounded-full bg-amber-400" />
                          <div className="w-3 h-3 rounded-full bg-green-400" />
                          <div className="flex-1 mx-3 h-6 bg-gray-50 rounded-lg flex items-center px-3">
                            <span className="text-[9px] text-gray-400">app.codapos.com/dashboard</span>
                          </div>
                        </div>
                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {[
                            { label: "Revenue", val: "Rp 12.5M", icon: "📈" },
                            { label: "Orders", val: "847 trx", icon: "🛒" },
                            { label: "Success", val: "98.2%", icon: "✅" },
                          ].map((m, j) => (
                            <div key={j} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                              <p className="text-[9px] text-gray-400 font-medium">{m.icon} {m.label}</p>
                              <p className="text-sm font-extrabold text-gray-800 mt-0.5">{m.val}</p>
                            </div>
                          ))}
                        </div>
                        {/* Chart */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-gray-700">{t("hero.visual.weekly_sales")}</span>
                            <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">+12.5%</span>
                          </div>
                          <div className="flex items-end gap-1.5 h-16">
                            {[35, 55, 42, 75, 48, 85, 62, 90, 55, 95, 70, 88].map((h, j) => (
                              <div key={j} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: "linear-gradient(to top, #0066FF, #00CCFF)", opacity: 0.6 + j * 0.03 }} />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Floating Revenue Card */}
                      <div className="absolute -top-4 -left-6 w-52 bg-white rounded-2xl shadow-2xl p-4 border border-gray-100 z-10 animate-float-delay">
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                            <TrendingUp className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400">{t("hero.visual.revenue")}</p>
                            <p className="text-sm font-extrabold text-gray-900">Rp 4.8M</p>
                          </div>
                        </div>
                        <p className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +23%</p>
                      </div>

                      {/* Floating Orders Card */}
                      <div className="absolute -bottom-4 -right-4 w-44 bg-white rounded-2xl shadow-2xl p-3.5 border border-gray-100 z-10 animate-float">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                            <ShoppingCart className="w-3.5 h-3.5 text-violet-600" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-700">{t("hero.visual.transactions")}</span>
                        </div>
                        <p className="text-xl font-black text-gray-900">127</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => goSlide(-1)}
          className="hero-nav-arrow hero-nav-left"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => goSlide(1)}
          className="hero-nav-arrow hero-nav-right"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dot Indicators */}
        <div className="hero-dots">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroSlide(i)}
              className={`hero-dot ${i === heroSlide ? "hero-dot-active" : ""}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ═══════ TRUSTED BY BRANDS ═══════ */}
      <section className="py-10 bg-white border-b border-gray-50">
        <div className="landing-container">
          <p className="text-center text-xs font-semibold text-gray-300 uppercase tracking-[0.2em] mb-6">{t("brands.title")}</p>
          <div className="flex items-center justify-center gap-6 md:gap-12 opacity-30 flex-wrap">
            {["☕ Kopi Kenangan", "🍽️ Warteg Modern", "🛒 TokoMart", "🧁 BakeryHQ", "💈 BarberKing"].map((brand, i) => (
              <span key={i} className="text-sm font-bold text-gray-600 whitespace-nowrap">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <section className="py-16 md:py-20 bg-white">
        <div className="landing-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { ref: stat1.ref, count: stat1.count, suffix: "+", labelKey: "stats.registered", icon: Store },
              { ref: stat2.ref, count: stat2.count, suffix: "+", labelKey: "stats.cities", icon: MapPin },
              { ref: stat3.ref, count: stat3.count, suffix: "M+", labelKey: "stats.transactions", icon: CreditCard },
              { ref: stat4.ref, count: `99.${stat4.count % 10} `, suffix: "%", labelKey: "stats.uptime", icon: Shield },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} ref={s.ref} className="landing-stat-card group text-center">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-[#00B894]/10 to-[#00CEC9]/10 flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 md:w-7 md:h-7 text-[#00B894]" />
                  </div>
                  <p className="text-2xl md:text-4xl font-black text-gray-900">
                    {typeof s.count === 'number' ? s.count.toLocaleString() : s.count}{s.suffix}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">{t(s.labelKey)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ BUSINESS TYPES ═══════ */}
      <section id="bisnis" className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="landing-container">
          <div className="text-center mb-10 md:mb-16">
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">{t("biz.section")}</span>
            <h2 className="text-2xl md:text-4xl font-black text-gray-900">
              {t("biz.title")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00957a]">{t("biz.highlight")}</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {BUSINESS_TYPES.map((biz, i) => (
              <div key={i} className="landing-biz-card group">
                <span className="text-3xl md:text-4xl mb-2 md:mb-3 block group-hover:scale-125 group-hover:rotate-6 transition-all duration-300">{biz.emoji}</span>
                <p className="font-bold text-sm md:text-base text-gray-800 group-hover:text-[#00B894] transition-colors">{t(biz.nameKey)}</p>
                <p className="text-[11px] md:text-xs text-gray-400 mt-1">{t(biz.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section id="fitur" className="py-16 md:py-24 bg-white">
        <div className="landing-container">
          <div className="text-center mb-10 md:mb-16">
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">{t("feat.section")}</span>
            <h2 className="text-2xl md:text-4xl font-black text-gray-900">
              {t("feat.title")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00957a]">{t("feat.highlight")}</span>
            </h2>
            <p className="mt-3 md:mt-4 text-sm md:text-base text-gray-500 max-w-2xl mx-auto">{t("feat.sub")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="landing-feature-card group">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center mb-4 md:mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg`}>
                    <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base md:text-lg mb-2">{t(feat.titleKey)}</h3>
                  <p className="text-xs md:text-sm text-gray-500 leading-relaxed">{t(feat.descKey)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ APP SHOWCASE ═══════ */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
        <div className="landing-container">
          <div className="text-center mb-10 md:mb-16">
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">{t("showcase.section")}</span>
            <h2 className="text-2xl md:text-4xl font-black text-gray-900">
              {t("showcase.title1")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00957a]">{t("showcase.highlight")}</span> {t("showcase.title2")}
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-3 md:space-y-4">
              {SHOWCASE.map((item, i) => (
                <button key={i} onClick={() => setActiveShowcase(i)} className={`w-full text-left p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 ${activeShowcase === i ? "border-[#00B894] bg-gradient-to-r from-emerald-50/80 to-teal-50/80 shadow-lg shadow-emerald-100/50" : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md"}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl md:text-2xl">{item.emoji}</span>
                    <h3 className={`font-bold text-base md:text-lg ${activeShowcase === i ? "text-emerald-700" : "text-gray-900"}`}>{t(item.titleKey)}</h3>
                  </div>
                  {activeShowcase === i && (
                    <div className="animate-slide-down">
                      <p className="text-xs md:text-sm text-gray-500 mb-3 ml-8 md:ml-10">{t(item.descKey)}</p>
                      <ul className="grid grid-cols-2 gap-1.5 ml-8 md:ml-10">
                        {item.featureKeys.map((fKey, j) => (
                          <li key={j} className="flex items-center gap-1.5 text-[11px] md:text-xs text-gray-600"><Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />{t(fKey)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-200/80 p-6 md:p-8 overflow-hidden">
                <div className="text-center py-8 md:py-12">
                  <span className="text-6xl md:text-8xl block mb-4 md:mb-6 animate-float">{SHOWCASE[activeShowcase].emoji}</span>
                  <h3 className="text-xl md:text-2xl font-black text-gray-800">{t(SHOWCASE[activeShowcase].titleKey)}</h3>
                  <p className="text-xs md:text-sm text-gray-400 mt-3 max-w-sm mx-auto leading-relaxed">{t(SHOWCASE[activeShowcase].descKey)}</p>
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
      <section className="py-16 md:py-24 bg-white">
        <div className="landing-container">
          <div className="text-center mb-10 md:mb-16">
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">{t("how.section")}</span>
            <h2 className="text-2xl md:text-4xl font-black text-gray-900">
              {t("how.title1")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00957a]">{t("how.highlight")}</span> {t("how.title2")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", titleKey: "how.step1.title", descKey: "how.step1.desc", icon: Users, color: "from-emerald-500 to-teal-600" },
              { step: "02", titleKey: "how.step2.title", descKey: "how.step2.desc", icon: Layers, color: "from-blue-500 to-indigo-600" },
              { step: "03", titleKey: "how.step3.title", descKey: "how.step3.desc", icon: TrendingUp, color: "from-violet-500 to-purple-600" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="text-center relative">
                  {i < 2 && <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-gray-200 to-transparent" />}
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-4 md:mb-5 shadow-xl`}>
                    <Icon className="w-7 h-7 md:w-9 md:h-9 text-white" />
                  </div>
                  <span className="text-xs font-black text-emerald-500 tracking-widest">{s.step}</span>
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mt-1">{t(s.titleKey)}</h3>
                  <p className="text-xs md:text-sm text-gray-500 mt-2">{t(s.descKey)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      <section id="harga" className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="landing-container">
          <div className="text-center mb-10 md:mb-16">
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">{t("pricing.section")}</span>
            <h2 className="text-2xl md:text-4xl font-black text-gray-900">
              {t("pricing.title")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00957a]">{t("pricing.highlight")}</span>
            </h2>
            <p className="mt-3 text-sm md:text-base text-gray-500">{t("pricing.sub")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="landing-pricing-card">
              <div className="flex items-center gap-3 mb-6 mt-2">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center bg-gray-100">
                  <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Free</h3>
                  <p className="text-xs text-gray-400">{t("pricing.free.desc")}</p>
                </div>
              </div>
              <div className="my-6">
                <span className="text-3xl md:text-4xl font-black text-gray-900">{t("pricing.free_label")}</span>
                <p className="text-xs text-gray-400 mt-1">{t("pricing.forever")}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {PRICING_FREE_FEATURES.map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100">
                      <Check className="w-3 h-3 text-gray-400" />
                    </div>
                    <span className="text-gray-600">{t(feat)}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="w-full inline-flex items-center justify-center gap-2 py-3.5 md:py-4 rounded-2xl font-bold transition-all text-sm md:text-base bg-gray-100 text-gray-700 hover:bg-gray-200">
                {t("pricing.start_free")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="landing-pricing-card landing-pricing-highlight">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-[#00B894] to-[#00CEC9] rounded-full text-xs font-bold text-white shadow-lg shadow-emerald-200/60 whitespace-nowrap">
                {t("pricing.most_popular")}
              </div>
              <div className="flex items-center gap-3 mb-6 mt-2">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#00B894] to-[#00CEC9] shadow-lg shadow-emerald-200/50">
                  <Crown className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Pro</h3>
                  <p className="text-xs text-gray-400">{t("pricing.pro.desc")}</p>
                </div>
              </div>
              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl md:text-4xl font-black text-gray-900">Rp 99 rb</span>
                  <span className="text-gray-400 text-sm">{t("pricing.per_month")}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {PRICING_PRO_FEATURES.map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-100">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-gray-600">{t(feat)}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="w-full inline-flex items-center justify-center gap-2 py-3.5 md:py-4 rounded-2xl font-bold transition-all text-sm md:text-base bg-gradient-to-r from-[#00B894] to-[#00CEC9] text-white shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/60 hover:-translate-y-1">
                {t("pricing.upgrade_pro")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section id="testimoni" className="py-16 md:py-24 bg-white">
        <div className="landing-container">
          <div className="text-center mb-10 md:mb-16">
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">{t("testi.section")}</span>
            <h2 className="text-2xl md:text-4xl font-black text-gray-900">
              {t("testi.title")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00957a]">{t("testi.highlight")}</span> {t("testi.title2")}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {TESTIMONIALS.map((testi, i) => (
              <div key={i} className="landing-testimonial-card group">
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: testi.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed mb-6">&ldquo;{t(testi.textKey)}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className={`w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br ${testi.gradient} flex items-center justify-center text-white text-xs font-bold shadow-md`}>{testi.avatar}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{testi.name}</p>
                    <p className="text-xs text-gray-400">{testi.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="landing-container" style={{ maxWidth: "48rem" }}>
          <div className="text-center mb-10 md:mb-14">
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">{t("faq.section")}</span>
            <h2 className="text-2xl md:text-4xl font-black text-gray-900">{t("faq.title")}</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="landing-faq-card">
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 md:p-5 text-left">
                  <span className="font-bold text-sm md:text-base text-gray-800 pr-4">{t(faq.qKey)}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${activeFaq === i ? "rotate-180" : ""}`} />
                </button>
                {activeFaq === i && (
                  <div className="px-4 md:px-5 pb-4 md:pb-5 animate-slide-down"><p className="text-xs md:text-sm text-gray-500 leading-relaxed">{t(faq.aKey)}</p></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="landing-cta-bg" />
        <div className="landing-container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur text-white text-sm font-semibold mb-6 md:mb-8">
            <Zap className="w-4 h-4" /> {t("cta.badge")}
          </div>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight max-w-3xl mx-auto">
            {t("cta.title1")} <span className="text-yellow-300">CODAPOS</span> {t("cta.title2")}
          </h2>
          <p className="mt-4 md:mt-5 text-white/70 text-sm md:text-lg max-w-xl mx-auto">
            {t("cta.sub")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mt-8 md:mt-10">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-8 md:px-10 py-4 md:py-5 bg-white text-emerald-700 font-black rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all text-base md:text-lg">
              {t("cta.btn1")} <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#harga" className="inline-flex items-center justify-center gap-2 px-8 md:px-10 py-4 md:py-5 border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-base md:text-lg">
              {t("cta.btn2")}
            </a>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-gray-900 pt-16 md:pt-20 pb-8">
        <div className="landing-container">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-10 mb-12 md:mb-16">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00B894] to-[#00CEC9] flex items-center justify-center shadow-lg">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-black text-white">CODAPOS</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">{t("footer.desc")}</p>
              <div className="flex gap-3">
                {[Mail, Phone, MapPin].map((Icon, i) => (
                  <a key={i} href={["/help", "/help", "/about"][i]} className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#00B894] transition-all">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
            {FOOTER_LINKS.map((group) => (
              <div key={t(group.titleKey)}>
                <h4 className="text-sm font-bold text-white mb-4 md:mb-5">{t(group.titleKey)}</h4>
                <ul className="space-y-2 md:space-y-3">
                  {group.links.map((link) => (
                    <li key={t(link.labelKey)}>
                      <Link href={link.href} className="text-xs md:text-sm text-gray-400 hover:text-white transition-colors">{t(link.labelKey)}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-6 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs md:text-sm text-gray-500">&copy; 2025 CODAPOS. {t("footer.rights")}</p>
            <div className="flex items-center gap-4 md:gap-6">
              <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-300 transition">{t("footer.privacy")}</Link>
              <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-300 transition">{t("footer.terms")}</Link>
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
