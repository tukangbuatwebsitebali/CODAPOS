'use client';

import { useState } from 'react';
import { Store, MapPin, CheckCircle2, ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { customerAPI } from '@/lib/api';
import type { CustomerSignUpRequest } from '@/types';

// Dynamic import for Leaflet (requires window)
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function CustomerSignUpPage() {
    const [step, setStep] = useState(1); // 1: info, 2: address/map, 3: success
    const [form, setForm] = useState<CustomerSignUpRequest>({
        tenant_slug: '', name: '', phone: '', email: '',
        full_address: '', city: '', province: '', postal_code: '',
        latitude: 0, longitude: 0,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!form.tenant_slug || !form.name || !form.phone) {
            setError('Kode merchant, nama, dan telepon wajib diisi');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await customerAPI.signup(form);
            setStep(3);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Gagal mendaftar. Periksa kode merchant.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] bg-pattern flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Logo Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#1DA1F2] to-[#A7D8FF] flex items-center justify-center shadow-lg shadow-blue-900/30 mb-4">
                        <Store className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">
                        CODA<span className="text-[#1DA1F2]">POS</span>
                    </h1>
                    <p className="text-sm text-white/40 mt-1">Daftar sebagai Pelanggan</p>
                </div>

                {/* Step 3: Success */}
                {step === 3 && (
                    <div className="glass-card p-8 text-center space-y-4 animate-fade-in">
                        <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Pendaftaran Berhasil!</h2>
                        <p className="text-white/50 text-sm">Akun pelanggan Anda telah terdaftar.</p>
                        <Link href="/login" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1DA1F2] text-white text-sm font-medium rounded-xl hover:bg-[#1DA1F2]/80 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Kembali ke Login
                        </Link>
                    </div>
                )}

                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <div className="glass-card p-6 space-y-5 animate-fade-in">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Informasi Pribadi</h2>
                            <p className="text-xs text-white/40 mt-1">Langkah 1 dari 2</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-white/50 mb-1.5">Kode Merchant *</label>
                                <input
                                    placeholder="contoh: warung-bali"
                                    value={form.tenant_slug}
                                    onChange={e => setForm({ ...form, tenant_slug: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50"
                                    required
                                />
                                <p className="text-xs text-white/30 mt-1">Minta kode ini dari merchant Anda</p>
                            </div>
                            <div>
                                <label className="block text-sm text-white/50 mb-1.5">Nama Lengkap *</label>
                                <input
                                    placeholder="Nama Anda"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white/50 mb-1.5">No. Telepon *</label>
                                <input
                                    placeholder="08xxxxxxxxxx"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white/50 mb-1.5">Email</label>
                                <input
                                    type="email"
                                    placeholder="email@contoh.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                if (!form.tenant_slug || !form.name || !form.phone) {
                                    setError('Kode merchant, nama, dan telepon wajib diisi');
                                    return;
                                }
                                setError('');
                                setStep(2);
                            }}
                            className="w-full py-3 bg-[#1DA1F2] text-white text-sm font-semibold rounded-xl hover:bg-[#1DA1F2]/80 transition-colors shadow-lg shadow-blue-900/30"
                        >
                            Selanjutnya →
                        </button>
                    </div>
                )}

                {/* Step 2: Address + Map */}
                {step === 2 && (
                    <div className="glass-card p-6 space-y-5 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Alamat & Lokasi</h2>
                                <p className="text-xs text-white/40 mt-1">Langkah 2 dari 2</p>
                            </div>
                            <button onClick={() => setStep(1)} className="text-xs text-white/40 hover:text-white transition-colors">
                                ← Kembali
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-white/50 mb-1.5 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-[#1DA1F2]" /> Pin Lokasi di Peta
                                </label>
                                <MapPicker
                                    latitude={form.latitude || 0}
                                    longitude={form.longitude || 0}
                                    onChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
                                    height="250px"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white/50 mb-1.5">Alamat Lengkap</label>
                                <textarea
                                    placeholder="Jalan, nomor, RT/RW, kelurahan..."
                                    value={form.full_address}
                                    onChange={e => setForm({ ...form, full_address: e.target.value })}
                                    rows={2}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50 resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-white/50 mb-1.5">Kota</label>
                                    <input
                                        placeholder="Denpasar"
                                        value={form.city}
                                        onChange={e => setForm({ ...form, city: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/50 mb-1.5">Provinsi</label>
                                    <input
                                        placeholder="Bali"
                                        value={form.province}
                                        onChange={e => setForm({ ...form, province: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-white/50 mb-1.5">Kode Pos</label>
                                <input
                                    placeholder="80234"
                                    value={form.postal_code}
                                    onChange={e => setForm({ ...form, postal_code: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-[#1DA1F2] to-[#0d8ecf] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-blue-900/30 disabled:opacity-50"
                        >
                            {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
                        </button>
                    </div>
                )}

                <p className="text-center text-xs text-white/30 mt-6">
                    © 2026 CODAPOS. All rights reserved.
                </p>
            </div>
        </div>
    );
}
