"use client";

import { useState, useEffect, useCallback } from "react";
import {
    ShoppingCart, TrendingUp, DollarSign, Store,
    ArrowUpRight, Package, Users, Loader2,
} from "lucide-react";
import { productAPI, outletAPI, posAPI } from "@/lib/api";
import { Product, Outlet, Transaction } from "@/types";
import Link from "next/link";

export default function DashboardPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [prodRes, outletRes, txRes] = await Promise.all([
                productAPI.getAll().catch(() => ({ data: { data: [] } })),
                outletAPI.getAll().catch(() => ({ data: { data: [] } })),
                posAPI.getTransactions().catch(() => ({ data: { data: [] } })),
            ]);
            setProducts(prodRes.data.data || []);
            setOutlets(outletRes.data.data || []);
            setTransactions(txRes.data.data || []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const todayTotal = transactions.reduce((s, tx) => s + (tx.total_amount || 0), 0);
    const activeProducts = products.filter((p) => p.is_active).length;
    const activeOutlets = outlets.filter((o) => o.status === "active").length;
    const recentTransactions = transactions.slice(0, 5);

    const stats = [
        { label: "Penjualan", value: formatCurrency(todayTotal), icon: DollarSign, color: "#C40000" },
        { label: "Total Transaksi", value: String(transactions.length), icon: ShoppingCart, color: "#007AFF" },
        { label: "Produk Aktif", value: String(activeProducts), icon: Package, color: "#34C759" },
        { label: "Outlet Aktif", value: String(activeOutlets), icon: Store, color: "#FF9500" },
    ];

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-sm text-white/40 mt-1">Selamat datang di CODAPOS — Overview bisnis Anda</p>
            </div>

            {loading ? (
                <div className="glass p-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#C40000] animate-spin" />
                    <p className="text-sm text-white/40 mt-3">Memuat dashboard...</p>
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={i}
                                    className={`glass stat-card p-5 animate-slide-in-up stagger-${i + 1}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{stat.label}</p>
                                            <p className="text-xl sm:text-2xl font-bold text-white mt-2">{stat.value}</p>
                                        </div>
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `${stat.color}15` }}
                                        >
                                            <Icon className="w-5 h-5" style={{ color: stat.color }} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 mt-3">
                                        <ArrowUpRight className="w-3.5 h-3.5 text-green-400" />
                                        <span className="text-xs font-medium text-green-400">Live data</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent Transactions */}
                        <div className="lg:col-span-2 glass p-4 sm:p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Transaksi Terkini</h2>
                                <Link href="/dashboard/transactions" className="text-xs text-[#C40000] hover:text-[#E53030] font-medium transition">
                                    Lihat Semua →
                                </Link>
                            </div>
                            {recentTransactions.length === 0 ? (
                                <p className="text-sm text-white/30 text-center py-8">Belum ada transaksi</p>
                            ) : (
                                <div className="overflow-x-auto -mx-4 sm:-mx-6">
                                    <div className="inline-block min-w-full px-4 sm:px-6">
                                        <table className="table-glass">
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Waktu</th>
                                                    <th className="mobile-hide">Item</th>
                                                    <th>Total</th>
                                                    <th className="mobile-hide">Metode</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentTransactions.map((tx) => (
                                                    <tr key={tx.id}>
                                                        <td className="font-mono text-white/70 text-xs sm:text-sm">{tx.transaction_number}</td>
                                                        <td className="text-white/50">{formatDate(tx.created_at)}</td>
                                                        <td className="text-white/50 mobile-hide">{tx.items?.length || 0} item</td>
                                                        <td className="font-medium text-white">{formatCurrency(tx.total_amount)}</td>
                                                        <td className="mobile-hide">
                                                            <span className="badge badge-info">{tx.payments?.[0]?.payment_method || "—"}</span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${tx.status === "completed" ? "badge-success" : "badge-danger"}`}>
                                                                {tx.status === "completed" ? "Selesai" : "Refund"}
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

                        {/* Top Products */}
                        <div className="glass p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Produk</h2>
                                <TrendingUp className="w-5 h-5 text-[#C40000]" />
                            </div>
                            <div className="space-y-4">
                                {products.slice(0, 5).map((product, i) => (
                                    <div key={product.id} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C40000]/20 to-[#C40000]/5 flex items-center justify-center text-sm font-bold text-[#C40000]">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{product.name}</p>
                                            <p className="text-xs text-white/30">{product.sku || "—"}</p>
                                        </div>
                                        <p className="text-sm font-semibold text-white/70">
                                            {formatCurrency(product.base_price)}
                                        </p>
                                    </div>
                                ))}
                                {products.length === 0 && (
                                    <p className="text-sm text-white/30 text-center py-4">Belum ada produk</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="glass p-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                        <h2 className="text-lg font-semibold text-white mb-4">Aksi Cepat</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: "Buka Kasir", icon: ShoppingCart, href: "/dashboard/pos" },
                                { label: "Tambah Produk", icon: Package, href: "/dashboard/products" },
                                { label: "Lihat Laporan", icon: TrendingUp, href: "/dashboard/accounting/reports" },
                                { label: "Kelola Outlet", icon: Store, href: "/dashboard/outlets" },
                            ].map((action, i) => {
                                const Icon = action.icon;
                                return (
                                    <Link
                                        key={i}
                                        href={action.href}
                                        className="glass-subtle p-4 flex flex-col items-center gap-2 hover:bg-white/5 transition-all cursor-pointer group"
                                    >
                                        <Icon className="w-6 h-6 text-white/40 group-hover:text-[#C40000] transition" />
                                        <span className="text-xs text-white/50 group-hover:text-white/80 font-medium transition">{action.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Footer stat */}
            <div className="flex items-center justify-center gap-2 py-4">
                <Users className="w-4 h-4 text-white/10" />
                <p className="text-xs text-white/10">CODAPOS v1.0.0 — Cloud POS & Merchant Platform</p>
            </div>
        </div>
    );
}
