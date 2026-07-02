// ============================================
// POP AGRO POSS - TO'LIQ ISHLAYDI (TUZATILGAN)
// ============================================

console.log("🚀 Pop Agro POSS yuklandi!");

var products = [];
var cart = [];
var shift = { isOpen: false, sales: [], startTime: null, cashierName: "" };
var selectedPaymentMethod = "mixed";
var debts = [];

var unitSymbols = {
    "kg": "kg",
    "dona": "dona",
    "gram": "g",
    "litr": "L",
    "metr": "m"
};

// ============================================
// MAHSULOTLAR
// ============================================

function loadProducts() {
    var stored = localStorage.getItem("products");
    if (stored) {
        try { products = JSON.parse(stored); } catch(e) { products = []; }
    } else {
        products = [];
        localStorage.setItem("products", JSON.stringify(products));
    }
    return products;
}

// ============================================
// XODIMLAR
// ============================================

function getEmployees() {
    try {
        var data = localStorage.getItem("employees");
        if (data) return JSON.parse(data);
    } catch(e) {}
    return [];
}

function getCashiers() {
    var all = getEmployees();
    return all.filter(function(e) {
        return e.role === "cashier" || e.role === "admin";
    });
}

function getEmployeeByName(name) {
    var employees = getEmployees();
    for (var i = 0; i < employees.length; i++) {
        if (employees[i].name === name) return employees[i];
    }
    return null;
}

// ============================================
// SMENA OCHISH
// ============================================

