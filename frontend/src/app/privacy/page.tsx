"use client";

import Link from "next/link";
import { ShoppingCart, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
                        <h1 className="text-4xl font-black text-gray-900">Kebijakan Privasi</h1>
                        <p className="text-sm text-gray-400 mt-3">Terakhir diperbarui: 1 Februari 2025</p>
                    </div>

                    <div className="landing-feature-card p-8 space-y-8">
                        {[
                            { title: "1. Informasi yang Kami Kumpulkan", content: "Kami mengumpulkan informasi yang Anda berikan saat mendaftar (nama, email, nomor telepon, informasi bisnis), data transaksi yang Anda proses melalui platform, serta data teknis seperti alamat IP, jenis browser, dan informasi perangkat." },
                            { title: "2. Bagaimana Kami Menggunakan Informasi", content: "Informasi Anda digunakan untuk: menyediakan dan meningkatkan Layanan, memproses transaksi, mengirim notifikasi penting, menyediakan dukungan pelanggan, menganalisis penggunaan untuk peningkatan produk, dan memenuhi kewajiban hukum." },
                            { title: "3. Keamanan Data", content: "Kami menggunakan enkripsi SSL/TLS untuk semua data transit, enkripsi AES-256 untuk data tersimpan, server yang tersertifikasi ISO 27001, dan backup otomatis harian. Akses ke data pengguna dibatasi dengan prinsip least privilege." },
                            { title: "4. Penyimpanan Data", content: "Data Anda disimpan di server yang berlokasi di Indonesia (sesuai dengan UU PDP). Data transaksi disimpan selama akun Anda aktif dan hingga 7 tahun setelah penutupan akun untuk keperluan audit dan kepatuhan." },
                            { title: "5. Pembagian Data", content: "Kami TIDAK menjual data pribadi Anda. Data hanya dibagikan dengan: penyedia layanan pembayaran (Midtrans) untuk memproses transaksi, penyedia hosting cloud untuk penyimpanan, dan otoritas hukum jika diwajibkan oleh undang-undang." },
                            { title: "6. Hak Anda", content: "Anda berhak untuk: mengakses data pribadi Anda, memperbarui atau mengoreksi data, meminta penghapusan data (right to be forgotten), mengekspor data Anda (data portability), dan menarik persetujuan penggunaan data." },
                            { title: "7. Cookie & Tracking", content: "Kami menggunakan cookie esensial untuk autentikasi dan preferensi pengguna. Cookie analitik digunakan untuk memahami penggunaan Layanan. Anda dapat menonaktifkan cookie melalui pengaturan browser Anda." },
                            { title: "8. Perubahan Kebijakan", content: "Kami dapat memperbarui kebijakan ini sewaktu-waktu. Perubahan signifikan akan diinformasikan melalui email dan banner di dashboard minimal 30 hari sebelum berlaku efektif." },
                            { title: "9. Kontak DPO", content: "Untuk pertanyaan terkait privasi dan perlindungan data, hubungi Data Protection Officer kami: dpo@codapos.com atau telepon +62-21-5555-0000." },
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
