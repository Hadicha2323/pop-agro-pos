// ============================================
// QAYTARISH (VAZVRAT) - ALOHIDA BO'LIM
// ============================================

console.log("🔄 Qaytarish bo'limi yuklandi!");

var currentCheckId = null;
var selectedReturnItem = null;
var returnItemsList = [];

// ===== CHEKLARNI CHIQARISH =====
function loadChecks() {
    var salesHistory = JSON.parse(localStorage.getItem("salesHistory")) || [];
    var shift = JSON.parse(localStorage.getItem("shift")) || { sales: [] };
    var allSales = [];
    
    // Smenadagi savdolarni qo'shish
    if (shift.isOpen) {
        allSales = shift.sales.concat(salesHistory);
    } else {
        allSales = salesHistory;
    }
    
    // Qaytarishlarni filtrlab olish (isReturn=false bo'lganlar)
    var checks = allSales.filter(function(s) {
        return !s.isReturn && s.items && s.items.length > 0;
    });
    
    // Sanaga qarab tartiblash (eng yangisi birinchi)
    checks.sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });
    
    return checks;
}

function renderChecks(checks) {
    var tbody = document.getElementById("checksTable");
    var countEl = document.getElementById("recordCount");
    
    if (!tbody) return;
    
    if (!checks) {
        checks = loadChecks();
    }
    
    // Statistikalar
    var totalSales = 0;
    var totalReturns = 0;
    var totalChecks = checks.length;
    var returnedItems = 0;
    
    var returnHistory = JSON.parse(localStorage.getItem("returnHistory")) || [];
    for (var i = 0; i < returnHistory.length; i++) {
        totalReturns += returnHistory[i].amount || 0;
        returnedItems += returnHistory[i].quantity || 0;
    }
    
    for (var i = 0; i < checks.length; i++) {
        totalSales += checks[i].amount || 0;
    }
    
    document.getElementById("totalSales").textContent = totalSales.toLocaleString() + " so'm";
    document.getElementById("totalReturns").textContent = totalReturns.toLocaleString() + " so'm";
    document.getElementById("totalChecks").textContent = totalChecks;
    document.getElementById("returnedItems").textContent = returnedItems;
    
    if (countEl) countEl.textContent = checks.length + " ta";
    
    if (checks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-receipt"></i><strong>Cheklar mavjud emas</strong><br><span style="font-size:13px;">Hali hech qanday savdo qilinmagan</span></td></tr>';
        return;
    }
    
    var html = "";
    for (var i = 0; i < checks.length; i++) {
        var check = checks[i];
        var num = i + 1;
        var date = new Date(check.date);
        var dateStr = date.toLocaleDateString("uz-UZ");
        var timeStr = date.toLocaleTimeString("uz-UZ");
        var cashier = check.cashierName || "Admin";
        var receiptNum = check.receiptNumber || "---";
        var receiptStr = String(receiptNum).padStart(6, "0");
        
        // Mahsulotlar nomi
        var itemsText = "";
        if (check.items) {
            var names = [];
            for (var j = 0; j < Math.min(check.items.length, 3); j++) {
                names.push(check.items[j].name);
            }
            itemsText = names.join(", ");
            if (check.items.length > 3) itemsText += " +" + (check.items.length - 3) + " ta";
        }
        
        html += "<tr>";
        html += "<td>" + num + "</td>";
        html += "<td><strong>#" + receiptStr + "</strong></td>";
        html += "<td>" + dateStr + "</td>";
        html += "<td>" + timeStr + "</td>";
        html += "<td>" + cashier + "</td>";
        html += "<td style=\"font-size:12px;\">" + itemsText + "</td>";
        html += "<td style=\"font-weight:700;color:#059669;\">" + (check.amount || 0).toLocaleString() + " so'm</td>";
        html += "<td><span class=\"badge-sale\">✅ Sotuv</span></td>";
        html += "<td><button class=\"btn-return-item\" onclick=\"openReturnModal(" + (check.id || i) + ")\"><i class=\"fas fa-undo\"></i> Qaytarish</button></td>";
        html += "</tr>";
    }
    tbody.innerHTML = html;
}

