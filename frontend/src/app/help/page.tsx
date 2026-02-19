"use client";

import Link from "next/link";
import { ShoppingCart, ArrowLeft, Headphones, MessageCircle, Book, Mail, Phone, ChevronDown, Search, ExternalLink } from "lucide-react";
import { useState } from "react";

const HELP_CATEGORIES = [
    { title: "Memulai", emoji: "🚀", articles: ["Cara mendaftar akun baru", "Setup bisnis pertama kali", "Menambah produk ke katalog", "Mengundang anggota tim"] },
    { title: "POS & Transaksi", emoji: "🛒", articles: ["Cara memproses transaksi", "Split bill & diskon", "Void dan refund transaksi", "Cetak struk via Bluetooth"] },
    { title: "Inventori", emoji: "📦", articles: ["Mengelola stok produk", "Transfer stok antar outlet", "Notifikasi stok menipis", "Laporan pergerakan barang"] },
    { title: "Pembayaran", emoji: "💳", articles: ["Setup Midtrans payment", "Terima pembayaran QRIS", "Rekonsiliasi otomatis", "Troubleshoot pembayaran gagal"] },
    { title: "Toko Online", emoji: "🌐", articles: ["Membuat storefront", "Kustomisasi template", "Setup custom domain", "Integrasi pengiriman"] },
    { title: "Laporan", emoji: "📊", articles: ["Dashboard analytics", "Export laporan PDF/Excel", "Laporan laba-rugi", "Revenue per outlet"] },
];

const FAQS = [
    { q: "Bagaimana cara menghubungi support?", a: "Anda bisa menghubungi kami via email di support@codapos.com, WhatsApp di +62-812-3456-7890, atau melalui live chat di dashboard CODAPOS. Jam operasional: Senin-Jumat 08:00-22:00 WIB." },
    { q: "Berapa lama waktu respon support?", a: "Untuk pengguna Free, waktu respon rata-rata dalam 24 jam kerja. Untuk pengguna Pro, kami menjamin respon dalam 2 jam melalui support prioritas 24/7." },
    { q: "Apakah ada video tutorial?", a: "Ya! Kami memiliki channel YouTube dengan 50+ video tutorial lengkap, dari setup awal hingga fitur-fitur lanjutan. Link tersedia di dashboard Anda." },
    { q: "Bagaimana cara request fitur baru?", a: "Kami sangat menghargai feedback dari pengguna. Anda bisa submit request fitur melalui tombol 'Feedback' di dashboard, atau email ke feedback@codapos.com." },
];

export default function HelpPage() {
    const [activeFaq, setActiveFaq] = useState<number | null>(null);

    return (
        <div className="landing-page font-sans">
            <nav className="landing-nav landing-nav-scrolled">
                <div className="landing-container flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00B894] to-[#00CEC9] flex items-center justify-center"><ShoppingCart className="w-4 h-4 text-white" /></div>
                        <span className="text-lg font-extrabold text-gray-900">CODA<span className="text-[#00B894]">POS</span></span>
                    </Link>
                    <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Beranda</Link>
                </div>
            </nav>

            <main className="pt-28 pb-20">
                <div className="landing-container max-w-4xl">
                    <div className="text-center mb-16">
                        <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">Pusat Bantuan</span>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                            Bagaimana Kami Bisa <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00957a]">Membantu?</span>
                        </h1>
                    </div>

                    {/* Contact Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
                        {[
                            { icon: MessageCircle, title: "Live Chat", desc: "Chat langsung dengan tim support kami", action: "Mulai Chat", gradient: "from-emerald-500 to-teal-600" },
                            { icon: Mail, title: "Email", desc: "support@codapos.com", action: "Kirim Email", gradient: "from-blue-500 to-indigo-600" },
                            { icon: Phone, title: "WhatsApp", desc: "+62-812-3456-7890", action: "Hubungi Kami", gradient: "from-green-500 to-emerald-600" },
                        ].map((c, i) => {
                            const Icon = c.icon;
                            return (
                                <div key={i} className="landing-feature-card p-6 text-center hover:border-[#00B894] cursor-pointer group">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{c.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
                                    <span className="inline-block mt-3 text-sm font-semibold text-[#00B894]">{c.action} →</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Knowledge Base */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Book className="w-6 h-6 text-[#00B894]" /> Knowledge Base</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
                        {HELP_CATEGORIES.map((cat, i) => (
                            <div key={i} className="landing-feature-card p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-3">{cat.emoji} {cat.title}</h3>
                                <ul className="space-y-2">
                                    {cat.articles.map((a, j) => (
                                        <li key={j} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00B894] cursor-pointer transition-colors">
                                            <ExternalLink className="w-3 h-3 flex-shrink-0" />{a}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* FAQ */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Pertanyaan Umum</h2>
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
            </main>

            <footer className="bg-gray-50 border-t border-gray-100 py-8">
                <div className="landing-container text-center">
                    <p className="text-sm text-gray-400">&copy; 2025 CODAPOS. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
