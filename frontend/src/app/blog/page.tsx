"use client";

import Link from "next/link";
import { ShoppingCart, ArrowLeft, Calendar, ArrowRight, Tag, Clock } from "lucide-react";

const POSTS = [
    { title: "5 Tips Mengoptimalkan POS untuk Bisnis F&B", excerpt: "Pelajari cara memaksimalkan penggunaan sistem POS untuk meningkatkan efisiensi operasional restoran dan kafe Anda.", date: "15 Feb 2025", category: "Tips & Trik", readTime: "5 min" },
    { title: "Panduan Lengkap Manajemen Stok untuk UMKM", excerpt: "Cara mengelola inventori dengan efisien: dari pemesanan hingga tracking stok realtime menggunakan teknologi cloud.", date: "12 Feb 2025", category: "Tutorial", readTime: "8 min" },
    { title: "Tren Pembayaran Digital 2025 untuk Bisnis Kecil", excerpt: "QRIS, e-wallet, dan cryptocurrency — apa yang perlu diketahui UMKM tentang tren pembayaran terbaru.", date: "8 Feb 2025", category: "Insight", readTime: "6 min" },
    { title: "Cara Membuat Toko Online Gratis dengan CODAPOS", excerpt: "Step-by-step guide membuat storefront digital untuk bisnis Anda dalam 10 menit, lengkap dengan payment gateway.", date: "5 Feb 2025", category: "Tutorial", readTime: "7 min" },
    { title: "Mengapa AI Forecasting Penting untuk Bisnis Anda", excerpt: "Bagaimana machine learning bisa membantu Anda memprediksi tren penjualan dan mengoptimalkan stok secara otomatis.", date: "1 Feb 2025", category: "Teknologi", readTime: "6 min" },
    { title: "CODAPOS v2.0: Fitur Baru yang Wajib Dicoba", excerpt: "Update terbesar kami: multi-outlet management, delivery system, dan 20+ template toko online premium.", date: "28 Jan 2025", category: "Update", readTime: "4 min" },
];

export default function BlogPage() {
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
                        <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">Blog</span>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                            Insight & Tips untuk <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00957a]">Bisnis Anda</span>
                        </h1>
                        <p className="mt-5 text-lg text-gray-500">Tips, tutorial, dan insight terbaru seputar teknologi POS dan manajemen bisnis.</p>
                    </div>

                    <div className="space-y-6">
                        {POSTS.map((post, i) => (
                            <div key={i} className="landing-feature-card p-6 hover:border-[#00B894] group cursor-pointer">
                                <div className="flex items-start gap-4">
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${["from-emerald-100 to-teal-200", "from-blue-100 to-indigo-200", "from-violet-100 to-purple-200", "from-amber-100 to-orange-200", "from-cyan-100 to-sky-200", "from-rose-100 to-pink-200"][i]} flex-shrink-0 flex items-center justify-center text-3xl`}>
                                        {["📊", "📦", "💳", "🛒", "🤖", "🚀"][i]}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-medium"><Tag className="w-3 h-3" />{post.category}</span>
                                            <span className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3" />{post.readTime}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#00B894] transition-colors">{post.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{post.excerpt}</p>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="flex items-center gap-1 text-xs text-gray-400"><Calendar className="w-3 h-3" />{post.date}</span>
                                            <span className="text-xs text-[#00B894] font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">Baca selengkapnya <ArrowRight className="w-3 h-3" /></span>
                                        </div>
                                    </div>
                                </div>
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
