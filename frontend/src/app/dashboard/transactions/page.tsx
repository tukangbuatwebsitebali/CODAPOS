"use client";

import { useState, useEffect, useCallback } from "react";
import { Receipt, Search, Download, Loader2 } from "lucide-react";
import { posAPI } from "@/lib/api";
import { Transaction } from "@/types";

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

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
        fetchTransactions();
    }, [fetchTransactions]);

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
                                    <tr key={tx.id}>
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
        </div>
    );
}