function openShift() {
    if (shift.isOpen) {
        alert("⚠️ Smena allaqachon ochiq!");
        return;
    }
    
    var cashiers = getCashiers();
    
    if (cashiers.length === 0) {
        var name = prompt("👤 Kassir ismini kiriting:", "Admin");
        if (name && name.trim() !== "") {
            var code = prompt("🔐 " + name + " uchun kodni kiriting:", "1234");
            if (code && code.trim() !== "") {
                openShiftNow(name.trim());
            }
        }
        return;
    }
    
    var overlay = document.createElement("div");
    overlay.id = "cashierModal";
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;";
    
    var modal = document.createElement("div");
    modal.style.cssText = "background:#fff;border-radius:16px;padding:24px;max-width:400px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);";
    
    var html = "";
    html += "<h3 style=\"margin:0 0 16px 0;font-size:18px;color:#1f2937;text-align:center;\">👤 Kassirni tanlang</h3>";
    html += "<div style=\"display:flex;flex-direction:column;gap:8px;margin-bottom:16px;\">";
    
    for (var i = 0; i < cashiers.length; i++) {
        var c = cashiers[i];
        var num = i + 1;
        var roleText = c.role === "admin" ? "Admin" : "Kassir";
        
        html += "<div onclick=\"selectCashier('" + c.name + "')\" style=\"";
        html += "padding:12px 16px;background:#f8fafc;border:2px solid #e5e7eb;border-radius:10px;cursor:pointer;";
        html += "transition:all 0.2s ease;display:flex;justify-content:space-between;align-items:center;";
        html += "\" onmouseover=\"this.style.borderColor='#059669';this.style.background='#f0fdf4';\" onmouseout=\"this.style.borderColor='#e5e7eb';this.style.background='#f8fafc';\">";
        html += "<div><span style=\"font-weight:600;\">" + num + ". " + c.name + "</span> <span style=\"font-size:12px;color:#6b7280;\">(" + roleText + ")</span></div>";
        html += "<div style=\"color:#059669;\"><i class=\"fas fa-chevron-right\"></i></div>";
        html += "</div>";
    }
    
    html += "</div>";
    html += "<button onclick=\"closeCashierModal()\" style=\"padding:10px;width:100%;background:#f1f5f9;color:#6b7280;border:none;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;\">Bekor qilish</button>";
    
    modal.innerHTML = html;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

function selectCashier(name) {
    closeCashierModal();
    var employee = getEmployeeByName(name);
    var correctCode = employee ? (employee.code || "1234") : "1234";
    var enteredCode = prompt("🔐 '" + name + "' uchun kodingizni kiriting:", "");
    if (enteredCode === null) return;
    if (enteredCode !== correctCode) {
        alert("❌ Noto'g'ri kod!");
        setTimeout(function() { openShift(); }, 300);
        return;
    }
    openShiftNow(name);
}

function closeCashierModal() {
    var el = document.getElementById("cashierModal");
    if (el) el.remove();
}

function openShiftNow(name) {
    shift.isOpen = true;
    shift.startTime = new Date().toISOString();
    shift.sales = [];
    shift.cashierName = name;
    localStorage.setItem("shift", JSON.stringify(shift));
    localStorage.setItem("cashierName", name);
    updateShiftUI();
    renderProducts();
    alert("✅ Smena ochildi!\n👤 " + name);
}

// ============================================
// SMENA YOPISH
// ============================================

function closeShift() {
    if (!shift.isOpen) {
        alert("⚠️ Smena allaqachon yopiq!");
        return;
    }
    
    var today = new Date().toDateString();
    var todaySales = [];
    var totalSales = 0;
    var totalCash = 0;
    var totalTerminal = 0;
    var totalCredit = 0;
    var totalReturns = 0;
    
    for (var i = 0; i < shift.sales.length; i++) {
        var sale = shift.sales[i];
        var saleDate = new Date(sale.date).toDateString();
        
        if (saleDate === today) {
            todaySales.push(sale);
            if (sale.isReturn) {
                totalReturns += Math.abs(sale.amount);
                totalSales -= Math.abs(sale.amount);
            } else {
                totalSales += sale.amount;
                var method = sale.method || "";
                if (method === "Naqd" || method === "cash") {
                    totalCash += sale.amount;
                } else if (method === "Terminal" || method === "terminal") {
                    totalTerminal += sale.amount;
                } else if (method === "Nasiya" || method === "credit") {
                    totalCredit += sale.amount;
                } else if (method === "Aralash" || method === "mixed") {
                    totalCash += sale.cashAmount || 0;
                    totalTerminal += sale.terminalAmount || 0;
                    totalCredit += sale.creditAmount || 0;
                }
            }
        }
    }
    
    var cashierName = shift.cashierName || localStorage.getItem("cashierName") || "Admin";
    
    var msg = "📊 SMENANI YOPISH\n\n";
    msg += "👤 Kassir: " + cashierName + "\n";
    msg += "💰 Jami savdo: " + totalSales.toLocaleString() + " so'm\n";
    msg += "💵 Naqd: " + totalCash.toLocaleString() + " so'm\n";
    msg += "💳 Terminal: " + totalTerminal.toLocaleString() + " so'm\n";
    msg += "📝 Nasiya: " + totalCredit.toLocaleString() + " so'm\n";
    msg += "🔄 Qaytarish: " + totalReturns.toLocaleString() + " so'm\n";
    msg += "📦 " + todaySales.length + " ta operatsiya\n\n";
    msg += "Smenani yopishni tasdiqlaysizmi?";
    
    if (!confirm(msg)) {
        return;
    }
    
    // Sales history ga saqlash
    var salesHistory = JSON.parse(localStorage.getItem("salesHistory")) || [];
    for (var i = 0; i < todaySales.length; i++) {
        var sale = todaySales[i];
        if (!sale.isReturn) {
            var exists = false;
            for (var j = 0; j < salesHistory.length; j++) {
                if (salesHistory[j].id === sale.id) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                salesHistory.push(sale);
            }
        }
    }
    localStorage.setItem("salesHistory", JSON.stringify(salesHistory));
    
    shift.isOpen = false;
    shift.endTime = new Date().toISOString();
    localStorage.setItem("shift", JSON.stringify(shift));
    
    localStorage.setItem("dashboardUpdate", Date.now().toString());
    
    exportToExcel(shift, cashierName, totalSales, totalCash, totalTerminal, totalCredit, totalReturns, todaySales);
    
    updateShiftUI();
    alert("✅ Smena yopildi!\n👤 Kassir: " + cashierName + "\n💰 Jami savdo: " + totalSales.toLocaleString() + " so'm\n📊 Hisobot Excelga yuklandi!");
    
    setTimeout(function() {
        localStorage.setItem("dashboardUpdate", Date.now().toString());
    }, 500);
}

function updateShiftUI() {
    var statusEl = document.getElementById("shiftStatus");
    var infoEl = document.getElementById("shiftInfo");
    var openBtn = document.getElementById("openShiftBtn");
    var closeBtn = document.getElementById("closeShiftBtn");
    if (!statusEl) return;
    var cashierName = shift.cashierName || localStorage.getItem("cashierName") || "Admin";
    if (shift.isOpen) {
        statusEl.textContent = "🟢 Smena ochiq";
        statusEl.style.color = "#059669";
        if (infoEl) {
            var start = new Date(shift.startTime);
            infoEl.textContent = "👤 " + cashierName + " | ⏰ " + start.toLocaleTimeString("uz-UZ") + " dan";
        }
        if (openBtn) openBtn.style.display = "none";
        if (closeBtn) closeBtn.style.display = "flex";
    } else {
        statusEl.textContent = "🔴 Smena yopiq";
        statusEl.style.color = "#dc2626";
        if (infoEl) infoEl.textContent = "👤 " + cashierName;
        if (openBtn) openBtn.style.display = "flex";
        if (closeBtn) closeBtn.style.display = "none";
    }
}

// ============================================
// MAHSULOTLAR
// ============================================

function renderProducts(filter) {
    filter = filter || "";
    var grid = document.getElementById("productGrid");
    if (!grid) return;
    loadProducts();
    var filtered = products.filter(function(p) {
        return p.name.toLowerCase().includes(filter.toLowerCase());
    });
    var countEl = document.getElementById("productCount");
    if (countEl) countEl.textContent = filtered.length + " ta";
    if (filtered.length === 0) {
        grid.innerHTML = '<div style="text-align:center;color:#6b7280;padding:40px 20px;">' +
            '<i class="fas fa-box-open" style="font-size:40px;display:block;margin-bottom:10px;color:#d1d5db;"></i>' +
            '<p style="margin:0;font-weight:600;">Mahsulot mavjud emas</p>' +
            '<p style="margin:4px 0 0 0;font-size:13px;">Mahsulotlar sahifasidan qo\'shing</p>' +
            '</div>';
        return;
    }
    var html = "";
    for (var i = 0; i < filtered.length; i++) {
        var p = filtered[i];
        var stockColor = p.stock < 10 ? "#dc2626" : "#059669";
        var unit = p.unit || "kg";
        var stockDisplay = p.stock % 1 === 0 ? p.stock : p.stock.toFixed(3);
        var imageHtml = (p.image && p.image !== "") ? "<img src=\"" + p.image + "\" style=\"width:100%;height:100%;object-fit:cover;border-radius:10px;\" />" : (p.emoji || "📦");
        html += "<div class=\"product-card\">";
        html += "<div class=\"product-image\">" + imageHtml + "</div>";
        html += "<div class=\"name\">" + p.name + "</div>";
        html += "<div class=\"price\">" + p.price.toLocaleString() + " so'm</div>";
        html += "<div class=\"stock\" style=\"color:" + stockColor + ";\">" + stockDisplay + " " + unit + "</div>";
        html += "<div class=\"quantity-control\">";
        html += "<input type=\"number\" id=\"qtyInput_" + p.id + "\" value=\"1\" min=\"0.001\" step=\"0.001\" max=\"" + p.stock + "\" />";
        html += "<button onclick=\"addToCart(" + p.id + ")\" class=\"qty-add-btn\"><i class=\"fas fa-plus\"></i> Qo'shish</button>";
        html += "</div></div>";
    }
    grid.innerHTML = html;
}

function addToCart(id) {
    if (!shift.isOpen) {
        alert("❌ Iltimos, avval smenani oching!");
        return;
    }
    loadProducts();
    var input = document.getElementById("qtyInput_" + id);
    if (!input) return;
    var quantity = parseFloat(input.value);
    if (!quantity || quantity <= 0) {
        alert("❌ To'g'ri miqdorni kiriting!");
        return;
    }
    var product = null;
    for (var i = 0; i < products.length; i++) {
        if (products[i].id === id) {
            product = products[i];
            break;
        }
    }
    if (!product) {
        alert("❌ Mahsulot topilmadi!");
        return;
    }
    if (quantity > product.stock) {
        alert("❌ Omborida " + product.stock + " " + (product.unit || "kg") + " mahsulot bor!");
        return;
    }
    var existing = null;
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === id) {
            existing = cart[i];
            break;
        }
    }
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            unit: product.unit || "kg",
            emoji: product.emoji || "📦",
            image: product.image || "",
            quantity: quantity
        });
    }
    product.stock = Math.round((product.stock - quantity) * 1000) / 1000;
    localStorage.setItem("products", JSON.stringify(products));
    input.value = "1";
    renderCart();
}

