// ============================================================
// Bluetooth Printer Service — Web Bluetooth API wrapper
// Supports SPP (Serial Port Profile) thermal receipt printers
// Compatible: Epson, BIXOLON, Star, Xprinter, Sunmi, etc.
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

// Web Bluetooth API type declarations
interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    addEventListener(type: string, listener: () => void): void;
}
interface BluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
    disconnect(): void;
}
interface BluetoothRemoteGATTService {
    getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}
interface BluetoothRemoteGATTCharacteristic {
    properties: { write: boolean; writeWithoutResponse: boolean };
    writeValueWithResponse(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
}
interface BluetoothRequestDeviceOptions {
    filters?: Array<{ services?: string[] }>;
    optionalServices?: string[];
    acceptAllDevices?: boolean;
}
interface NavigatorBluetooth {
    requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>;
}
declare global {
    interface Navigator {
        bluetooth: NavigatorBluetooth;
    }
}

const BT_SERVICE_UUID = "000018f0-0000-1000-8000-00805f9b34fb";
const BT_CHAR_UUID = "00002af1-0000-1000-8000-00805f9b34fb";

// Fallback UUIDs for different printer brands
const KNOWN_SERVICE_UUIDS = [
    BT_SERVICE_UUID,
    "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Generic SPP
    "49535343-fe7d-4ae5-8fa9-9fafd205e455", // Xprinter/generic
];

export interface SavedPrinter {
    id: string;
    name: string;
    lastConnected?: string;
    paperSize: "58mm" | "80mm";
}

export interface PrinterStatus {
    connected: boolean;
    deviceName: string | null;
    deviceId: string | null;
    batteryLevel?: number;
}

type StatusListener = (status: PrinterStatus) => void;

const STORAGE_KEY = "dewata_bt_printers";
const SETTINGS_KEY = "dewata_printer_settings";

export interface PrinterSettings {
    autoPrint: boolean;
    paperSize: "58mm" | "80mm";
    receiptType: "Kasir" | "Dapur";
    defaultPrinterId?: string;
}

const DEFAULT_SETTINGS: PrinterSettings = {
    autoPrint: false,
    paperSize: "58mm",
    receiptType: "Kasir",
};

class BluetoothPrinterService {
    private device: BluetoothDevice | null = null;
    private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
    private listeners: StatusListener[] = [];
    private reconnecting = false;

    // ── Status ──
    getStatus(): PrinterStatus {
        return {
            connected: !!this.characteristic,
            deviceName: this.device?.name || null,
            deviceId: this.device?.id || null,
        };
    }

    onStatusChange(listener: StatusListener): () => void {
        this.listeners.push(listener);
        return () => { this.listeners = this.listeners.filter(l => l !== listener); };
    }

    private emitStatus() {
        const status = this.getStatus();
        this.listeners.forEach(l => l(status));
    }

    // ── Settings ──
    getSettings(): PrinterSettings {
        if (typeof window === "undefined") return DEFAULT_SETTINGS;
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
        } catch { return DEFAULT_SETTINGS; }
    }

    saveSettings(settings: Partial<PrinterSettings>) {
        const current = this.getSettings();
        const merged = { ...current, ...settings };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    }

    // ── Saved Devices ──
    getSavedDevices(): SavedPrinter[] {
        if (typeof window === "undefined") return [];
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }

    private saveDevice(device: BluetoothDevice, paperSize: "58mm" | "80mm" = "58mm") {
        const devices = this.getSavedDevices();
        const existing = devices.findIndex(d => d.id === device.id);
        const entry: SavedPrinter = {
            id: device.id,
            name: device.name || "Unknown Printer",
            lastConnected: new Date().toISOString(),
            paperSize,
        };
        if (existing >= 0) devices[existing] = entry;
        else devices.push(entry);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
    }

