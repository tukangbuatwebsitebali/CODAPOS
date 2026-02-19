'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Phone, Mail, Plus, Search, X, MapPin, Trash2, Eye } from 'lucide-react';
import dynamic from 'next/dynamic';
import { customerAPI } from '@/lib/api';
import type { Customer, CustomerAddress, AddAddressRequest } from '@/types';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [addressForm, setAddressForm] = useState<AddAddressRequest>({
        label: 'Rumah', full_address: '', city: '', province: '', postal_code: '',
        latitude: 0, longitude: 0, is_default: false,
    });
    const [form, setForm] = useState({
        name: '', phone: '', email: '', notes: '',
        full_address: '', city: '', province: '', postal_code: '',
        latitude: 0, longitude: 0,
    });

    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await customerAPI.getAll(100, 0);
            setCustomers(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadCustomers(); }, [loadCustomers]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.phone) return;
        try {
            await customerAPI.create(form);
            setForm({ name: '', phone: '', email: '', notes: '', full_address: '', city: '', province: '', postal_code: '', latitude: 0, longitude: 0 });
            setShowForm(false);
            loadCustomers();
        } catch (err) {
            console.error(err);
        }
    };

    const loadAddresses = async (customerId: string) => {
        try {
            const res = await customerAPI.getAddresses(customerId);
            setAddresses(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelectCustomer = async (customer: Customer) => {
        setSelectedCustomer(customer);
        await loadAddresses(customer.id);
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer || !addressForm.full_address) return;
        try {
            await customerAPI.addAddress(selectedCustomer.id, addressForm);
            setAddressForm({ label: 'Rumah', full_address: '', city: '', province: '', postal_code: '', latitude: 0, longitude: 0, is_default: false });
            setShowAddressForm(false);
            await loadAddresses(selectedCustomer.id);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteAddress = async (addressId: string) => {
        if (!selectedCustomer) return;
        try {
            await customerAPI.deleteAddress(addressId);
            await loadAddresses(selectedCustomer.id);
        } catch (err) {
            console.error(err);
        }
    };

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/20">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white">Pelanggan</h1>
                        <p className="text-sm text-white/50">{customers.length} pelanggan terdaftar</p>
                    </div>
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); setSelectedCustomer(null); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1DA1F2] hover:bg-[#1DA1F2]/80 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-blue-900/30 self-start sm:self-auto"
                >
                    {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showForm ? 'Batal' : 'Tambah'}
                </button>
            </div>

            {/* Add Customer Form */}
            {showForm && (
                <form onSubmit={handleCreate} className="glass-card p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Tambah Pelanggan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Nama *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50" required />
                        <input placeholder="No. Telepon *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50" required />
                        <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50" />
                        <input placeholder="Catatan" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50" />
                    </div>

                    {/* Address with Map */}
                    <div className="space-y-3 pt-2">
                        <label className="text-sm text-white/50 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#1DA1F2]" /> Alamat & Lokasi (opsional)
                        </label>
                        <MapPicker latitude={form.latitude} longitude={form.longitude} onChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })} height="220px" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input placeholder="Alamat lengkap" value={form.full_address} onChange={e => setForm({ ...form, full_address: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50" />
                            <input placeholder="Kota" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50" />
                        </div>
                    </div>

                    <button type="submit" className="px-6 py-2.5 bg-[#1DA1F2] text-white text-sm font-medium rounded-xl hover:bg-[#1DA1F2]/80 transition-colors">
                        Simpan
                    </button>
                </form>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                    placeholder="Cari pelanggan..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50"
                />
            </div>

            {/* Customer Detail Modal */}
            {selectedCustomer && (
                <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white">{selectedCustomer.name}</h3>
                            <p className="text-sm text-white/50">{selectedCustomer.phone} {selectedCustomer.email && `• ${selectedCustomer.email}`}</p>
                        </div>
                        <button onClick={() => setSelectedCustomer(null)} className="text-white/30 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Addresses */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#1DA1F2]" /> Alamat ({addresses.length})
                            </h4>
                            <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-xs text-[#1DA1F2] hover:text-[#1DA1F2]/80">
                                {showAddressForm ? 'Batal' : '+ Tambah Alamat'}
                            </button>
                        </div>

                        {/* Add Address Form */}
                        {showAddressForm && (
                            <form onSubmit={handleAddAddress} className="bg-white/5 rounded-xl p-4 space-y-3">
                                <MapPicker latitude={addressForm.latitude} longitude={addressForm.longitude} onChange={(lat, lng) => setAddressForm({ ...addressForm, latitude: lat, longitude: lng })} height="200px" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input placeholder="Label (Rumah, Kantor...)" value={addressForm.label} onChange={e => setAddressForm({ ...addressForm, label: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none" />
                                    <input placeholder="Kota" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none" />
                                </div>
                                <textarea placeholder="Alamat Lengkap *" value={addressForm.full_address} onChange={e => setAddressForm({ ...addressForm, full_address: e.target.value })} rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none resize-none" required />
                                <button type="submit" className="px-4 py-2 bg-[#1DA1F2] text-white text-xs font-medium rounded-lg hover:bg-[#1DA1F2]/80 transition-colors">
                                    Simpan Alamat
                                </button>
                            </form>
                        )}

                        {/* Address List */}
                        {addresses.map(addr => (
                            <div key={addr.id} className="flex items-start justify-between bg-white/5 rounded-xl p-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-white">{addr.label}</span>
                                        {addr.is_default && <span className="px-1.5 py-0.5 bg-[#1DA1F2]/20 text-[#1DA1F2] text-[10px] rounded-md">Utama</span>}
                                    </div>
                                    <p className="text-xs text-white/50 mt-1">{addr.full_address}</p>
                                    {addr.city && <p className="text-xs text-white/40">{addr.city}{addr.province && `, ${addr.province}`}</p>}
                                    {(addr.latitude !== 0 || addr.longitude !== 0) && (
                                        <p className="text-[10px] text-white/30 mt-1 flex items-center gap-1">
                                            <MapPin className="w-2.5 h-2.5" /> {addr.latitude.toFixed(5)}, {addr.longitude.toFixed(5)}
                                        </p>
                                    )}
                                </div>
                                <button onClick={() => handleDeleteAddress(addr.id)} className="text-red-400/50 hover:text-red-400 p-1 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}

                        {addresses.length === 0 && !showAddressForm && (
                            <p className="text-xs text-white/30 text-center py-2">Belum ada alamat</p>
                        )}
                    </div>
                </div>
            )}

            {/* Customer List */}
            {loading ? (
                <div className="glass-card p-12 text-center text-white/50">Memuat data...</div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-4 text-sm font-medium text-white/60">Nama</th>
                                    <th className="text-left p-4 text-sm font-medium text-white/60">Telepon</th>
                                    <th className="text-left p-4 text-sm font-medium text-white/60 mobile-hide">Email</th>
                                    <th className="text-left p-4 text-sm font-medium text-white/60">Status</th>
                                    <th className="text-left p-4 text-sm font-medium text-white/60">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(customer => (
                                    <tr key={customer.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-white font-medium">{customer.name}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-sm text-white/70">
                                                <Phone className="w-3 h-3" />{customer.phone}
                                            </div>
                                        </td>
                                        <td className="p-4 mobile-hide">
                                            <div className="flex items-center gap-1.5 text-sm text-white/70">
                                                {customer.email ? <><Mail className="w-3 h-3" />{customer.email}</> : <span className="text-white/30">-</span>}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-lg text-xs ${customer.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {customer.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button onClick={() => handleSelectCustomer(customer)} className="text-[#1DA1F2] hover:text-[#1DA1F2]/80 transition-colors" title="Lihat Detail">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && (
                        <div className="p-8 text-center text-white/40">
                            {search ? 'Tidak ditemukan' : 'Belum ada pelanggan'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
