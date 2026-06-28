// ============================================
// PRINTER BOSHQARISH
// ============================================

class PrinterManager {
    constructor() {
        this.device = null;
        this.connected = false;
        this.printerName = "XP-80C";
        this.vendorId = 0x0fe6;
    }

    async connect() {
        try {
            if (!navigator.usb) {
                console.warn("WebUSB qo'llab-quvvatlanmaydi");
                this.useWindowsPrint();
                return false;
            }

            const device = await navigator.usb.requestDevice({
                filters: [
                    { vendorId: this.vendorId },
                    { vendorId: 0x0416 },
                    { vendorId: 0x1504 }
                ]
            });

            await device.open();
            await device.selectConfiguration(1);
            await device.claimInterface(0);

            this.device = device;
            this.connected = true;
            this.printerName = device.productName || "XP-80C";

            console.log("✅ Printer ulandi:", this.printerName);
            this.updateStatusUI(true);
            return true;
        } catch (error) {
            console.error("❌ Printer ulashda xatolik:", error);
            this.useWindowsPrint();
            return false;
        }
    }

    useWindowsPrint() {
        this.connected = true;
        this.printerName = "Windows Printer";
        console.log("🖨️ Windows print dialogi ishlatiladi");
        this.updateStatusUI(true);
        alert("✅ Printer tayyor!\n🖨️ Windows print dialogi orqali chop etiladi.");
    }

    async printReceipt(sale) {
        if (!sale) {
            alert("❌ Chek ma'lumotlari topilmadi!");
            return;
        }

        const text = this.generateReceiptText(sale);

        if (this.device && this.connected) {
            await this.printViaUSB(text);
        } else {
            this.printViaWindows(text, sale.receiptNumber);
        }
    }

    async printViaUSB(text) {
        try {
            if (!this.device) {
                throw new Error("Printer ulangan emas");
            }

            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            
            const init = new Uint8Array([0x1B, 0x40]);
            const alignCenter = new Uint8Array([0x1B, 0x61, 0x01]);
            const cut = new Uint8Array([0x1D, 0x56, 0x42, 0x00]);
            
            const fullData = new Uint8Array(init.length + data.length + alignCenter.length + cut.length);
            fullData.set(init, 0);
            fullData.set(data, init.length);
            fullData.set(alignCenter, init.length + data.length);
            fullData.set(cut, init.length + data.length + alignCenter.length);
            
            await this.device.transferOut(1, fullData);
            console.log("✅ Chek printerga yuborildi!");
            alert("✅ Chek printerga yuborildi!");
        } catch (error) {
            console.error("❌ USB chop etishda xatolik:", error);
            this.printViaWindows(text, "---");
        }
    }