    removeDevice(id: string) {
        const devices = this.getSavedDevices().filter(d => d.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
        if (this.device?.id === id) this.disconnect();
    }

    // ── Check Bluetooth Support ──
    isSupported(): boolean {
        return typeof navigator !== "undefined" && "bluetooth" in navigator;
    }

    // ── Scan & Pair ──
    async requestDevice(): Promise<BluetoothDevice | null> {
        if (!this.isSupported()) {
            throw new Error("Web Bluetooth API tidak didukung di browser ini. Gunakan Chrome/Edge.");
        }
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: KNOWN_SERVICE_UUIDS.map(uuid => ({ services: [uuid] })),
                optionalServices: KNOWN_SERVICE_UUIDS,
            });
            return device;
        } catch (err) {
            if ((err as Error).message?.includes("cancelled")) return null;
            // Fallback: accept all devices
            try {
                const device = await navigator.bluetooth.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: KNOWN_SERVICE_UUIDS,
                });
                return device;
            } catch {
                throw new Error("Gagal memindai perangkat Bluetooth");
            }
        }
    }

    // ── Connect ──
    async connect(device?: BluetoothDevice): Promise<boolean> {
        try {
            const target = device || this.device;
            if (!target) throw new Error("No device to connect to");

            this.device = target;

            // Listen for disconnect
            target.addEventListener("gattserverdisconnected", () => {
                this.characteristic = null;
                this.emitStatus();
                if (!this.reconnecting) this.autoReconnect();
            });

            const server = await target.gatt!.connect();

            // Try known service UUIDs
            let char: BluetoothRemoteGATTCharacteristic | null = null;
            for (const uuid of KNOWN_SERVICE_UUIDS) {
                try {
                    const service = await server.getPrimaryService(uuid);
                    const chars = await service.getCharacteristics();
                    // Find writable characteristic
                    char = chars.find(c =>
                        c.properties.write || c.properties.writeWithoutResponse
                    ) || null;
                    if (char) break;
                } catch { /* try next UUID */ }
            }

            if (!char) throw new Error("Tidak ditemukan karakteristik printer yang kompatibel");

            this.characteristic = char;
            this.saveDevice(target, this.getSettings().paperSize);
            this.emitStatus();
            return true;
        } catch (err) {
            this.characteristic = null;
            this.emitStatus();
            throw err;
        }
    }

    // ── Auto Reconnect ──
    private async autoReconnect() {
        if (!this.device || this.reconnecting) return;
        this.reconnecting = true;
        for (let i = 0; i < 3; i++) {
            try {
                await new Promise(r => setTimeout(r, 2000));
                await this.connect(this.device);
                this.reconnecting = false;
                return;
            } catch { /* retry */ }
        }
        this.reconnecting = false;
    }

    // ── Disconnect ──
    disconnect() {
        if (this.device?.gatt?.connected) {
            this.device.gatt.disconnect();
        }
        this.characteristic = null;
        this.device = null;
        this.emitStatus();
    }

    // ── Print ──
    async print(data: Uint8Array): Promise<void> {
        if (!this.characteristic) {
            throw new Error("Printer tidak terhubung");
        }

        // Send in chunks (BLE has ~512 byte MTU, safe at 100)
        const CHUNK_SIZE = 100;
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
            const chunk = data.slice(i, i + CHUNK_SIZE);
            if (this.characteristic.properties.writeWithoutResponse) {
                await this.characteristic.writeValueWithoutResponse(chunk);
            } else {
                await this.characteristic.writeValueWithResponse(chunk);
            }
            // Small delay between chunks to prevent buffer overflow
            await new Promise(r => setTimeout(r, 20));
        }
    }

    // ── Test Print ──
    async testPrint(): Promise<void> {
        const encoder = new TextEncoder();
        const ESC = 0x1B;
        const GS = 0x1D;
        const W = this.getSettings().paperSize === "58mm" ? 32 : 48;

        const buf: number[] = [];
        buf.push(ESC, 0x40); // Init
        buf.push(ESC, 0x61, 0x01); // Center
        buf.push(ESC, 0x45, 0x01); // Bold on
        buf.push(GS, 0x21, 0x11); // Double size
        buf.push(...encoder.encode("TEST PRINT"));
        buf.push(0x0A);
        buf.push(GS, 0x21, 0x00); // Normal size
        buf.push(ESC, 0x45, 0x00); // Bold off
        buf.push(...encoder.encode("=".repeat(W)));
        buf.push(0x0A);
        buf.push(ESC, 0x61, 0x01); // Center
        buf.push(...encoder.encode("CODAPOS POS System"));
        buf.push(0x0A);
        buf.push(...encoder.encode(`Paper: ${this.getSettings().paperSize}`));
        buf.push(0x0A);
        buf.push(...encoder.encode(new Date().toLocaleString("id-ID")));
        buf.push(0x0A);
        buf.push(...encoder.encode("=".repeat(W)));
        buf.push(0x0A);
        buf.push(...encoder.encode("Printer terhubung! ✓"));
        buf.push(0x0A);
        buf.push(ESC, 0x64, 0x04); // Feed
        buf.push(GS, 0x56, 0x00); // Cut

        await this.print(new Uint8Array(buf));
    }
}

// Singleton instance
export const printerService = new BluetoothPrinterService();
