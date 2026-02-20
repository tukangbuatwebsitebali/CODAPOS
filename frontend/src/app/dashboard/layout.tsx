"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { deliveryAPI } from "@/lib/api";
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
    // Users can re-enable via settings if needed
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Mark as done so overlays never block the dashboard
            localStorage.setItem('codapos_ftux_done', 'true');
            localStorage.setItem('codapos_tour_done', 'true');
        }
    }, []);

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
            if (!item.permission) return true; // no permission = always visible
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

    return (
        <>
            {/* FTUX Onboarding Wizard Overlay */}
            {showFtux && (
                <OnboardingWizard
                    userName={user?.full_name || "Partner"}
                    onComplete={() => {
                        setShowFtux(false);
                        // Auto-start product tour after FTUX
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
            <div className="min-h-screen flex bg-[#0a0a0f] overflow-x-hidden isolate">
                {/* Mobile overlay */}
                {mobileOpen && (
                    <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
                )}

                {/* Sidebar */}
                <aside className={`
        fixed lg:sticky top-0 left-0 h-screen z-50
        glass-sidebar flex flex-col
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-20" : "w-64"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
                    {/* Logo */}
                    <div className="flex items-center gap-3 p-5 border-b border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1DA1F2] to-[#A7D8FF] flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/20">
                            <Store className="w-5 h-5 text-white" />
                        </div>
                        {!collapsed && (
                            <div className="animate-fade-in">
                                <h1 className="font-bold text-white text-lg tracking-tight">
                                    CODA<span className="text-[#1DA1F2]">POS</span>
                                </h1>
                                <p className="text-[10px] text-white/30 -mt-0.5">Cloud POS &amp; Merchant Platform</p>
                            </div>
                        )}
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

                    {/* Collapse toggle */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex absolute -right-3 top-7 w-6 h-6 rounded-full bg-[#1a1a2e] border border-white/10 items-center justify-center text-white/30 hover:text-white hover:bg-[#1DA1F2] transition-all"
                    >
                        <ChevronLeft className={`w-3 h-3 transition-transform ${collapsed ? "rotate-180" : ""}`} />
                    </button>
                </aside>

                {/* Main Content */}
                <div className="flex-1 min-h-screen flex flex-col relative z-20 pointer-events-auto">
                    {/* Top bar */}
                    <header className="sticky top-0 z-30 glass-subtle h-14 md:h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/5 pointer-events-auto">
                        <button onClick={() => setMobileOpen(true)} className="lg:hidden text-white/50 hover:text-white">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-4" data-tour="tour-topbar">
                            <div className="text-right">
                                <p className="text-xs text-white/30">{user?.tenant?.name || "CODAPOS"}</p>
                            </div>
                        </div>
                    </header>

                    {/* Page content */}
                    <main className="flex-1 p-3 sm:p-4 md:p-6 relative z-10 pointer-events-auto">
                        {children}
                    </main>
                </div>
            </div >
        </>
    );
}