    printViaWindows(text, receiptNumber) {
        const receiptStr = String(receiptNumber || "---").padStart(6, "0");
        const printWindow = window.open("", "_blank", "width=420,height=600,scrollbars=yes,menubar=yes,toolbar=yes");
        
        if (!printWindow) {
            alert("❌ Chop etish oynasini ochib bo'lmadi!");
            return;
        }
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Chek #${receiptStr} - Pop Agro POSS</title>
            <meta charset="UTF-8">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Courier New', monospace; 
                    padding: 20px; 
                    max-width: 380px; 
                    margin: 0 auto; 
                    background: #ffffff;
                }
                .receipt-print {
                    white-space: pre-wrap;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    line-height: 1.4;
                    color: #1f2937;
                }
                .receipt-actions {
                    margin-top: 16px;
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                .receipt-actions button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 13px;
                }
                .btn-print {
                    background: #059669;
                    color: #fff;
                }
                .btn-print:hover {
                    background: #047857;
                }
                .btn-close {
                    background: #f1f5f9;
                    color: #6b7280;
                }
                .btn-close:hover {
                    background: #e5e7eb;
                }
                @media print {
                    .receipt-actions { display: none !important; }
                    body { padding: 10px; }
                }
            </style>
        </head>
        <body>
            <div class="receipt-print">${text}</div>
            <div class="receipt-actions">
                <button class="btn-print" onclick="window.print()">🖨️ Chop etish</button>
                <button class="btn-close" onclick="window.close()">❌ Yopish</button>
            </div>
        </body>
        </html>`;
        
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(function() {
            printWindow.print();
            console.log("✅ Windows printer paneli ochildi!");
        }, 500);
    }

    generateReceiptText(sale) {
        const now = new Date(sale.date);
        const receiptNum = sale.receiptNumber || "---";
        const receiptStr = String(receiptNum).padStart(6, "0");
        
        let text = "";
        text += "==============================\n";
        text += "    🏪 Pop Agro POSS\n";
        text += "    Manzil: Toshkent sh.\n";
        text += "    Tel: +998 77 727 2113\n";
        text += "==============================\n";
        text += "🧾 Chek #: " + receiptStr + "\n";
        text += "📅 Sana: " + now.toLocaleDateString("uz-UZ") + "\n";
        text += "🕐 Vaqt: " + now.toLocaleTimeString("uz-UZ") + "\n";
        text += "💳 To'lov: " + sale.method + "\n";
        text += "------------------------------\n";
        text += "#  Mahsulot   Miqdor  Narx   Summa\n";
        text += "------------------------------\n";
        
        for (let i = 0; i < sale.items.length; i++) {
            const item = sale.items[i];
            const unit = unitSymbols[item.unit] || item.unit || "kg";
            const qtyDisplay = item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(3);
            const nameShort = item.name.length > 10 ? item.name.substring(0, 10) : item.name;
            text += (i + 1) + "  " + nameShort.padEnd(10) + " " + qtyDisplay + unit + "  " + item.price.toLocaleString() + "  " + item.total.toLocaleString() + "\n";
        }
        
        text += "------------------------------\n";
        text += "JAMI: " + sale.amount.toLocaleString() + " so'm\n";
        
        if (sale.method === "Naqd") {
            text += "To'langan: " + sale.amount.toLocaleString() + " so'm\n";
        } else if (sale.method === "Aralash") {
            if (sale.cashAmount > 0) {
                text += "💵 Naqd: " + (sale.cashAmount || 0).toLocaleString() + " so'm\n";
            }
            if (sale.terminalAmount > 0) {
                text += "💳 Terminal: " + (sale.terminalAmount || 0).toLocaleString() + " so'm\n";
            }
            if (sale.creditAmount > 0) {
                text += "📝 Nasiya: " + (sale.creditAmount || 0).toLocaleString() + " so'm\n";
            }
        } else if (sale.method === "Nasiya") {
            text += "👤 " + (sale.customerName || "-") + "\n";
            text += "📞 " + (sale.customerPhone || "-") + "\n";
            text += "📅 Muddati: 30 kun\n";
        }
        
        text += "------------------------------\n";
        text += "✅ Xaridingiz uchun rahmat!\n";
        text += "Pop Agro POSS v1.0\n";
        text += "==============================\n";
        text += "\n\n";
        
        return text;
    }

    updateStatusUI(connected) {
        const statusEl = document.getElementById("printerStatus");
        if (statusEl) {
            if (connected) {
                statusEl.innerHTML = '<i class="fas fa-circle" style="color:#059669;font-size:10px;"></i> Printer: ' + this.printerName + ' (ulangan)';
                statusEl.style.background = "#d1fae5";
            } else {
                statusEl.innerHTML = '<i class="fas fa-circle" style="color:#dc2626;font-size:10px;"></i> Printer: ulangan emas';
                statusEl.style.background = "#fee2e2";
            }
        }
    }

    async checkStatus() {
        if (this.device) {
            try {
                await this.device.open();
                this.connected = true;
                this.updateStatusUI(true);
                return true;
            } catch {
                this.connected = false;
                this.updateStatusUI(false);
                return false;
            }
        }
        this.updateStatusUI(false);
        return false;
    }
}

const printer = new PrinterManager();

function connectPrinter() {
    printer.connect();
}

function checkPrinterStatus() {
    printer.checkStatus();
}

function showPrinterSettings() {
    const status = printer.connected ? "✅ Ulangan" : "❌ Ulangan emas";
    let msg = "🖨️ PRINTER SOZLAMALARI\n\n";
    msg += "📌 Holat: " + status + "\n";
    msg += "📌 Printer: " + printer.printerName + "\n";
    msg += "📌 Qog'oz o'lchami: 80mm\n";
    msg += "📌 Kodlash: UTF-8\n\n";
    msg += "🔹 Chek chop etish uchun 'To'lov' tugmasini bosing\n";
    msg += "🔹 Printer avtomatik ravishda chekni chop etadi";
    alert(msg);
}

console.log("🖨️ Printer manager yuklandi!");
