// ============================================
// NASIYALAR - FAQAT QOLGAN QARZLAR
// ============================================

function loadDebts() {
    debts = JSON.parse(localStorage.getItem('debts')) || [];
}

function renderDebts() {
    var tbody = document.getElementById('debtsTable');
    var summaryTotal = document.getElementById('summaryTotalDebt');
    var summaryPaid = document.getElementById('summaryPaidDebt');
    var summaryRemaining = document.getElementById('summaryRemainingDebt');
    var countEl = document.getElementById('debtCount');
    
    loadDebts();
    
    // ===== FAQAT QOLGAN QARZLARNI FILTRLASH =====
    var activeDebts = debts.filter(function(d) {
        return d.remaining > 0;
    });
    
    // ===== JAMI QARZLAR (FAQAT QOLGANLAR) =====
    var totalRemaining = 0;
    var totalPaid = 0;
    var totalDebt = 0;
    
    for (var i = 0; i < debts.length; i++) {
        totalDebt += debts[i].amount;
        totalPaid += debts[i].paid;
        // Qolgan qarzni faqat remaining > 0 bo'lsa qo'shamiz
        if (debts[i].remaining > 0) {
            totalRemaining += debts[i].remaining;
        }
    }
    
    // ===== STATISTIKALARNI YANGILASH =====
    // Jami qarz - faqat qolgan qarzlar
    if (summaryTotal) summaryTotal.textContent = totalRemaining.toLocaleString() + " so'm";
    if (summaryPaid) summaryPaid.textContent = totalPaid.toLocaleString() + " so'm";
    if (summaryRemaining) summaryRemaining.textContent = totalRemaining.toLocaleString() + " so'm";
    if (countEl) countEl.textContent = activeDebts.length;
    
    // ===== QARZDORLAR RO'YXATI =====
    if (activeDebts.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="11" style="text-align:center;padding:50px 20px;">
                <div class="empty-state">
                    <i class="fas fa-check-circle" style="color:#059669;font-size:48px;display:block;margin-bottom:16px;"></i>
                    <strong style="font-size:18px;color:#1f2937;">Barcha qarzlar to'langan!</strong>
                    <br><span style="font-size:14px;color:#6b7280;">Hozircha qarzdorlar mavjud emas</span>
                </div>
            </td>
        </tr>`;
        return;
    }
    
    // ===== QARZDORLAR JADVALI =====
    var html = '';
    for (var i = 0; i < activeDebts.length; i++) {
        var d = activeDebts[i];
        var status = 'Qarzdor';
        var statusClass = 'status-debtor';
        
        html += `<tr>
            <td>${i + 1}</td>
            <td><strong>${d.name}</strong></td>
            <td>${d.phone || '-'}</td>
            <td>${d.address || '-'}</td>
            <td>${d.amount.toLocaleString()} so'm</td>
            <td>${d.paid.toLocaleString()} so'm</td>
            <td><strong style="color:#dc2626;">${d.remaining.toLocaleString()} so'm</strong></td>
            <td>${new Date(d.date).toLocaleDateString('uz-UZ')}</td>
            <td>${d.dueDate ? new Date(d.dueDate).toLocaleDateString('uz-UZ') : '30 kun'}</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
            <td>
                <button class="btn-pay-debt" onclick="openPaymentModal(${d.id})">
                    <i class="fas fa-hand-holding-usd"></i> To'lash
                </button>
                <button class="btn-delete-debt" onclick="deleteDebt(${d.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
    }
    tbody.innerHTML = html;
}

