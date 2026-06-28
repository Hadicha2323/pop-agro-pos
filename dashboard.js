// ============================================
// DASHBOARD - KUNLIK SAVDO TO'G'RI
// ============================================

console.log("📊 Dashboard yuklandi!");

function loadDashboardData() {
    console.log("🔄 Dashboard yangilanmoqda...");
    
    var salesHistory = JSON.parse(localStorage.getItem("salesHistory")) || [];
    var products = JSON.parse(localStorage.getItem("products")) || [];
    var debts = JSON.parse(localStorage.getItem("debts")) || [];
    var shift = JSON.parse(localStorage.getItem("shift")) || { isOpen: false, sales: [], startTime: null };
    var reports = JSON.parse(localStorage.getItem("reports")) || [];
    
    var today = new Date().toDateString();
    var todaySales = [];
    var totalSales = 0;
    var totalCash = 0;
    var totalTerminal = 0;
    var totalCredit = 0;
    var totalReturns = 0;
    
    // ===== 1. SMENADAN BUGUNGI SAVDOLARNI OLISH =====
    // Agar smena ochiq bo'lsa, shift.sales dan o'qiymiz
    if (shift.isOpen) {
        console.log("📊 Smena ochiq, shift.sales dan o'qilmoqda...");
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
    } else {
        // ===== 2. SMENA YOPIQ BO'LSA, SALES HISTORY DAN O'QIMIZ =====
        console.log("📊 Smena yopiq, salesHistory dan o'qilmoqda...");
        
        // Bugungi sana bo'yicha salesHistory dan olish
        for (var i = 0; i < salesHistory.length; i++) {
            var sale = salesHistory[i];
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
    }
    
    // ===== 3. JAMI MAHSULOTLAR VA KAM ZAXIRA =====
    var totalStock = 0;
    var lowStockCount = 0;
    for (var i = 0; i < products.length; i++) {
        totalStock += products[i].stock || 0;
        if ((products[i].stock || 0) < 10) lowStockCount++;
    }
    
    // ===== 4. OYLIK SAVDO =====
    var monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    var monthlyTotal = 0;
    var allSales = [];
    
    if (shift.isOpen) {
        allSales = shift.sales.concat(salesHistory);
    } else {
        allSales = salesHistory;
    }
    
    for (var i = 0; i < allSales.length; i++) {
        var sale = allSales[i];
        var saleDate = new Date(sale.date);
        if (saleDate >= monthAgo && !sale.isReturn) {
            monthlyTotal += sale.amount || 0;
        }
    }
    
    // ===== 5. NASIYA QOLDIG'I =====
    var totalDebtRemaining = 0;
    for (var i = 0; i < debts.length; i++) {
        if (debts[i].remaining > 0) {
            totalDebtRemaining += debts[i].remaining;
        }
    }
    
    // ===== 6. UI NI YANGILASH =====
    document.getElementById("dailySales").textContent = totalSales.toLocaleString() + " so'm";
    document.getElementById("monthlySales").textContent = monthlyTotal.toLocaleString() + " so'm";
    document.getElementById("totalProducts").textContent = totalStock.toFixed(1) + " kg";
    document.getElementById("lowStock").textContent = lowStockCount + " ta";
    
    document.getElementById("cashPayments").textContent = totalCash.toLocaleString() + " so'm";
    document.getElementById("cardPayments").textContent = totalTerminal.toLocaleString() + " so'm";
    document.getElementById("creditPayments").textContent = totalCredit.toLocaleString() + " so'm";
    
    // Dashboard holati
    var statusEl = document.getElementById("dailyStatus");
    if (statusEl) {
        if (shift.isOpen) {
            statusEl.textContent = "🟢 Smena ochiq";
            statusEl.style.color = "#059669";
        } else {
            statusEl.textContent = "🔴 Smena yopiq";
            statusEl.style.color = "#dc2626";
        }
    }
    
    // Grafiklar
    createPaymentChart(totalCash, totalTerminal, totalCredit);
    createMonthlyChart();
    renderLowStockTable();
    
    console.log("📊 Dashboard yangilandi! Kunlik savdo:", totalSales);
}

// ===== GRAFIKLAR =====
var paymentChartInstance = null;

function createPaymentChart(cash, card, credit) {
    var ctx = document.getElementById("paymentChart");
    if (!ctx) return;
    if (paymentChartInstance) { paymentChartInstance.destroy(); }
    
    var data = [cash, card, credit];
    var labels = ["Naqd", "Terminal", "Nasiya"];
    var colors = ["#059669", "#3b82f6", "#d97706"];
    
    if (cash === 0 && card === 0 && credit === 0) {
        data = [1];
        labels = ["Ma'lumot yo'q"];
        colors = ["#e5e7eb"];
    }
    
    paymentChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { padding: 12, usePointStyle: true, pointStyle: "circle", font: { size: 13 } }
                }
            },
            cutout: "65%"
        }
    });
}

