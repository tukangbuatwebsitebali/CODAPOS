"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Loader2 } from "lucide-react";
import { accountingAPI } from "@/lib/api";
import { ChartOfAccount } from "@/types";

export default function ReportsPage() {
    const [trialBalance, setTrialBalance] = useState<ChartOfAccount[]>([]);
    const [balanceSheet, setBalanceSheet] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (amount: number) => `Rp ${Math.abs(amount).toLocaleString("id-ID")}`;

    const fetchReports = useCallback(async () => {
        try {
            setLoading(true);
            const [tbRes, bsRes] = await Promise.all([
                accountingAPI.getTrialBalance(),
                accountingAPI.getBalanceSheet(),
            ]);
            setTrialBalance(tbRes.data.data || []);
            setBalanceSheet(bsRes.data.data || []);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    // Compute summary from balance sheet data
    const getTotal = (type: string) =>
        balanceSheet.filter((a) => a.type === type).reduce((s, a) => s + (a.balance || 0), 0);

    const totalAssets = getTotal("asset");
    const totalLiabilities = getTotal("liability");
    const totalEquity = getTotal("equity");
    const totalRevenue = getTotal("revenue");
    const totalExpense = getTotal("expense");
    const netProfit = totalRevenue - totalExpense;

    const summaryCards = [
        { label: "Pendapatan", value: totalRevenue, icon: DollarSign, color: "#34C759" },
        { label: "Total Beban", value: totalExpense, icon: TrendingDown, color: "#FF3B30" },
        { label: "Laba Bersih", value: netProfit, icon: TrendingUp, color: "#C40000" },
        { label: "Total Aset", value: totalAssets, icon: BarChart3, color: "#FF9500" },
    ];

    // Compute trial balance totals
    const tbTotalDebit = trialBalance.reduce((s, a) => s + (a.balance > 0 && (a.type === "asset" || a.type === "expense") ? a.balance : 0), 0);
    const tbTotalCredit = trialBalance.reduce((s, a) => s + (a.balance > 0 && (a.type === "liability" || a.type === "equity" || a.type === "revenue") ? a.balance : 0), 0);

    return (
        <div className="space-y-6">
            <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-white">Laporan Keuangan</h1>
                <p className="text-sm text-white/40 mt-1">Ringkasan laporan keuangan bisnis Anda</p>
            </div>

            {loading ? (
                <div className="glass p-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#C40000] animate-spin" />
                    <p className="text-sm text-white/40 mt-3">Memuat laporan...</p>
                </div>
            ) : (
                <>
                    {/* Financial Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {summaryCards.map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                                <div key={i} className={`glass stat-card p-5 animate-slide-in-up stagger-${i + 1}`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
                                            <p className="text-xl font-bold text-white mt-2">{formatCurrency(stat.value)}</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                                            <Icon className="w-5 h-5" style={{ color: stat.color }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Profit & Loss */}
                        <div className="glass p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-[#C40000]" />
                                Laba Rugi
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-white/60">Pendapatan</span>
                                    <span className="text-white font-medium">{formatCurrency(totalRevenue)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-white/60">Total Beban</span>
                                    <span className="text-red-400 font-medium">({formatCurrency(totalExpense)})</span>
                                </div>
                                <div className="flex justify-between py-3 bg-gradient-to-r from-[#C40000]/10 to-transparent px-3 -mx-3 rounded-lg">
                                    <span className="text-white font-bold">Laba Bersih</span>
                                    <span className={`text-xl font-bold ${netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(netProfit)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Balance Sheet */}
                        <div className="glass p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-[#007AFF]" />
                                Neraca
                            </h2>
                            <div className="space-y-3">
                                <p className="text-xs text-white/30 uppercase tracking-wider font-semibold">Aset</p>
                                {balanceSheet.filter((a) => a.type === "asset").map((a) => (
                                    <div key={a.id} className="flex justify-between py-2 border-b border-white/5">
                                        <span className="text-white/60">{a.name}</span>
                                        <span className="text-white font-medium">{formatCurrency(a.balance || 0)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between py-2 bg-white/2 px-3 -mx-3 rounded-lg">
                                    <span className="text-white font-semibold">Total Aset</span>
                                    <span className="text-blue-400 font-bold">{formatCurrency(totalAssets)}</span>
                                </div>

                                <div className="h-px bg-white/5 my-2" />

                                <p className="text-xs text-white/30 uppercase tracking-wider font-semibold">Liabilitas + Ekuitas</p>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-white/60">Total Liabilitas</span>
                                    <span className="text-orange-400 font-medium">{formatCurrency(totalLiabilities)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-white/60">Ekuitas</span>
                                    <span className="text-green-400 font-medium">{formatCurrency(totalEquity)}</span>
                                </div>
                                <div className="flex justify-between py-2 bg-white/2 px-3 -mx-3 rounded-lg">
                                    <span className="text-white font-semibold">Total L + E</span>
                                    <span className="text-blue-400 font-bold">{formatCurrency(totalLiabilities + totalEquity)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trial Balance */}
                    {trialBalance.length > 0 && (
                        <div className="glass p-0 overflow-hidden animate-fade-in" style={{ animationDelay: '0.5s' }}>
                            <div className="p-4 border-b border-white/5">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <TrendingDown className="w-5 h-5 text-[#FF9500]" />
                                    Neraca Saldo
                                </h2>
                            </div>
                            <table className="table-glass">
                                <thead>
                                    <tr>
                                        <th>Kode</th>
                                        <th>Nama Akun</th>
                                        <th>Debit</th>
                                        <th>Kredit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trialBalance.map((account) => {
                                        const isDebit = account.type === "asset" || account.type === "expense";
                                        return (
                                            <tr key={account.id || account.code}>
                                                <td className="font-mono text-white/50">{account.code}</td>
                                                <td className="text-white font-medium">{account.name}</td>
                                                <td className={isDebit && account.balance > 0 ? "text-green-400 font-medium" : "text-white/20"}>
                                                    {isDebit && account.balance > 0 ? formatCurrency(account.balance) : "-"}
                                                </td>
                                                <td className={!isDebit && account.balance > 0 ? "text-red-400 font-medium" : "text-white/20"}>
                                                    {!isDebit && account.balance > 0 ? formatCurrency(account.balance) : "-"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="border-t-2 border-white/10">
                                        <td></td>
                                        <td className="font-bold text-white">TOTAL</td>
                                        <td className="font-bold text-green-400">{formatCurrency(tbTotalDebit)}</td>
                                        <td className="font-bold text-red-400">{formatCurrency(tbTotalCredit)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