// ===== QIDIRUV =====
function searchDebts(query) {
    var tbody = document.getElementById('debtsTable');
    loadDebts();
    
    var activeDebts = debts.filter(function(d) {
        return d.remaining > 0;
    });
    
    if (!query || query.length < 1) {
        renderDebts();
        return;
    }
    
    var filtered = activeDebts.filter(function(d) {
        return d.name.toLowerCase().includes(query.toLowerCase()) ||
               (d.phone && d.phone.includes(query));
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="11" style="text-align:center;padding:40px;color:#6b7280;">
                <i class="fas fa-search" style="font-size:32px;display:block;margin-bottom:10px;color:#d1d5db;"></i>
                <strong>Hech narsa topilmadi</strong>
                <br><span style="font-size:13px;">"${query}" bo'yicha qarz topilmadi</span>
            </td>
        </tr>`;
        return;
    }
    
    var html = '';
    for (var i = 0; i < filtered.length; i++) {
        var d = filtered[i];
        var statusClass = 'status-debtor';
        var status = 'Qarzdor';
        
        html += `<tr>
            <td>${i + 1}</td>
            <td><strong>${d.name}</strong></td>
            <td>${d.phone || '-'}</td>
            <td>${d.address || '-'}</td>
            <td>${d.amount.toLocaleString()} so'm</td>
            <td>${d.paid.toLocaleString()} so'm</td>
            <td><strong style="color:#dc2626;">${d.remaining.toLocaleString()} so'm</strong></td>
            <td>${new Date(d.date).toLocaleDateString('uz-UZ')}</td>
            <td>${d.dueDate ? new Date(d.dueDate).toLocaleDateString('uz-UZ') : '30 kun'}</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
            <td>
                <button class="btn-pay-debt" onclick="openPaymentModal(${d.id})">
                    <i class="fas fa-hand-holding-usd"></i> To'lash
                </button>
                <button class="btn-delete-debt" onclick="deleteDebt(${d.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
    }
    tbody.innerHTML = html;
}

// ===== QARZ OCHISH =====
function openDebtForm() {
    document.getElementById('debtForm').reset();
    document.getElementById('debtForm').style.display = 'block';
    document.getElementById('debtFormContainer').scrollIntoView({ behavior: 'smooth' });
}

function saveDebt() {
    var name = document.getElementById('debtName').value.trim();
    var phone = document.getElementById('debtPhone').value.trim();
    var address = document.getElementById('debtAddress').value.trim();
    var amount = parseFloat(document.getElementById('debtAmount').value);
    var dueDays = parseInt(document.getElementById('debtDue').value) || 30;
    
    if (!name || !amount || amount <= 0) {
        alert('❌ Iltimos, ism va qarz miqdorini kiriting!');
        return;
    }
    
    var dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);
    
    var newDebt = {
        id: Date.now(),
        name: name,
        phone: phone || '-',
        address: address || '-',
        amount: amount,
        paid: 0,
        remaining: amount,
        date: new Date().toISOString(),
        dueDate: dueDate.toISOString(),
        dueDays: dueDays,
        paymentHistory: []
    };
    
    debts.push(newDebt);
    localStorage.setItem('debts', JSON.stringify(debts));
    localStorage.setItem('dashboardUpdate', Date.now().toString());
    
    alert('✅ Qarz qo\'shildi!\n👤 ' + name + '\n💰 ' + amount.toLocaleString() + " so'm\n📅 Muddati: " + dueDate.toLocaleDateString('uz-UZ'));
    
    document.getElementById('debtForm').reset();
    document.getElementById('debtForm').style.display = 'none';
    renderDebts();
}

function cancelDebtForm() {
    document.getElementById('debtForm').reset();
    document.getElementById('debtForm').style.display = 'none';
}

// ===== QARZNI O'CHIRISH =====
function deleteDebt(id) {
    if (!confirm('⚠️ Ushbu qarzni o\'chirishni tasdiqlaysizmi?')) return;
    
    debts = debts.filter(function(d) { return d.id !== id; });
    localStorage.setItem('debts', JSON.stringify(debts));
    localStorage.setItem('dashboardUpdate', Date.now().toString());
    renderDebts();
    alert('✅ Qarz o\'chirildi!');
}

// ===== QARZNI TO'LASH =====
var currentDebtId = null;

function openPaymentModal(id) {
    currentDebtId = id;
    var debt = null;
    for (var i = 0; i < debts.length; i++) {
        if (debts[i].id === id) {
            debt = debts[i];
            break;
        }
    }
    if (!debt) {
        alert('❌ Qarz topilmadi!');
        return;
    }
    
    document.getElementById('paymentDebtName').textContent = debt.name;
    document.getElementById('paymentDebtAmount').textContent = debt.remaining.toLocaleString() + " so'm";
    document.getElementById('paymentAmount').value = debt.remaining;
    document.getElementById('paymentMethod').value = 'cash';
    document.getElementById('paymentModal').classList.add('active');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
    currentDebtId = null;
}

