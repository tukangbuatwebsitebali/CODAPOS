"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { deliveryAPI, chatAPI } from "@/lib/api";
import {
    Truck, Package, MapPin, Phone, MessageCircle, ChevronRight,
    Send, X, Clock, CheckCircle2, AlertCircle, User
} from "lucide-react";

/* ============ Types ============ */
interface DeliveryOrder {
    id: string;
    order_number: string;
    status: string;
    courier_name: string;
    dropoff_address: string;
    dropoff_contact: string;
    dropoff_phone: string;
    pickup_address: string;
    package_desc: string;
    items_summary: string;
    total_amount: number;
    notes: string;
    distance_km: number;
    delivery_fee: number;
    created_at: string;
    delivered_at?: string;
    customer?: { id: string; name: string; phone: string };
}

interface ChatMessage {
    id: string;
    room_id: string;
    sender_type: "merchant" | "customer";
    sender_name: string;
    content: string;
    read_at?: string;
    created_at: string;
}

interface ChatRoom {
    id: string;
    delivery_id: string;
    customer_id: string;
    status: string;
    last_message: string;
    last_message_at: string;
    unread_count: number;
    customer?: { name: string };
}

/* ============ Status helpers ============ */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    waiting_payment: { label: "Menunggu Bayar", color: "text-amber-400", bg: "bg-amber-500/10", icon: <Clock className="w-4 h-4" /> },
    pending: { label: "Pesanan Baru", color: "text-blue-400", bg: "bg-blue-500/10", icon: <AlertCircle className="w-4 h-4" /> },
    preparing: { label: "Diproses", color: "text-purple-400", bg: "bg-purple-500/10", icon: <Package className="w-4 h-4" /> },
    on_delivery: { label: "Dikirim", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: <Truck className="w-4 h-4" /> },
    delivered: { label: "Selesai", color: "text-green-400", bg: "bg-green-500/10", icon: <CheckCircle2 className="w-4 h-4" /> },
    cancelled: { label: "Dibatalkan", color: "text-red-400", bg: "bg-red-500/10", icon: <X className="w-4 h-4" /> },
};

const STATUS_FLOW = ["pending", "preparing", "on_delivery", "delivered"];

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
            {cfg.icon} {cfg.label}
        </span>
    );
}

function getNextStatus(current: string): string | null {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
}

function getNextAction(current: string): string | null {
    const map: Record<string, string> = {
        pending: "Proses Pesanan",
        preparing: "Kirim Sekarang",
        on_delivery: "Selesai Diantar",
    };
    return map[current] || null;
}

