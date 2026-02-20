"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { deliveryAPI, aiAPI } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store";
import { usePermission } from "@/hooks/usePermission";
import Link from "next/link";
import OnboardingWizard from "@/components/OnboardingWizard";
import ProductTour from "@/components/ProductTour";
import {
    LayoutDashboard, ShoppingCart, Package, Warehouse,
    Receipt, Store, BookOpen, FileText, BarChart3,
    Building2, Settings, LogOut, ChevronLeft, Menu, Crown, Shield, Users, Brain, Truck, Palette, Printer, Globe,
    X, MoreHorizontal, User, Bell, AlertTriangle, TrendingDown,
} from "lucide-react";


interface MenuItem {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    href?: string;
    divider?: boolean;
    permission?: string;
    tourId?: string;
}

const allMenuItems: MenuItem[] = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", tourId: "tour-dashboard" },
    { label: "POS Kasir", icon: ShoppingCart, href: "/dashboard/pos", permission: "pos_checkout", tourId: "tour-pos" },
    { label: "Produk", icon: Package, href: "/dashboard/products", permission: "read_products", tourId: "tour-products" },
    { label: "Inventori", icon: Warehouse, href: "/dashboard/inventory", permission: "manage_products" },
    { label: "Transaksi", icon: Receipt, href: "/dashboard/transactions", permission: "read_transactions", tourId: "tour-transactions" },
    { label: "Outlet", icon: Store, href: "/dashboard/outlets", permission: "manage_outlets", tourId: "tour-outlets" },
    { label: "Pelanggan", icon: Users, href: "/dashboard/customers", permission: "manage_customers" },
    { label: "AI Forecast", icon: Brain, href: "/dashboard/forecast", permission: "manage_settings" },
    { label: "AI Stock Alerts", icon: Brain, href: "/dashboard/stock-alerts", permission: "manage_products" },
    { label: "MyKurir", icon: Truck, href: "/dashboard/delivery", permission: "manage_settings" },
    { label: "Template Toko", icon: Palette, href: "/dashboard/storefront", permission: "manage_settings" },
    { divider: true, label: "Akuntansi", permission: "manage_accounting" },
    { label: "Chart of Accounts", icon: BookOpen, href: "/dashboard/accounting/coa", permission: "manage_accounting" },
    { label: "Jurnal", icon: FileText, href: "/dashboard/accounting/journals", permission: "manage_accounting" },
    { label: "Laporan Keuangan", icon: BarChart3, href: "/dashboard/accounting/reports", permission: "manage_accounting" },
    { divider: true, label: "Franchise", permission: "manage_settings" },
    { label: "Franchise", icon: Building2, href: "/dashboard/franchise", permission: "manage_settings" },
    { divider: true, label: "Super Admin", permission: "super_admin" },
    { label: "Admin Panel", icon: Shield, href: "/dashboard/admin", permission: "super_admin" },
    { label: "Official Web CODA", icon: Globe, href: "/dashboard/admin/website", permission: "super_admin" },
    { divider: true, label: "Tim", permission: "manage_users" },
    { label: "Kelola Tim", icon: Users, href: "/dashboard/team", permission: "manage_users" },
    { divider: true, label: "Sistem" },
    { label: "Pengaturan", icon: Settings, href: "/dashboard/settings", permission: "manage_settings", tourId: "tour-settings" },
    { label: "Printer & Struk", icon: Printer, href: "/dashboard/settings/printer", permission: "manage_settings" },
];

// Bottom nav items — the 4 most important + "More"
const bottomNavItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "POS", icon: ShoppingCart, href: "/dashboard/pos" },
    { label: "Produk", icon: Package, href: "/dashboard/products" },
    { label: "Transaksi", icon: Receipt, href: "/dashboard/transactions" },
];
// ======= STOCK ALERT BELL COMPONENT =======
interface StockAlertItem {
    product_id: string;
    product_name: string;
    product_unit: string;
    current_stock: number;
    daily_avg_sales: number;
    weekly_trend: number;
    predicted_days_left: number;
    suggested_restock: number;
    severity: string;
    message: string;
}

