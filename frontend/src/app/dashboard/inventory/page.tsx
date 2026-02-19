"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Warehouse, AlertTriangle, ArrowRightLeft, Package, Loader2,
    Plus, Minus, Settings, X, History, ArrowDown, ArrowUp,
} from "lucide-react";
import { inventoryAPI, outletAPI } from "@/lib/api";
import { InventoryItem, InventoryMovement, Outlet } from "@/types";

export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [selectedOutlet, setSelectedOutlet] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [lowStockCount, setLowStockCount] = useState(0);

    // Adjust modal state
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
    const [adjustMode, setAdjustMode] = useState<"adjust" | "set">("adjust");
    const [adjustDelta, setAdjustDelta] = useState(0);
    const [adjustQty, setAdjustQty] = useState(0);
    const [adjustNotes, setAdjustNotes] = useState("");
    const [saving, setSaving] = useState(false);

    // Movement history
    const [showHistory, setShowHistory] = useState(false);
    const [historyProductId, setHistoryProductId] = useState<string>("");
    const [movements, setMovements] = useState<InventoryMovement[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchOutlets = useCallback(async () => {
        try {
            const res = await outletAPI.getAll();
            const data = res.data.data || [];
            setOutlets(data);
            if (data.length > 0 && !selectedOutlet) {
                setSelectedOutlet(data[0].id);
            }
        } catch {
            // silently fail
        }
    }, [selectedOutlet]);

    const fetchInventory = useCallback(async () => {
        if (!selectedOutlet) return;
        try {
            setLoading(true);
            const res = await inventoryAPI.getStock(selectedOutlet);
            setInventory(res.data.data || []);
            const lowRes = await inventoryAPI.getLowStock(selectedOutlet);
            setLowStockCount((lowRes.data.data || []).length);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [selectedOutlet]);

    useEffect(() => {
        fetchOutlets();
    }, [fetchOutlets]);

    useEffect(() => {
        if (selectedOutlet) fetchInventory();
    }, [selectedOutlet, fetchInventory]);

    const totalStock = inventory.reduce((sum, i) => sum + i.quantity, 0);

    const openAdjustModal = (item: InventoryItem) => {
        setAdjustItem(item);
        setAdjustMode("adjust");
        setAdjustDelta(0);
        setAdjustQty(item.quantity);
        setAdjustNotes("");
        setShowAdjustModal(true);
    };

    const handleSaveStock = async () => {
        if (!adjustItem || !selectedOutlet) return;
        setSaving(true);
        try {
            if (adjustMode === "adjust") {
                await inventoryAPI.adjustStock({
                    outlet_id: selectedOutlet,
                    product_id: adjustItem.product_id,
                    variant_id: adjustItem.variant_id,
                    delta: adjustDelta,
                    notes: adjustNotes,
                });
            } else {
                await inventoryAPI.setStock({
                    outlet_id: selectedOutlet,
                    product_id: adjustItem.product_id,
                    variant_id: adjustItem.variant_id,
                    quantity: adjustQty,
                    notes: adjustNotes,
                });
            }
            setShowAdjustModal(false);
            fetchInventory();
        } catch {
            // handle error
        } finally {
            setSaving(false);
        }
    };

    const openHistory = async (productId: string) => {
        setHistoryProductId(productId);
        setShowHistory(true);
        setLoadingHistory(true);
        try {
            const res = await inventoryAPI.getMovements(selectedOutlet, productId, 20);
            setMovements(res.data.data || []);
        } catch {
            setMovements([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const getStockBadge = (item: InventoryItem) => {
        if (item.min_stock > 0 && item.quantity <= item.min_stock) {
            return { label: "Stok Rendah", class: "badge-danger" };
        }
        if (item.quantity <= 0) {
            return { label: "Habis", class: "badge-danger" };
        }
        return { label: "Normal", class: "badge-success" };
    };

    const getMovementIcon = (type: string) => {
        switch (type) {
            case "sale": return <ArrowDown className="w-3.5 h-3.5 text-red-400" />;
            case "purchase": return <ArrowUp className="w-3.5 h-3.5 text-green-400" />;
            case "adjustment": return <Settings className="w-3.5 h-3.5 text-blue-400" />;
            case "transfer_in": return <ArrowUp className="w-3.5 h-3.5 text-green-400" />;
            case "transfer_out": return <ArrowDown className="w-3.5 h-3.5 text-yellow-400" />;
            default: return <ArrowRightLeft className="w-3.5 h-3.5 text-white/30" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Inventori</h1>
                    <p className="text-sm text-white/40 mt-1">Kelola stok produk per outlet</p>
                </div>
                {outlets.length > 1 && (
                    <select
                        className="input-glass text-sm min-w-[200px]"
                        value={selectedOutlet}
                        onChange={(e) => setSelectedOutlet(e.target.value)}
                    >
                        {outlets.map((o) => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="glass p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <p className="text-xs text-white/40">Total Item Stok</p>
                        <p className="text-xl font-bold text-white">{inventory.length}</p>
                    </div>
                </div>
                <div className="glass p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Warehouse className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-white/40">Total Qty</p>
                        <p className="text-xl font-bold text-white">{totalStock.toLocaleString("id-ID")}</p>
                    </div>
                </div>
                <div className="glass p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                        <p className="text-xs text-white/40">Stok Rendah</p>
                        <p className="text-xl font-bold text-yellow-400">{lowStockCount}</p>
                    </div>
                </div>
            </div>

            {/* Empty state or no outlet */}
            {!selectedOutlet ? (
                <div className="glass p-12 flex flex-col items-center justify-center">
                    <Warehouse className="w-12 h-12 text-white/10 mb-3" />
                    <p className="text-white/40">Pilih outlet untuk melihat stok</p>
                </div>
            ) : loading ? (
                <div className="glass p-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#C40000] animate-spin" />
                    <p className="text-sm text-white/40 mt-3">Memuat inventori...</p>
                </div>
            ) : inventory.length === 0 ? (
                <div className="glass p-12 flex flex-col items-center justify-center">
                    <Warehouse className="w-12 h-12 text-white/10 mb-3" />
                    <p className="text-white/40">Belum ada data stok untuk outlet ini</p>
                    <p className="text-xs text-white/20 mt-1">Stok akan otomatis dibuat saat transaksi POS atau atur stok manual.</p>
                </div>
            ) : (
                <div className="glass p-0 overflow-hidden animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="overflow-x-auto">
                        <table className="table-glass">
                            <thead>
                                <tr>
                                    <th>Produk</th>
                                    <th className="mobile-hide">SKU</th>
                                    <th className="text-right">Stok</th>
                                    <th className="text-right mobile-hide">Min. Stok</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.map((item) => {
                                    const status = getStockBadge(item);
                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-white/20" />
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-white">
                                                            {item.product?.name || "Produk"}
                                                        </span>
                                                        {item.variant && (
                                                            <p className="text-xs text-white/30">{item.variant.name}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="font-mono text-white/50 text-sm mobile-hide">
                                                {item.product?.sku || item.variant?.sku || "—"}
                                            </td>
                                            <td className="text-right">
                                                <span className={`text-lg font-bold ${item.quantity <= 0 ? "text-red-400" : item.min_stock > 0 && item.quantity <= item.min_stock ? "text-yellow-400" : "text-white"}`}>
                                                    {item.quantity.toLocaleString("id-ID")}
                                                </span>
                                            </td>
                                            <td className="text-right text-white/40 mobile-hide">
                                                {item.min_stock > 0 ? item.min_stock.toLocaleString("id-ID") : "—"}
                                            </td>
                                            <td>
                                                <span className={`badge ${status.class}`}>{status.label}</span>
                                            </td>
                                            <td>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => openAdjustModal(item)}
                                                        className="btn-ghost p-2"
                                                        title="Atur Stok"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openHistory(item.product_id)}
                                                        className="btn-ghost p-2"
                                                        title="Riwayat Pergerakan"
                                                    >
                                                        <History className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ==================== ADJUST STOCK MODAL ==================== */}
            {showAdjustModal && adjustItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAdjustModal(false)}>
                    <div className="glass-strong p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Atur Stok</h2>
                            <button onClick={() => setShowAdjustModal(false)} className="text-white/30 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="glass p-3 mb-4">
                            <p className="font-medium text-white">{adjustItem.product?.name || "Produk"}</p>
                            <p className="text-xs text-white/40">Stok saat ini: <span className="text-white font-bold">{adjustItem.quantity}</span></p>
                        </div>

                        {/* Mode Tabs */}
                        <div className="flex gap-1 p-1 rounded-xl bg-white/5 mb-4">
                            <button
                                onClick={() => setAdjustMode("adjust")}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${adjustMode === "adjust" ? "bg-gradient-to-r from-[#C40000]/20 to-[#C40000]/5 text-white border border-[#C40000]/20" : "text-white/40 hover:text-white"}`}
                            >
                                <Plus className="w-3.5 h-3.5" /><Minus className="w-3.5 h-3.5 -ml-2" /> Tambah/Kurangi
                            </button>
                            <button
                                onClick={() => setAdjustMode("set")}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${adjustMode === "set" ? "bg-gradient-to-r from-[#C40000]/20 to-[#C40000]/5 text-white border border-[#C40000]/20" : "text-white/40 hover:text-white"}`}
                            >
                                <Settings className="w-3.5 h-3.5" /> Set Langsung
                            </button>
                        </div>

                        <div className="space-y-4">
                            {adjustMode === "adjust" ? (
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                                        Jumlah (+ tambah, - kurangi)
                                    </label>
                                    <input
                                        type="number"
                                        className="input-glass text-center text-2xl font-bold"
                                        value={adjustDelta || ""}
                                        onChange={(e) => setAdjustDelta(Number(e.target.value))}
                                        placeholder="0"
                                    />
                                    <p className="text-xs text-white/30 mt-1.5 text-center">
                                        Stok baru: <span className="text-white font-semibold">{adjustItem.quantity + adjustDelta}</span>
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                                        Stok Baru
                                    </label>
                                    <input
                                        type="number"
                                        className="input-glass text-center text-2xl font-bold"
                                        value={adjustQty || ""}
                                        onChange={(e) => setAdjustQty(Number(e.target.value))}
                                        min={0}
                                        placeholder="0"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Catatan</label>
                                <input
                                    type="text"
                                    className="input-glass"
                                    value={adjustNotes}
                                    onChange={(e) => setAdjustNotes(e.target.value)}
                                    placeholder="Alasan perubahan stok"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowAdjustModal(false)} className="btn-secondary flex-1">Batal</button>
                                <button
                                    onClick={handleSaveStock}
                                    disabled={saving || (adjustMode === "adjust" && adjustDelta === 0)}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== MOVEMENT HISTORY MODAL ==================== */}
            {showHistory && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowHistory(false)}>
                    <div className="glass-strong p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Riwayat Pergerakan Stok</h2>
                            <button onClick={() => setShowHistory(false)} className="text-white/30 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {loadingHistory ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="w-6 h-6 text-[#C40000] animate-spin" />
                            </div>
                        ) : movements.length === 0 ? (
                            <div className="text-center p-8 text-white/40">
                                <History className="w-8 h-8 mx-auto mb-2 text-white/10" />
                                <p>Belum ada riwayat pergerakan</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {movements.map((m) => (
                                    <div key={m.id} className="glass p-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                            {getMovementIcon(m.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white capitalize">{m.type.replace(/_/g, " ")}</span>
                                                <span className={`text-sm font-bold ${m.quantity >= 0 ? "text-green-400" : "text-red-400"}`}>
                                                    {m.quantity >= 0 ? "+" : ""}{m.quantity}
                                                </span>
                                            </div>
                                            {m.notes && <p className="text-xs text-white/30 truncate">{m.notes}</p>}
                                        </div>
                                        <span className="text-xs text-white/20 whitespace-nowrap">
                                            {new Date(m.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
