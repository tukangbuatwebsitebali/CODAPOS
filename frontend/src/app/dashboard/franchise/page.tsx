"use client";

import { Building2, DollarSign, FileText, TrendingUp } from "lucide-react";

export default function FranchisePage() {
    const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;

    return (
        <div className="space-y-6">
            <div className="animate-fade-in">
                <h1 className="text-xl sm:text-2xl font-bold text-white">Franchise Management</h1>
                <p className="text-sm text-white/40 mt-1">Kelola royalti dan mitra franchise</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="glass p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#C40000]/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-[#C40000]" />
                        </div>
                        <p className="text-xs text-white/40 uppercase">Mitra Franchise</p>
                    </div>
                    <p className="text-2xl font-bold text-white">3</p>
                </div>
                <div className="glass p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-green-400" />
                        </div>
                        <p className="text-xs text-white/40 uppercase">Royalti Bulan Ini</p>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(12500000)}</p>
                </div>
                <div className="glass p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-yellow-400" />
                        </div>
                        <p className="text-xs text-white/40 uppercase">Invoice Tertunda</p>
                    </div>
                    <p className="text-2xl font-bold text-yellow-400">2</p>
                </div>
            </div>

            <div className="glass p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#C40000]" />
                    Performa Franchise
                </h2>
                <div className="space-y-4">
                    {[
                        { name: "Franchise Ubud", revenue: 45000000, royalty: 4500000, status: "active" },
                        { name: "Franchise Canggu", revenue: 38000000, royalty: 3800000, status: "active" },
                        { name: "Franchise Sanur", revenue: 42000000, royalty: 4200000, status: "pending" },
                    ].map((f, i) => (
                        <div key={i} className="glass-subtle p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-white/30" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">{f.name}</p>
                                    <p className="text-xs text-white/30">Revenue: {formatCurrency(f.revenue)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-[#C40000]">{formatCurrency(f.royalty)}</p>
                                <span className={`badge text-[10px] ${f.status === "active" ? "badge-success" : "badge-warning"}`}>
                                    {f.status === "active" ? "Aktif" : "Pending"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