// ============================================
// SAVAT
// ============================================

function renderCart() {
    var container = document.getElementById("cartItems");
    var countEl = document.getElementById("cartCount");
    var subtotalEl = document.getElementById("subtotal");
    var totalEl = document.getElementById("totalPrice");
    if (!container) return;
    if (cart.length === 0) {
        container.innerHTML = "<div class=\"empty-cart\"><i class=\"fas fa-shopping-cart\"></i><p>Savat bo'sh</p></div>";
        if (countEl) countEl.textContent = "0";
        if (subtotalEl) subtotalEl.textContent = "0 so'm";
        if (totalEl) totalEl.innerHTML = "<strong>0 so'm</strong>";
        calculateMixedTotal();
        return;
    }
    var html = "";
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
        var item = cart[i];
        var itemTotal = item.price * item.quantity;
        total += itemTotal;
        var unit = item.unit || "kg";
        var qtyDisplay = item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(3);
        var imgHtml = (item.image && item.image !== "") ? "<img src=\"" + item.image + "\" style=\"width:24px;height:24px;object-fit:cover;border-radius:4px;\" />" : (item.emoji || "📦");
        html += "<div class=\"cart-item\">";
        html += "<div class=\"cart-item-info\">";
        html += "<span class=\"cart-item-name\">" + imgHtml + " " + item.name + "</span>";
        html += "<span class=\"cart-item-qty\">" + qtyDisplay + " " + unit + " × " + item.price.toLocaleString() + "</span>";
        html += "</div>";
        html += "<div class=\"cart-item-actions\">";
        html += "<span class=\"cart-item-total\">" + itemTotal.toLocaleString() + " so'm</span>";
        html += "<button class=\"cart-item-remove\" onclick=\"removeFromCart(" + i + ")\"><i class=\"fas fa-times\"></i></button>";
        html += "</div>";
        html += "</div>";
    }
    container.innerHTML = html;
    if (countEl) countEl.textContent = cart.length;
    if (subtotalEl) subtotalEl.textContent = total.toLocaleString() + " so'm";
    if (totalEl) totalEl.innerHTML = "<strong>" + total.toLocaleString() + " so'm</strong>";
    calculateMixedTotal();
}

function removeFromCart(index) {
    var item = cart[index];
    if (item) {
        for (var i = 0; i < products.length; i++) {
            if (products[i].id === item.id) {
                products[i].stock = Math.round((products[i].stock + item.quantity) * 1000) / 1000;
                localStorage.setItem("products", JSON.stringify(products));
                break;
            }
        }
    }
    cart.splice(index, 1);
    renderCart();
}

// ============================================
// clearCart - TUZATILGAN
// ============================================

function clearCart() {
    if (cart.length === 0) {
        alert("❌ Savat bo'sh!");
        return;
    }

    if (!confirm("⚠️ Savatni tozalashni tasdiqlaysizmi?\n\nBarcha mahsulotlar omborga qaytariladi!")) {
        return;
    }

    // Mahsulotlarni omborga qaytarish
    for (var i = 0; i < cart.length; i++) {
        var item = cart[i];

        for (var j = 0; j < products.length; j++) {
            if (products[j].id === item.id) {
                products[j].stock = Math.round((products[j].stock + item.quantity) * 1000) / 1000;
                break;
            }
        }
    }

    // Saqlash
    localStorage.setItem("products", JSON.stringify(products));

    // Savatni tozalash
    cart = [];
    
    // UI yangilash
    renderProducts();
    renderCart();
    
    console.log("✅ Savat tozalandi, mahsulotlar omborga qaytarildi!");
}

function calculateTotal() {
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
        total += cart[i].price * cart[i].quantity;
    }
    return total;
}

// ============================================
// TO'LOV
// ============================================

function selectPayment(method) {
    selectedPaymentMethod = method;
    var cards = document.querySelectorAll(".payment-card");
    for (var i = 0; i < cards.length; i++) {
        cards[i].classList.remove("active");
    }
    var active = document.querySelector(".payment-card[data-method=\"" + method + "\"]");
    if (active) active.classList.add("active");
    var mixed = document.getElementById("mixedForm");
    var credit = document.getElementById("creditForm");
    if (method === "mixed") {
        if (mixed) mixed.style.display = "block";
        if (credit) credit.style.display = "none";
    } else if (method === "credit") {
        if (mixed) mixed.style.display = "none";
        if (credit) credit.style.display = "block";
    } else {
        if (mixed) mixed.style.display = "none";
        if (credit) credit.style.display = "none";
    }
}

