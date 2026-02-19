"use client";

import { useState, useCallback } from "react";
import { forecastAPI } from "@/lib/api";
import {
    Brain, TrendingUp, TrendingDown, Minus, Package, AlertTriangle, Info,
    CheckCircle, RefreshCw, BarChart3, Sparkles, Calendar, ArrowUp, ArrowDown,
} from "lucide-react";

interface DailyForecast {
    date: string;
    predicted_revenue: number;
    predicted_orders: number;
    lower_bound: number;
    upper_bound: number;
}

interface ProductForecast {
    product_id: string;
    product_name: string;
    predicted_qty: number;
    trend_direction: string;
    trend_percentage: number;
    recommended_stock: number;
}

interface ForecastInsight {
    type: string;
    title: string;
    message: string;
    icon: string;
}

interface DailySummary {
    date: string;
    revenue: number;
    order_count: number;
    avg_order: number;
}

interface ForecastResult {
    period: string;
    generated_at: string;
    total_predicted_revenue: number;
    trend_direction: string;
    trend_percentage: number;
    confidence_score: number;
    daily_forecasts: DailyForecast[];
    top_products: ProductForecast[];
    insights: ForecastInsight[];
    historical_data: DailySummary[];
}

export default function ForecastPage() {
    const [forecast, setForecast] = useState<ForecastResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [forecastDays, setForecastDays] = useState(7);

    const generateForecast = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await forecastAPI.generate({ period: "daily", days: forecastDays });
            setForecast(res.data.data);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            setError(axiosErr.response?.data?.error || "Gagal membuat prediksi");
        } finally {
            setLoading(false);
        }
    }, [forecastDays]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

    const TrendIcon = ({ direction }: { direction: string }) => {
        if (direction === "up") return <TrendingUp className="w-4 h-4 text-green-400" />;
        if (direction === "down") return <TrendingDown className="w-4 h-4 text-red-400" />;
        return <Minus className="w-4 h-4 text-white/40" />;
    };

    const trendColor = (dir: string) =>
        dir === "up" ? "text-green-400" : dir === "down" ? "text-red-400" : "text-white/50";

    const insightIcon = (type: string) => {
        if (type === "success") return <CheckCircle className="w-5 h-5 text-green-400" />;
        if (type === "warning") return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
        return <Info className="w-5 h-5 text-[#1DA1F2]" />;
    };

    const insightBorder = (type: string) => {
        if (type === "success") return "border-green-500/20 bg-green-500/5";
        if (type === "warning") return "border-yellow-500/20 bg-yellow-500/5";
        return "border-[#1DA1F2]/20 bg-[#1DA1F2]/5";
    };

    // Get max revenue for chart scaling
    const allRevenues = forecast ? [
        ...forecast.historical_data.map(d => d.revenue),
        ...forecast.daily_forecasts.map(d => d.predicted_revenue),
    ] : [];
    const maxRevenue = Math.max(...allRevenues, 1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        AI Forecast
                    </h1>
                    <p className="text-white/50 text-sm mt-1">Prediksi penjualan menggunakan analisis data historis</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={forecastDays}
                        onChange={(e) => setForecastDays(Number(e.target.value))}
                        className="input-glass text-sm py-2 px-3 w-auto"
                    >
                        <option value={7}>7 Hari</option>
                        <option value={14}>14 Hari</option>
                        <option value={30}>30 Hari</option>
                    </select>
                    <button
                        onClick={generateForecast}
                        disabled={loading}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        {loading ? "Menganalisis..." : "Generate Prediksi"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            {/* Empty state */}
            {!forecast && !loading && (
                <div className="glass-strong p-12 rounded-2xl text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Mulai Analisis AI</h3>
                    <p className="text-white/40 text-sm max-w-md mx-auto">
                        Klik &quot;Generate Prediksi&quot; untuk mendapatkan prediksi penjualan berdasarkan data transaksi Anda.
                        Semakin banyak data, semakin akurat prediksinya.
                    </p>
                </div>
            )}

            {/* Loading state */}
            {loading && (
                <div className="glass-strong p-12 rounded-2xl text-center">
                    <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/60 text-sm">AI sedang menganalisis data transaksi Anda...</p>
                </div>
            )}

            {/* Forecast Results */}
            {forecast && !loading && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="glass-strong p-5 rounded-2xl">
                            <p className="text-xs text-white/40 uppercase tracking-wider">Prediksi Pendapatan</p>
                            <p className="text-2xl font-bold text-white mt-1">{formatCurrency(forecast.total_predicted_revenue)}</p>
                            <p className="text-xs text-white/30 mt-1">{forecastDays} hari ke depan</p>
                        </div>
                        <div className="glass-strong p-5 rounded-2xl">
                            <p className="text-xs text-white/40 uppercase tracking-wider">Tren</p>
                            <div className="flex items-center gap-2 mt-1">
                                <TrendIcon direction={forecast.trend_direction} />
                                <span className={`text-2xl font-bold ${trendColor(forecast.trend_direction)}`}>
                                    {forecast.trend_percentage > 0 ? "+" : ""}{forecast.trend_percentage}%
                                </span>
                            </div>
                            <p className="text-xs text-white/30 mt-1">{forecast.trend_direction === "up" ? "Naik" : forecast.trend_direction === "down" ? "Turun" : "Stabil"}</p>
                        </div>
                        <div className="glass-strong p-5 rounded-2xl">
                            <p className="text-xs text-white/40 uppercase tracking-wider">Akurasi Model</p>
                            <p className="text-2xl font-bold text-white mt-1">{Math.round(forecast.confidence_score * 100)}%</p>
                            <div className="mt-2 w-full bg-white/10 rounded-full h-2">
                                <div className="bg-gradient-to-r from-[#1DA1F2] to-purple-500 h-2 rounded-full transition-all" style={{ width: `${forecast.confidence_score * 100}%` }} />
                            </div>
                        </div>
                        <div className="glass-strong p-5 rounded-2xl">
                            <p className="text-xs text-white/40 uppercase tracking-wider">Rata-rata / Hari</p>
                            <p className="text-2xl font-bold text-white mt-1">
                                {formatCurrency(forecast.total_predicted_revenue / forecastDays)}
                            </p>
                            <p className="text-xs text-white/30 mt-1">Estimasi harian</p>
                        </div>
                    </div>

                    {/* Revenue Chart */}
                    <div className="glass-strong p-6 rounded-2xl">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-[#1DA1F2]" /> Grafik Pendapatan
                        </h3>
                        <div className="flex items-end gap-1 h-48 overflow-x-auto pb-2">
                            {/* Historical bars */}
                            {forecast.historical_data.map((d, i) => (
                                <div key={`h-${i}`} className="flex flex-col items-center flex-shrink-0 gap-1 group relative" style={{ minWidth: 28 }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                                        {formatCurrency(d.revenue)}
                                    </div>
                                    <div
                                        className="w-5 rounded-t bg-white/20 transition-all group-hover:bg-white/30"
                                        style={{ height: `${Math.max((d.revenue / maxRevenue) * 140, 2)}px` }}
                                    />
                                    <span className="text-[8px] text-white/30 -rotate-45 origin-top-left whitespace-nowrap">
                                        {new Date(d.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                                    </span>
                                </div>
                            ))}
                            {/* Separator */}
                            <div className="flex flex-col items-center flex-shrink-0 gap-1" style={{ minWidth: 20 }}>
                                <div className="w-px h-36 bg-white/20 border-l border-dashed border-white/30" />
                                <span className="text-[8px] text-white/50">Hari ini</span>
                            </div>
                            {/* Forecast bars */}
                            {forecast.daily_forecasts.map((d, i) => (
                                <div key={`f-${i}`} className="flex flex-col items-center flex-shrink-0 gap-1 group relative" style={{ minWidth: 28 }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                                        {formatCurrency(d.predicted_revenue)}
                                    </div>
                                    <div
                                        className="w-5 rounded-t bg-gradient-to-t from-[#1DA1F2] to-purple-500 opacity-70 transition-all group-hover:opacity-100"
                                        style={{ height: `${Math.max((d.predicted_revenue / maxRevenue) * 140, 2)}px` }}
                                    />
                                    <span className="text-[8px] text-[#1DA1F2]/50 -rotate-45 origin-top-left whitespace-nowrap">
                                        {new Date(d.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-white/20" /> Historis</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gradient-to-r from-[#1DA1F2] to-purple-500" /> Prediksi</div>
                        </div>
                    </div>

                    {/* AI Insights + Top Products */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Insights */}
                        <div className="glass-strong p-6 rounded-2xl">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-400" /> AI Insights
                            </h3>
                            <div className="space-y-3">
                                {forecast.insights.map((insight, i) => (
                                    <div key={i} className={`p-4 rounded-xl border ${insightBorder(insight.type)}`}>
                                        <div className="flex items-start gap-3">
                                            {insightIcon(insight.type)}
                                            <div>
                                                <p className="text-sm font-medium text-white">{insight.title}</p>
                                                <p className="text-xs text-white/50 mt-1">{insight.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="glass-strong p-6 rounded-2xl">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-[#1DA1F2]" /> Prediksi Produk Teratas
                            </h3>
                            {forecast.top_products.length === 0 ? (
                                <p className="text-white/30 text-sm text-center py-8">Belum ada data transaksi produk</p>
                            ) : (
                                <div className="space-y-3">
                                    {forecast.top_products.map((product, i) => (
                                        <div key={product.product_id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1DA1F2]/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-white/60">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{product.product_name}</p>
                                                <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                                                    <span>Prediksi: {product.predicted_qty} unit</span>
                                                    <span>•</span>
                                                    <span>Stok: {product.recommended_stock}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {product.trend_direction === "up" ? (
                                                    <ArrowUp className="w-3.5 h-3.5 text-green-400" />
                                                ) : product.trend_direction === "down" ? (
                                                    <ArrowDown className="w-3.5 h-3.5 text-red-400" />
                                                ) : (
                                                    <Minus className="w-3.5 h-3.5 text-white/30" />
                                                )}
                                                <span className={`text-xs font-medium ${trendColor(product.trend_direction)}`}>
                                                    {product.trend_percentage > 0 ? "+" : ""}{product.trend_percentage}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Daily Forecast Table */}
                    <div className="glass-strong p-6 rounded-2xl">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-[#1DA1F2]" /> Detail Prediksi Harian
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-white/40 text-xs uppercase border-b border-white/10">
                                        <th className="text-left py-3 px-4">Tanggal</th>
                                        <th className="text-right py-3 px-4">Prediksi Pendapatan</th>
                                        <th className="text-right py-3 px-4">Prediksi Order</th>
                                        <th className="text-right py-3 px-4">Range</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {forecast.daily_forecasts.map((d, i) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                                            <td className="py-3 px-4 text-white/80">
                                                {new Date(d.date).toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short" })}
                                            </td>
                                            <td className="py-3 px-4 text-right text-white font-medium">
                                                {formatCurrency(d.predicted_revenue)}
                                            </td>
                                            <td className="py-3 px-4 text-right text-white/60">{d.predicted_orders}</td>
                                            <td className="py-3 px-4 text-right text-white/40 text-xs">
                                                {formatCurrency(d.lower_bound)} — {formatCurrency(d.upper_bound)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Generated info */}
                    <p className="text-center text-xs text-white/20">
                        Prediksi dibuat pada {new Date(forecast.generated_at).toLocaleString("id-ID")} • Model: EMA + Seasonality • Confidence: {Math.round(forecast.confidence_score * 100)}%
                    </p>
                </>
            )}
        </div>
    );
}
