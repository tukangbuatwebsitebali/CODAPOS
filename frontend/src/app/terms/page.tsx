"use client";

import Link from "next/link";
import { ShoppingCart, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
                <div className="landing-container max-w-3xl">
                    <div className="text-center mb-12">
                        <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">Legal</span>
                        <h1 className="text-4xl font-black text-gray-900">Syarat & Ketentuan</h1>
                        <p className="text-sm text-gray-400 mt-3">Terakhir diperbarui: 1 Februari 2025</p>
                    </div>

                    <div className="landing-feature-card p-8 space-y-8">
                        {[
                            { title: "1. Penerimaan Syarat", content: "Dengan mengakses dan menggunakan layanan CODAPOS ('Layanan'), Anda menyetujui dan terikat oleh syarat dan ketentuan ini. Jika Anda tidak setuju dengan syarat-syarat ini, harap tidak menggunakan Layanan kami." },
                            { title: "2. Deskripsi Layanan", content: "CODAPOS menyediakan platform Point of Sale (POS) berbasis cloud, manajemen inventori, laporan keuangan, dan toko online untuk pelaku usaha mikro, kecil, dan menengah (UMKM) di Indonesia. Layanan tersedia melalui browser web dan aplikasi mobile." },
                            { title: "3. Akun Pengguna", content: "Anda bertanggung jawab untuk menjaga kerahasiaan informasi akun Anda. Anda setuju untuk memberikan informasi yang akurat dan terkini saat mendaftar. CODAPOS berhak menangguhkan atau menghentikan akun yang melanggar ketentuan ini." },
                            { title: "4. Pembayaran & Langganan", content: "Paket Free tersedia tanpa biaya. Paket Pro dikenakan biaya bulanan atau tahunan. Pembayaran diproses melalui Midtrans. Anda dapat membatalkan langganan kapan saja, dan akses Pro akan berlaku hingga akhir periode yang telah dibayar." },
                            { title: "5. Data & Privasi", content: "Kami menghormati privasi Anda. Pengumpulan dan penggunaan data pribadi Anda diatur dalam Kebijakan Privasi kami. Data transaksi Anda adalah milik Anda dan kami tidak akan membagikannya kepada pihak ketiga tanpa persetujuan Anda." },
                            { title: "6. Ketersediaan Layanan", content: "Kami berusaha menjaga ketersediaan Layanan 99.9% (SLA). Namun, kami tidak menjamin bahwa Layanan akan selalu tersedia tanpa gangguan. Pemeliharaan terjadwal akan diinformasikan minimal 24 jam sebelumnya." },
                            { title: "7. Pembatasan Tanggung Jawab", content: "CODAPOS tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan Layanan. Tanggung jawab maksimum kami terbatas pada jumlah yang Anda bayarkan dalam 12 bulan terakhir." },
                            { title: "8. Perubahan Ketentuan", content: "Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan material akan diinformasikan melalui email atau notifikasi di dashboard. Penggunaan berkelanjutan setelah perubahan berarti Anda menyetujui ketentuan yang diperbarui." },
                            { title: "9. Kontak", content: "Jika Anda memiliki pertanyaan tentang syarat dan ketentuan ini, hubungi kami di legal@codapos.com atau melalui alamat: Jl. Jend. Sudirman, Jakarta Selatan, DKI Jakarta 12190." },
                        ].map((s, i) => (
                            <div key={i}>
                                <h2 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h2>
                                <p className="text-sm text-gray-600 leading-relaxed">{s.content}</p>
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