function calculateMixedTotal() {
    var total = calculateTotal();
    var cashEl = document.getElementById("mixedCash");
    var terminalEl = document.getElementById("mixedTerminal");
    var creditEl = document.getElementById("mixedCredit");
    var mixedTotalEl = document.getElementById("mixedTotal");
    var statusEl = document.getElementById("mixedStatus");
    if (!cashEl || !terminalEl || !creditEl) return;
    var cash = parseFloat(cashEl.value) || 0;
    var terminal = parseFloat(terminalEl.value) || 0;
    var credit = parseFloat(creditEl.value) || 0;
    var mixedTotal = cash + terminal + credit;
    if (mixedTotalEl) mixedTotalEl.textContent = mixedTotal.toLocaleString();
    if (statusEl) {
        if (mixedTotal >= total && total > 0) {
            statusEl.textContent = "✅ To'lov yetarli";
            statusEl.style.color = "#059669";
        } else if (mixedTotal > 0) {
            statusEl.textContent = "⚠️ Yetarli emas: " + (total - mixedTotal).toLocaleString() + " so'm";
            statusEl.style.color = "#d97706";
        } else {
            statusEl.textContent = "💰 To'lovni kiriting";
            statusEl.style.color = "#6b7280";
        }
    }
}

// ============================================
// CHEK RAQAMI
// ============================================

function getReceiptNumber() {
    var receiptCounter = parseInt(localStorage.getItem("receiptCounter")) || 0;
    receiptCounter++;
    localStorage.setItem("receiptCounter", receiptCounter);
    return receiptCounter;
}

// ============================================
// CHEK CHIQARISH - WINDOWS PRINTER PANELI
// ============================================

function printReceipt(sale) {
    console.log("🧾 Chek chiqarilmoqda...");
    
    if (!sale) {
        alert("❌ Chek ma'lumotlari topilmadi!");
        return;
    }
    
    if (!sale.items || sale.items.length === 0) {
        alert("❌ Chek uchun mahsulotlar topilmadi!");
        return;
    }
    
    var now = new Date(sale.date);
    var receiptNum = sale.receiptNumber || getReceiptNumber();
    var receiptStr = String(receiptNum).padStart(6, "0");
    
    var html = "<div style=\"font-family:'Courier New',monospace;font-size:13px;text-align:center;padding:10px;max-width:380px;margin:0 auto;\">";
    html += "<h2 style=\"color:#059669;margin:0 0 4px 0;\">🏪 Pop Agro POSS</h2>";
    html += "<p style=\"margin:2px 0;font-size:12px;color:#6b7280;\">Manzil: Toshkent sh.</p>";
    html += "<p style=\"margin:2px 0;font-size:12px;color:#6b7280;\">Tel: +998 77 727 2113</p>";
    html += "<hr style=\"border:1px dashed #d1d5db;margin:8px 0;\">";
    html += "<p><strong>🧾 Chek #:</strong> " + receiptStr + "</p>";
    html += "<p><strong>📅 Sana:</strong> " + now.toLocaleDateString("uz-UZ") + "</p>";
    html += "<p><strong>🕐 Vaqt:</strong> " + now.toLocaleTimeString("uz-UZ") + "</p>";
    html += "<p><strong>👤 Kassir:</strong> " + (sale.cashierName || "Admin") + "</p>";
    html += "<p><strong>💳 To'lov:</strong> " + sale.method + "</p>";
    if (sale.customerName) {
        html += "<p><strong>👤 Qarzdor:</strong> " + sale.customerName + "</p>";
    }
    html += "<hr style=\"border:1px dashed #d1d5db;margin:8px 0;\">";
    html += "<table style=\"width:100%;font-size:12px;border-collapse:collapse;text-align:left;\">";
    html += "<thead><tr><th style=\"border-bottom:1px solid #d1d5db;padding:4px 2px;font-size:11px;color:#6b7280;\">#</th><th style=\"border-bottom:1px solid #d1d5db;padding:4px 2px;font-size:11px;color:#6b7280;\">Mahsulot</th><th style=\"border-bottom:1px solid #d1d5db;padding:4px 2px;font-size:11px;color:#6b7280;\">Miqdor</th><th style=\"border-bottom:1px solid #d1d5db;padding:4px 2px;font-size:11px;color:#6b7280;\">Narx</th><th style=\"border-bottom:1px solid #d1d5db;padding:4px 2px;font-size:11px;color:#6b7280;\">Summa</th></tr></thead>";
    html += "<tbody>";
    for (var i = 0; i < sale.items.length; i++) {
        var item = sale.items[i];
        var unit = item.unit || "kg";
        var qtyDisplay = item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(3);
        html += "<tr>";
        html += "<td style=\"padding:4px 2px;border-bottom:1px solid #f1f5f9;\">" + (i + 1) + "</td>";
        html += "<td style=\"padding:4px 2px;border-bottom:1px solid #f1f5f9;\">" + item.name + "</td>";
        html += "<td style=\"padding:4px 2px;border-bottom:1px solid #f1f5f9;\">" + qtyDisplay + " " + unit + "</td>";
        html += "<td style=\"padding:4px 2px;border-bottom:1px solid #f1f5f9;\">" + item.price.toLocaleString() + "</td>";
        html += "<td style=\"padding:4px 2px;border-bottom:1px solid #f1f5f9;text-align:right;\">" + item.total.toLocaleString() + "</td>";
        html += "</tr>";
    }
    html += "</tbody></table>";
    html += "<hr style=\"border:1px dashed #d1d5db;margin:8px 0;\">";
    html += "<div style=\"display:flex;justify-content:space-between;font-size:18px;font-weight:700;padding:4px 0;color:#064e3b;\"><span>JAMI:</span><span>" + sale.amount.toLocaleString() + " so'm</span></div>";
    if (sale.method === "Naqd") {
        html += "<div style=\"display:flex;justify-content:space-between;padding:2px 0;font-size:13px;color:#374151;\"><span>💵 To'langan:</span><span>" + sale.amount.toLocaleString() + " so'm</span></div>";
    } else if (sale.method === "Aralash") {
        if (sale.cashAmount > 0) {
            html += "<div style=\"display:flex;justify-content:space-between;padding:2px 0;font-size:13px;color:#374151;\"><span>💵 Naqd:</span><span>" + (sale.cashAmount || 0).toLocaleString() + " so'm</span></div>";
        }
        if (sale.terminalAmount > 0) {
            html += "<div style=\"display:flex;justify-content:space-between;padding:2px 0;font-size:13px;color:#374151;\"><span>💳 Terminal:</span><span>" + (sale.terminalAmount || 0).toLocaleString() + " so'm</span></div>";
        }
        if (sale.creditAmount > 0) {
            html += "<div style=\"display:flex;justify-content:space-between;padding:2px 0;font-size:13px;color:#374151;\"><span>📝 Nasiya:</span><span>" + (sale.creditAmount || 0).toLocaleString() + " so'm</span></div>";
        }
    } else if (sale.method === "Nasiya") {
        html += "<div style=\"display:flex;justify-content:space-between;padding:2px 0;font-size:13px;color:#374151;\"><span>👤 " + (sale.customerName || "-") + "</span></div>";
        html += "<div style=\"display:flex;justify-content:space-between;padding:2px 0;font-size:13px;color:#374151;\"><span>📅 Muddati: 30 kun</span></div>";
    }
    html += "<hr style=\"border:1px dashed #d1d5db;margin:8px 0;\">";
    html += "<p style=\"font-size:14px;color:#059669;font-weight:600;padding:4px 0;\">✅ Xaridingiz uchun rahmat!</p>";
    html += "<p style=\"font-size:10px;color:#9ca3af;\">Pop Agro POSS v1.0</p>";
    html += "</div>";
    
    localStorage.setItem("lastReceipt", html);
    localStorage.setItem("lastReceiptNumber", receiptNum);
    
    openWindowsPrintDialog(html, receiptStr);
}

