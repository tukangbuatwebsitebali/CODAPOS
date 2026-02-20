// ============================================================
// Receipt Generator — HTML + ESC/POS for thermal printers
// Supports 58mm (32 chars) and 80mm (48 chars) paper widths
// ============================================================

export interface ReceiptTenant {
    name: string;
    logo_url?: string;
    address?: string;
    phone?: string;
    subscription_plan?: string;
}

export interface ReceiptItem {
    product_name: string;
    variant_name?: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    discount_amount?: number;
    modifiers?: { name: string; price: number }[];
    notes?: string;
}

export interface ReceiptPayment {
    payment_method: string;
    amount: number;
    reference_number?: string;
}

export interface ReceiptData {
    transaction_number: string;
    created_at: string;
    cashier_name?: string;
    outlet_name?: string;
    items: ReceiptItem[];
    payments: ReceiptPayment[];
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    notes?: string;
}

type PaperSize = "58mm" | "80mm";

const PAPER_CHARS: Record<PaperSize, number> = { "58mm": 32, "80mm": 48 };
const PAPER_WIDTH: Record<PaperSize, string> = { "58mm": "48mm", "80mm": "72mm" };

// ── Format helpers ──
function formatCurrency(amount: number): string {
    return "Rp " + Math.round(amount).toLocaleString("id-ID");
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function paymentLabel(method: string): string {
    const labels: Record<string, string> = {
        cash: "Tunai", qris: "QRIS", ewallet: "E-Wallet",
        bank_transfer: "Transfer Bank", credit_card: "Kartu Kredit", card: "Kartu",
    };
    return labels[method] || method;
}

// ═══════════════════════════════════════════════
// HTML Receipt (for browser print / @media print)
// ═══════════════════════════════════════════════
export function generateReceiptHTML(data: ReceiptData, tenant: ReceiptTenant, paper: PaperSize = "58mm", receiptType: "Kasir" | "Dapur" = "Kasir"): string {
    const w = PAPER_WIDTH[paper];
    const items = data.items.map(item => {
        const modLines = (item.modifiers || [])
            .map(m => `<div style="padding-left:12px;font-size:10px;color:#666">+ ${m.name} ${receiptType === "Kasir" ? formatCurrency(m.price) : ""}</div>`)
            .join("");
        const discount = item.discount_amount && item.discount_amount > 0 && receiptType === "Kasir"
            ? `<div style="padding-left:12px;font-size:10px;color:#C40000">Diskon -${formatCurrency(item.discount_amount)}</div>` : "";
        return `
            <div style="display:flex;justify-content:space-between;margin:2px 0">
                <div style="flex:1">
                    <div>${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ""}</div>
                    <div style="font-size:10px;color:#666">${item.quantity} ${receiptType === "Kasir" ? `x ${formatCurrency(item.unit_price)}` : ""}</div>
                    ${item.notes ? `<div style="font-size:10px;color:#C40000;font-style:italic">Catatan: ${item.notes}</div>` : ""}
                </div>
                ${receiptType === "Kasir" ? `<div style="text-align:right;white-space:nowrap">${formatCurrency(item.subtotal)}</div>` : ""}
            </div>
            ${modLines}${discount}`;
    }).join("");

    const payments = data.payments.map(p =>
        `<div style="display:flex;justify-content:space-between;margin:1px 0">
            <span>${paymentLabel(p.payment_method)}</span>
            <span>${formatCurrency(p.amount)}</span>
        </div>`
    ).join("");

    const change = data.payments.reduce((s, p) => s + p.amount, 0) - data.total_amount;

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@media print {
    @page { margin: 0; size: ${w} auto; }
    body { margin: 0; }
}
body { font-family: 'Courier New', monospace; font-size: 12px; width: ${w}; margin: 0 auto; padding: 4px; color: #000; }
.divider { border-top: 1px dashed #000; margin: 6px 0; }
.divider-bold { border-top: 2px solid #000; margin: 6px 0; }
.center { text-align: center; }
.bold { font-weight: bold; }
.total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
.row { display: flex; justify-content: space-between; }
</style></head><body>
${tenant.subscription_plan?.includes("pro") && tenant.logo_url && receiptType === "Kasir" ? `<div class="center" style="margin-bottom:8px"><img src="${tenant.logo_url.startsWith('http') ? tenant.logo_url : `https://codapos-production.up.railway.app${tenant.logo_url}`}" style="max-height:40px;max-width:100%"/></div>` : ""}
${receiptType === "Dapur" ? `<div class="center bold" style="font-size:16px;margin-bottom:8px;border:1px solid #000;padding:4px">STRUK DAPUR</div>` : ""}
<div class="center bold" style="font-size:14px">${tenant.name}</div>
${tenant.address ? `<div class="center" style="font-size:10px">${tenant.address}</div>` : ""}
${tenant.phone ? `<div class="center" style="font-size:10px">Tel: ${tenant.phone}</div>` : ""}
<div class="divider-bold"></div>
<div class="row"><span>No:</span><span>${data.transaction_number}</span></div>
<div class="row"><span>Tgl:</span><span>${formatDate(data.created_at)}</span></div>
${data.cashier_name ? `<div class="row"><span>Kasir:</span><span>${data.cashier_name}</span></div>` : ""}
${data.outlet_name ? `<div class="row"><span>Outlet:</span><span>${data.outlet_name}</span></div>` : ""}
<div class="divider"></div>
${items}
${receiptType === "Kasir" ? `
<div class="divider"></div>
<div class="row"><span>Subtotal</span><span>${formatCurrency(data.subtotal)}</span></div>
${data.discount_amount > 0 ? `<div class="row" style="color:#C40000"><span>Diskon</span><span>-${formatCurrency(data.discount_amount)}</span></div>` : ""}
${data.tax_amount > 0 ? `<div class="row"><span>PPN 11%</span><span>${formatCurrency(data.tax_amount)}</span></div>` : ""}
<div class="divider-bold"></div>
<div class="total-row"><span>TOTAL</span><span>${formatCurrency(data.total_amount)}</span></div>
<div class="divider-bold"></div>
${payments}
${change > 0 ? `<div class="row bold"><span>Kembali</span><span>${formatCurrency(change)}</span></div>` : ""}
` : ""}
<div class="divider"></div>
<div class="center" style="font-size:11px;margin-top:8px">Terima Kasih! 🙏</div>
<div class="center" style="font-size:10px;color:#666">Selamat Menikmati 😊</div>
${data.notes ? `<div class="center" style="font-size:9px;color:#888;margin-top:4px">Catatan: ${data.notes}</div>` : ""}
<div class="divider-bold"></div>
<div class="center bold" style="font-size:9px;color:#666;margin:6px 0">POWERED BY CODAPOS.COM</div>
<div style="margin-top:12px"></div>
</body></html>`;
}

// ═══════════════════════════════════════════════
// ESC/POS Binary Commands for Thermal Printers
// ═══════════════════════════════════════════════
export function generateESCPOS(data: ReceiptData, tenant: ReceiptTenant, paper: PaperSize = "58mm", receiptType: "Kasir" | "Dapur" = "Kasir"): Uint8Array {
    const W = PAPER_CHARS[paper];
    const buf: number[] = [];
    const encoder = new TextEncoder();

    // ESC/POS commands
    const ESC = 0x1B;
    const GS = 0x1D;
    const INIT = [ESC, 0x40]; // Initialize
    const CENTER = [ESC, 0x61, 0x01];
    const LEFT = [ESC, 0x61, 0x00];
    const BOLD_ON = [ESC, 0x45, 0x01];
    const BOLD_OFF = [ESC, 0x45, 0x00];
    const DOUBLE_ON = [GS, 0x21, 0x11]; // Double width+height
    const DOUBLE_OFF = [GS, 0x21, 0x00];
    const CUT = [GS, 0x56, 0x00]; // Full cut
    const FEED = [ESC, 0x64, 0x03]; // Feed 3 lines

    function push(...bytes: number[]) { buf.push(...bytes); }
    function text(s: string) { buf.push(...encoder.encode(s)); }
    function newline() { buf.push(0x0A); }
    function line(char: string = "-") { text(char.repeat(W)); newline(); }
    function boldLine(char: string = "=") { push(...BOLD_ON); line(char); push(...BOLD_OFF); }

    function leftRight(left: string, right: string) {
        const space = W - left.length - right.length;
        if (space > 0) {
            text(left + " ".repeat(space) + right);
        } else {
            text(left.substring(0, W - right.length - 1) + " " + right);
        }
        newline();
    }

    // ── Header ──
    push(...INIT);
    push(...CENTER);
    if (receiptType === "Dapur") {
        push(...BOLD_ON);
        push(...DOUBLE_ON);
        text("STRUK DAPUR");
        newline();
        push(...DOUBLE_OFF);
        push(...BOLD_OFF);
        line();
    }
    push(...BOLD_ON);
    push(...DOUBLE_ON);
    text(tenant.name);
    newline();
    push(...DOUBLE_OFF);
    push(...BOLD_OFF);
    if (tenant.address) { text(tenant.address); newline(); }
    if (tenant.phone) { text("Tel: " + tenant.phone); newline(); }
    push(...LEFT);
    boldLine();

    // ── Transaction info ──
    leftRight("No:", data.transaction_number);
    leftRight("Tgl:", formatDate(data.created_at));
    if (data.cashier_name) leftRight("Kasir:", data.cashier_name);
    if (data.outlet_name) leftRight("Outlet:", data.outlet_name);
    line();

    // ── Items ──
    for (const item of data.items) {
        const name = item.product_name + (item.variant_name ? ` (${item.variant_name})` : "");
        text(name);
        newline();
        if (receiptType === "Kasir") {
            leftRight(`  ${item.quantity} x ${formatCurrency(item.unit_price)}`, formatCurrency(item.subtotal));
        } else {
            text(`  ${item.quantity} x`);
            newline();
        }
        for (const mod of item.modifiers || []) {
            text(`  + ${mod.name}`);
            newline();
        }
        if (item.notes) {
            text(`  [!] ${item.notes}`);
            newline();
        }
        if (item.discount_amount && item.discount_amount > 0 && receiptType === "Kasir") {
            leftRight("  Diskon", `-${formatCurrency(item.discount_amount)}`);
        }
    }
    line();

    // ── Totals ──
    if (receiptType === "Kasir") {
        leftRight("Subtotal", formatCurrency(data.subtotal));
        if (data.discount_amount > 0) leftRight("Diskon", `-${formatCurrency(data.discount_amount)}`);
        if (data.tax_amount > 0) leftRight("PPN 11%", formatCurrency(data.tax_amount));
        boldLine();

        push(...BOLD_ON);
        push(...DOUBLE_ON);
        push(...CENTER);
        text(`TOTAL ${formatCurrency(data.total_amount)}`);
        newline();
        push(...DOUBLE_OFF);
        push(...BOLD_OFF);
        push(...LEFT);
        boldLine();

        // ── Payments ──
        for (const p of data.payments) {
            leftRight(paymentLabel(p.payment_method), formatCurrency(p.amount));
        }
        const change = data.payments.reduce((s, p) => s + p.amount, 0) - data.total_amount;
        if (change > 0) {
            push(...BOLD_ON);
            leftRight("Kembali", formatCurrency(change));
            push(...BOLD_OFF);
        }
        line();
    }

    // ── Footer ──
    push(...CENTER);
    text("Terima Kasih!");
    newline();
    text("Selamat Menikmati :)");
    newline();
    if (data.notes) { text(`Catatan: ${data.notes}`); newline(); }
    line();
    text("POWERED BY CODAPOS.COM");
    newline();

    // Feed & cut
    push(...FEED);
    push(...CUT);

    return new Uint8Array(buf);
}

// ═══════════════════════════════════════════════
// Browser Print Helper
// ═══════════════════════════════════════════════
export function printReceiptInBrowser(data: ReceiptData, tenant: ReceiptTenant, paper: PaperSize = "58mm", receiptType: "Kasir" | "Dapur" = "Kasir") {
    const html = generateReceiptHTML(data, tenant, paper, receiptType);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(html);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 3000); // cleanup after 3 seconds
        }, 500); // give time for css/layout to render
    } else {
        document.body.removeChild(iframe);
    }
}
