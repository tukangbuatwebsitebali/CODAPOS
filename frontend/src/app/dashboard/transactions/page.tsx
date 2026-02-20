"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Receipt, Search, Download, Loader2, X, Printer, Clock } from "lucide-react";
import { posAPI, tenantAPI } from "@/lib/api";
import { Transaction } from "@/types";
import { printReceiptInBrowser, generateESCPOS, type ReceiptData, type ReceiptTenant } from "@/lib/receipt";
import { printerService } from "@/lib/bluetooth-printer";

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [printing, setPrinting] = useState(false);
    const tenantRef = useRef<ReceiptTenant>({ name: "Toko" });

    const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const res = await posAPI.getTransactions();
            setTransactions(res.data.data || []);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const tenantRes = await tenantAPI.getMe();
                if (tenantRes.data.data) {
                    const t = tenantRes.data.data;
                    tenantRef.current = {
                        name: t.business_name || t.name || "Toko",
                        address: t.address,
                        phone: t.phone,
                        logo_url: t.logo_url,
                        subscription_plan: t.subscription_plan,
                    };
                }
            } catch { /* ignore */ }
        };
        init();
        fetchTransactions();
    }, [fetchTransactions]);

    const handleReprint = async (tx: Transaction) => {
        try {
            setPrinting(true);
            const res = await posAPI.reprintTransaction(tx.id);
            const updatedTx = res.data.data;

            setTransactions(prev => prev.map(t => t.id === tx.id ? updatedTx : t));
            setSelectedTx(updatedTx);

            const receiptData: ReceiptData = {
                transaction_number: updatedTx.transaction_number,
                created_at: updatedTx.created_at,
                cashier_name: updatedTx.cashier?.name || updatedTx.cashier?.full_name,
                outlet_name: updatedTx.outlet?.name,
                items: (updatedTx.items || []).map((it: any) => ({
                    product_name: it.product_name,
                    variant_name: it.variant_name,
                    quantity: it.quantity,
                    unit_price: it.unit_price,
                    subtotal: it.subtotal,
                    discount_amount: it.discount_amount,
                    modifiers: it.modifiers,
                })),
                payments: (updatedTx.payments || []).map((p: any) => ({
                    payment_method: p.payment_method,
                    amount: p.amount,
                    reference_number: p.reference_number,
                })),
                subtotal: updatedTx.subtotal,
                discount_amount: updatedTx.discount_amount,
                tax_amount: updatedTx.tax_amount,
                total_amount: updatedTx.total_amount,
                notes: updatedTx.notes,
            };

            const settings = printerService.getSettings();
            const status = printerService.getStatus();

            if (status.connected) {
                const escpos = generateESCPOS(receiptData, tenantRef.current, settings.paperSize, settings.receiptType);
                await printerService.print(escpos);
            } else {
                printReceiptInBrowser(receiptData, tenantRef.current, settings.paperSize, settings.receiptType);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setPrinting(false);
        }
    };

    const filteredTransactions = transactions.filter((tx) =>
        tx.transaction_number?.toLowerCase().includes(search.toLowerCase()) ||
        tx.cashier?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        tx.outlet?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Transaksi</h1>
                    <p className="text-sm text-white/40 mt-1">Riwayat semua transaksi ({transactions.length})</p>
                </div>
                <button className="btn-secondary flex items-center gap-2 self-start sm:self-auto">
                    <Download className="w-4 h-4" /> Export
                </button>
            </div>

            <div className="relative animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                    type="text"
                    className="input-glass pl-11"
                    placeholder="Cari transaksi..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="glass p-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#C40000] animate-spin" />
                    <p className="text-sm text-white/40 mt-3">Memuat transaksi...</p>
                </div>
            ) : filteredTransactions.length === 0 ? (
                <div className="glass p-12 flex flex-col items-center justify-center">
                    <Receipt className="w-12 h-12 text-white/10 mb-3" />
                    <p className="text-white/40">Belum ada transaksi</p>
                    <p className="text-xs text-white/20 mt-1">Buat transaksi pertama di menu POS</p>
                </div>
            ) : (
                <div className="glass p-0 overflow-hidden animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="overflow-x-auto">
                        <table className="table-glass">
                            <thead>
                                <tr>
                                    <th>No. Transaksi</th>
                                    <th>Tanggal</th>
                                    <th className="mobile-hide">Outlet</th>
                                    <th className="mobile-hide">Kasir</th>
                                    <th className="mobile-hide">Item</th>
                                    <th>Total</th>
                                    <th className="mobile-hide">Metode</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((tx) => (
                                    <tr key={tx.id} onClick={() => setSelectedTx(tx)} className="cursor-pointer hover:bg-white/5 transition-colors">
                                        <td className="font-mono text-white/70 text-xs sm:text-sm">{tx.transaction_number}</td>
                                        <td className="text-white/50 text-xs sm:text-sm">{formatDate(tx.created_at)}</td>
                                        <td className="text-white mobile-hide">{tx.outlet?.name || "—"}</td>
                                        <td className="text-white/50 mobile-hide">{tx.cashier?.full_name || "—"}</td>
                                        <td className="text-white/50 mobile-hide">{tx.items?.length || 0}</td>
                                        <td className="font-semibold text-white">{formatCurrency(tx.total_amount)}</td>
                                        <td className="mobile-hide">
                                            <span className="badge badge-info">
                                                {tx.payments?.[0]?.payment_method || "—"}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${tx.status === "completed" ? "badge-success" :
                                                tx.status === "refunded" ? "badge-danger" :
                                                    "badge-warning"
                                                }`}>
                                                {tx.status === "completed" ? "Selesai" :
                                                    tx.status === "refunded" ? "Refund" :
                                                        tx.status === "voided" ? "Batal" : "Pending"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Detail Transaksi */}
            {selectedTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedTx(null)}>
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-slide-in-up" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="font-bold text-white">Detail Transaksi</h3>
                                <p className="text-xs text-white/50">{selectedTx.transaction_number}</p>
                            </div>
                            <button onClick={() => setSelectedTx(null)} className="text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-xl">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm border-b border-white/10 pb-4">
                                <div><p className="text-white/40 text-xs">Tanggal</p><p className="text-white font-medium">{formatDate(selectedTx.created_at)}</p></div>
                                <div><p className="text-white/40 text-xs">Kasir</p><p className="text-white font-medium">{selectedTx.cashier?.full_name || "—"}</p></div>
                                <div><p className="text-white/40 text-xs">Outlet</p><p className="text-white font-medium">{selectedTx.outlet?.name || "—"}</p></div>
                                <div>
                                    <p className="text-white/40 text-xs">Status</p>
                                    <span className={`badge inline-flex mt-1 ${selectedTx.status === "completed" ? "badge-success" : selectedTx.status === "refunded" ? "badge-danger" : "badge-warning"}`}>
                                        {selectedTx.status === "completed" ? "Selesai" : selectedTx.status === "refunded" ? "Refund" : selectedTx.status === "voided" ? "Batal" : "Pending"}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider">Item Transaksi ({selectedTx.items?.length || 0})</h4>
                                <div className="space-y-3">
                                    {selectedTx.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex flex-col gap-1">
                                            <div className="flex justify-between text-sm">
                                                <div className="flex-1">
                                                    <span className="text-white font-medium">{item.quantity}x {item.product_name} {item.variant_name ? `(${item.variant_name})` : ''}</span>
                                                    {item.modifiers?.length > 0 && (
                                                        <div className="text-xs text-white/40 pl-4 mt-0.5">
                                                            {item.modifiers.map((m: any, i: number) => <div key={i}>+ {m.name}</div>)}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-white font-mono">{formatCurrency(item.subtotal)}</span>
                                            </div>
                                            {item.notes && (
                                                <div className="text-xs text-orange-300/80 bg-orange-500/10 px-2 py-1 rounded-md mt-1 italic w-fit">
                                                    Catatan: {item.notes}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
                                <div className="flex justify-between text-white/60"><span>Subtotal (*Gross*)</span><span>{formatCurrency(selectedTx.subtotal)}</span></div>
                                {selectedTx.discount_amount > 0 && <div className="flex justify-between text-red-400"><span>Diskon</span><span>-{formatCurrency(selectedTx.discount_amount)}</span></div>}
                                {selectedTx.tax_amount > 0 && <div className="flex justify-between text-white/60"><span>PPN</span><span>{formatCurrency(selectedTx.tax_amount)}</span></div>}

                                <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-white/5">
                                    <span>Total Pembayaran (Customer)</span>
                                    <span>{formatCurrency(selectedTx.total_amount)}</span>
                                </div>

                                {(selectedTx.total_mdr_merchant || 0) > 0 && (
                                    <>
                                        <div className="flex justify-between text-amber-400/80 pt-2 text-xs">
                                            <span>MDR Payment Gateway ({selectedTx.payment_method})</span>
                                            <span>-{formatCurrency(selectedTx.total_mdr_merchant || 0)}</span>
                                        </div>
                                        <div className="flex justify-between text-[#1DA1F2] font-bold text-base pt-1 border-t border-white/5 mt-1">
                                            <span>Total Pendapatan Bersih (Net Profit)</span>
                                            <span>{formatCurrency(selectedTx.net_profit ?? (selectedTx.total_amount - (selectedTx.total_mdr_merchant || 0)))}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="bg-white/5 rounded-xl p-3 text-xs border border-white/10">
                                <div className="flex justify-between text-white/60 mb-1"><span>Metode Pembayaran</span><span className="uppercase text-white font-medium">{selectedTx.payments?.[0]?.payment_method || "—"}</span></div>
                                <div className="flex justify-between text-white/60"><span>Jumlah Bayar</span><span className="text-white font-medium">{formatCurrency(selectedTx.payments?.[0]?.amount || 0)}</span></div>
                            </div>

                            {selectedTx.reprint_count ? (
                                <div className="flex items-center gap-2 text-xs text-white/40 px-1 pt-2">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Dicetak ulang {selectedTx.reprint_count} kali (terakhir: {selectedTx.last_reprint_at ? formatDate(selectedTx.last_reprint_at) : "—"})</span>
                                </div>
                            ) : null}
                        </div>

                        <div className="p-4 border-t border-white/10 bg-black/20 flex gap-3">
                            <button
                                onClick={() => handleReprint(selectedTx)}
                                disabled={printing || selectedTx.status !== "completed"}
                                className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                            >
                                {printing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                                Cetak Ulang Struk
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