function openWindowsPrintDialog(html, receiptStr) {
    console.log("🖨️ Windows printer paneli ochilmoqda...");
    
    var printWindow = window.open("", "_blank", "width=420,height=600,scrollbars=yes,menubar=yes,toolbar=yes");
    
    if (!printWindow) {
        alert("❌ Chop etish oynasini ochib bo'lmadi!\nIltimos, pop-up blokirovkasini o'chiring.");
        return;
    }
    
    var printHtml = "<!DOCTYPE html>";
    printHtml += "<html><head><title>Chek #" + receiptStr + " - Pop Agro POSS</title>";
    printHtml += "<meta charset=\"UTF-8\">";
    printHtml += "<style>";
    printHtml += "        * { margin: 0; padding: 0; box-sizing: border-box; }";
    printHtml += "        body { ";
    printHtml += "            font-family: 'Courier New', monospace; ";
    printHtml += "            padding: 20px; ";
    printHtml += "            max-width: 380px; ";
    printHtml += "            margin: 0 auto; ";
    printHtml += "            background: #ffffff;";
    printHtml += "        }";
    printHtml += "        @media print { body { padding: 10px; } }";
    printHtml += "    </style>";
    printHtml += "</head><body>";
    printHtml += html;
    printHtml += "<div style=\"margin-top:16px;display:flex;gap:10px;justify-content:center;\">";
    printHtml += "<button onclick=\"window.print()\" style=\"padding:10px 20px;background:#059669;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;\">🖨️ Печать</button>";
    printHtml += "<button onclick=\"window.close()\" style=\"padding:10px 20px;background:#f1f5f9;color:#6b7280;border:none;border-radius:8px;font-weight:600;cursor:pointer;\">❌ Отмена</button>";
    printHtml += "</div>";
    printHtml += "</body></html>";
    
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(function() {
        printWindow.print();
        console.log("✅ Windows printer paneli ochildi!");
    }, 500);
}

// ============================================
// TO'LOV - CHEK BILAN
// ============================================

