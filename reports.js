// ============================================
// HISOBOTLAR (TO'LIQ ISHLAYDI)
// ============================================

var reports = JSON.parse(localStorage.getItem('reports')) || [];

// ===== SANANI CHIQARISH =====
document.getElementById('currentDate').textContent = new Date().toLocaleString('uz-UZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
});

// ===== STATISTIKANI YANGILASH =====
function updateStats() {
    reports = JSON.parse(localStorage.getItem('reports')) || [];
    
    var totalReports = reports.length;
    var totalSales = 0;
    var totalCash = 0;
    var totalTerminal = 0;
    
    for (var i = 0; i < reports.length; i++) {
        var r = reports[i];
        totalSales += r.totalSales || 0;
        totalCash += r.cashSales || 0;
        totalTerminal += r.terminalSales || 0;
    }
    
    document.getElementById('totalReports').textContent = totalReports;
    document.getElementById('totalSales').textContent = totalSales.toLocaleString() + " so'm";
    document.getElementById('totalCash').textContent = totalCash.toLocaleString() + " so'm";
    document.getElementById('totalTerminal').textContent = totalTerminal.toLocaleString() + " so'm";
}

// ===== HISOBOTLARNI CHIQARISH =====
function renderReports() {
    var tbody = document.getElementById('reportsTable');
    reports = JSON.parse(localStorage.getItem('reports')) || [];
    
    if (reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#6b7280;padding:40px;"><i class="fas fa-file-alt" style="font-size:32px;display:block;margin-bottom:10px;"></i>Hali hisobot mavjud emas</td></tr>';
        return;
    }
    
    // Oxirgi hisobotdan boshlab (eng yangisi birinchi)
    var sortedReports = reports.slice().reverse();
    
    var html = '';
    for (var i = 0; i < sortedReports.length; i++) {
        var r = sortedReports[i];
        var dateStr = r.dateStr || new Date(r.date).toLocaleDateString('uz-UZ');
        var startTime = r.startTime || '-';
        var endTime = r.endTime || '-';
        
        html += '<tr>';
        html += '<td>' + (i + 1) + '</td>';
        html += '<td><strong>' + dateStr + '</strong></td>';
        html += '<td>' + startTime + '</td>';
        html += '<td>' + endTime + '</td>';
        html += '<td style="color:#059669;font-weight:700;">' + (r.totalSales || 0).toLocaleString() + " so'm</td>";
        html += '<td>' + (r.cashSales || 0).toLocaleString() + " so'm</td>";
        html += '<td>' + (r.terminalSales || 0).toLocaleString() + " so'm</td>";
        html += '<td>' + (r.creditSales || 0).toLocaleString() + " so'm</td>";
        html += '<td>' + (r.totalItems || 0) + ' ta</td>';
        html += '</tr>';
    }
    tbody.innerHTML = html;
}

// ===== HISOBOTLARNI YUKLAB OLISH (CSV) =====
function exportReports() {
    reports = JSON.parse(localStorage.getItem('reports')) || [];
    
    if (reports.length === 0) {
        alert('❌ Hisobot mavjud emas!');
        return;
    }
    
    var csv = '🌾 Pop Agro POSS - Hisobotlar\n';
    csv += '==========================================\n';
    csv += '№;Sana;Boshlanish;Tugash;Jami savdo;Naqd;Terminal;Nasiya;Savdolar\n';
    
    for (var i = 0; i < reports.length; i++) {
        var r = reports[i];
        var dateStr = r.dateStr || new Date(r.date).toLocaleDateString('uz-UZ');
        var startTime = r.startTime || '-';
        var endTime = r.endTime || '-';
        
        csv += (i + 1) + ';';
        csv += dateStr + ';';
        csv += startTime + ';';
        csv += endTime + ';';
        csv += (r.totalSales || 0) + ';';
        csv += (r.cashSales || 0) + ';';
        csv += (r.terminalSales || 0) + ';';
        csv += (r.creditSales || 0) + ';';
        csv += (r.totalItems || 0) + '\n';
    }
    
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'hisobotlar_' + new Date().toLocaleDateString('uz-UZ') + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('✅ ' + reports.length + ' ta hisobot yuklab olindi!');
}

