"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import {
    Truck, Package, MapPin, CheckCircle2, Clock,
    MessageCircle, Send, ChevronRight, AlertCircle, User
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

/* ============ Types ============ */
interface DeliveryOrder {
    id: string;
    order_number: string;
    status: string;
    courier_name: string;
    dropoff_address: string;
    dropoff_contact: string;
    pickup_address: string;
    package_desc: string;
    items_summary: string;
    total_amount: number;
    notes: string;
    created_at: string;
    delivered_at?: string;
    customer?: { name: string; phone: string };
}

interface ChatMessage {
    id: string;
    sender_type: "merchant" | "customer";
    sender_name: string;
    content: string;
    created_at: string;
}

/* ============ Status ============ */
const STEPS = [
    { key: "pending", label: "Pesanan Diterima", icon: AlertCircle },
    { key: "preparing", label: "Sedang Diproses", icon: Package },
    { key: "on_delivery", label: "Dalam Pengiriman", icon: Truck },
    { key: "delivered", label: "Telah Diterima", icon: CheckCircle2 },
];

function getStepIndex(status: string): number {
    const idx = STEPS.findIndex(s => s.key === status);
    return idx === -1 ? 0 : idx;
}

/* ============ Page ============ */
export default function OrderTrackingPage() {
    const params = useParams();
    const slug = params.slug as string;
    const orderId = params.orderId as string;

    const [order, setOrder] = useState<DeliveryOrder | null>(null);
    const [chatRoomId, setChatRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    const loadOrder = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/store/${slug}/orders/${orderId}`);
            if (res.data.success) {
                setOrder(res.data.data.order);
                if (res.data.data.chat_room_id) {
                    setChatRoomId(res.data.data.chat_room_id);
                }
            }
        } catch {
            setError("Pesanan tidak ditemukan");
        } finally {
            setLoading(false);
        }
    }, [slug, orderId]);

    const loadMessages = useCallback(async () => {
        if (!chatRoomId) return;
        try {
            const res = await axios.get(`${API_URL}/store/${slug}/chat/${chatRoomId}/messages`);
            if (res.data.success) {
                setMessages(res.data.data || []);
            }
        } catch { /* ignore */ }
    }, [slug, chatRoomId]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    useEffect(() => {
        if (!chatRoomId) return;
        loadMessages();
        const interval = setInterval(() => {
            loadOrder();
            loadMessages();
        }, 10000);
        return () => clearInterval(interval);
    }, [chatRoomId, loadMessages, loadOrder]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!chatInput.trim() || !chatRoomId || sending) return;
        setSending(true);
        try {
            await axios.post(`${API_URL}/store/${slug}/chat/${chatRoomId}/messages`, { content: chatInput.trim() });
            setChatInput("");
            await loadMessages();
        } catch { /* ignore */ } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Truck className="w-10 h-10 text-emerald-400 animate-bounce" />
                    <p className="text-gray-400 text-sm">Memuat pesanan...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <Package className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">{error || "Pesanan tidak ditemukan"}</p>
                </div>
            </div>
        );
    }

    const currentStep = getStepIndex(order.status);

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-4 py-8 pb-16 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-white/20 blur-3xl" />
                    <div className="absolute bottom-5 left-5 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                </div>
                <div className="max-w-lg mx-auto relative z-10">
                    <div className="flex items-center gap-2 text-white/70 text-sm mb-3">
                        <Truck className="w-4 h-4" />
                        <span>MyKurir Tracking</span>
                    </div>
                    <h1 className="text-2xl font-bold mb-1">#{order.order_number}</h1>
                    <p className="text-white/60 text-sm">
                        {new Date(order.created_at).toLocaleDateString("id-ID", {
                            weekday: "long", day: "numeric", month: "long", year: "numeric"
                        })}
                    </p>
                </div>
            </div>

            <div className="max-w-lg mx-auto -mt-8 px-4 pb-8 space-y-4">
                {/* Status Timeline */}
                <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-5">
                    <div className="space-y-0">
                        {STEPS.map((step, i) => {
                            const Icon = step.icon;
                            const isActive = i <= currentStep;
                            const isCurrent = i === currentStep;
                            return (
                                <div key={step.key} className="flex gap-4">
                                    {/* Line + Dot */}
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCurrent
                                            ? "bg-emerald-500 shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/20"
                                            : isActive
                                                ? "bg-emerald-600/60"
                                                : "bg-gray-800 border border-white/10"
                                            }`}>
                                            <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-600"}`} />
                                        </div>
                                        {i < STEPS.length - 1 && (
                                            <div className={`w-0.5 h-10 my-1 ${i < currentStep ? "bg-emerald-600/60" : "bg-gray-800"
                                                }`} />
                                        )}
                                    </div>
                                    {/* Label */}
                                    <div className="pt-1">
                                        <p className={`text-sm font-medium ${isCurrent ? "text-emerald-400" : isActive ? "text-gray-300" : "text-gray-600"
                                            }`}>
                                            {step.label}
                                        </p>
                                        {isCurrent && (
                                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Saat ini
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Courier Info */}
                {order.courier_name && (
                    <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                            <Truck className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Pengantar</p>
                            <p className="text-white font-semibold">🛵 {order.courier_name}</p>
                        </div>
                    </div>
                )}

                {/* Order Details */}
                <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Detail Pesanan
                    </h3>
                    <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                        <span className="text-gray-300">{order.dropoff_address}</span>
                    </div>
                    {order.items_summary && (
                        <p className="text-sm text-gray-400">{order.items_summary}</p>
                    )}
                    {order.total_amount > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-sm text-gray-500">Total</span>
                            <span className="text-lg font-bold text-emerald-400">
                                Rp {order.total_amount.toLocaleString("id-ID")}
                            </span>
                        </div>
                    )}
                    {order.notes && (
                        <p className="text-xs text-gray-500 italic">📝 {order.notes}</p>
                    )}
                </div>

                {/* Chat Section */}
                {chatRoomId && (
                    <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-white/[0.06] overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-semibold text-white">Chat dengan Toko</span>
                        </div>
                        {/* Messages */}
                        <div className="max-h-60 overflow-y-auto p-4 space-y-2.5">
                            {messages.length === 0 && (
                                <p className="text-center text-gray-600 text-xs py-4">
                                    Belum ada pesan. Kirim pesan untuk mengobrol dengan toko.
                                </p>
                            )}
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender_type === "customer" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${msg.sender_type === "customer"
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
                        <div className="p-3 border-t border-white/5 flex gap-2">
                            <input
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && sendMessage()}
                                placeholder="Tulis pesan..."
                                className="flex-1 px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                            <button onClick={sendMessage} disabled={sending || !chatInput.trim()}
                                className="px-3 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 disabled:opacity-40 transition">
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Delivered Banner */}
                {order.status === "delivered" && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
                        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <p className="text-green-400 font-bold text-lg">Pesanan Telah Diterima!</p>
                        <p className="text-green-500/60 text-xs mt-1">Terima kasih atas pesanan Anda</p>
                    </div>
                )}
            </div>
        </div>
    );
}
