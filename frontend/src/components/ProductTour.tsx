"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowRight, ChevronRight, X } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
//  CODAPOS Product Tour — Dashboard Guided Walkthrough
//  Spotlight overlay + Glassmorphism Tooltip Balloon
// ═══════════════════════════════════════════════════════════════

interface TourStep {
    selector: string;
    title: string;
    description: string;
}

const TOUR_STEPS: TourStep[] = [
    {
        selector: "tour-dashboard",
        title: "📊 Dashboard",
        description: "Pantau ringkasan bisnis kamu di sini — total penjualan, produk terlaris, dan statistik harian.",
    },
    {
        selector: "tour-pos",
        title: "🛒 POS Kasir",
        description: "Gunakan POS untuk proses transaksi penjualan secara cepat dan mudah.",
    },
    {
        selector: "tour-products",
        title: "📦 Produk",
        description: "Kelola semua produk, harga, variasi, dan kategori bisnis kamu.",
    },
    {
        selector: "tour-transactions",
        title: "🧾 Transaksi",
        description: "Lihat riwayat semua transaksi dari semua outlet kamu.",
    },
    {
        selector: "tour-outlets",
        title: "🏪 Outlet",
        description: "Atur outlet / cabang bisnis kamu — tambah, edit, dan kelola.",
    },
    {
        selector: "tour-settings",
        title: "⚙️ Pengaturan",
        description: "Ubah profil bisnis, langganan, keamanan, dan pengaturan lainnya.",
    },
    {
        selector: "tour-topbar",
        title: "🎉 Tour Selesai!",
        description: "Selamat! Kamu sudah siap menggunakan CODAPOS. Jelajahi semua fitur di sidebar.",
    },
];

interface ProductTourProps {
    onComplete: () => void;
}

