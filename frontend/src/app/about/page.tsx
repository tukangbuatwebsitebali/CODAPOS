"use client";

import Link from "next/link";
import { ShoppingCart, ArrowLeft, Users, Target, Heart, Lightbulb, Globe, Shield, Award, MapPin, Mail } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="landing-page font-sans">
            {/* Nav */}
            <nav className="landing-nav landing-nav-scrolled">
                <div className="landing-container flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00B894] to-[#00CEC9] flex items-center justify-center">
                            <ShoppingCart className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-extrabold text-gray-900">CODA<span className="text-[#00B894]">POS</span></span>
                    </Link>
                    <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Beranda</Link>
                </div>
            </nav>

            <main className="pt-28 pb-20">
                <div className="landing-container max-w-4xl">
                    {/* Hero */}
                    <div className="text-center mb-16">
                        <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">Tentang Kami</span>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                            Membangun Masa Depan <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00957a]">UMKM Indonesia</span>
                        </h1>
                        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto">
                            CODAPOS lahir dari keyakinan bahwa setiap pelaku usaha di Indonesia berhak mendapatkan teknologi terbaik untuk mengembangkan bisnisnya.
                        </p>
                    </div>

                    {/* Story */}
                    <div className="landing-feature-card p-8 mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cerita Kami</h2>
                        <div className="space-y-4 text-gray-600 leading-relaxed">
                            <p>Didirikan pada tahun 2024, CODAPOS bermula dari observasi sederhana: jutaan UMKM di Indonesia masih mengelola bisnis dengan cara manual — catatan kertas, kalkulator, dan spreadsheet. Hal ini bukan hanya memperlambat operasional, tetapi juga menghambat pertumbuhan bisnis.</p>
                            <p>Kami percaya bahwa teknologi seharusnya menjadi akselerator, bukan hambatan. Itulah mengapa CODAPOS didesain dari nol untuk menjadi platform yang mudah digunakan, terjangkau, dan powerful. Dari kasir digital hingga toko online, dari manajemen stok hingga laporan keuangan — semua dalam satu platform terintegrasi.</p>
                            <p>Hari ini, CODAPOS dipercaya oleh ribuan pelaku usaha di seluruh Indonesia, dari warung kopi kecil di pelosok desa hingga jaringan franchise di kota besar. Dan kami baru memulai.</p>
                        </div>
                    </div>

                    {/* Values */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {[
                            { icon: Target, title: "Misi", desc: "Memberdayakan 10 juta UMKM Indonesia dengan teknologi POS dan manajemen bisnis terdepan.", gradient: "from-emerald-500 to-teal-600" },
                            { icon: Lightbulb, title: "Visi", desc: "Menjadi platform digital #1 yang menjadi tulang punggung operasional bisnis di Asia Tenggara.", gradient: "from-blue-500 to-indigo-600" },
                            { icon: Heart, title: "Nilai", desc: "Sederhana, Terpercaya, Inovatif. Kami membuat teknologi yang bekerja untuk Anda, bukan sebaliknya.", gradient: "from-violet-500 to-purple-600" },
                        ].map((v, i) => {
                            const Icon = v.icon;
                            return (
                                <div key={i} className="landing-feature-card text-center p-8">
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${v.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                                        <Icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{v.title}</h3>
                                    <p className="text-sm text-gray-500">{v.desc}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                        {[
                            { val: "10,000+", label: "Merchant Aktif" },
                            { val: "500+", label: "Kota" },
                            { val: "50+", label: "Tim Kami" },
                            { val: "2024", label: "Didirikan" },
                        ].map((s, i) => (
                            <div key={i} className="landing-stat-card">
                                <p className="text-2xl font-black text-gray-900">{s.val}</p>
                                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Contact */}
                    <div className="landing-feature-card p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Hubungi Kami</h2>
                        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
                            <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-emerald-500" /> hello@codapos.com</span>
                            <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500" /> Jakarta, Indonesia</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gray-50 border-t border-gray-100 py-8">
                <div className="landing-container text-center">
                    <p className="text-sm text-gray-400">&copy; 2025 CODAPOS. All rights reserved.</p>
                    <div className="flex justify-center gap-6 mt-3">
                        <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600">Privacy</Link>
                        <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600">Terms</Link>
                        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">Beranda</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
