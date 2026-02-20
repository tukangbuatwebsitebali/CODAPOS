"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, TrendingUp, CreditCard, Store, AlertTriangle, Loader2, ArrowUpRight, Search } from "lucide-react";
import { superAdminAPI } from "@/lib/api";
import { AppRevenueStats, AppRevenueMerchant } from "@/types";

export default function SuperAdminRevenuePage() {
    const [stats, setStats] = useState<AppRevenueStats | null>(null);
    const [merchants, setMerchants] = useState<AppRevenueMerchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;
    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return d.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [statsRes, merchantsRes] = await Promise.all([
                superAdminAPI.getRevenueStats(),
                superAdminAPI.getRevenueByMerchant(page, 20)
            ]);
            setStats(statsRes.data.data);
            setMerchants(merchantsRes.data.data || []);
            setTotalPages(Math.ceil((merchantsRes.data.total || 0) / 20));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredMerchants = merchants.filter(m => m.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1DA1F2] to-[#A7D8FF] flex items-center justify-center shadow-lg shadow-blue-900/20">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        Revenue CODAPOS
                    </h1>
                    <p className="text-sm text-white/40 mt-1">
                        Rekapitulasi pendapatan platform dari margin MDR (Payment Gateway) & Denda Merchant.
                    </p>
                </div>
                <button onClick={fetchData} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-all border border-white/10">
                    Refresh Data
                </button>
            </div>

            {loading && !stats ? (
                <div className="glass-card p-12 flex flex-col items-center justify-center rounded-2xl border border-white/5">
                    <Loader2 className="w-8 h-8 text-[#1DA1F2] animate-spin" />
                    <p className="text-sm text-white/40 mt-3">Memuat data revenue platform...</p>
                </div>
            ) : stats ? (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Total Pendapatan (All Time)</p>
                            <p className="text-3xl font-bold text-green-400 mt-2 flex items-center gap-2">
                                {formatCurrency(stats.total_revenue)}
                            </p>
                        </div>
                        <div className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#1DA1F2]/10 blur-3xl rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Pendapatan Bulan Ini</p>
                            <p className="text-3xl font-bold text-white mt-2 flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-[#1DA1F2]" />
                                {formatCurrency(stats.revenue_this_month)}
                            </p>
                        </div>
                        <div className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Total Margin MDR</p>
                            <p className="text-3xl font-bold text-white mt-2 flex items-center gap-2">
                                {formatCurrency(stats.total_mdr)}
                            </p>
                        </div>
                        <div className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Total Denda (Penalty)</p>
                            <p className="text-3xl font-bold text-red-400 mt-2 flex items-center gap-2">
                                {formatCurrency(stats.total_penalty)}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                        <div className="glass p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <Store className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-white/40">Active Merchants</p>
                                <p className="text-xl font-bold text-white">{stats.active_merchants}</p>
                            </div>
                        </div>
                        <div className="glass p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <ArrowUpRight className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs text-white/40">Total Transaksi (Digital)</p>
                                <p className="text-xl font-bold text-white">{stats.total_transactions}</p>
                            </div>
                        </div>
                        <div className="glass p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-white/40">Top Payment Method</p>
                                <p className="text-xl font-bold text-white uppercase">{stats.top_payment_method || "N/A"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Merchants Breakdown Table */}
                    <div className="glass p-0 overflow-hidden rounded-2xl border border-white/5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h3 className="font-semibold text-white">Breakdown Margin per Merchant</h3>
                            <div className="relative w-full sm:w-64">
                                <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari merchant..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#1DA1F2]/50"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="table-glass w-full">
                                <thead>
                                    <tr>
                                        <th>Nama Tenant / Merchant</th>
                                        <th>Trx Digital</th>
                                        <th>Kontribusi Margin MDR</th>
                                        <th>Sumbangan Denda</th>
                                        <th>Total Revenue (APP)</th>
                                        <th>Trx Terakhir</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredMerchants.length > 0 ? filteredMerchants.map((m) => (
                                        <tr key={m.tenant_id} className="hover:bg-white/5 transition-colors">
                                            <td className="font-medium text-white">{m.tenant_name}</td>
                                            <td className="text-white/70">{m.total_transactions} Trx</td>
                                            <td className="font-mono text-amber-400/80">
                                                {formatCurrency(m.total_mdr)}
                                            </td>
                                            <td className="font-mono text-red-400/80">
                                                {m.total_penalty > 0 ? formatCurrency(m.total_penalty) : "—"}
                                            </td>
                                            <td className="font-bold text-green-400 font-mono">
                                                {formatCurrency(m.total_revenue_contributed)}
                                            </td>
                                            <td className="text-white/50 text-sm">
                                                {formatDate(m.last_transaction_date)}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-white/40">
                                                Tidak ada data merchant yang memiliki histori margin.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-white/10 flex justify-center gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="px-3 py-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-50 text-sm"
                                >
                                    Sebelumnya
                                </button>
                                <span className="px-3 py-1.5 text-sm text-white/70">
                                    {page} / {totalPages}
                                </span>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className="px-3 py-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-50 text-sm"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : null}
        </div>
    );
}
