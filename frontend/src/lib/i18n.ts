import { create } from 'zustand';

// =============================================
// CODAPOS Multi-Language System (ID / EN)
// =============================================

export type Lang = 'id' | 'en';

interface LangState {
    lang: Lang;
    setLang: (lang: Lang) => void;
    loadFromStorage: () => void;
}

export const useLanguageStore = create<LangState>((set) => ({
    lang: 'id',
    setLang: (lang: Lang) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('codapos_lang', lang);
        }
        set({ lang });
    },
    loadFromStorage: () => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('codapos_lang') as Lang | null;
            if (saved && (saved === 'id' || saved === 'en')) {
                set({ lang: saved });
            }
        }
    },
}));

// ── Translation dictionary ──
const translations: Record<string, Record<Lang, string>> = {
    // ─── Navbar ───
    'nav.features': { id: 'Fitur', en: 'Features' },
    'nav.pricing': { id: 'Harga', en: 'Pricing' },
    'nav.business': { id: 'Bisnis', en: 'Business' },
    'nav.testimonials': { id: 'Testimoni', en: 'Testimonials' },
    'nav.login': { id: 'Masuk', en: 'Log In' },
    'nav.try_free': { id: 'Coba Gratis', en: 'Try Free' },

    // ─── Hero Slides ───
    'hero.slide1.badge': { id: 'Platform POS #1 untuk UMKM Indonesia', en: '#1 POS Platform for Indonesian SMEs' },
    'hero.slide1.headline': { id: 'Solusi Kasir Digital & Manajemen Bisnis Terdepan', en: 'Leading Digital POS & Business Management Solution' },
    'hero.slide1.sub': { id: 'Kelola kasir, inventori, laporan keuangan, dan toko online dalam satu platform terintegrasi. Gratis untuk UMKM, powerful untuk enterprise.', en: 'Manage POS, inventory, financial reports, and online store in one integrated platform. Free for SMEs, powerful for enterprise.' },
    'hero.slide2.badge': { id: 'Pantau Bisnis dari Mana Saja', en: 'Monitor Business from Anywhere' },
    'hero.slide2.headline': { id: 'Pantau Semua Informasi Bisnis dalam Satu Sistem', en: 'Monitor All Business Information in One System' },
    'hero.slide2.sub': { id: 'Bisnis lebih efektif dengan visibilitas stok antar outlet, fitur promosi untuk pelanggan dan laporan transaksi yang akurat.', en: 'More effective business with cross-outlet stock visibility, customer promotion features and accurate transaction reports.' },
    'hero.slide3.badge': { id: 'Multi-Outlet & Franchise Ready', en: 'Multi-Outlet & Franchise Ready' },
    'hero.slide3.headline': { id: 'Kelola Semua Cabang dari Satu Dashboard', en: 'Manage All Branches from One Dashboard' },
    'hero.slide3.sub': { id: 'Sinkronisasi real-time, manajemen staf, royalti otomatis, dan standarisasi harga di semua outlet Anda.', en: 'Real-time sync, staff management, automated royalty, and price standardization across all your outlets.' },
    'hero.cta_primary': { id: 'Coba Gratis Sekarang', en: 'Start Free Now' },
    'hero.cta_secondary': { id: 'Lihat Demo', en: 'Watch Demo' },
    'hero.trust': { id: 'Dipercaya 10,000+ pelaku usaha', en: 'Trusted by 10,000+ business owners' },

    // ─── Hero Dashboard Visual ───
    'hero.visual.revenue': { id: 'Omzet Hari Ini', en: "Today's Revenue" },
    'hero.visual.transactions': { id: 'Transaksi', en: 'Transactions' },
    'hero.visual.weekly_sales': { id: 'Penjualan Mingguan', en: 'Weekly Sales' },

    // ─── Brands ───
    'brands.title': { id: 'Dipercaya oleh brand terkemuka', en: 'Trusted by leading brands' },

    // ─── Stats ───
    'stats.registered': { id: 'UMKM Terdaftar', en: 'Registered SMEs' },
    'stats.cities': { id: 'Kota di Indonesia', en: 'Cities in Indonesia' },
    'stats.transactions': { id: 'Transaksi Diproses', en: 'Transactions Processed' },
    'stats.uptime': { id: 'Uptime Server', en: 'Server Uptime' },

    // ─── Business Types ───
    'biz.section': { id: 'Untuk Semua Jenis Bisnis', en: 'For All Business Types' },
    'biz.title': { id: 'Solusi Tepat untuk', en: 'The Right Solution for' },
    'biz.highlight': { id: 'Bisnis Anda', en: 'Your Business' },
    'biz.coffee.name': { id: 'Kedai Kopi', en: 'Coffee Shop' },
    'biz.coffee.desc': { id: 'Manajemen menu, stok bahan, laporan harian', en: 'Menu management, ingredient stock, daily reports' },
    'biz.restaurant.name': { id: 'Restoran', en: 'Restaurant' },
    'biz.restaurant.desc': { id: 'Multi-meja, split bill, kitchen display', en: 'Multi-table, split bill, kitchen display' },
    'biz.retail.name': { id: 'Retail & Toko', en: 'Retail & Store' },
    'biz.retail.desc': { id: 'Barcode, inventori, supplier management', en: 'Barcode, inventory, supplier management' },
    'biz.bakery.name': { id: 'Bakery & Kue', en: 'Bakery & Cake' },
    'biz.bakery.desc': { id: 'Pre-order, resep, kalkulasi bahan', en: 'Pre-order, recipes, ingredient calculation' },
    'biz.barbershop.name': { id: 'Barbershop & Salon', en: 'Barbershop & Salon' },
    'biz.barbershop.desc': { id: 'Booking, membership, komisi stylist', en: 'Booking, membership, stylist commission' },
    'biz.pharmacy.name': { id: 'Apotek', en: 'Pharmacy' },
    'biz.pharmacy.desc': { id: 'Batch tracking, expired alert, resep', en: 'Batch tracking, expiry alert, prescriptions' },
    'biz.laundry.name': { id: 'Laundry', en: 'Laundry' },
    'biz.laundry.desc': { id: 'Status cucian, pickup/delivery, notifikasi', en: 'Laundry status, pickup/delivery, notifications' },
    'biz.franchise.name': { id: 'Franchise', en: 'Franchise' },
    'biz.franchise.desc': { id: 'Multi-outlet, royalti, standarisasi', en: 'Multi-outlet, royalty, standardization' },

    // ─── Features ───
    'feat.section': { id: 'Fitur Lengkap', en: 'Complete Features' },
    'feat.title': { id: 'Semua yang Bisnis Anda', en: 'Everything Your Business' },
    'feat.highlight': { id: 'Butuhkan', en: 'Needs' },
    'feat.sub': { id: 'Dari kasir sampai delivery, dari stok sampai laporan keuangan — terintegrasi dalam satu platform cloud', en: 'From POS to delivery, from stock to financial reports — integrated in one cloud platform' },
    'feat.pos.title': { id: 'POS Kasir Ultra-Cepat', en: 'Ultra-Fast POS' },
    'feat.pos.desc': { id: 'Proses transaksi dalam hitungan detik. Scan barcode, pilih payment, cetak struk — semua dalam 3 tap.', en: 'Process transactions in seconds. Scan barcode, select payment, print receipt — all in 3 taps.' },
    'feat.inventory.title': { id: 'Manajemen Inventori', en: 'Inventory Management' },
    'feat.inventory.desc': { id: 'Stok realtime, notifikasi stok menipis, transfer antar outlet, dan laporan pergerakan barang.', en: 'Real-time stock, low stock notifications, inter-outlet transfers, and stock movement reports.' },
    'feat.analytics.title': { id: 'Analitik & Laporan', en: 'Analytics & Reports' },
    'feat.analytics.desc': { id: 'Dashboard realtime dengan grafik penjualan, produk terlaris, laba-rugi, dan export ke PDF/Excel.', en: 'Real-time dashboard with sales charts, best sellers, profit/loss, and export to PDF/Excel.' },
    'feat.payment.title': { id: 'Multi-Payment Gateway', en: 'Multi-Payment Gateway' },
    'feat.payment.desc': { id: 'Terima QRIS, kartu kredit/debit, e-wallet, transfer bank via Midtrans. Rekonsiliasi otomatis.', en: 'Accept QRIS, credit/debit cards, e-wallets, bank transfer via Midtrans. Automatic reconciliation.' },
    'feat.delivery.title': { id: 'Delivery & MyKurir', en: 'Delivery & MyKurir' },
    'feat.delivery.desc': { id: 'Sistem kurir internal dengan tracking GPS realtime, auto-assign driver, dan estimasi ongkir.', en: 'Internal courier system with real-time GPS tracking, auto-assign drivers, and shipping estimates.' },
    'feat.ai.title': { id: 'AI Forecasting', en: 'AI Forecasting' },
    'feat.ai.desc': { id: 'Prediksi penjualan dengan machine learning. Restock otomatis dan optimasi stok berdasarkan tren.', en: 'Sales prediction with machine learning. Automatic restocking and stock optimization based on trends.' },
    'feat.printer.title': { id: 'Printer Thermal', en: 'Thermal Printer' },
    'feat.printer.desc': { id: 'Cetak struk via Bluetooth & USB. Kompatibel 58mm & 80mm, template kustom, auto-print.', en: 'Print receipts via Bluetooth & USB. Compatible 58mm & 80mm, custom templates, auto-print.' },
    'feat.store.title': { id: 'Toko Online Gratis', en: 'Free Online Store' },
    'feat.store.desc': { id: 'Storefront dengan 20+ tema premium. Custom domain, SEO friendly, checkout terintegrasi.', en: 'Storefront with 20+ premium themes. Custom domain, SEO friendly, integrated checkout.' },

    // ─── Showcase ───
    'showcase.section': { id: 'Tampilan Aplikasi', en: 'App Preview' },
    'showcase.title1': { id: 'Didesain untuk', en: 'Designed for' },
    'showcase.highlight': { id: 'Kecepatan', en: 'Speed' },
    'showcase.title2': { id: '& Kemudahan', en: '& Simplicity' },
    'showcase.dashboard.title': { id: 'Dashboard Analitik Realtime', en: 'Real-time Analytics Dashboard' },
    'showcase.dashboard.desc': { id: 'Monitor omzet, penjualan, dan performa outlet dalam satu layar. Grafik interaktif dan insight AI.', en: 'Monitor revenue, sales, and outlet performance on one screen. Interactive charts and AI insights.' },
    'showcase.dashboard.f1': { id: 'Revenue harian/mingguan', en: 'Daily/weekly revenue' },
    'showcase.dashboard.f2': { id: 'Produk terlaris', en: 'Best-selling products' },
    'showcase.dashboard.f3': { id: 'Revenue per outlet', en: 'Revenue per outlet' },
    'showcase.dashboard.f4': { id: 'Export PDF/Excel', en: 'Export PDF/Excel' },
    'showcase.pos.title': { id: 'POS Kasir Modern', en: 'Modern POS System' },
    'showcase.pos.desc': { id: 'Interface kasir super cepat dan intuitif. Barcode scanner, split bill, multi-payment — 3 detik per transaksi.', en: 'Super fast and intuitive POS interface. Barcode scanner, split bill, multi-payment — 3 seconds per transaction.' },
    'showcase.pos.f1': { id: 'Scan barcode & QR', en: 'Scan barcode & QR' },
    'showcase.pos.f2': { id: 'Split bill & diskon', en: 'Split bill & discounts' },
    'showcase.pos.f3': { id: 'Multi payment method', en: 'Multi payment methods' },
    'showcase.pos.f4': { id: 'Auto-print struk', en: 'Auto-print receipts' },
    'showcase.multi.title': { id: 'Multi-Outlet Manager', en: 'Multi-Outlet Manager' },
    'showcase.multi.desc': { id: 'Kontrol semua cabang dari satu dashboard. Sinkronisasi real-time, harga per lokasi, transfer stok.', en: 'Control all branches from one dashboard. Real-time sync, location pricing, stock transfers.' },
    'showcase.multi.f1': { id: 'Sync stok antar outlet', en: 'Cross-outlet stock sync' },
    'showcase.multi.f2': { id: 'Harga berbeda per lokasi', en: 'Different prices per location' },
    'showcase.multi.f3': { id: 'Transfer stok cabang', en: 'Branch stock transfer' },
    'showcase.multi.f4': { id: 'Laporan per outlet', en: 'Reports per outlet' },

    // ─── How it works ───
    'how.section': { id: 'Mudah & Cepat', en: 'Easy & Fast' },
    'how.title1': { id: 'Mulai dalam', en: 'Start in' },
    'how.highlight': { id: '3 Langkah', en: '3 Easy' },
    'how.title2': { id: 'Mudah', en: 'Steps' },
    'how.step1.title': { id: 'Daftar Gratis', en: 'Sign Up Free' },
    'how.step1.desc': { id: 'Buat akun dalam 30 detik. Tanpa kartu kredit, tanpa kontrak.', en: 'Create an account in 30 seconds. No credit card, no contract.' },
    'how.step2.title': { id: 'Setup Bisnis', en: 'Setup Business' },
    'how.step2.desc': { id: 'Tambah produk, atur harga, pilih template toko online Anda.', en: 'Add products, set prices, choose your online store template.' },
    'how.step3.title': { id: 'Mulai Jualan!', en: 'Start Selling!' },
    'how.step3.desc': { id: 'Langsung terima transaksi, monitor analytics, dan kembangkan bisnis.', en: 'Start accepting transactions, monitor analytics, and grow your business.' },

    // ─── Pricing ───
    'pricing.section': { id: 'Harga Transparan', en: 'Transparent Pricing' },
    'pricing.title': { id: 'Pilih Paket yang', en: 'Choose the Right' },
    'pricing.highlight': { id: 'Sesuai', en: 'Plan' },
    'pricing.sub': { id: 'Mulai gratis, upgrade kapan saja. Tanpa biaya tersembunyi.', en: 'Start free, upgrade anytime. No hidden fees.' },
    'pricing.most_popular': { id: '⭐ Paling Populer', en: '⭐ Most Popular' },
    'pricing.free.desc': { id: 'Untuk bisnis baru yang baru memulai', en: 'For new businesses just getting started' },
    'pricing.pro.desc': { id: 'Untuk bisnis berkembang & franchise', en: 'For growing businesses & franchises' },
    'pricing.free_label': { id: 'Gratis', en: 'Free' },
    'pricing.forever': { id: 'selamanya', en: 'forever' },
    'pricing.per_month': { id: '/bulan', en: '/month' },
    'pricing.start_free': { id: 'Mulai Gratis', en: 'Start Free' },
    'pricing.upgrade_pro': { id: 'Upgrade ke Pro', en: 'Upgrade to Pro' },
    // Pricing features
    'pricing.feat.1outlet': { id: '1 Outlet', en: '1 Outlet' },
    'pricing.feat.1user': { id: '1 User', en: '1 User' },
    'pricing.feat.30products': { id: '30 Produk', en: '30 Products' },
    'pricing.feat.basic_pos': { id: 'POS Kasir Dasar', en: 'Basic POS System' },
    'pricing.feat.simple_report': { id: 'Laporan Sederhana', en: 'Simple Reports' },
    'pricing.feat.1template': { id: '1 Template Toko', en: '1 Store Template' },
    'pricing.feat.5outlet': { id: '5 Outlet', en: '5 Outlets' },
    'pricing.feat.10users': { id: '10 Users', en: '10 Users' },
    'pricing.feat.unlimited': { id: 'Unlimited Produk', en: 'Unlimited Products' },
    'pricing.feat.all_pos': { id: 'Semua Fitur POS', en: 'All POS Features' },
    'pricing.feat.ai_report': { id: 'Laporan Detail + AI', en: 'Detailed Reports + AI' },
    'pricing.feat.premium_template': { id: '20+ Template Premium', en: '20+ Premium Templates' },
    'pricing.feat.midtrans': { id: 'Payment Gateway Midtrans', en: 'Midtrans Payment Gateway' },
    'pricing.feat.printer': { id: 'Printer Bluetooth/USB', en: 'Bluetooth/USB Printer' },
    'pricing.feat.delivery': { id: 'MyKurir Delivery', en: 'MyKurir Delivery' },
    'pricing.feat.domain': { id: 'Custom Domain', en: 'Custom Domain' },
    'pricing.feat.support': { id: 'Support Prioritas 24/7', en: 'Priority Support 24/7' },

    // ─── Testimonials ───
    'testi.section': { id: 'Testimoni', en: 'Testimonials' },
    'testi.title': { id: 'Cerita', en: 'User' },
    'testi.highlight': { id: 'Sukses', en: 'Success' },
    'testi.title2': { id: 'Pengguna', en: 'Stories' },
    'testi.1.text': { id: 'CODAPOS mengubah cara kami mengelola 3 outlet. Laporan realtime dan POS super cepat benar-benar menghemat waktu 2 jam per hari!', en: 'CODAPOS transformed how we manage 3 outlets. Real-time reports and super fast POS truly save us 2 hours daily!' },
    'testi.2.text': { id: 'Fitur inventory management-nya luar biasa. Notifikasi stok otomatis bikin kami tidak pernah kehabisan barang lagi. Revenue naik 30%!', en: 'The inventory management feature is amazing. Automatic stock notifications mean we never run out of items anymore. Revenue up 30%!' },
    'testi.3.text': { id: 'Dari kasir manual ke CODAPOS, peningkatannya drastis! AI Forecast membantu kami prepare bahan dengan tepat. Zero waste!', en: 'From manual cashier to CODAPOS, the improvement is dramatic! AI Forecast helps us prepare ingredients precisely. Zero waste!' },
    'testi.4.text': { id: 'Mengelola 12 outlet franchise jadi mudah. Royalti, standarisasi harga, semua otomatis. Sangat direkomendasikan!', en: 'Managing 12 franchise outlets made easy. Royalty, price standardization, all automated. Highly recommended!' },

    // ─── FAQ ───
    'faq.section': { id: 'FAQ', en: 'FAQ' },
    'faq.title': { id: 'Pertanyaan Umum', en: 'Frequently Asked Questions' },
    'faq.1.q': { id: 'Apakah CODAPOS benar-benar gratis?', en: 'Is CODAPOS really free?' },
    'faq.1.a': { id: 'Ya! Paket Free bisa digunakan selamanya tanpa biaya. Anda hanya perlu upgrade ke Pro jika membutuhkan fitur lebih seperti multi-outlet dan payment gateway.', en: 'Yes! The Free plan can be used forever at no cost. You only need to upgrade to Pro if you need more features like multi-outlet and payment gateway.' },
    'faq.2.q': { id: 'Apakah data saya aman?', en: 'Is my data safe?' },
    'faq.2.a': { id: '100% aman. Kami menggunakan enkripsi end-to-end, server yang tersertifikasi ISO 27001, dan backup otomatis setiap hari. Uptime 99.9% guaranteed.', en: '100% safe. We use end-to-end encryption, ISO 27001 certified servers, and automatic daily backups. 99.9% uptime guaranteed.' },
    'faq.3.q': { id: 'Bisa dipakai di HP dan tablet?', en: 'Can it be used on phones and tablets?' },
    'faq.3.a': { id: 'Ya, CODAPOS berjalan di browser modern dan responsive untuk semua ukuran layar. Bisa diakses dari smartphone, tablet, maupun desktop.', en: 'Yes, CODAPOS runs on modern browsers and is responsive for all screen sizes. Accessible from smartphones, tablets, and desktops.' },
    'faq.4.q': { id: 'Bagaimana cara migrasi dari POS lain?', en: 'How do I migrate from another POS?' },
    'faq.4.a': { id: 'Tim kami akan membantu migrasi data Anda secara gratis. Import data via CSV/Excel. Proses biasanya selesai dalam 1-2 hari kerja.', en: 'Our team will help migrate your data for free. Import via CSV/Excel. The process usually takes 1-2 business days.' },
    'faq.5.q': { id: 'Apakah bisa pakai printer struk?', en: 'Can I use a receipt printer?' },
    'faq.5.a': { id: 'Ya, CODAPOS mendukung printer thermal 58mm & 80mm via Bluetooth dan USB. Struk bisa di-customize dengan logo dan informasi toko Anda.', en: 'Yes, CODAPOS supports 58mm & 80mm thermal printers via Bluetooth and USB. Receipts can be customized with your store logo and info.' },

    // ─── CTA ───
    'cta.badge': { id: 'Gratis selamanya untuk UMKM', en: 'Free forever for SMEs' },
    'cta.title1': { id: 'Kelola Bisnis Anda dengan', en: 'Manage Your Business with' },
    'cta.title2': { id: 'Sekarang!', en: 'Now!' },
    'cta.sub': { id: 'Daftar gratis dalam 30 detik. Tanpa kartu kredit, tanpa kontrak, tanpa risiko.', en: 'Sign up free in 30 seconds. No credit card, no contract, no risk.' },
    'cta.btn1': { id: 'Daftar Gratis Sekarang', en: 'Sign Up Free Now' },
    'cta.btn2': { id: 'Lihat Harga', en: 'See Pricing' },

    // ─── Footer ───
    'footer.desc': { id: 'Platform POS & manajemen bisnis cloud #1 untuk UMKM Indonesia.', en: '#1 Cloud POS & business management platform for Indonesian SMEs.' },
    'footer.rights': { id: 'Hak cipta dilindungi.', en: 'All rights reserved.' },
    'footer.col.product': { id: 'Produk', en: 'Product' },
    'footer.col.company': { id: 'Perusahaan', en: 'Company' },
    'footer.col.support': { id: 'Support', en: 'Support' },
    'footer.col.legal': { id: 'Legal', en: 'Legal' },
    'footer.pos': { id: 'POS Kasir', en: 'POS System' },
    'footer.stock': { id: 'Manajemen Stok', en: 'Stock Management' },
    'footer.report': { id: 'Laporan', en: 'Reports' },
    'footer.online_store': { id: 'Toko Online', en: 'Online Store' },
    'footer.delivery': { id: 'Delivery', en: 'Delivery' },
    'footer.about': { id: 'Tentang Kami', en: 'About Us' },
    'footer.careers': { id: 'Karir', en: 'Careers' },
    'footer.blog': { id: 'Blog', en: 'Blog' },
    'footer.press': { id: 'Press Kit', en: 'Press Kit' },
    'footer.help': { id: 'Pusat Bantuan', en: 'Help Center' },
    'footer.api': { id: 'Dokumentasi API', en: 'API Documentation' },
    'footer.status': { id: 'Status Sistem', en: 'System Status' },
    'footer.contact': { id: 'Hubungi Kami', en: 'Contact Us' },
    'footer.terms': { id: 'Syarat & Ketentuan', en: 'Terms & Conditions' },
    'footer.privacy': { id: 'Kebijakan Privasi', en: 'Privacy Policy' },
    'footer.sla': { id: 'SLA', en: 'SLA' },

    // ─── Settings ───
    'lang.label': { id: 'Bahasa', en: 'Language' },
    'lang.id': { id: 'Indonesia', en: 'Indonesian' },
    'lang.en': { id: 'Inggris', en: 'English' },
};

/** Get translated string by key */
export function t(key: string, lang: Lang): string {
    return translations[key]?.[lang] ?? key;
}

/** Hook: use translation with current language from store */
export function useT() {
    const lang = useLanguageStore((s) => s.lang);
    return (key: string) => t(key, lang);
}