function processPayment() {
    if (!shift.isOpen) {
        alert("❌ Iltimos, avval smenani oching!");
        return;
    }
    
    if (cart.length === 0) {
        alert("❌ Savat bo'sh!");
        return;
    }
    
    var total = calculateTotal();
    if (total <= 0) {
        alert("❌ To'lov summasi 0 dan katta bo'lishi kerak!");
        return;
    }
    
    var method = selectedPaymentMethod || "mixed";
    var cashAmount = 0, terminalAmount = 0, creditAmount = 0;
    var customerName = "", customerPhone = "", customerAddress = "";
    var isCredit = false;
    
    if (method === "mixed") {
        cashAmount = parseFloat(document.getElementById("mixedCash").value) || 0;
        terminalAmount = parseFloat(document.getElementById("mixedTerminal").value) || 0;
        creditAmount = parseFloat(document.getElementById("mixedCredit").value) || 0;
        
        var mixedTotal = cashAmount + terminalAmount + creditAmount;
        if (mixedTotal < total) {
            alert("❌ To'lov summasi yetarli emas!\nJami: " + total.toLocaleString() + " so'm\nTo'lov: " + mixedTotal.toLocaleString() + " so'm");
            return;
        }
        
        if (creditAmount > 0) {
            isCredit = true;
            customerName = prompt("👤 Qarzdor ism familiyasi:", "");
            if (!customerName || customerName.trim() === "") {
                alert("❌ Nasiya uchun ism familiya kiritilmadi!");
                return;
            }
            customerPhone = prompt("📞 Telefon raqami (ixtiyoriy):", "");
            customerAddress = prompt("🏠 Manzil (ixtiyoriy):", "");
        }
        
    } else if (method === "cash") {
        cashAmount = total;
    } else if (method === "terminal") {
        terminalAmount = total;
    } else if (method === "credit") {
        isCredit = true;
        customerName = document.getElementById("creditName").value.trim();
        customerPhone = document.getElementById("creditPhone").value.trim();
        customerAddress = document.getElementById("creditAddress").value.trim();
        
        if (!customerName) {
            alert("❌ Nasiya uchun ism familiya kiriting!");
            return;
        }
        creditAmount = total;
    }
    
    var confirmMsg = "📋 To'lovni tasdiqlaysizmi?\n\n";
    confirmMsg += "👤 Kassir: " + (shift.cashierName || "Admin") + "\n";
    confirmMsg += "💰 Jami: " + total.toLocaleString() + " so'm\n";
    confirmMsg += "💳 Usul: " + getMethodName(method) + "\n";
    
    if (method === "mixed") {
        confirmMsg += "\n💵 Naqd: " + cashAmount.toLocaleString() + " so'm";
        if (terminalAmount > 0) confirmMsg += "\n💳 Terminal: " + terminalAmount.toLocaleString() + " so'm";
        if (creditAmount > 0) confirmMsg += "\n📝 Nasiya: " + creditAmount.toLocaleString() + " so'm";
    }
    
    if (isCredit && customerName) {
        confirmMsg += "\n\n👤 Qarzdor: " + customerName;
        if (customerPhone) confirmMsg += "\n📞 Telefon: " + customerPhone;
        if (customerAddress) confirmMsg += "\n🏠 Manzil: " + customerAddress;
        confirmMsg += "\n📅 Muddati: 30 kun";
    }
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    var receiptNumber = getReceiptNumber();
    
    var sale = {
        id: Date.now(),
        receiptNumber: receiptNumber,
        cashierName: shift.cashierName || "Admin",
        method: getMethodName(method),
        amount: total,
        items: cart.map(function(item) {
            return {
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                unit: item.unit,
                total: item.price * item.quantity,
                image: item.image || "",
                emoji: item.emoji || "📦"
            };
        }),
        date: new Date().toISOString(),
        cashAmount: cashAmount,
        terminalAmount: terminalAmount,
        creditAmount: creditAmount
    };
    
    if (isCredit && customerName) {
        sale.customerName = customerName.trim();
        sale.customerPhone = customerPhone ? customerPhone.trim() : "-";
        sale.customerAddress = customerAddress ? customerAddress.trim() : "-";
        
        var debtAmount = creditAmount > 0 ? creditAmount : total;
        var debts = JSON.parse(localStorage.getItem("debts")) || [];
        debts.push({
            id: Date.now(),
            name: customerName.trim(),
            phone: customerPhone ? customerPhone.trim() : "-",
            address: customerAddress ? customerAddress.trim() : "-",
            amount: debtAmount,
            paid: 0,
            remaining: debtAmount,
            date: new Date().toISOString(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            items: cart.map(function(item) {
                return {
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.price * item.quantity,
                    image: item.image || "",
                    emoji: item.emoji || "📦"
                };
            }),
            cashierName: shift.cashierName || "Admin",
            saleId: sale.id
        });
        localStorage.setItem("debts", JSON.stringify(debts));
        alert("✅ Qarzdor ma'lumotlari saqlandi!\n👤 " + customerName);
    }
    
    shift.sales.push(sale);
    localStorage.setItem("shift", JSON.stringify(shift));
    
    cart = [];
    renderCart();
    updateShiftUI();
    
    if (method === "credit") {
        var creditNameEl = document.getElementById("creditName");
        var creditPhoneEl = document.getElementById("creditPhone");
        var creditAddressEl = document.getElementById("creditAddress");
        if (creditNameEl) creditNameEl.value = "";
        if (creditPhoneEl) creditPhoneEl.value = "";
        if (creditAddressEl) creditAddressEl.value = "";
    }
    
    alert("✅ To'lov amalga oshirildi!\n👤 Kassir: " + (shift.cashierName || "Admin") + "\n💰 Summa: " + total.toLocaleString() + " so'm");
    
    // ===== CHEKNI CHIQARISH =====
    printReceipt(sale);
}

function getMethodName(method) {
    var names = {
        "cash": "Naqd",
        "terminal": "Terminal",
        "credit": "Nasiya",
        "mixed": "Aralash"
    };
    return names[method] || method;
}

// ============================================
// QAYTARISH
// ============================================

function openReturnModal() {
    console.log("🔄 Qaytarish tugmasi bosildi!");
    alert("🔄 Qaytarish funksiyasi");
    
    var modal = document.getElementById("returnModal");
    if (modal) {
        modal.classList.add("active");
    } else {
        alert("⚠️ Qaytarish modali topilmadi!\nIltimos, HTML da returnModal div ni qo'shing.");
    }
}

function closeReturnModal() {
    var modal = document.getElementById("returnModal");
    if (modal) {
        modal.classList.remove("active");
    }
    console.log("🔒 Qaytarish modali yopildi");
}

function confirmReturn() {
    alert("✅ Qaytarish amalga oshirildi!");
    closeReturnModal();
}

function closeReceiptModal() {
    var modal = document.getElementById("receiptModal");
    if (modal) {
        modal.classList.remove("active");
    }
    console.log("🔒 Chek modali yopildi");
}

// ============================================
// EXCELGA YUKLASH (CSV)
// ============================================

function exportToExcel(shiftData, cashierName, totalSales, totalCash, totalTerminal, totalCredit, totalReturns, todaySales) {
    console.log("📊 Excelga yuklash boshlandi...");
    
    try {
        if (!todaySales) {
            todaySales = [];
        }
        
        var rows = [];
        var now = new Date();
        
        rows.push(["═══════════════════════════════════════"]);
        rows.push(["     POP AGRO POSS - SMENA HISOBOTI"]);
        rows.push(["═══════════════════════════════════════"]);
        rows.push([]);
        
        rows.push(["📋 UMUMIY MA'LUMOTLAR"]);
        rows.push(["─────────────────────────────────────"]);
        rows.push(["👤 Kassir:", cashierName || "Admin"]);
        rows.push(["📅 Sana:", now.toLocaleDateString("uz-UZ")]);
        rows.push(["⏰ Boshlanish:", new Date(shiftData.startTime).toLocaleTimeString("uz-UZ")]);
        rows.push(["⏰ Tugash:", new Date(shiftData.endTime).toLocaleTimeString("uz-UZ")]);
        rows.push(["📦 Operatsiyalar:", (todaySales || []).length + " ta"]);
        rows.push([]);
        
        rows.push(["📊 SAVDO STATISTIKASI"]);
        rows.push(["─────────────────────────────────────"]);
        rows.push(["💰 Jami savdo:", totalSales.toLocaleString() + " so'm"]);
        rows.push(["💵 Naqd:", totalCash.toLocaleString() + " so'm"]);
        rows.push(["💳 Terminal:", totalTerminal.toLocaleString() + " so'm"]);
        rows.push(["📝 Nasiya:", totalCredit.toLocaleString() + " so'm"]);
        rows.push(["🔄 Qaytarish:", totalReturns.toLocaleString() + " so'm"]);
        rows.push([]);
        
        var totalPay = totalCash + totalTerminal + totalCredit;
        var cp = totalPay > 0 ? Math.round((totalCash / totalPay) * 100) : 0;
        var tp = totalPay > 0 ? Math.round((totalTerminal / totalPay) * 100) : 0;
        var crp = totalPay > 0 ? Math.round((totalCredit / totalPay) * 100) : 0;
        
        rows.push(["📈 TO'LOV TURLARI"]);
        rows.push(["─────────────────────────────────────"]);
        rows.push(["💵 Naqd:", totalCash.toLocaleString() + " so'm (" + cp + "%)"]);
        rows.push(["💳 Terminal:", totalTerminal.toLocaleString() + " so'm (" + tp + "%)"]);
        rows.push(["📝 Nasiya:", totalCredit.toLocaleString() + " so'm (" + crp + "%)"]);
        rows.push([]);
        
        rows.push(["📦 MAHSULOTLAR RO'YXATI"]);
        rows.push(["─────────────────────────────────────"]);
        rows.push(["#", "Mahsulot", "Miqdor", "Birlik", "Narx", "Summa", "To'lov turi", "Kassir", "Vaqt"]);
        
        var rowNum = 1;
        var productMap = {};
        
        if (todaySales && todaySales.length > 0) {
            for (var i = 0; i < todaySales.length; i++) {
                var sale = todaySales[i];
                var saleCashier = sale.cashierName || cashierName || "Admin";
                if (sale.items && sale.items.length > 0) {
                    for (var j = 0; j < sale.items.length; j++) {
                        var item = sale.items[j];
                        var key = item.name + "_" + item.price + "_" + sale.method;
                        if (!productMap[key]) {
                            productMap[key] = {
                                name: item.name,
                                price: item.price,
                                unit: item.unit || "kg",
                                quantity: 0,
                                total: 0,
                                method: sale.method || "Naqd",
                                cashier: saleCashier,
                                time: new Date(sale.date).toLocaleTimeString("uz-UZ")
                            };
                        }
                        productMap[key].quantity += item.quantity;
                        productMap[key].total += item.total;
                    }
                }
            }
        }
        
        var keys = Object.keys(productMap);
        if (keys.length === 0) {
            rows.push(["", "Mahsulot sotilmagan", "", "", "", "", "", "", ""]);
        } else {
            for (var k = 0; k < keys.length; k++) {
                var p = productMap[keys[k]];
                var qty = p.quantity % 1 === 0 ? p.quantity : p.quantity.toFixed(3);
                rows.push([
                    rowNum,
                    p.name,
                    qty,
                    p.unit,
                    p.price.toLocaleString(),
                    p.total.toLocaleString() + " so'm",
                    p.method,
                    p.cashier,
                    p.time
                ]);
                rowNum++;
            }
        }
        
        rows.push([]);
        rows.push(["─────────────────────────────────────"]);
        rows.push(["JAMI SAVDO:", "", "", "", "", totalSales.toLocaleString() + " so'm", "", "", ""]);
        rows.push([]);
        
        if (totalReturns > 0) {
            rows.push(["🔄 QAYTARISHLAR"]);
            rows.push(["─────────────────────────────────────"]);
            rows.push(["#", "Mahsulot", "Miqdor", "Sabab", "Summa", "Vaqt"]);
            
            var returnNum = 1;
            if (todaySales && todaySales.length > 0) {
                for (var i = 0; i < todaySales.length; i++) {
                    var sale = todaySales[i];
                    if (sale.isReturn && sale.items) {
                        for (var j = 0; j < sale.items.length; j++) {
                            var item = sale.items[j];
                            rows.push([
                                returnNum,
                                item.name,
                                item.quantity,
                                sale.reason || "-",
                                item.total.toLocaleString() + " so'm",
                                new Date(sale.date).toLocaleTimeString("uz-UZ")
                            ]);
                            returnNum++;
                        }
                    }
                }
            }
            rows.push([]);
        }
        
        var debts = JSON.parse(localStorage.getItem("debts")) || [];
        var activeDebts = debts.filter(function(d) { return d.remaining > 0; });
        
        if (activeDebts.length > 0) {
            rows.push(["📝 NASIYADORLAR RO'YXATI"]);
            rows.push(["─────────────────────────────────────"]);
            rows.push(["#", "Ism", "Telefon", "Qarz", "To'langan", "Qolgan", "Sana", "Kassir"]);
            
            for (var i = 0; i < activeDebts.length; i++) {
                var d = activeDebts[i];
                rows.push([
                    i + 1,
                    d.name,
                    d.phone || "-",
                    d.amount.toLocaleString() + " so'm",
                    d.paid.toLocaleString() + " so'm",
                    d.remaining.toLocaleString() + " so'm",
                    new Date(d.date).toLocaleDateString("uz-UZ"),
                    d.cashierName || "-"
                ]);
            }
            rows.push([]);
        }
        
        rows.push(["═══════════════════════════════════════"]);
        rows.push(["     Pop Agro POSS v1.0"]);
        rows.push(["     " + now.toLocaleString("uz-UZ")]);
        rows.push(["═══════════════════════════════════════"]);
        
        var csv = "";
        for (var r = 0; r < rows.length; r++) {
            var row = rows[r];
            var rowStr = "";
            for (var c = 0; c < row.length; c++) {
                var val = row[c] || "";
                if (typeof val === "string" && (val.includes(",") || val.includes('"'))) {
                    val = '"' + val.replace(/"/g, '""') + '"';
                }
                if (c > 0) rowStr += ",";
                rowStr += val;
            }
            csv += rowStr + "\n";
        }
        
        var blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        var link = document.createElement("a");
        var url = URL.createObjectURL(blob);
        var fileName = "Smena_hisoboti_" + now.toISOString().slice(0, 10) + ".csv";
        
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log("✅ Excel fayl yuklandi:", fileName);
        
        var reports = JSON.parse(localStorage.getItem("reports")) || [];
        reports.push({
            id: Date.now(),
            date: new Date().toISOString(),
            dateStr: new Date().toLocaleDateString("uz-UZ"),
            cashierName: cashierName || "Admin",
            startTime: shiftData.startTime,
            endTime: shiftData.endTime,
            totalSales: totalSales,
            cashSales: totalCash,
            terminalSales: totalTerminal,
            creditSales: totalCredit,
            totalReturns: totalReturns,
            totalItems: (todaySales || []).length,
            sales: todaySales || []
        });
        localStorage.setItem("reports", JSON.stringify(reports));
        
        return true;
        
    } catch (error) {
        console.error("❌ Excelga yuklashda xatolik:", error);
        alert("❌ Excelga yuklashda xatolik yuz berdi!");
        return false;
    }
}

// ============================================
// CHEK MATNI - SOZLAMALARDAN OLISH
// ============================================

function getReceiptFooter() {
    return localStorage.getItem("receiptFooter") || "✅ Xaridingiz uchun rahmat!";
}

function getReceiptPrefix() {
    return localStorage.getItem("receiptPrefix") || "CH";
}

function getShopName() {
    return localStorage.getItem("shopName") || "Pop Agro POSS";
}

function getShopAddress() {
    return localStorage.getItem("shopAddress") || "Toshkent sh.";
}

function getShopPhone() {
    return localStorage.getItem("shopPhone") || "+998 77 727 2113";
}

// ============================================
// BOSHLANG'ICH + MENU TOGGLE (DOMContentLoaded ichida)
// ============================================

document.addEventListener("DOMContentLoaded", function() {
    console.log("🚀 Sahifa yuklandi!");
    
    // ===== SANA =====
    var dateEl = document.getElementById("currentDate");
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleString("uz-UZ", {
            day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
        });
    }
    
    // ===== SMENA =====
    var savedShift = localStorage.getItem("shift");
    if (savedShift) {
        try { shift = JSON.parse(savedShift); } catch(e) {}
    }
    
    // ===== MAHSULOTLAR =====
    loadProducts();
    renderProducts();
    updateShiftUI();
    renderCart();
    
    // ===== QIDIRISH =====
    var searchEl = document.getElementById("searchProduct");
    if (searchEl) {
        searchEl.addEventListener("input", function(e) {
            renderProducts(e.target.value);
        });
    }
    
    // ===== ARALASH TO'LOV =====
    var mixedInputs = ["mixedCash", "mixedTerminal", "mixedCredit"];
    for (var i = 0; i < mixedInputs.length; i++) {
        var el = document.getElementById(mixedInputs[i]);
        if (el) {
            el.addEventListener("input", calculateMixedTotal);
        }
    }
    
    // ===== CHEGIRMA =====
    var discountBtn = document.getElementById("discountBtn");
    if (discountBtn) {
        discountBtn.addEventListener("click", function() {
            var total = calculateTotal();
            if (total <= 0) {
                alert("❌ Savat bo'sh!");
                return;
            }
            var discount = prompt("💰 Chegirma miqdorini kiriting (so'm):", "0");
            if (discount === null) return;
            var discountAmount = parseFloat(discount);
            if (isNaN(discountAmount) || discountAmount < 0) {
                alert("❌ Noto'g'ri miqdor!");
                return;
            }
            if (discountAmount > total) {
                alert("❌ Chegirma summasi jami summadan katta bo'lishi mumkin emas!");
                return;
            }
            var discountEl = document.getElementById("discount");
            if (discountEl) {
                discountEl.textContent = discountAmount.toLocaleString() + " so'm";
            }
            var totalEl = document.getElementById("totalPrice");
            if (totalEl) {
                totalEl.innerHTML = "<strong>" + (total - discountAmount).toLocaleString() + " so'm</strong>";
            }
            alert("✅ " + discountAmount.toLocaleString() + " so'm chegirma qo'shildi!");
        });
    }
    
    // ===== TO'LOV =====
    var payBtn = document.getElementById("payBtn");
    if (payBtn) {
        payBtn.addEventListener("click", processPayment);
    }
    
    // ===== SMENANI AVTOMAT SAQLASH =====
    setInterval(function() {
        if (shift.isOpen) {
            localStorage.setItem("shift", JSON.stringify(shift));
        }
    }, 5000);
    
    // ============================================
    // MENU TOGGLE - MOBIL UCHUN (TO'G'RI JOYDA)
    // ============================================
    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.getElementById("sidebar");

    if (menuBtn && sidebar) {
        // Menu tugmasini bosganda sidebar show/hide qilish
        menuBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            sidebar.classList.toggle("show");
            console.log("📱 Menu toggled: ", sidebar.classList.contains("show") ? "ochildi" : "yopildi");
        });

        // Tashqarini bosganda sidebar yopilishi
        document.addEventListener("click", function(e) {
            if (
                sidebar.classList.contains("show") &&
                !sidebar.contains(e.target) &&
                !menuBtn.contains(e.target)
            ) {
                sidebar.classList.remove("show");
                console.log("📱 Sidebar tashqaridan bosildi, yopildi");
            }
        });

        // Ekran kengligi o'zgarganda sidebar holatini tekshirish
        window.addEventListener("resize", function() {
            if (window.innerWidth > 768 && sidebar) {
                sidebar.classList.remove("show");
            }
        });
        
        console.log("✅ Menu toggle qo'shildi!");
    } else {
        console.warn("⚠️ menuBtn yoki sidebar topilmadi!");
    }
    
    console.log("✅ Barcha komponentlar yuklandi!");
});