// ===== QAYTARISH MODALINI OCHISH =====
function openReturnModal(checkId) {
    console.log("🔄 Qaytarish modali ochilmoqda... ID:", checkId);
    
    var checks = loadChecks();
    var check = null;
    for (var i = 0; i < checks.length; i++) {
        if (checks[i].id === checkId || i === checkId) {
            check = checks[i];
            break;
        }
    }
    
    if (!check) {
        alert("❌ Chek topilmadi!");
        return;
    }
    
    currentCheckId = check.id;
    returnItemsList = [];
    selectedReturnItem = null;
    
    // Chek ma'lumotlarini ko'rsatish
    var infoDiv = document.getElementById("returnCheckInfo");
    var receiptNum = check.receiptNumber || "---";
    var receiptStr = String(receiptNum).padStart(6, "0");
    var date = new Date(check.date);
    infoDiv.innerHTML = "<div style=\"display:flex;justify-content:space-between;\">" +
        "<span><strong>🧾 Chek #" + receiptStr + "</strong></span>" +
        "<span>📅 " + date.toLocaleDateString("uz-UZ") + " " + date.toLocaleTimeString("uz-UZ") + "</span>" +
        "<span>👤 " + (check.cashierName || "Admin") + "</span>" +
        "</div>";
    
    // Mahsulotlar ro'yxati
    var itemsList = document.getElementById("returnItemsList");
    var html = "";
    
    for (var i = 0; i < check.items.length; i++) {
        var item = check.items[i];
        var imgHtml = item.image ? "<img src=\"" + item.image + "\" style=\"width:28px;height:28px;object-fit:cover;border-radius:4px;\" />" : (item.emoji || "📦");
        
        html += "<div class=\"return-item-select\" data-id=\"" + i + "\" onclick=\"selectReturnItem(" + i + ")\" style=\"";
        html += "display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:6px;cursor:pointer;transition:all 0.2s;border:2px solid transparent;margin-bottom:2px;background:#fff;";
        html += "\" onmouseover=\"this.style.background='#f8fafc';\" onmouseout=\"this.style.background='#fff';\">";
        html += "<div style=\"width:28px;height:28px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:#f1f5f9;border-radius:4px;font-size:18px;\">" + imgHtml + "</div>";
        html += "<div style=\"flex:1;\"><div style=\"font-weight:600;font-size:13px;\">" + item.name + "</div>";
        html += "<div style=\"font-size:11px;color:#6b7280;\">" + item.quantity + " " + (item.unit || "kg") + " × " + item.price.toLocaleString() + " so'm</div></div>";
        html += "<div style=\"font-weight:700;color:#059669;font-size:13px;\">" + (item.price * item.quantity).toLocaleString() + " so'm</div>";
        html += "</div>";
    }
    
    itemsList.innerHTML = html;
    
    // Detallarni yashirish
    document.getElementById("returnDetails").style.display = "none";
    
    // Modalni ochish
    document.getElementById("returnModal").classList.add("active");
}

// ===== MAHSULOT TANLASH =====
function selectReturnItem(index) {
    var checks = loadChecks();
    var check = null;
    for (var i = 0; i < checks.length; i++) {
        if (checks[i].id === currentCheckId) {
            check = checks[i];
            break;
        }
    }
    
    if (!check || !check.items || index >= check.items.length) return;
    
    selectedReturnItem = check.items[index];
    selectedReturnItem.index = index;
    
    // Highlight
    var allItems = document.querySelectorAll(".return-item-select");
    for (var i = 0; i < allItems.length; i++) {
        allItems[i].classList.remove("selected");
    }
    var target = document.querySelector(".return-item-select[data-id=\"" + index + "\"]");
    if (target) {
        target.classList.add("selected");
    }
    
    // Detallarni ko'rsatish
    var details = document.getElementById("returnDetails");
    details.style.display = "block";
    
    var info = document.getElementById("returnProductInfo");
    var imgHtml = selectedReturnItem.image ? "<img src=\"" + selectedReturnItem.image + "\" style=\"width:40px;height:40px;object-fit:cover;border-radius:6px;\" />" : (selectedReturnItem.emoji || "📦");
    info.innerHTML = "<div style=\"display:flex;align-items:center;gap:10px;\">" +
        "<div style=\"width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:#f1f5f9;border-radius:6px;font-size:24px;\">" + imgHtml + "</div>" +
        "<div><div style=\"font-weight:700;font-size:15px;\">" + selectedReturnItem.name + "</div>" +
        "<div style=\"font-size:12px;color:#6b7280;\">Sotilgan: " + selectedReturnItem.quantity + " " + (selectedReturnItem.unit || "kg") + " | " + selectedReturnItem.price.toLocaleString() + " so'm</div></div>" +
        "</div>";
    
    var qtyInput = document.getElementById("returnQty");
    qtyInput.max = selectedReturnItem.quantity;
    qtyInput.step = selectedReturnItem.quantity % 1 === 0 ? 1 : 0.001;
    qtyInput.value = selectedReturnItem.quantity;
    
    updateReturnSummary();
}