var monthlyChartInstance = null;

function createMonthlyChart() {
    var ctx = document.getElementById("monthlyChart");
    if (!ctx) return;
    
    var salesHistory = JSON.parse(localStorage.getItem("salesHistory")) || [];
    var shift = JSON.parse(localStorage.getItem("shift")) || { isOpen: false, sales: [] };
    var allSales = shift.isOpen ? shift.sales.concat(salesHistory) : salesHistory;
    
    var months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
    var monthlyData = [];
    
    for (var m = 0; m < 12; m++) {
        var total = 0;
        for (var i = 0; i < allSales.length; i++) {
            var sale = allSales[i];
            var saleDate = new Date(sale.date);
            if (saleDate.getMonth() === m && !sale.isReturn) {
                total += sale.amount || 0;
            }
        }
        monthlyData.push(total);
    }
    
    if (monthlyChartInstance) { monthlyChartInstance.destroy(); }
    
    monthlyChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: months,
            datasets: [{
                label: "Oylik savdo",
                data: monthlyData,
                borderColor: "#059669",
                backgroundColor: "rgba(5,150,105,0.1)",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "#059669",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) return (value / 1000000).toFixed(0) + "M";
                            else if (value >= 1000) return (value / 1000).toFixed(0) + "K";
                            return value;
                        }
                    }
                }
            }
        }
    });
}

function renderLowStockTable() {
    var tbody = document.getElementById("lowStockTable");
    if (!tbody) return;
    
    var products = JSON.parse(localStorage.getItem("products")) || [];
    var lowStock = products.filter(function(p) { return (p.stock || 0) < 20; });
    lowStock.sort(function(a, b) { return (a.stock || 0) - (b.stock || 0); });
    
    if (lowStock.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#6b7280;padding:30px;">✅ Barcha mahsulotlar yetarli miqdorda</td></tr>';
        return;
    }
    
    var html = "";
    for (var i = 0; i < lowStock.length; i++) {
        var p = lowStock[i];
        var status = p.stock <= 5 ? "🔴 Kritik" : "🟡 Yetarli emas";
        var statusClass = p.stock <= 5 ? "status-critical" : "status-warning";
        html += "<tr><td>" + (i + 1) + "</td><td>" + (p.emoji || "📦") + " " + p.name + "</td><td><strong>" + (p.stock || 0).toFixed(1) + " " + (p.unit || "kg") + "</strong></td><td><span class=\"status-badge " + statusClass + "\">" + status + "</span></td></tr>";
    }
    tbody.innerHTML = html;
}

// ===== REAL VAQTDA YANGILASH =====
window.addEventListener("storage", function(e) {
    if (e.key === "dashboardUpdate" || e.key === "salesHistory" || e.key === "products" || e.key === "shift" || e.key === "debts") {
        loadDashboardData();
    }
});

setInterval(loadDashboardData, 3000);

document.addEventListener("visibilitychange", function() {
    if (!document.hidden) { loadDashboardData(); }
});

// ===== BOSHLANG'ICH =====
document.addEventListener("DOMContentLoaded", function() {
    var dateEl = document.getElementById("currentDate");
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleString("uz-UZ", {
            day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
        });
    }
    loadDashboardData();
    console.log("✅ Dashboard yuklandi!");
});