// ===== ESKI HISOBOTLARNI O'CHIRISH =====
function clearOldReports() {
    reports = JSON.parse(localStorage.getItem('reports')) || [];
    
    if (reports.length === 0) {
        alert('❌ Hisobot mavjud emas!');
        return;
    }
    
    var keep = prompt('📊 Qancha oxirgi hisobotni saqlab qolmoqchisiz?\n\nJami hisobotlar: ' + reports.length + ' ta\n\nMasalan: 10', '10');
    
    if (keep === null) return;
    
    keep = parseInt(keep);
    if (isNaN(keep) || keep < 1) {
        alert('❌ Noto\'g\'ri qiymat!');
        return;
    }
    
    if (keep >= reports.length) {
        alert('⚠️ ' + reports.length + ' ta hisobot bor, ' + keep + ' ta saqlab qolish mumkin emas.');
        return;
    }
    
    if (!confirm('⚠️ ' + (reports.length - keep) + ' ta eski hisobot o\'chiriladi!\nFaqat oxirgi ' + keep + ' ta hisobot saqlanib qoladi.')) {
        return;
    }
    
    reports = reports.slice(-keep);
    localStorage.setItem('reports', JSON.stringify(reports));
    
    updateStats();
    renderReports();
    alert('✅ ' + keep + ' ta hisobot saqlanib qoldi!');
}

// ===== LOCALSTORAGE O'ZGARISHLARINI KUZATISH =====
window.addEventListener('storage', function(e) {
    if (e.key === 'reports' || e.key === 'dashboardUpdate') {
        updateStats();
        renderReports();
    }
});

// ===== AVTOMATIK YANGILASH =====
setInterval(function() {
    updateStats();
    renderReports();
}, 5000);

// ===== BOSHLANG'ICH =====
updateStats();
renderReports();
console.log('Reports.js yuklandi!');

// ============================================
// HISOBOTLAR (QAYTARISHLAR BILAN)
// ============================================

function renderReports() {
    var tbody = document.getElementById('reportsTable');
    reports = JSON.parse(localStorage.getItem('reports')) || [];
    
    if (reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#6b7280;padding:40px;"><i class="fas fa-file-alt" style="font-size:32px;display:block;margin-bottom:10px;"></i>Hali hisobot mavjud emas</td></tr>';
        return;
    }
    
    // Oxirgi hisobotdan boshlab (eng yangisi birinchi)
    var sortedReports = reports.slice().reverse();
    
    var html = '';
    for (var i = 0; i < sortedReports.length; i++) {
        var r = sortedReports[i];
        var dateStr = r.dateStr || new Date(r.date).toLocaleDateString('uz-UZ');
        var startTime = r.startTime || '-';
        var endTime = r.endTime || '-';
        var totalReturns = r.totalReturns || 0;
        var totalSales = (r.totalSales || 0) + (r.totalReturns || 0); // Qaytarish qo'shilgan holda asl savdo
        
        // Qaytarish borligini ko'rsatish
        var returnBadge = '';
        if (totalReturns > 0) {
            returnBadge = '<span style="color:#dc2626;font-weight:700;">-' + totalReturns.toLocaleString() + " so'm</span>";
        }
        
        html += '<tr>';
        html += '<td>' + (i + 1) + '</td>';
        html += '<td><strong>' + dateStr + '</strong></td>';
        html += '<td>' + startTime + '</td>';
        html += '<td>' + endTime + '</td>';
        html += '<td style="color:#059669;font-weight:700;">' + (r.totalSales || 0).toLocaleString() + " so'm</td>";
        html += '<td>' + (r.cashSales || 0).toLocaleString() + " so'm</td>";
        html += '<td>' + (r.terminalSales || 0).toLocaleString() + " so'm</td>";
        html += '<td>' + (r.creditSales || 0).toLocaleString() + " so'm</td>";
        html += '<td>' + (r.totalItems || 0) + ' ta</td>';
        html += '</tr>';
        
        // Agar qaytarish bo'lsa, qo'shimcha qator
        if (totalReturns > 0 && r.returnItems) {
            html += '<tr style="background:#fef2f2;">';
            html += '<td colspan="9" style="padding:4px 12px;font-size:12px;color:#dc2626;">';
            html += '🔄 Qaytarish: ';
            for (var j = 0; j < r.returnItems.length; j++) {
                var ret = r.returnItems[j];
                html += ret.product + ' (' + ret.quantity + ' ' + (ret.unit || 'kg') + ') - ' + ret.amount.toLocaleString() + " so'm";
                if (j < r.returnItems.length - 1) html += ' | ';
            }
            html += '</td>';
            html += '</tr>';
        }
    }
    tbody.innerHTML = html;
}