export default function ProductTour({ onComplete }: ProductTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
    const [arrowDir, setArrowDir] = useState<"left" | "top">("left");
    const [ready, setReady] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const step = TOUR_STEPS[currentStep];

    const measure = useCallback(() => {
        const el = document.querySelector(`[data-tour="${step.selector}"]`) as HTMLElement | null;
        if (!el) {
            setRect(null);
            setReady(false);
            return;
        }

        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });

        // Calculate tooltip position
        const tooltipW = 320;
        const tooltipH = 180;
        const gap = 16;

        const spaceRight = window.innerWidth - r.right;
        const spaceBottom = window.innerHeight - r.bottom;

        let tTop: number;
        let tLeft: number;
        let dir: "left" | "top" = "left";

        if (spaceRight > tooltipW + gap) {
            // Position to the right of target
            tLeft = r.right + gap;
            tTop = r.top + r.height / 2 - tooltipH / 2;
            dir = "left";
        } else if (spaceBottom > tooltipH + gap) {
            // Position below target
            tLeft = r.left + r.width / 2 - tooltipW / 2;
            tTop = r.bottom + gap;
            dir = "top";
        } else {
            // Fallback: position to the right anyway
            tLeft = r.right + gap;
            tTop = r.top;
            dir = "left";
        }

        // Clamp within viewport
        tTop = Math.max(12, Math.min(tTop, window.innerHeight - tooltipH - 12));
        tLeft = Math.max(12, Math.min(tLeft, window.innerWidth - tooltipW - 12));

        setTooltipPos({ top: tTop, left: tLeft });
        setArrowDir(dir);

        // Slight delay for entrance animation
        setTimeout(() => setReady(true), 50);
    }, [step.selector]);

    useEffect(() => {
        setReady(false);
        const timer = setTimeout(measure, 150);

        window.addEventListener("resize", measure);
        window.addEventListener("scroll", measure, true);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", measure);
            window.removeEventListener("scroll", measure, true);
        };
    }, [measure]);

    const goNext = () => {
        setReady(false);
        if (currentStep < TOUR_STEPS.length - 1) {
            setTimeout(() => setCurrentStep((s) => s + 1), 200);
        } else {
            finish();
        }
    };

    const finish = () => {
        localStorage.setItem("codapos_tour_done", "true");
        onComplete();
    };

    // Spotlight padding
    const pad = 8;
    const spotTop = rect ? rect.top - pad : 0;
    const spotLeft = rect ? rect.left - pad : 0;
    const spotW = rect ? rect.width + pad * 2 : 0;
    const spotH = rect ? rect.height + pad * 2 : 0;

    return (
        <>
            {/* Full-screen dark overlay with spotlight cutout using CSS clip-path */}
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 9998,
                    background: "rgba(0, 0, 0, 0.75)",
                    transition: "clip-path 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    clipPath: rect
                        ? `polygon(
                            0% 0%, 0% 100%, 
                            ${spotLeft}px 100%, 
                            ${spotLeft}px ${spotTop}px, 
                            ${spotLeft + spotW}px ${spotTop}px, 
                            ${spotLeft + spotW}px ${spotTop + spotH}px, 
                            ${spotLeft}px ${spotTop + spotH}px, 
                            ${spotLeft}px 100%, 
                            100% 100%, 100% 0%
                          )`
                        : "none",
                }}
            />

            {/* Glowing border around spotlight target */}
            {rect && (
                <div
                    style={{
                        position: "fixed",
                        zIndex: 9999,
                        top: spotTop,
                        left: spotLeft,
                        width: spotW,
                        height: spotH,
                        borderRadius: 12,
                        border: "2px solid rgba(29, 161, 242, 0.6)",
                        boxShadow: "0 0 20px rgba(29, 161, 242, 0.3), inset 0 0 20px rgba(29, 161, 242, 0.05)",
                        pointerEvents: "none",
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />
            )}

            {/* Tooltip card */}
            {tooltipPos && (
                <div
                    ref={tooltipRef}
                    style={{
                        position: "fixed",
                        zIndex: 10000,
                        top: tooltipPos.top,
                        left: tooltipPos.left,
                        width: 320,
                        opacity: ready ? 1 : 0,
                        transform: ready
                            ? "scale(1) translateY(0)"
                            : "scale(0.95) translateY(6px)",
                        transition: "opacity 0.3s ease, transform 0.3s ease",
                        pointerEvents: "auto",
                    }}
                >
                    {/* Arrow */}
                    <div
                        style={{
                            position: "absolute",
                            width: 14,
                            height: 14,
                            background: "rgba(12, 18, 36, 0.95)",
                            border: "1px solid rgba(29, 161, 242, 0.25)",
                            transform: "rotate(45deg)",
                            ...(arrowDir === "left"
                                ? { left: -7, top: 30, borderRight: "none", borderTop: "none" }
                                : { top: -7, left: 40, borderBottom: "none", borderRight: "none" }),
                        }}
                    />

                    {/* Card body */}
                    <div
                        style={{
                            background: "rgba(12, 18, 36, 0.95)",
                            backdropFilter: "blur(24px)",
                            WebkitBackdropFilter: "blur(24px)",
                            border: "1px solid rgba(29, 161, 242, 0.25)",
                            borderRadius: 18,
                            padding: "22px 20px 18px",
                            boxShadow:
                                "0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(29, 161, 242, 0.08)",
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <h3 style={{ fontSize: 17, fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.02em" }}>
                                {step.title}
                            </h3>
                            <button
                                onClick={finish}
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "rgba(255,255,255,0.3)",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                                    e.currentTarget.style.color = "white";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                    e.currentTarget.style.color = "rgba(255,255,255,0.3)";
                                }}
                            >
                                <X style={{ width: 14, height: 14 }} />
                            </button>
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: "0 0 18px 0" }}>
                            {step.description}
                        </p>

                        {/* Footer */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            {/* Progress dots */}
                            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                                {TOUR_STEPS.map((_, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            width: i === currentStep ? 18 : 6,
                                            height: 6,
                                            borderRadius: 100,
                                            background:
                                                i === currentStep
                                                    ? "#1DA1F2"
                                                    : i < currentStep
                                                        ? "rgba(29, 161, 242, 0.4)"
                                                        : "rgba(255,255,255,0.1)",
                                            transition: "all 0.3s ease",
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <button
                                    onClick={finish}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "rgba(255,255,255,0.25)",
                                        fontSize: 12,
                                        cursor: "pointer",
                                        padding: "4px 8px",
                                        transition: "color 0.2s",
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.25)"; }}
                                >
                                    Lewati
                                </button>
                                <button
                                    onClick={goNext}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 5,
                                        padding: "9px 18px",
                                        background: "linear-gradient(135deg, #1DA1F2, #0d8ecf)",
                                        color: "white",
                                        fontWeight: 700,
                                        fontSize: 12,
                                        borderRadius: 10,
                                        border: "none",
                                        cursor: "pointer",
                                        boxShadow: "0 4px 16px rgba(29, 161, 242, 0.35)",
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-1px)";
                                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(29, 161, 242, 0.5)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(29, 161, 242, 0.35)";
                                    }}
                                >
                                    {currentStep < TOUR_STEPS.length - 1 ? (
                                        <>Lanjut <ChevronRight style={{ width: 14, height: 14 }} /></>
                                    ) : (
                                        <>Selesai <ArrowRight style={{ width: 14, height: 14 }} /></>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Step counter */}
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", textAlign: "center", marginTop: 12, marginBottom: 0 }}>
                            {currentStep + 1} / {TOUR_STEPS.length}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