function StockAlertBell() {
    const [alerts, setAlerts] = useState<StockAlertItem[]>([]);
    const [open, setOpen] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await aiAPI.getStockAlerts();
                setAlerts(res.data.data || []);
            } catch { /* ignore */ }
        };
        fetch();
        const interval = setInterval(fetch, 300000); // every 5 min
        return () => clearInterval(interval);
    }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const criticalCount = alerts.filter(a => a.severity === "critical").length;
    const totalCount = alerts.length;

    return (
        <div className="relative" ref={bellRef}>
            <button
                onClick={() => setOpen(!open)}
                className="relative w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
                <Bell className="w-4.5 h-4.5" />
                {totalCount > 0 && (
                    <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white ${criticalCount > 0 ? "bg-red-500 animate-pulse" : "bg-amber-500"}`}>
                        {totalCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 max-h-[70vh] overflow-y-auto rounded-2xl bg-[#12121e]/98 border border-white/10 backdrop-blur-xl shadow-2xl z-50 animate-fade-in">
                    <div className="sticky top-0 bg-[#12121e] px-4 py-3 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-semibold text-white">Peringatan Stok</span>
                        </div>
                        <span className="text-xs text-white/30">{totalCount} peringatan</span>
                    </div>

                    {totalCount === 0 ? (
                        <div className="p-8 text-center">
                            <Package className="w-8 h-8 text-white/10 mx-auto mb-2" />
                            <p className="text-sm text-white/30">Semua stok aman 👍</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {alerts.map((alert) => (
                                <div key={alert.product_id} className="px-4 py-3 hover:bg-white/3 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${alert.severity === "critical" ? "bg-red-500" : "bg-amber-500"}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white truncate">{alert.product_name}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${alert.severity === "critical" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
                                                    {alert.severity === "critical" ? "KRITIS" : "RENDAH"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-white/40">
                                                    Stok: <span className="text-white/70 font-medium">{alert.current_stock} {alert.product_unit}</span>
                                                </span>
                                                <span className="text-xs text-white/40">
                                                    ~{Math.round(alert.predicted_days_left)} hari
                                                </span>
                                                {alert.weekly_trend !== 0 && (
                                                    <span className={`text-[10px] flex items-center gap-0.5 ${alert.weekly_trend > 0 ? "text-green-400" : "text-red-400"}`}>
                                                        <TrendingDown className={`w-3 h-3 ${alert.weekly_trend > 0 ? "rotate-180" : ""}`} />
                                                        {Math.abs(alert.weekly_trend).toFixed(0)}%
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-white/25 mt-1">
                                                Rekomendasi: tambah {alert.suggested_restock} {alert.product_unit}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, logout, loadFromStorage } = useAuthStore();
    const { hasPermission } = usePermission();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeDeliveryCount, setActiveDeliveryCount] = useState(0);
    const [showFtux, setShowFtux] = useState(false);
    const [showTour, setShowTour] = useState(false);

    // FTUX and ProductTour disabled — no longer auto-show overlays
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('codapos_ftux_done', 'true');
            localStorage.setItem('codapos_tour_done', 'true');
        }
    }, []);

    // Close mobile drawer on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Poll active delivery order count for MyKurir badge
    const fetchDeliveryCount = useCallback(async () => {
        try {
            const res = await deliveryAPI.getActiveCount();
            setActiveDeliveryCount(res.data.data?.count || 0);
        } catch { /* ignore if not logged in */ }
    }, []);

    useEffect(() => {
        fetchDeliveryCount();
        const interval = setInterval(fetchDeliveryCount, 30000);
        return () => clearInterval(interval);
    }, [fetchDeliveryCount]);

    // Filter menu based on user permissions
    const menuItems = useMemo(() => {
        return allMenuItems.filter(item => {
            if (!item.permission) return true;
            return hasPermission(item.permission);
        });
    }, [hasPermission]);

    useEffect(() => {
        loadFromStorage();
    }, [loadFromStorage]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('codapos_token');
            if (!token) {
                router.push("/login");
            }
        }
    }, [isAuthenticated, router]);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    // Check if a bottom nav item is active
    const isBottomNavActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* FTUX Onboarding Wizard Overlay */}
            {showFtux && (
                <OnboardingWizard
                    userName={user?.full_name || "Partner"}
                    onComplete={() => {
                        setShowFtux(false);
                        if (!localStorage.getItem('codapos_tour_done')) {
                            setTimeout(() => setShowTour(true), 500);
                        }
                    }}
                />
            )}
            {/* Product Tour */}
            {showTour && !showFtux && (
                <ProductTour onComplete={() => setShowTour(false)} />
            )}

            <div className="min-h-screen flex bg-[#0a0a0f] overflow-x-hidden">
                {/* ======= MOBILE SIDEBAR DRAWER OVERLAY ======= */}
                {mobileOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998] lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                )}

                {/* ======= SIDEBAR (Desktop: sticky | Mobile: slide-in drawer) ======= */}
                <aside className={`
                    fixed top-0 left-0 h-screen z-[999]
                    lg:sticky lg:top-0 lg:z-30
                    glass-sidebar flex flex-col
                    transition-transform duration-300 ease-in-out will-change-transform
                    ${collapsed ? "lg:w-20" : "lg:w-64"}
                    w-[280px]
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}>
                    {/* Logo + Close Button */}
                    <div className="flex items-center gap-3 p-5 border-b border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1DA1F2] to-[#A7D8FF] flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/20">
                            <Store className="w-5 h-5 text-white" />
                        </div>
                        {!collapsed && (
                            <div className="animate-fade-in flex-1">
                                <h1 className="font-bold text-white text-lg tracking-tight">
                                    CODA<span className="text-[#1DA1F2]">POS</span>
                                </h1>
                                <p className="text-[10px] text-white/30 -mt-0.5">Cloud POS &amp; Merchant Platform</p>
                            </div>
                        )}
                        {/* Close button - mobile only */}
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="lg:hidden ml-auto w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Menu */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {menuItems.map((item, i) => {
                            if ('divider' in item && item.divider) {
                                return !collapsed ? (
                                    <div key={i} className="pt-4 pb-2 px-3">
                                        <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">{item.label}</p>
                                    </div>
                                ) : <div key={i} className="pt-4 pb-2"><hr className="border-white/5" /></div>;
                            }
                            const isActive = pathname === item.href;
                            const Icon = item.icon!;
                            return (
                                <Link
                                    key={i}
                                    href={item.href!}
                                    onClick={() => setMobileOpen(false)}
                                    {...(item.tourId ? { 'data-tour': item.tourId } : {})}
                                    className={`
                                        relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                                        transition-all duration-200
                                        ${isActive
                                            ? "bg-gradient-to-r from-[#1DA1F2]/20 to-[#1DA1F2]/5 text-white border border-[#1DA1F2]/20"
                                            : "text-white/50 hover:text-white hover:bg-white/5"
                                        }
                                        ${collapsed ? "justify-center" : ""}
                                    `}
                                >
                                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#1DA1F2]" : ""}`} />
                                    {!collapsed && (
                                        <span className="flex-1 flex items-center gap-2">
                                            {item.label}
                                            {item.label === "MyKurir" && activeDeliveryCount > 0 && (
                                                <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                                    {activeDeliveryCount}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                    {collapsed && item.label === "MyKurir" && activeDeliveryCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                            {activeDeliveryCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User info */}
                    <div className="p-3 border-t border-white/5">
                        {!collapsed && user && (
                            <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer group">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1DA1F2] to-[#A7D8FF] flex items-center justify-center text-xs font-bold text-white">
                                    {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate group-hover:text-[#1DA1F2] transition">{user.full_name}</p>
                                    <p className="text-xs text-white/30 flex items-center gap-1">
                                        <Crown className="w-3 h-3" />
                                        {user.role?.replace("_", " ")}
                                    </p>
                                </div>
                            </Link>
                        )}
                        <button
                            onClick={handleLogout}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 w-full transition-all ${collapsed ? "justify-center" : ""}`}
                        >
                            <LogOut className="w-5 h-5" />
                            {!collapsed && <span>Keluar</span>}
                        </button>
                    </div>

                    {/* Collapse toggle - desktop only */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex absolute -right-3 top-7 w-6 h-6 rounded-full bg-[#1a1a2e] border border-white/10 items-center justify-center text-white/30 hover:text-white hover:bg-[#1DA1F2] transition-all"
                    >
                        <ChevronLeft className={`w-3 h-3 transition-transform ${collapsed ? "rotate-180" : ""}`} />
                    </button>
                </aside>

                {/* ======= MAIN CONTENT ======= */}
                <div className="flex-1 min-w-0 min-h-screen flex flex-col relative">
                    {/* Top bar */}
                    <header className="sticky top-0 z-30 glass-subtle h-14 flex items-center justify-between px-4 md:px-6 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="lg:hidden w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            {/* Mobile: show logo in header */}
                            <div className="lg:hidden flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1DA1F2] to-[#A7D8FF] flex items-center justify-center">
                                    <Store className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="font-bold text-white text-sm">
                                    CODA<span className="text-[#1DA1F2]">POS</span>
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4" data-tour="tour-topbar">
                            {/* Stock Alert Bell */}
                            <StockAlertBell />
                            <div className="text-right hidden sm:block">
                                <p className="text-xs text-white/30">{user?.tenant?.name || "CODAPOS"}</p>
                            </div>
                            {/* Mobile: user avatar in header */}
                            <Link href="/dashboard/profile" className="lg:hidden">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1DA1F2] to-[#A7D8FF] flex items-center justify-center text-xs font-bold text-white">
                                    {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                            </Link>
                        </div>
                    </header>

                    {/* Page content */}
                    <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6 relative">
                        {children}
                    </main>
                </div>

                {/* ======= MOBILE BOTTOM NAVIGATION (hidden on POS page) ======= */}
                {!pathname.startsWith("/dashboard/pos") && (
                    <nav className="mobile-bottom-nav lg:hidden">
                        {bottomNavItems.map((item, i) => {
                            const Icon = item.icon;
                            const isActive = isBottomNavActive(item.href);
                            return (
                                <Link
                                    key={i}
                                    href={item.href}
                                    className={`mobile-nav-item ${isActive ? "mobile-nav-item-active" : ""}`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                        {/* More button — opens full sidebar drawer */}
                        <button
                            onClick={() => setMobileOpen(true)}
                            className={`mobile-nav-item ${mobileOpen ? "mobile-nav-item-active" : ""}`}
                        >
                            <MoreHorizontal className="w-5 h-5" />
                            <span>Lainnya</span>
                        </button>
                    </nav>
                )}
            </div>
        </>
    );
}