// ===== MIQDOR O'ZGARTIRISH =====
function changeReturnQty(delta) {
    var input = document.getElementById("returnQty");
    if (!input) return;
    var val = parseFloat(input.value) || 0;
    var step = parseFloat(input.step) || 1;
    var max = parseFloat(input.max) || 9999;
    var newVal = val + (delta * step);
    if (newVal >= 0.001 && newVal <= max) {
        input.value = Math.round(newVal * 1000) / 1000;
        updateReturnSummary();
    }
}

function filterReturnItems(query) {
    var items = document.querySelectorAll(".return-item-select");
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var name = item.textContent.toLowerCase();
        if (name.includes(query.toLowerCase())) {
            item.style.display = "flex";
        } else {
            item.style.display = "none";
        }
    }
}

// ===== QAYTARISH SUMASINI HISOBLASH =====
function updateReturnSummary() {
    if (!selectedReturnItem) return;
    
    var qty = parseFloat(document.getElementById("returnQty").value) || 0;
    var maxQty = selectedReturnItem.quantity;
    
    if (qty > maxQty) {
        qty = maxQty;
        document.getElementById("returnQty").value = qty;
    }
    
    var amount = selectedReturnItem.price * qty;
    document.getElementById("returnAmount").textContent = amount.toLocaleString();
    
    var statusEl = document.getElementById("returnStatus");
    if (qty <= 0) {
        statusEl.textContent = "⚠️ Miqdorni kiriting";
        statusEl.style.background = "#fee2e2";
        statusEl.style.color = "#dc2626";
    } else if (qty >= maxQty) {
        statusEl.textContent = "✅ To'liq qaytarish";
        statusEl.style.background = "#d1fae5";
        statusEl.style.color = "#059669";
    } else {
        statusEl.textContent = "✅ Qaytarish mumkin";
        statusEl.style.background = "#d1fae5";
        statusEl.style.color = "#059669";
    }
}

