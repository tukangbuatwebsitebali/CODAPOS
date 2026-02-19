"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { accountingAPI } from "@/lib/api";
import { ChartOfAccount } from "@/types";

const typeColors: Record<string, string> = {
    asset: "#007AFF",
    liability: "#FF9500",
    equity: "#34C759",
    revenue: "#C40000",
    expense: "#FF3B30",
};

const typeLabels: Record<string, string> = {
    asset: "Aset",
    liability: "Liabilitas",
    equity: "Ekuitas",
    revenue: "Pendapatan",
    expense: "Beban",
};

interface COAGroup {
    type: string;
    accounts: ChartOfAccount[];
    total: number;
}

export default function COAPage() {
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;

    const fetchCOA = useCallback(async () => {
        try {
            setLoading(true);
            const res = await accountingAPI.getCOA();
            setAccounts(res.data.data || []);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCOA();
    }, [fetchCOA]);

    // Group accounts by type
    const groups: COAGroup[] = ["asset", "liability", "equity", "revenue", "expense"]
        .map((type) => {
            const accts = accounts.filter((a) => a.type === type);
            return {
                type,
                accounts: accts,
                total: accts.reduce((s, a) => s + (a.balance || 0), 0),
            };
        })
        .filter((g) => g.accounts.length > 0);

    return (
        <div className="space-y-6">
            <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-white">Chart of Accounts</h1>
                <p className="text-sm text-white/40 mt-1">Bagan akun standar bisnis Anda ({accounts.length} akun)</p>
            </div>

            {loading ? (
                <div className="glass p-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#C40000] animate-spin" />
                    <p className="text-sm text-white/40 mt-3">Memuat chart of accounts...</p>
                </div>
            ) : groups.length === 0 ? (
                <div className="glass p-12 flex flex-col items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white/10 mb-3" />
                    <p className="text-white/40">Belum ada akun</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {groups.map((group, i) => (
                        <div key={group.type} className={`glass overflow-hidden animate-slide-in-up stagger-${i + 1}`}>
                            <div className="p-4 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${typeColors[group.type]}15` }}>
                                        <BookOpen className="w-5 h-5" style={{ color: typeColors[group.type] }} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{typeLabels[group.type] || group.type}</h3>
                                        <span className="badge text-[10px]" style={{ backgroundColor: `${typeColors[group.type]}15`, color: typeColors[group.type] }}>
                                            {group.type.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-lg font-bold text-white">{formatCurrency(group.total)}</p>
                            </div>

                            {group.accounts.map((account) => (
                                <div key={account.id} className="px-4 py-3 flex items-center justify-between border-b border-white/3 last:border-0 ml-6">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-white/30">{account.code}</span>
                                        <span className="text-sm text-white/70">{account.name}</span>
                                    </div>
                                    <p className="text-sm font-medium text-white/60">{formatCurrency(account.balance || 0)}</p>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