function payDebt() {
    if (!currentDebtId) {
        alert('❌ Xatolik! Qarz topilmadi.');
        return;
    }
    
    var amount = parseFloat(document.getElementById('paymentAmount').value);
    var method = document.getElementById('paymentMethod').value;
    
    if (!amount || amount <= 0) {
        alert('❌ Iltimos, to\'g\'ri miqdorni kiriting!');
        return;
    }
    
    var debt = null;
    for (var i = 0; i < debts.length; i++) {
        if (debts[i].id === currentDebtId) {
            debt = debts[i];
            break;
        }
    }
    if (!debt) {
        alert('❌ Qarz topilmadi!');
        return;
    }
    
    if (amount > debt.remaining) {
        alert('❌ Qolgan qarzdan ko\'p to\'lov kiritdingiz!\nQolgan qarz: ' + debt.remaining.toLocaleString() + " so'm");
        return;
    }
    
    // Qarzni yangilash
    debt.paid += amount;
    debt.remaining -= amount;
    if (!debt.paymentHistory) debt.paymentHistory = [];
    debt.paymentHistory.push({
        date: new Date().toISOString(),
        amount: amount,
        method: method === 'cash' ? 'Naqd' : 'Terminal'
    });
    
    localStorage.setItem('debts', JSON.stringify(debts));
    
    // Sales history
    var salesHistory = JSON.parse(localStorage.getItem('salesHistory')) || [];
    salesHistory.push({
        id: Date.now(),
        method: 'Nasiya to\'lovi (' + (method === 'cash' ? 'Naqd' : 'Terminal') + ')',
        amount: amount,
        items: [{ name: debt.name + ' qarzi', quantity: 1, price: amount }],
        date: new Date().toISOString(),
        type: 'debt_payment',
        debtId: debt.id,
        isDebtPayment: true,
        debtName: debt.name
    });
    localStorage.setItem('salesHistory', JSON.stringify(salesHistory));
    
    // Hisobot
    var reports = JSON.parse(localStorage.getItem('reports')) || [];
    var today = new Date().toDateString();
    var todayReport = null;
    for (var i = 0; i < reports.length; i++) {
        if (new Date(reports[i].date).toDateString() === today) {
            todayReport = reports[i];
            break;
        }
    }
    
    if (todayReport) {
        todayReport.totalSales = (todayReport.totalSales || 0) + amount;
        todayReport.creditSales = (todayReport.creditSales || 0) + amount;
        todayReport.debtPaid = (todayReport.debtPaid || 0) + amount;
        todayReport.debtPayments = todayReport.debtPayments || [];
        todayReport.debtPayments.push({
            debtName: debt.name,
            amount: amount,
            method: method === 'cash' ? 'Naqd' : 'Terminal',
            date: new Date().toISOString()
        });
        reports[i] = todayReport;
    } else {
        var newReport = {
            id: Date.now(),
            date: new Date().toISOString(),
            dateStr: new Date().toLocaleDateString('uz-UZ'),
            totalSales: amount,
            cashSales: method === 'cash' ? amount : 0,
            terminalSales: method === 'terminal' ? amount : 0,
            creditSales: 0,
            totalItems: 1,
            debtPaid: amount,
            debtPayments: [{
                debtName: debt.name,
                amount: amount,
                method: method === 'cash' ? 'Naqd' : 'Terminal',
                date: new Date().toISOString()
            }],
            sales: []
        };
        reports.push(newReport);
    }
    localStorage.setItem('reports', JSON.stringify(reports));
    
    localStorage.setItem('dashboardUpdate', Date.now().toString());
    
    var msg = '✅ To\'lov muvaffaqiyatli!\n👤 ' + debt.name + '\n💰 ' + amount.toLocaleString() + " so'm\n💳 " + (method === 'cash' ? 'Naqd' : 'Terminal') + '\n📅 Qolgan qarz: ' + debt.remaining.toLocaleString() + " so'm";
    
    if (debt.remaining === 0) {
        msg += '\n🎉 Qarz to\'liq to\'landi!';
    }
    
    alert(msg);
    
    closePaymentModal();
    renderDebts();
}

// ===== SANANI CHIQARISH =====
document.getElementById('currentDate').textContent = new Date().toLocaleString('uz-UZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
});

// ===== BOSHLANG'ICH =====
renderDebts();
console.log('Nasiyalar sahifasi yuklandi!');