// ===== QAYTARISHNI TASDIQLASH =====
function confirmReturn() {
    if (!selectedReturnItem) {
        alert("❌ Qaytariladigan mahsulotni tanlang!");
        return;
    }
    
    var qty = parseFloat(document.getElementById("returnQty").value) || 0;
    var reason = document.getElementById("returnReason").value;
    
    if (qty <= 0) {
        alert("❌ To'g'ri miqdorni kiriting!");
        return;
    }
    
    if (qty > selectedReturnItem.quantity) {
        alert("❌ Sotilgan " + selectedReturnItem.quantity + " " + (selectedReturnItem.unit || "kg") + " mahsulot bor!");
        return;
    }
    
    var returnAmount = selectedReturnItem.price * qty;
    
    if (!confirm("📦 " + selectedReturnItem.name + "\n📊 " + qty + " " + (selectedReturnItem.unit || "kg") + "\n💰 " + returnAmount.toLocaleString() + " so'm\n📝 Sabab: " + reason + "\n\nQaytarishni tasdiqlaysizmi?")) {
        return;
    }
    
    // 1. Mahsulotni omborga qaytarish
    var products = JSON.parse(localStorage.getItem("products")) || [];
    var found = false;
    for (var i = 0; i < products.length; i++) {
        if (products[i].id === selectedReturnItem.id) {
            products[i].stock = Math.round((products[i].stock + qty) * 1000) / 1000;
            localStorage.setItem("products", JSON.stringify(products));
            found = true;
            break;
        }
    }
    
    if (!found) {
        products.push({
            id: selectedReturnItem.id,
            name: selectedReturnItem.name,
            price: selectedReturnItem.price,
            stock: qty,
            unit: selectedReturnItem.unit || "kg",
            emoji: selectedReturnItem.emoji || "📦",
            image: selectedReturnItem.image || ""
        });
        localStorage.setItem("products", JSON.stringify(products));
    }
    
    // 2. Qaytarish tarixiga yozish
    var returnHistory = JSON.parse(localStorage.getItem("returnHistory")) || [];
    returnHistory.push({
        id: Date.now(),
        productId: selectedReturnItem.id,
        productName: selectedReturnItem.name,
        quantity: qty,
        amount: returnAmount,
        unit: selectedReturnItem.unit || "kg",
        price: selectedReturnItem.price,
        reason: reason,
        date: new Date().toISOString(),
        checkId: currentCheckId,
        cashierName: shift.cashierName || "Admin"
    });
    localStorage.setItem("returnHistory", JSON.stringify(returnHistory));
    
    // 3. Smenaga qaytarishni yozish
    var shift = JSON.parse(localStorage.getItem("shift")) || { sales: [] };
    shift.sales.push({
        id: Date.now(),
        method: "Qaytarish",
        amount: -returnAmount,
        items: [{
            id: selectedReturnItem.id,
            name: selectedReturnItem.name,
            quantity: qty,
            price: selectedReturnItem.price,
            unit: selectedReturnItem.unit || "kg",
            total: returnAmount,
            image: selectedReturnItem.image || "",
            emoji: selectedReturnItem.emoji || "📦"
        }],
        date: new Date().toISOString(),
        reason: reason,
        isReturn: true,
        cashierName: shift.cashierName || "Admin",
        checkId: currentCheckId
    });
    localStorage.setItem("shift", JSON.stringify(shift));
    
    // 4. Hisobotga yozish
    var reports = JSON.parse(localStorage.getItem("reports")) || [];
    var today = new Date().toDateString();
    var todayReport = null;
    for (var i = 0; i < reports.length; i++) {
        if (new Date(reports[i].date).toDateString() === today) {
            todayReport = reports[i];
            break;
        }
    }
    
    if (todayReport) {
        todayReport.totalReturns = (todayReport.totalReturns || 0) + returnAmount;
        todayReport.returnItems = todayReport.returnItems || [];
        todayReport.returnItems.push({
            product: selectedReturnItem.name,
            quantity: qty,
            amount: returnAmount,
            reason: reason,
            date: new Date().toISOString(),
            cashierName: shift.cashierName || "Admin"
        });
        todayReport.totalSales = (todayReport.totalSales || 0) - returnAmount;
        var idx = reports.indexOf(todayReport);
        reports[idx] = todayReport;
    } else {
        reports.push({
            id: Date.now(),
            date: new Date().toISOString(),
            dateStr: new Date().toLocaleDateString("uz-UZ"),
            totalSales: -returnAmount,
            totalReturns: returnAmount,
            returnItems: [{
                product: selectedReturnItem.name,
                quantity: qty,
                amount: returnAmount,
                reason: reason,
                date: new Date().toISOString(),
                cashierName: shift.cashierName || "Admin"
            }],
            sales: []
        });
    }
    localStorage.setItem("reports", JSON.stringify(reports));
    
    // 5. Dashboardni yangilash
    localStorage.setItem("dashboardUpdate", Date.now().toString());
    
    alert("✅ Mahsulot qaytarildi!\n\n📦 " + selectedReturnItem.name + "\n📊 " + qty + " " + (selectedReturnItem.unit || "kg") + "\n💰 " + returnAmount.toLocaleString() + " so'm\n📝 Sabab: " + reason);
    
    closeReturnModal();
    renderChecks();
}

// ===== MODALNI YOPISH =====
function closeReturnModal() {
    document.getElementById("returnModal").classList.remove("active");
    selectedReturnItem = null;
    currentCheckId = null;
}

// ===== FILTRLASH =====
function applyFilters() {
    var date = document.getElementById("filterDate").value;
    var type = document.getElementById("filterType").value;
    var search = document.getElementById("filterSearch").value.toLowerCase();
    
    var checks = loadChecks();
    
    if (date) {
        var filterDate = new Date(date).toDateString();
        checks = checks.filter(function(s) {
            return new Date(s.date).toDateString() === filterDate;
        });
    }
    
    if (search) {
        checks = checks.filter(function(s) {
            var text = (s.cashierName || "") + " " + (s.method || "");
            var itemsText = "";
            if (s.items) {
                for (var i = 0; i < s.items.length; i++) {
                    itemsText += s.items[i].name + " ";
                }
            }
            return text.toLowerCase().includes(search) || itemsText.toLowerCase().includes(search);
        });
    }
    
    renderChecks(checks);
}

function resetFilters() {
    document.getElementById("filterDate").value = "";
    document.getElementById("filterType").value = "all";
    document.getElementById("filterSearch").value = "";
    renderChecks();
}

// ===== SANANI CHIQARISH =====
document.getElementById("currentDate").textContent = new Date().toLocaleString("uz-UZ", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
});

// ===== BOSHLANG'ICH =====
renderChecks();
console.log("🔄 Qaytarish bo'limi yuklandi!");
