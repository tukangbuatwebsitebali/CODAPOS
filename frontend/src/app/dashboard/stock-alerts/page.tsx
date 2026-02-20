'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Package, RefreshCw, Brain, Loader2, Info } from 'lucide-react';
import { aiAPI } from '@/lib/api';
import { StockAlert } from '@/types';

export default function StockAlertsPage() {
    const [alerts, setAlerts] = useState<StockAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await aiAPI.getStockAlerts();
            setAlerts(res.data?.data || []);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Gagal memuat data stock alerts';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">AI Stock Alerts</h1>
                        <p className="text-sm text-gray-500">Analisis cerdas stok berdasarkan pola penjualan</p>
                    </div>
                </div>
                <button
                    onClick={fetchAlerts}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
                            <p className="text-xs text-gray-500">Kritis (≤3 hari)</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{warningCount}</p>
                            <p className="text-xs text-gray-500">Peringatan (≤7 hari)</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                            <Package className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{alerts.length}</p>
                            <p className="text-xs text-gray-500">Total Alert</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading / Error / Empty */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-3" />
                    <p>Menganalisis data penjualan...</p>
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm mb-4">
                    {error}
                </div>
            )}
            {!loading && !error && alerts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Stok Aman! 🎉</h3>
                    <p className="text-sm text-gray-500">Semua produk memiliki stok yang cukup</p>
                </div>
            )}

            {/* Alerts List */}
            {!loading && alerts.length > 0 && (
                <div className="space-y-3">
                    {alerts.map((alert, i) => (
                        <div
                            key={i}
                            className={`bg-white rounded-2xl border p-4 transition hover:shadow-md ${alert.severity === 'critical'
                                    ? 'border-red-200 bg-red-50/30'
                                    : 'border-amber-200 bg-amber-50/30'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${alert.severity === 'critical' ? 'bg-red-100' : 'bg-amber-100'
                                    }`}>
                                    <AlertTriangle className={`w-5 h-5 ${alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                                        }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-gray-900 truncate">{alert.product_name}</h3>
                                        {alert.product_sku && (
                                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{alert.product_sku}</span>
                                        )}
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${alert.severity === 'critical'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {alert.severity === 'critical' ? 'KRITIS' : 'PERINGATAN'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">{alert.message}</p>

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-white rounded-xl px-3 py-2 border border-gray-100">
                                            <p className="text-xs text-gray-400">Stok Saat Ini</p>
                                            <p className="text-sm font-bold text-gray-800">
                                                {alert.current_stock} {alert.product_unit}
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-xl px-3 py-2 border border-gray-100">
                                            <p className="text-xs text-gray-400">Rata-rata/Hari</p>
                                            <p className="text-sm font-bold text-gray-800">
                                                {alert.daily_avg_sales} {alert.product_unit}
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-xl px-3 py-2 border border-gray-100">
                                            <div className="flex items-center gap-1">
                                                <p className="text-xs text-gray-400">Tren Mingguan</p>
                                                {alert.weekly_trend > 0 ? (
                                                    <TrendingUp className="w-3 h-3 text-green-500" />
                                                ) : alert.weekly_trend < 0 ? (
                                                    <TrendingDown className="w-3 h-3 text-red-500" />
                                                ) : null}
                                            </div>
                                            <p className={`text-sm font-bold ${alert.weekly_trend > 0 ? 'text-green-600' :
                                                    alert.weekly_trend < 0 ? 'text-red-600' : 'text-gray-800'
                                                }`}>
                                                {alert.weekly_trend > 0 ? '+' : ''}{alert.weekly_trend}%
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-xl px-3 py-2 border border-gray-100">
                                            <p className="text-xs text-gray-400">Habis Dalam</p>
                                            <p className={`text-sm font-bold ${alert.predicted_days_left <= 3 ? 'text-red-600' : 'text-amber-600'
                                                }`}>
                                                {alert.predicted_days_left < 1
                                                    ? '< 1 hari'
                                                    : `${Math.round(alert.predicted_days_left)} hari`
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* Restock suggestion */}
                                    {alert.suggested_restock > 0 && (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2">
                                            <Info className="w-4 h-4 flex-shrink-0" />
                                            <span>
                                                Rekomendasi restock: <strong>{alert.suggested_restock} {alert.product_unit}</strong> (supply 30 hari)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
