"use client";

import { useState, useEffect, useCallback } from "react";
import {
    printerService,
    type PrinterStatus,
    type SavedPrinter,
    type PrinterSettings,
} from "@/lib/bluetooth-printer";
import {
    Bluetooth, BluetoothConnected, BluetoothOff, BluetoothSearching,
    Printer, Trash2, Wifi, WifiOff, Settings, Zap,
    CheckCircle2, XCircle, RefreshCw, Loader2, FileText,
    Smartphone, Radio, Signal, ChevronRight, Shield,
} from "lucide-react";

export default function PrinterSettingsPage() {
    const [status, setStatus] = useState<PrinterStatus>({ connected: false, deviceName: null, deviceId: null });
    const [savedDevices, setSavedDevices] = useState<SavedPrinter[]>([]);
    const [settings, setSettings] = useState<PrinterSettings>({ autoPrint: false, paperSize: "58mm" });
    const [scanning, setScanning] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [testPrinting, setTestPrinting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
    const [supported, setSupported] = useState(true);

    useEffect(() => {
        setSupported(printerService.isSupported());
        setStatus(printerService.getStatus());
        setSavedDevices(printerService.getSavedDevices());
        setSettings(printerService.getSettings());
        const unsub = printerService.onStatusChange((s) => {
            setStatus(s);
            setSavedDevices(printerService.getSavedDevices());
        });
        return unsub;
    }, []);

    const showMsg = useCallback((type: "success" | "error" | "info", text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    }, []);

    const handleScan = async () => {
        setScanning(true);
        try {
            const device = await printerService.requestDevice();
            if (device) {
                setConnecting(true);
                await printerService.connect(device);
                showMsg("success", `Terhubung ke ${device.name || "Printer"}! 🎉`);
            }
        } catch (err) {
            showMsg("error", (err as Error).message);
        } finally {
            setScanning(false);
            setConnecting(false);
        }
    };

    const handleConnect = async (device: SavedPrinter) => {
        setConnecting(true);
        try {
            // For saved devices, we need to request again via BT picker
            const btDevice = await printerService.requestDevice();
            if (btDevice) {
                await printerService.connect(btDevice);
                showMsg("success", `Terhubung ke ${btDevice.name || device.name}!`);
            }
        } catch (err) {
            showMsg("error", (err as Error).message);
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = () => {
        printerService.disconnect();
        showMsg("info", "Printer terputus");
    };

    const handleRemove = (id: string) => {
        printerService.removeDevice(id);
        setSavedDevices(printerService.getSavedDevices());
        showMsg("info", "Printer dihapus dari daftar");
    };

    const handleTestPrint = async () => {
        setTestPrinting(true);
        try {
            await printerService.testPrint();
            showMsg("success", "Test print berhasil! Periksa printer Anda 🖨️");
        } catch (err) {
            showMsg("error", (err as Error).message);
        } finally {
            setTestPrinting(false);
        }
    };

    const updateSetting = (key: keyof PrinterSettings, value: unknown) => {
        const updated = { ...settings, [key]: value };
        setSettings(updated);
        printerService.saveSettings({ [key]: value });
    };

    // ── Status dot color ──
    const statusColor = status.connected ? "#22C55E" : "#EF4444";
    const statusText = status.connected ? "Terhubung" : "Tidak Terhubung";

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Printer className="w-5 h-5 text-white" />
                    </div>
                    Pengaturan Printer
                </h1>
                <p className="text-white/40 text-sm mt-1">Hubungkan printer Bluetooth untuk cetak struk otomatis</p>
            </div>

            {/* Toast */}
            {message && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium animate-slide-in-up flex items-center gap-2 ${message.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : message.type === "error" ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}>
                    {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : message.type === "error" ? <XCircle className="w-4 h-4" /> : <Bluetooth className="w-4 h-4" />}
                    {message.text}
                </div>
            )}

            {/* Browser not supported */}
            {!supported && (
                <div className="glass p-6 border border-amber-400/20 bg-amber-400/5 rounded-xl text-center space-y-3">
                    <BluetoothOff className="w-12 h-12 text-amber-400 mx-auto" />
                    <h3 className="text-white font-bold text-lg">Browser Tidak Mendukung</h3>
                    <p className="text-white/40 text-sm">Web Bluetooth API hanya tersedia di <strong className="text-white">Google Chrome</strong> atau <strong className="text-white">Microsoft Edge</strong>.</p>
                    <p className="text-white/30 text-xs">Pastikan juga Bluetooth aktif di perangkat Anda.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Left Column: Connection ── */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status Card */}
                    <div className={`glass p-6 rounded-xl border animate-slide-in-up ${status.connected ? 'border-green-500/20 bg-green-500/5' : 'border-white/10'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center ${status.connected
                                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
                                    : 'bg-white/5'
                                    }`}>
                                    {status.connected
                                        ? <BluetoothConnected className="w-7 h-7 text-green-400" />
                                        : <BluetoothOff className="w-7 h-7 text-white/20" />}
                                    {/* Pulse ring */}
                                    {status.connected && (
                                        <div className="absolute inset-0 rounded-2xl border-2 border-green-400/40 animate-pulse-glow" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                                        <span className={`text-sm font-semibold ${status.connected ? 'text-green-400' : 'text-white/40'}`}>{statusText}</span>
                                    </div>
                                    {status.connected && (
                                        <p className="text-white font-bold text-lg mt-0.5">{status.deviceName}</p>
                                    )}
                                    {!status.connected && (
                                        <p className="text-white/20 text-sm mt-0.5">Belum ada printer terhubung</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {status.connected ? (
                                    <>
                                        <button onClick={handleTestPrint} disabled={testPrinting}
                                            className="px-4 py-2.5 rounded-xl bg-green-500/10 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-all flex items-center gap-2 border border-green-500/20">
                                            {testPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                            Test Print
                                        </button>
                                        <button onClick={handleDisconnect}
                                            className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all flex items-center gap-2 border border-red-500/20">
                                            <WifiOff className="w-4 h-4" /> Putuskan
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={handleScan} disabled={scanning || connecting || !supported}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center gap-2 disabled:opacity-50">
                                        {scanning ? <BluetoothSearching className="w-4 h-4 animate-pulse" /> : connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bluetooth className="w-4 h-4" />}
                                        {scanning ? "Memindai..." : connecting ? "Menghubungkan..." : "Cari Printer"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Saved Devices */}
                    <div className="glass p-5 rounded-xl border border-white/10 animate-slide-in-up stagger-2">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-blue-400" />
                                <h2 className="text-sm font-semibold text-white">Perangkat Tersimpan</h2>
                            </div>
                            <button onClick={() => setSavedDevices(printerService.getSavedDevices())} className="text-white/20 hover:text-white/50 transition-colors">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                        {savedDevices.length === 0 ? (
                            <div className="text-center py-8 bg-white/[0.02] rounded-xl border border-dashed border-white/10">
                                <Bluetooth className="w-10 h-10 text-white/10 mx-auto mb-3" />
                                <p className="text-white/25 text-sm">Belum ada printer tersimpan</p>
                                <p className="text-white/15 text-xs mt-1">Klik &quot;Cari Printer&quot; untuk memindai</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {savedDevices.map((device) => {
                                    const isActive = status.connected && status.deviceId === device.id;
                                    return (
                                        <div key={device.id}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isActive
                                                ? 'bg-green-500/5 border-green-500/20'
                                                : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'
                                                }`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-green-500/20' : 'bg-white/5'}`}>
                                                    <Printer className={`w-4 h-4 ${isActive ? 'text-green-400' : 'text-white/30'}`} />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-medium ${isActive ? 'text-green-400' : 'text-white'}`}>{device.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-white/25">{device.paperSize}</span>
                                                        {device.lastConnected && (
                                                            <span className="text-[10px] text-white/15">• {new Date(device.lastConnected).toLocaleDateString("id-ID")}</span>
                                                        )}
                                                        {isActive && (
                                                            <span className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
                                                                <Signal className="w-2.5 h-2.5" /> Aktif
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!isActive && (
                                                    <button onClick={() => handleConnect(device)} disabled={connecting}
                                                        className="px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-all border border-blue-500/20">
                                                        {connecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                                                    </button>
                                                )}
                                                <button onClick={() => handleRemove(device.id)}
                                                    className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-all border border-red-500/20">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Compatible Printers */}
                    <div className="glass p-5 rounded-xl border border-white/10 animate-slide-in-up stagger-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5 text-cyan-400" />
                            <h2 className="text-sm font-semibold text-white">Printer yang Didukung</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                            {[
                                { name: "Epson", desc: "TM series" },
                                { name: "BIXOLON", desc: "SPP series" },
                                { name: "Star", desc: "mPOP, TSP" },
                                { name: "Xprinter", desc: "XP series" },
                                { name: "Sunmi", desc: "Built-in" },
                                { name: "iMin", desc: "Built-in" },
                                { name: "Goojprt", desc: "PT/MTP" },
                                { name: "Panda", desc: "PRJ series" },
                                { name: "MiniPOS", desc: "MP series" },
                                { name: "Zjiang", desc: "ZJ series" },
                            ].map((brand) => (
                                <div key={brand.name} className="bg-white/[0.03] rounded-lg p-3 border border-white/5 text-center">
                                    <p className="text-xs font-semibold text-white/70">{brand.name}</p>
                                    <p className="text-[10px] text-white/25">{brand.desc}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-white/15 mt-3 text-center">Mendukung semua printer thermal Bluetooth dengan protokol ESC/POS</p>
                    </div>
                </div>

                {/* ── Right Column: Settings ── */}
                <div className="space-y-6">
                    {/* Settings Card */}
                    <div className="glass p-5 rounded-xl border border-white/10 animate-slide-in-up stagger-1">
                        <div className="flex items-center gap-2 mb-5">
                            <Settings className="w-5 h-5 text-blue-400" />
                            <h2 className="text-sm font-semibold text-white">Pengaturan</h2>
                        </div>
                        <div className="space-y-5">
                            {/* Paper Size */}
                            <div>
                                <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">Ukuran Kertas</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(["58mm", "80mm"] as const).map(size => (
                                        <button key={size} onClick={() => updateSetting("paperSize", size)}
                                            className={`p-3 rounded-xl border-2 transition-all ${settings.paperSize === size
                                                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                                                : 'border-white/10 hover:border-white/20'
                                                }`}>
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`rounded-md border-2 flex items-center justify-center ${settings.paperSize === size ? 'border-blue-400' : 'border-white/20'}`}
                                                    style={{ width: size === "58mm" ? 24 : 32, height: 36 }}>
                                                    <div className="space-y-0.5">
                                                        {[0, 1, 2].map(i => (
                                                            <div key={i} className={`rounded-full ${settings.paperSize === size ? 'bg-blue-400' : 'bg-white/15'}`}
                                                                style={{ width: size === "58mm" ? 12 : 18, height: 1.5 }} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className={`text-center mt-2 text-sm font-bold ${settings.paperSize === size ? 'text-blue-400' : 'text-white/40'}`}>{size}</p>
                                            <p className="text-center text-[10px] text-white/25">{size === "58mm" ? "32 karakter" : "48 karakter"}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Auto Print */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${settings.autoPrint ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                                        <Zap className={`w-4 h-4 ${settings.autoPrint ? 'text-blue-400' : 'text-white/20'}`} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${settings.autoPrint ? 'text-white' : 'text-white/50'}`}>Auto Print</p>
                                        <p className="text-[10px] text-white/25">Cetak struk otomatis setelah checkout</p>
                                    </div>
                                </div>
                                <button onClick={() => updateSetting("autoPrint", !settings.autoPrint)}
                                    className={`relative w-12 h-7 rounded-full transition-all ${settings.autoPrint ? 'bg-blue-500' : 'bg-white/10'}`}>
                                    <div className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all"
                                        style={{ left: settings.autoPrint ? 22 : 2 }} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="glass p-5 rounded-xl border border-white/10 animate-slide-in-up stagger-3">
                        <div className="flex items-center gap-2 mb-4">
                            <Radio className="w-5 h-5 text-cyan-400" />
                            <h2 className="text-sm font-semibold text-white">Cara Pakai</h2>
                        </div>
                        <div className="space-y-3">
                            {[
                                { step: "1", title: "Nyalakan printer", desc: "Pastikan Bluetooth printer menyala" },
                                { step: "2", title: "Klik Cari Printer", desc: "Pilih printer dari daftar perangkat" },
                                { step: "3", title: "Test Print", desc: "Klik test print untuk memastikan" },
                                { step: "4", title: "Aktifkan Auto Print", desc: "Struk tercetak otomatis setelah checkout" },
                            ].map(item => (
                                <div key={item.step} className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-bold text-blue-400">{item.step}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-white">{item.title}</p>
                                        <p className="text-[10px] text-white/30">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Receipt Preview */}
                    <div className="glass p-5 rounded-xl border border-white/10 animate-slide-in-up stagger-5">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-blue-400" />
                            <h2 className="text-sm font-semibold text-white">Contoh Struk</h2>
                        </div>
                        <div className="bg-white rounded-xl p-4 font-mono text-[10px] text-black leading-relaxed shadow-xl shadow-black/20">
                            <div className="text-center font-bold text-xs">TOKO SAYA</div>
                            <div className="text-center text-[9px] text-gray-500">Jl. Contoh No. 123</div>
                            <div className="border-t-2 border-black my-2" />
                            <div className="flex justify-between"><span>No:</span><span>TXN-001</span></div>
                            <div className="flex justify-between"><span>Tgl:</span><span>19/02/26 17:00</span></div>
                            <div className="border-t border-dashed border-gray-400 my-2" />
                            <div>Nasi Goreng</div>
                            <div className="flex justify-between text-gray-600"><span>&nbsp;&nbsp;2 x Rp 15.000</span><span>Rp 30.000</span></div>
                            <div>Es Teh Manis</div>
                            <div className="flex justify-between text-gray-600"><span>&nbsp;&nbsp;3 x Rp 5.000</span><span>Rp 15.000</span></div>
                            <div className="border-t border-dashed border-gray-400 my-2" />
                            <div className="flex justify-between"><span>Subtotal</span><span>Rp 45.000</span></div>
                            <div className="border-t-2 border-black my-2" />
                            <div className="flex justify-between font-bold text-xs"><span>TOTAL</span><span>Rp 45.000</span></div>
                            <div className="border-t-2 border-black my-2" />
                            <div className="flex justify-between"><span>Tunai</span><span>Rp 50.000</span></div>
                            <div className="flex justify-between font-bold"><span>Kembali</span><span>Rp 5.000</span></div>
                            <div className="border-t border-dashed border-gray-400 my-2" />
                            <div className="text-center text-[9px]">Terima Kasih! 🙏</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
