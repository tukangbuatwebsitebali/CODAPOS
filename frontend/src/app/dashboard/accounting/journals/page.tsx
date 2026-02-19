"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { accountingAPI } from "@/lib/api";
import { JournalEntry } from "@/types";

export default function JournalsPage() {
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" });
    };

    const fetchJournals = useCallback(async () => {
        try {
            setLoading(true);
            const res = await accountingAPI.getJournals();
            setJournals(res.data.data || []);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJournals();
    }, [fetchJournals]);

    const totalDebit = journals.reduce((s, j) => s + (j.total_debit || 0), 0);
    const totalCredit = journals.reduce((s, j) => s + (j.total_credit || 0), 0);

    return (
        <div className="space-y-6">
            <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-white">Jurnal Umum</h1>
                <p className="text-sm text-white/40 mt-1">Catatan transaksi akuntansi double-entry</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="glass p-4">
                    <p className="text-xs text-white/40 uppercase">Total Debit</p>
                    <p className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-green-400" />
                        {formatCurrency(totalDebit)}
                    </p>
                </div>
                <div className="glass p-4">
                    <p className="text-xs text-white/40 uppercase">Total Kredit</p>
                    <p className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                        {formatCurrency(totalCredit)}
                    </p>
                </div>
                <div className="glass p-4">
                    <p className="text-xs text-white/40 uppercase">Jurnal</p>
                    <p className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#C40000]" />
                        {journals.length} entri
                    </p>
                </div>
            </div>

            {/* Journals Table */}
            {loading ? (
                <div className="glass p-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#C40000] animate-spin" />
                    <p className="text-sm text-white/40 mt-3">Memuat jurnal...</p>
                </div>
            ) : journals.length === 0 ? (
                <div className="glass p-12 flex flex-col items-center justify-center">
                    <FileText className="w-12 h-12 text-white/10 mb-3" />
                    <p className="text-white/40">Belum ada entri jurnal</p>
                </div>
            ) : (
                <div className="glass p-0 overflow-hidden animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <table className="table-glass">
                        <thead>
                            <tr>
                                <th>No. Jurnal</th>
                                <th>Tanggal</th>
                                <th>Deskripsi</th>
                                <th>Sumber</th>
                                <th>Debit</th>
                                <th>Kredit</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {journals.map((journal) => (
                                <tr key={journal.id}>
                                    <td className="font-mono text-white/70 text-sm">{journal.entry_number}</td>
                                    <td className="text-white/50">{formatDate(journal.date || journal.created_at)}</td>
                                    <td className="text-white font-medium">{journal.description || "—"}</td>
                                    <td>
                                        <span className={`badge ${journal.source === "POS" ? "badge-info" : "badge-warning"}`}>
                                            {journal.source || "Manual"}
                                        </span>
                                    </td>
                                    <td className="font-medium text-green-400">{formatCurrency(journal.total_debit)}</td>
                                    <td className="font-medium text-red-400">{formatCurrency(journal.total_credit)}</td>
                                    <td>
                                        <span className={`badge ${journal.status === "posted" ? "badge-success" : "badge-warning"}`}>
                                            {journal.status === "posted" ? "Posted" : "Draft"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
