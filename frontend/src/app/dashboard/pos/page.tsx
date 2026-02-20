"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCartStore } from "@/store";
import { Product } from "@/types";
import { productAPI, posAPI, outletAPI, paymentAPI, tenantAPI } from "@/lib/api";
import { generateESCPOS, printReceiptInBrowser, type ReceiptData, type ReceiptTenant } from "@/lib/receipt";
import { printerService } from "@/lib/bluetooth-printer";
import {
    Search, Minus, Plus, Trash2, CreditCard, Banknote,
    QrCode, ShoppingBag, X, CheckCircle2, Loader2, AlertCircle, Printer,
} from "lucide-react";

// Helper: resolve image URL — use directly if absolute (Cloudinary), prepend API base if relative
const resolveImageUrl = (url?: string): string => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080';
    return `${base}${url}`;
};

declare global {
    interface Window {
        snap?: {
            pay: (token: string, options: {
                onSuccess?: (result: Record<string, unknown>) => void;
                onPending?: (result: Record<string, unknown>) => void;
                onError?: (result: Record<string, unknown>) => void;
                onClose?: () => void;
            }) => void;
        };
    }
}

const categories = ["Semua", "Makanan", "Minuman", "Snack"];

export default function POSPage() {
    const { items, addItem, removeItem, updateQuantity, clearCart, getSubtotal, getTax, getTotal, getItemCount } = useCartStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("Semua");
    const [showPayment, setShowPayment] = useState(false);
    const [paymentDone, setPaymentDone] = useState(false);
    const [checkoutError, setCheckoutError] = useState("");
    const [txNumber, setTxNumber] = useState("");
    const [defaultOutletId, setDefaultOutletId] = useState("");
    const [processingPayment, setProcessingPayment] = useState(false);
    const [lastTxId, setLastTxId] = useState("");
    const [printing, setPrinting] = useState(false);
    const tenantRef = useRef<ReceiptTenant>({ name: "Toko" });
    const snapLoaded = useRef(false);
    const midtransConfig = useRef<{ clientKey: string; mode: string }>({ clientKey: "", mode: "sandbox" });
    const [mobileCartOpen, setMobileCartOpen] = useState(false);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await productAPI.getAll(search || undefined);
            setProducts((res.data.data || []).filter((p: Product) => p.is_active));
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    // Load outlet + Midtrans config + tenant info on mount
    useEffect(() => {
        const init = async () => {
            try {
                const [outletRes, configRes, tenantRes] = await Promise.all([
                    outletAPI.getAll(),
                    paymentAPI.getConfig(),
                    tenantAPI.getMe(),
                ]);
                const outlets = outletRes.data.data || [];
                if (outlets.length > 0) setDefaultOutletId(outlets[0].id);

                const tenant = tenantRes.data.data;
                if (tenant) {
                    tenantRef.current = {
                        name: tenant.business_name || tenant.name || "Toko",
                        address: tenant.address,
                        phone: tenant.phone,
                        logo_url: tenant.logo_url,
                    };
                }

                const cfg = configRes.data.data || {};
                midtransConfig.current = {
                    clientKey: cfg.client_key || "",
                    mode: cfg.mode || "sandbox",
                };

                // Preload Snap.js
                if (midtransConfig.current.clientKey && !snapLoaded.current) {
                    const snapUrl = midtransConfig.current.mode === "production"
                        ? "https://app.midtrans.com/snap/snap.js"
                        : "https://app.sandbox.midtrans.com/snap/snap.js";
                    const script = document.createElement("script");
                    script.src = snapUrl;
                    script.setAttribute("data-client-key", midtransConfig.current.clientKey);
                    script.onload = () => { snapLoaded.current = true; };
                    document.head.appendChild(script);
                }
            } catch { /* ignore */ }
        };
        init();
    }, []);

    // ── Auto-print receipt after checkout ──
    const handlePrintReceipt = useCallback(async (txId: string) => {
        try {
            const res = await posAPI.getTransaction(txId);
            const tx = res.data.data;
            if (!tx) return;

            const receiptData: ReceiptData = {
                transaction_number: tx.transaction_number,
                created_at: tx.created_at,
                cashier_name: tx.cashier?.name,
                outlet_name: tx.outlet?.name,
                items: (tx.items || []).map((it: any) => ({
                    product_name: it.product_name,
                    variant_name: it.variant_name,
                    quantity: it.quantity,
                    unit_price: it.unit_price,
                    subtotal: it.subtotal,
                    discount_amount: it.discount_amount,
                    modifiers: it.modifiers,
                })),
                payments: (tx.payments || []).map((p: any) => ({
                    payment_method: p.payment_method,
                    amount: p.amount,
                    reference_number: p.reference_number,
                })),
                subtotal: tx.subtotal,
                discount_amount: tx.discount_amount,
                tax_amount: tx.tax_amount,
                total_amount: tx.total_amount,
                notes: tx.notes,
            };

            const settings = printerService.getSettings();
            const status = printerService.getStatus();

            if (status.connected) {
                const escpos = generateESCPOS(receiptData, tenantRef.current, settings.paperSize);
                await printerService.print(escpos);
            } else {
                printReceiptInBrowser(receiptData, tenantRef.current, settings.paperSize);
            }
        } catch {
            // Silently fail — receipt is optional
        }
    }, []);

    const triggerAutoPrint = useCallback(async (txId: string) => {
        const settings = printerService.getSettings();
        if (settings.autoPrint) {
            setPrinting(true);
            await handlePrintReceipt(txId);
            setPrinting(false);
        }
    }, [handlePrintReceipt]);

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const formatCurrency = (amount: number) =>
        `Rp ${amount.toLocaleString("id-ID")}`;

    const handlePayment = async (method: string) => {
        setCheckoutError("");
        if (!defaultOutletId) {
            setCheckoutError("Outlet belum tersedia. Buat outlet terlebih dahulu di menu Outlets.");
            return;
        }

        const methodLower = method.toLowerCase();

        // For QRIS or Card, use Midtrans Snap
        if (methodLower === "qris" || methodLower === "card") {
            if (!midtransConfig.current.clientKey) {
                setCheckoutError("Midtrans belum dikonfigurasi. Setup di Admin → Pembayaran.");
                return;
            }
            setProcessingPayment(true);
            try {
                const orderId = `POS-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                const snapRes = await paymentAPI.createSnap({
                    order_id: orderId,
                    gross_amount: getTotal(),
                    first_name: "Pelanggan",
                    email: "pos@codapos.com",
                    phone: "08000000000",
                });

                const snapToken = snapRes.data.data?.token;
                if (!snapToken) {
                    setCheckoutError("Gagal mendapatkan token pembayaran dari Midtrans.");
                    setProcessingPayment(false);
                    return;
                }

                // Wait for snap.js to be ready
                const waitForSnap = () => new Promise<void>((resolve, reject) => {
                    let tries = 0;
                    const check = () => {
                        if (window.snap) { resolve(); return; }
                        if (tries++ > 30) { reject(new Error("Snap.js timeout")); return; }
                        setTimeout(check, 200);
                    };
                    check();
                });

                await waitForSnap();

                window.snap!.pay(snapToken, {
                    onSuccess: async () => {
                        // Payment success → record transaction in POS
                        try {
                            const checkoutData = {
                                outlet_id: defaultOutletId,
                                items: items.map((item) => ({
                                    product_id: item.product.id,
                                    variant_id: item.variant?.id,
                                    quantity: item.quantity,
                                    modifiers: item.modifiers,
                                })),
                                payments: [{
                                    payment_method: methodLower,
                                    amount: getTotal(),
                                    reference_number: orderId,
                                }],
                            };
                            const res = await posAPI.checkout(checkoutData);
                            const txn = res.data.data;
                            setTxNumber(txn?.transaction_number || orderId);
                            if (txn?.id) { setLastTxId(txn.id); triggerAutoPrint(txn.id); }
                        } catch {
                            setTxNumber(orderId);
                        }
                        setPaymentDone(true);
                        setProcessingPayment(false);
                        setTimeout(() => {
                            clearCart();
                            setShowPayment(false);
                            setPaymentDone(false);
                            setTxNumber("");
                            setLastTxId("");
                        }, 8000);
                    },
                    onPending: () => {
                        setCheckoutError("Pembayaran pending. Silakan selesaikan pembayaran.");
                        setProcessingPayment(false);
                    },
                    onError: () => {
                        setCheckoutError("Pembayaran gagal. Coba lagi.");
                        setProcessingPayment(false);
                    },
                    onClose: () => {
                        setProcessingPayment(false);
                    },
                });
            } catch {
                setCheckoutError("Gagal memproses pembayaran Midtrans. Coba lagi.");
                setProcessingPayment(false);
            }
            return;
        }

        // Cash payment → direct checkout
        try {
            const checkoutData = {
                outlet_id: defaultOutletId,
                items: items.map((item) => ({
                    product_id: item.product.id,
                    variant_id: item.variant?.id,
                    quantity: item.quantity,
                    modifiers: item.modifiers,
                })),
                payments: [{
                    payment_method: methodLower,
                    amount: getTotal(),
                }],
            };

            const res = await posAPI.checkout(checkoutData);
            const txn = res.data.data;
            setTxNumber(txn?.transaction_number || "");
            if (txn?.id) { setLastTxId(txn.id); triggerAutoPrint(txn.id); }
            setPaymentDone(true);
            setTimeout(() => {
                clearCart();
                setShowPayment(false);
                setPaymentDone(false);
                setTxNumber("");
                setLastTxId("");
            }, 8000);
        } catch {
            setCheckoutError("Gagal memproses pembayaran. Coba lagi.");
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-4 h-[calc(100vh-5rem)] md:h-[calc(100vh-7rem)] -m-3 sm:-m-4 md:-m-6">
            {/* LEFT: Product Grid */}
            <div className="flex-1 flex flex-col p-3 sm:p-4 md:p-6 min-h-0">
                {/* Search & Categories */}
                <div className="flex flex-col gap-3 mb-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            type="text"
                            className="input-glass pl-11 py-3"
                            placeholder="Cari produk..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === cat
                                    ? "bg-[#C40000] text-white shadow-lg shadow-red-900/30"
                                    : "bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/8"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-[#C40000] animate-spin" />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                        <ShoppingBag className="w-12 h-12 mb-3" />
                        <p className="text-sm">Tidak ada produk ditemukan</p>
                        <p className="text-xs mt-1">Tambahkan produk di menu Produk</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-min">
                        {filteredProducts.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => addItem(product)}
                                className="glass pos-product-card p-4 text-left"
                            >
                                <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-white/5 to-white/2 mb-3 flex items-center justify-center overflow-hidden">
                                    {product.image_url ? (
                                        <img src={resolveImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <ShoppingBag className="w-8 h-8 text-white/10" />
                                    )}
                                </div>
                                <h3 className="text-sm font-semibold text-white truncate">{product.name}</h3>
                                <p className="text-base font-bold text-[#C40000] mt-1">{formatCurrency(product.base_price)}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile Cart Toggle Button */}
            <button
                onClick={() => setMobileCartOpen(true)}
                className="lg:hidden fixed bottom-6 right-4 z-[950] w-14 h-14 rounded-full bg-[#C40000] text-white shadow-2xl shadow-red-900/50 flex items-center justify-center hover:bg-[#E53030] transition-all active:scale-95"
            >
                <ShoppingBag className="w-6 h-6" />
                {getItemCount() > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 bg-white text-[#C40000] text-xs font-bold rounded-full flex items-center justify-center shadow">
                        {getItemCount()}
                    </span>
                )}
            </button>

            {/* Mobile Cart Overlay */}
            {mobileCartOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] lg:hidden" onClick={() => setMobileCartOpen(false)} />
            )}

            {/* RIGHT: Cart Panel — side panel on desktop, bottom drawer on mobile */}
            <div className={`
                fixed bottom-0 left-0 right-0 z-[1000] lg:relative lg:z-0
                lg:w-96 glass-sidebar flex flex-col border-t lg:border-t-0 lg:border-l border-white/5
                transition-transform duration-300 ease-in-out
                h-[90vh] lg:h-auto rounded-t-3xl lg:rounded-none
                ${mobileCartOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
            `}>
                {/* Cart Header */}
                <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between">
                    {/* Mobile drag handle */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/20 lg:hidden" />
                    <div>
                        <h2 className="text-lg font-bold text-white">Keranjang</h2>
                        <p className="text-xs text-white/30">{getItemCount()} item</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {items.length > 0 && (
                            <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                                <Trash2 className="w-3 h-3" /> Hapus
                            </button>
                        )}
                        <button onClick={() => setMobileCartOpen(false)} className="lg:hidden text-white/30 hover:text-white p-1">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/20">
                            <ShoppingBag className="w-12 h-12 mb-3" />
                            <p className="text-sm">Keranjang kosong</p>
                            <p className="text-xs mt-1">Pilih produk untuk memulai</p>
                        </div>
                    ) : (
                        items.map((item, i) => (
                            <div key={i} className="glass-subtle p-3 flex gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{item.product.name}</p>
                                    <p className="text-xs text-white/30 mt-0.5">{formatCurrency(item.unitPrice)} / item</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateQuantity(i, item.quantity - 1)}
                                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 transition"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-sm font-semibold text-white w-6 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(i, item.quantity + 1)}
                                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 transition"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-white">{formatCurrency(item.unitPrice * item.quantity)}</p>
                                    <button
                                        onClick={() => removeItem(i)}
                                        className="text-red-400/50 hover:text-red-400 mt-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Cart Footer / Payment */}
                {items.length > 0 && (
                    <div className="p-5 pb-8 border-t border-white/5 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/40">Subtotal</span>
                            <span className="text-white">{formatCurrency(getSubtotal())}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/40">PPN (11%)</span>
                            <span className="text-white">{formatCurrency(getTax())}</span>
                        </div>
                        <div className="h-px bg-white/5" />
                        <div className="flex justify-between">
                            <span className="text-white font-semibold">Total</span>
                            <span className="text-xl font-bold text-[#C40000]">{formatCurrency(getTotal())}</span>
                        </div>

                        {checkoutError && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 text-red-400 text-xs">
                                <AlertCircle className="w-3 h-3" />
                                {checkoutError}
                            </div>
                        )}

                        {!showPayment ? (
                            <button
                                onClick={() => setShowPayment(true)}
                                className="btn-primary w-full mt-3"
                            >
                                Bayar Sekarang
                            </button>
                        ) : paymentDone ? (
                            <div className="flex flex-col items-center gap-2 py-4 animate-fade-in">
                                <CheckCircle2 className="w-12 h-12 text-green-400" />
                                <p className="text-sm font-semibold text-green-400">Pembayaran Berhasil!</p>
                                {txNumber && <p className="text-xs text-white/30">{txNumber}</p>}
                                {printing && <p className="text-xs text-blue-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Mencetak struk...</p>}
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => { if (lastTxId) { setPrinting(true); handlePrintReceipt(lastTxId).finally(() => setPrinting(false)); } }}
                                        disabled={!lastTxId || printing}
                                        className="px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-all flex items-center gap-1.5 border border-blue-500/20 disabled:opacity-50"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                        Cetak Struk
                                    </button>
                                    <button
                                        onClick={() => { if (lastTxId) handlePrintReceipt(lastTxId); }}
                                        className="px-3 py-2 rounded-lg bg-white/5 text-white/40 text-xs font-medium hover:bg-white/10 transition-all flex items-center gap-1.5 border border-white/10"
                                    >
                                        Cetak Browser
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 animate-slide-in-up">
                                <p className="text-xs text-white/30 text-center">Pilih metode pembayaran</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { label: "Cash", icon: Banknote },
                                        { label: "QRIS", icon: QrCode },
                                        { label: "Card", icon: CreditCard },
                                    ].map(({ label, icon: Icon }) => (
                                        <button
                                            key={label}
                                            onClick={() => handlePayment(label)}
                                            disabled={processingPayment}
                                            className={`glass-subtle p-3 flex flex-col items-center gap-1.5 hover:bg-white/8 transition ${processingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {processingPayment ? (
                                                <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
                                            ) : (
                                                <Icon className="w-5 h-5 text-white/40" />
                                            )}
                                            <span className="text-xs text-white/60">{label}</span>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setShowPayment(false)}
                                    className="btn-ghost w-full text-xs"
                                >
                                    Batal
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
