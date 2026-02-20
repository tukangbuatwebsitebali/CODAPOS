"use client";

import { useState, useEffect, useCallback } from "react";
import { receipt as ReceiptIcon, FileText, ArrowUpRight, ArrowDownRight, Loader2, AlertTriangle, Lock } from "lucide-react";
import { posAPI } from "@/lib/api";
import { TenantBilling } from "@/types";

export default function BillingPage() {
    const [billings, setBillings] = useState<TenantBilling[]>([]);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;

    const fetchBillings = useCallback(async () => {
        try {
            setLoading(true);
            const res = await posAPI.getBillings();
            setBillings(res.data.data || []);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBillings();
    }, [fetchBillings]);

    const handlePayBill = async (id: string) => {
        try {
            await posAPI.payBilling(id);
            alert("Pembayaran Tagihan MDR bulan ini berhasil dilakukan.");
            fetchBillings(); // Refresh list after payment
        } catch (error: any) {
            alert(error?.response?.data?.error || "Gagal melakukan pembayaran.");
        }
    }

    const totalUnpaid = billings
        .filter(b => b.status === 'unpaid' || b.status === 'past_due' || b.status === "suspended")
        .reduce((sum, b) => sum + b.total_mdr + b.penalty_fee, 0);

    const hasPastDue = billings.some(b => b.status === 'past_due' || b.status === 'suspended');

    return (
        <div className="space-y-6">
            <div className="animate-fade-in flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Tagihan MDR Payment Gateway</h1>
                    <p className="text-sm text-white/40 mt-1">
                        Rekapitulasi biaya Payment Gateway (Cashless) yang dibebankan ke Merchant.
                    </p>
                </div>
            </div>

            {hasPastDue && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start sm:items-center gap-3 animate-pulse">
                    <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5 sm:mt-0" />
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-red-200">Perhatian: Ada Tagihan Tertunggak!</h3>
                        <p className="text-xs text-red-300/80 mt-1">
                            Anda memiliki tagihan MDR yang telah melewati tanggal jatuh tempo (Tanggal 7).
                            Akses Kasir (POS) akan dibekukan sementara hingga tagihan dilunasi.
                        </p>
                    </div>
                </div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#1DA1F2]/10 blur-3xl rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                    <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Total Menunggu Pembayaran</p>
                    <p className="text-3xl font-bold text-white mt-2 flex items-center gap-2">
                        {formatCurrency(totalUnpaid)}
                    </p>
                </div>
                <div className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                    <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Total Tagihan (Bulan Ini)</p>
                    <p className="text-3xl font-bold text-white mt-2 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-red-400" />
                        {billings.length} Bln
                    </p>
                </div>
            </div>

            {/* Billings Table */}
            {loading ? (
                <div className="glass p-12 flex flex-col items-center justify-center rounded-2xl border border-white/5">
                    <Loader2 className="w-8 h-8 text-[#1DA1F2] animate-spin" />
                    <p className="text-sm text-white/40 mt-3">Memuat tagihan MDR...</p>
                </div>
            ) : billings.length === 0 ? (
                <div className="glass p-12 flex flex-col items-center justify-center rounded-2xl border border-white/5">
                    <FileText className="w-12 h-12 text-white/10 mb-3" />
                    <p className="text-white/40">Belum ada tagihan MDR yang diterbitkan</p>
                </div>
            ) : (
                <div className="glass p-0 overflow-hidden rounded-2xl border border-white/5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="overflow-x-auto">
                        <table className="table-glass w-full">
                            <thead>
                                <tr>
                                    <th>Bulan Tagihan</th>
                                    <th>Total Transaksi</th>
                                    <th>Total Biaya MDR</th>
                                    <th>Denda Keterlambatan (10%)</th>
                                    <th>Status</th>
                                    <th className="text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {billings.map((bill) => (
                                    <tr key={bill.id} className="hover:bg-white/5 transition-colors">
                                        <td className="font-medium text-white">{bill.billing_month}</td>
                                        <td className="text-white/70">{bill.total_transactions} Trx</td>
                                        <td className="font-semibold text-red-400 font-mono">
                                            {formatCurrency(bill.total_mdr)}
                                        </td>
                                        <td className="text-red-500 font-mono">
                                            {bill.penalty_fee > 0 ? `+ ${formatCurrency(bill.penalty_fee)}` : "—"}
                                        </td>
                                        <td>
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium border
                                                ${bill.status === "paid" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                    bill.status === "unpaid" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                        "bg-red-500/10 text-red-400 border-red-500/20"}
                                            `}>
                                                {bill.status === "paid" ? "Lunas" :
                                                    bill.status === "past_due" ? "Jatuh Tempo" :
                                                        bill.status === "suspended" ? "Dibekukan" : "Menunggu Pembayaran"}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            {bill.status !== "paid" ? (
                                                <button
                                                    onClick={() => handlePayBill(bill.id)}
                                                    className="bg-white/10 hover:bg-[#1DA1F2] text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                                                >
                                                    Bayar Tagihan
                                                </button>
                                            ) : (
                                                <button disabled className="bg-white/5 text-white/30 px-3 py-1.5 rounded-lg text-sm font-medium cursor-not-allowed">
                                                    Selesai
                                                </button>
                                            )}
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
