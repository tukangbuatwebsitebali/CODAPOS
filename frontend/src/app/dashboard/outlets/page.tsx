"use client";

import { useState, useEffect, useCallback } from "react";
import { Store, Plus, Edit3, MapPin, Phone, Building2, X, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { outletAPI } from "@/lib/api";
import { Outlet } from "@/types";

export default function OutletsPage() {
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: "",
        code: "",
        address: "",
        city: "",
        province: "",
        phone: "",
        status: "active" as Outlet["status"],
        type: "owned" as Outlet["type"],
    });

    const fetchOutlets = useCallback(async () => {
        try {
            setLoading(true);
            const res = await outletAPI.getAll();
            setOutlets(res.data.data || []);
        } catch {
            setError("Gagal memuat data outlet");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOutlets();
    }, [fetchOutlets]);

    const resetForm = () => {
        setForm({ name: "", code: "", address: "", city: "", province: "", phone: "", status: "active", type: "owned" });
        setEditingOutlet(null);
    };

    const openEditModal = (outlet: Outlet) => {
        setEditingOutlet(outlet);
        setForm({
            name: outlet.name,
            code: outlet.code,
            address: outlet.address || "",
            city: outlet.city || "",
            province: outlet.province || "",
            phone: outlet.phone || "",
            status: outlet.status || "active",
            type: outlet.type || "owned",
        });
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            if (editingOutlet) {
                await outletAPI.update(editingOutlet.id, form);
            } else {
                await outletAPI.create(form);
            }
            setShowModal(false);
            resetForm();
            fetchOutlets();
        } catch {
            setError(editingOutlet ? "Gagal mengupdate outlet" : "Gagal membuat outlet");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await outletAPI.delete(id);
            setDeleteConfirm(null);
            fetchOutlets();
        } catch {
            setError("Gagal menghapus outlet");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Outlet</h1>
                    <p className="text-sm text-white/40 mt-1">Kelola outlet dan cabang bisnis Anda ({outlets.length} outlet)</p>
                </div>
                <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
                    <Plus className="w-4 h-4" />
                    Tambah Outlet
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                    <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
                </div>
            )}

            {loading ? (
                <div className="glass p-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#C40000] animate-spin" />
                    <p className="text-sm text-white/40 mt-3">Memuat outlet...</p>
                </div>
            ) : outlets.length === 0 ? (
                <div className="glass p-12 flex flex-col items-center justify-center">
                    <Store className="w-12 h-12 text-white/10 mb-3" />
                    <p className="text-white/40">Belum ada outlet</p>
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary mt-4 text-sm">
                        <Plus className="w-4 h-4 inline mr-1" /> Tambah Outlet Pertama
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {outlets.map((outlet, i) => (
                        <div
                            key={outlet.id}
                            className={`glass p-6 animate-slide-in-up stagger-${i + 1}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${outlet.status === "active"
                                        ? "bg-gradient-to-br from-[#C40000]/20 to-[#C40000]/5"
                                        : "bg-white/5"
                                        }`}>
                                        <Store className={`w-6 h-6 ${outlet.status === "active" ? "text-[#C40000]" : "text-white/20"}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{outlet.name}</h3>
                                        <p className="text-xs text-white/30 font-mono">{outlet.code}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`badge ${outlet.status === "active" ? "badge-success" : "badge-danger"}`}>
                                        {outlet.status === "active" ? "Aktif" : "Nonaktif"}
                                    </span>
                                    <button onClick={() => openEditModal(outlet)} className="btn-ghost p-2"><Edit3 className="w-4 h-4" /></button>
                                    <button onClick={() => setDeleteConfirm(outlet.id)} className="btn-ghost p-2 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                {outlet.address && (
                                    <div className="flex items-center gap-2 text-sm text-white/40">
                                        <MapPin className="w-4 h-4 flex-shrink-0" />
                                        <span>{outlet.address}</span>
                                    </div>
                                )}
                                {outlet.phone && (
                                    <div className="flex items-center gap-2 text-sm text-white/40">
                                        <Phone className="w-4 h-4 flex-shrink-0" />
                                        <span>{outlet.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-white/40">
                                    <Building2 className="w-4 h-4 flex-shrink-0" />
                                    <span className="capitalize">{outlet.type === "franchise" ? "Franchise" : "Milik Sendiri"}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                    <div className="glass-strong p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white mb-2">Hapus Outlet?</h3>
                        <p className="text-sm text-white/50 mb-6">Outlet yang dihapus tidak dapat dikembalikan.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Batal</button>
                            <button onClick={() => handleDelete(deleteConfirm)} className="btn-primary flex-1 !bg-red-600">Hapus</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="glass-strong p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingOutlet ? "Edit Outlet" : "Tambah Outlet Baru"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Nama Outlet *</label>
                                    <input type="text" className="input-glass" placeholder="Outlet Denpasar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Kode *</label>
                                    <input type="text" className="input-glass" placeholder="DPS-001" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Alamat</label>
                                <textarea className="input-glass" rows={2} placeholder="Jl. Sunset Road No. 12" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Kota</label>
                                    <input type="text" className="input-glass" placeholder="Denpasar" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Telepon</label>
                                    <input type="text" className="input-glass" placeholder="0361-123456" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Tipe</label>
                                    <select className="input-glass" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Outlet["type"] })}>
                                        <option value="owned">Milik Sendiri</option>
                                        <option value="franchise">Franchise</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Status</label>
                                    <select className="input-glass" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Outlet["status"] })}>
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Nonaktif</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Batal</button>
                                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {editingOutlet ? "Simpan" : "Tambah Outlet"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