/* ============ Chat Panel ============ */
function ChatPanel({ roomId, onClose }: { roomId: string; onClose: () => void }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadMessages = useCallback(async () => {
        try {
            const res = await chatAPI.getMessages(roomId);
            setMessages(res.data.data || []);
        } catch { /* ignore */ }
    }, [roomId]);

    useEffect(() => {
        loadMessages();
        pollRef.current = setInterval(loadMessages, 5000);
        // Mark read
        chatAPI.markRead(roomId).catch(() => { });
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [roomId, loadMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const send = async () => {
        if (!input.trim() || sending) return;
        setSending(true);
        try {
            await chatAPI.sendMessage(roomId, input.trim());
            setInput("");
            await loadMessages();
        } catch { /* ignore */ } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 bg-black/40" onClick={onClose}>
            <div onClick={e => e.stopPropagation()}
                className="w-full max-w-md h-[70vh] bg-gray-900 rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-emerald-600/20 to-teal-600/20">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-emerald-400" />
                        <span className="font-semibold text-white text-sm">Chat Pelanggan</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 py-8 text-sm">Belum ada pesan</div>
                    )}
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender_type === "merchant" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${msg.sender_type === "merchant"
                                ? "bg-emerald-600 text-white rounded-br-md"
                                : "bg-gray-800 text-gray-100 rounded-bl-md"
                                }`}>
                                <div className="text-[10px] opacity-60 mb-0.5 font-medium">{msg.sender_name}</div>
                                <div>{msg.content}</div>
                                <div className="text-[9px] opacity-40 mt-1 text-right">
                                    {new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
                {/* Input */}
                <div className="p-3 border-t border-white/10 flex gap-2">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && send()}
                        placeholder="Tulis pesan..."
                        className="flex-1 px-3.5 py-2 bg-gray-800 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <button onClick={send} disabled={sending || !input.trim()}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 disabled:opacity-40 transition">
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============ Main Page ============ */
export default function MyKurirPage() {
    const [orders, setOrders] = useState<DeliveryOrder[]>([]);
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [activeChatRoom, setActiveChatRoom] = useState<string | null>(null);
    const [editingCourier, setEditingCourier] = useState<string | null>(null);
    const [courierInput, setCourierInput] = useState("");
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

    const loadOrders = useCallback(async () => {
        try {
            const res = await deliveryAPI.getOrders(statusFilter);
            setOrders(res.data.data?.orders || []);
        } catch { /* ignore */ }
    }, [statusFilter]);

    const loadChatRooms = useCallback(async () => {
        try {
            const res = await chatAPI.getRooms();
            setChatRooms(res.data.data || []);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        Promise.all([loadOrders(), loadChatRooms()]).finally(() => setLoading(false));
    }, [loadOrders, loadChatRooms]);

    // Refresh every 15s
    useEffect(() => {
        const interval = setInterval(() => {
            loadOrders();
            loadChatRooms();
        }, 15000);
        return () => clearInterval(interval);
    }, [loadOrders, loadChatRooms]);

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        setUpdatingStatus(orderId);
        try {
            await deliveryAPI.updateStatus(orderId, { status: newStatus });
            await loadOrders();
        } catch { /* ignore */ } finally {
            setUpdatingStatus(null);
        }
    };

    const handleSetCourier = async (orderId: string) => {
        if (!courierInput.trim()) return;
        try {
            await deliveryAPI.setCourier(orderId, courierInput.trim());
            setEditingCourier(null);
            setCourierInput("");
            await loadOrders();
        } catch { /* ignore */ }
    };

    const getChatRoomForOrder = (orderId: string) => {
        return chatRooms.find(r => r.delivery_id === orderId);
    };

    // Count orders by status
    const statusCounts = orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const filterTabs = [
        { key: "", label: "Semua", count: orders.length },
        { key: "pending", label: "Baru", count: statusCounts.pending || 0 },
        { key: "preparing", label: "Diproses", count: statusCounts.preparing || 0 },
        { key: "on_delivery", label: "Dikirim", count: statusCounts.on_delivery || 0 },
        { key: "delivered", label: "Selesai", count: statusCounts.delivered || 0 },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-3">
                    <Truck className="w-10 h-10 text-emerald-400 animate-bounce" />
                    <p className="text-gray-400 text-sm">Memuat MyKurir...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/25">
                            <Truck className="w-6 h-6 text-white" />
                        </div>
                        MyKurir
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Kelola pesanan pengiriman Anda</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full font-medium">
                        <Package className="w-4 h-4" />
                        {orders.length} pesanan
                    </div>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {filterTabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setStatusFilter(tab.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${statusFilter === tab.key
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${statusFilter === tab.key ? "bg-white/20" : "bg-white/10"
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Orders Grid */}
            {orders.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] rounded-2xl border border-white/5">
                    <Truck className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">Belum ada pesanan</p>
                    <p className="text-gray-600 text-sm mt-1">Pesanan dari toko online akan muncul di sini</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {orders.map(order => {
                        const room = getChatRoomForOrder(order.id);
                        const nextStatus = getNextStatus(order.status);
                        const nextAction = getNextAction(order.status);
                        const isUpdating = updatingStatus === order.id;

                        return (
                            <div key={order.id}
                                className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-white/[0.06] overflow-hidden hover:border-white/10 transition-all group">
                                {/* Card Header */}
                                <div className="px-4 pt-4 pb-3 flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-white font-bold text-sm">{order.order_number}</span>
                                            <StatusBadge status={order.status} />
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(order.created_at).toLocaleDateString("id-ID", {
                                                day: "numeric", month: "short", year: "numeric",
                                                hour: "2-digit", minute: "2-digit"
                                            })}
                                        </div>
                                    </div>
                                    {room && (
                                        <button
                                            onClick={() => setActiveChatRoom(room.id)}
                                            className="relative p-2 hover:bg-white/10 rounded-xl transition"
                                            title="Chat Pelanggan"
                                        >
                                            <MessageCircle className="w-5 h-5 text-emerald-400" />
                                            {room.unread_count > 0 && (
                                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                                                    {room.unread_count}
                                                </span>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Customer + Address */}
                                <div className="px-4 pb-3 space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                        <span className="text-white font-medium truncate">
                                            {order.dropoff_contact || order.customer?.name || "Pelanggan"}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm">
                                        <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                                        <span className="text-gray-400 line-clamp-2">{order.dropoff_address}</span>
                                    </div>
                                    {order.dropoff_phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                            <a href={`tel:${order.dropoff_phone}`} className="text-emerald-400 hover:underline">
                                                {order.dropoff_phone}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Items + Amount */}
                                {(order.items_summary || order.total_amount > 0) && (
                                    <div className="mx-4 mb-3 p-2.5 bg-white/[0.03] rounded-xl">
                                        {order.items_summary && (
                                            <p className="text-xs text-gray-400 line-clamp-2">{order.items_summary}</p>
                                        )}
                                        {order.total_amount > 0 && (
                                            <p className="text-sm font-bold text-emerald-400 mt-1">
                                                Rp {order.total_amount.toLocaleString("id-ID")}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Courier (Pengantar) */}
                                <div className="mx-4 mb-3">
                                    {editingCourier === order.id ? (
                                        <div className="flex gap-2">
                                            <input
                                                autoFocus
                                                value={courierInput}
                                                onChange={e => setCourierInput(e.target.value)}
                                                onKeyDown={e => e.key === "Enter" && handleSetCourier(order.id)}
                                                placeholder="Nama pengantar..."
                                                className="flex-1 px-3 py-1.5 bg-gray-800 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            />
                                            <button onClick={() => handleSetCourier(order.id)}
                                                className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-500 transition font-medium">
                                                OK
                                            </button>
                                            <button onClick={() => { setEditingCourier(null); setCourierInput(""); }}
                                                className="px-2 py-1.5 bg-gray-800 text-gray-400 text-xs rounded-lg hover:bg-gray-700 transition">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setEditingCourier(order.id);
                                                setCourierInput(order.courier_name || "");
                                            }}
                                            className="w-full flex items-center justify-between px-3 py-2 bg-white/[0.03] rounded-xl hover:bg-white/[0.06] transition text-sm group/courier"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Truck className="w-3.5 h-3.5 text-gray-500" />
                                                <span className={order.courier_name ? "text-white font-medium" : "text-gray-500"}>
                                                    {order.courier_name ? `🛵 ${order.courier_name}` : "Pilih pengantar..."}
                                                </span>
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover/courier:text-gray-400 transition" />
                                        </button>
                                    )}
                                </div>

                                {/* Notes */}
                                {order.notes && (
                                    <div className="mx-4 mb-3 text-xs text-gray-500 italic">
                                        📝 {order.notes}
                                    </div>
                                )}

                                {/* Action Button */}
                                {nextStatus && nextAction && (
                                    <div className="px-4 pb-4">
                                        <button
                                            onClick={() => handleStatusUpdate(order.id, nextStatus)}
                                            disabled={isUpdating}
                                            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                        >
                                            {isUpdating ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    {STATUS_CONFIG[nextStatus]?.icon}
                                                    {nextAction}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Delivered indicator */}
                                {order.status === "delivered" && (
                                    <div className="px-4 pb-4">
                                        <div className="flex items-center justify-center gap-2 py-2 text-green-400 text-sm font-medium bg-green-500/5 rounded-xl">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Selesai diantar
                                            {order.delivered_at && (
                                                <span className="text-green-600 text-xs">
                                                    • {new Date(order.delivered_at).toLocaleString("id-ID")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Chat Panel */}
            {activeChatRoom && (
                <ChatPanel roomId={activeChatRoom} onClose={() => setActiveChatRoom(null)} />
            )}
        </div>
    );
}
