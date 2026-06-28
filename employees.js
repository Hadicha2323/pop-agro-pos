// ============================================
// POP AGRO POSS - XODIMLAR
// ============================================

// ===== MA'LUMOTLAR =====
let employees = JSON.parse(localStorage.getItem('employees')) || [];
let editingId = null;

// Agar admin bo'lmasa, default admin yaratish
if (employees.length === 0) {
    employees = [
        { id: 1, name: 'Admin', role: 'administrator', phone: '+998 90 123 45 67', password: 'admin123', status: 'active' }
    ];
    localStorage.setItem('employees', JSON.stringify(employees));
}

// ===== SANANI CHIQARISH =====
document.getElementById('currentDate').textContent = new Date().toLocaleString('uz-UZ', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

// ===== XODIM QO'SHISH =====
document.getElementById('employeeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    var name = document.getElementById('empName').value.trim();
    var role = document.getElementById('empRole').value;
    var phone = document.getElementById('empPhone').value.trim();
    var password = document.getElementById('empPassword').value.trim();
    var status = document.getElementById('empStatus').value;
    
    if (!name) { alert('❌ Ism familiyani kiriting!'); return; }
    if (!password || password.length < 4) { alert('❌ Parol kamida 4 belgidan iborat bo\'lishi kerak!'); return; }
    
    var newEmployee = {
        id: Date.now(),
        name: name,
        role: role,
        phone: phone || '-',
        password: password,
        status: status
    };
    
    employees.push(newEmployee);
    localStorage.setItem('employees', JSON.stringify(employees));
    renderEmployees();
    document.getElementById('employeeForm').reset();
    alert('✅ Xodim muvaffaqiyatli qo\'shildi!');
});

// ===== XODIMLARNI CHIQARISH =====
function renderEmployees() {
    var tbody = document.getElementById('employeesTable');
    
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#6b7280;padding:40px;"><i class="fas fa-users" style="font-size:32px;display:block;margin-bottom:10px;"></i>Hali xodim mavjud emas</td></tr>';
        document.getElementById('employeeTotal').textContent = '0 ta';
        return;
    }
    
    var html = '';
    for (var i = 0; i < employees.length; i++) {
        var emp = employees[i];
        var statusClass = emp.status === 'active' ? 'status-active' : 'status-inactive';
        var statusText = emp.status === 'active' ? '✅ Faol' : '❌ No faol';
        
        html += '<tr>';
        html += '<td>' + (i + 1) + '</td>';
        html += '<td><strong>' + emp.name + '</strong></td>';
        html += '<td><span style="background:#f1f5f9;padding:2px 10px;border-radius:12px;font-size:12px;">' + emp.role + '</span></td>';
        html += '<td>' + emp.phone + '</td>';
        html += '<td><span style="font-family:monospace;background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:12px;">' + emp.password + '</span></td>';
        html += '<td><span class="status-badge ' + statusClass + '">' + statusText + '</span></td>';
        html += '<td>';
        html += '<button class="btn-action btn-edit" onclick="editEmployee(' + emp.id + ')"><i class="fas fa-edit"></i></button>';
        html += '<button class="btn-action btn-delete" onclick="deleteEmployee(' + emp.id + ')"><i class="fas fa-trash"></i></button>';
        html += '</td>';
        html += '</tr>';
    }
    tbody.innerHTML = html;
    document.getElementById('employeeTotal').textContent = employees.length + ' ta';
}

// ===== XODIMNI TAHRIRLASH =====
function editEmployee(id) {
    var emp = employees.find(function(e) { return e.id === id; });
    if (!emp) return;
    
    editingId = id;
    document.getElementById('editId').value = id;
    document.getElementById('editName').value = emp.name;
    document.getElementById('editRole').value = emp.role;
    document.getElementById('editPhone').value = emp.phone;
    document.getElementById('editPassword').value = emp.password;
    document.getElementById('editStatus').value = emp.status;
    document.getElementById('editModal').classList.add('active');
}

// ===== TAHRIRLASHNI SAQLASH =====
document.getElementById('editForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    var id = parseInt(document.getElementById('editId').value);
    var name = document.getElementById('editName').value.trim();
    var role = document.getElementById('editRole').value;
    var phone = document.getElementById('editPhone').value.trim();
    var password = document.getElementById('editPassword').value.trim();
    var status = document.getElementById('editStatus').value;
    
    if (!name) { alert('❌ Ism familiyani kiriting!'); return; }
    if (!password || password.length < 4) { alert('❌ Parol kamida 4 belgidan iborat bo\'lishi kerak!'); return; }
    
    var index = employees.findIndex(function(e) { return e.id === id; });
    if (index !== -1) {
        employees[index] = { id: id, name: name, role: role, phone: phone || '-', password: password, status: status };
        localStorage.setItem('employees', JSON.stringify(employees));
        renderEmployees();
        closeEditModal();
        alert('✅ Xodim muvaffaqiyatli yangilandi!');
    }
});

// ===== XODIMNI O'CHIRISH =====
function deleteEmployee(id) {
    var emp = employees.find(function(e) { return e.id === id; });
    if (!emp) return;
    if (emp.role === 'administrator') {
        alert('❌ Administratorni o\'chirib bo\'lmaydi!');
        return;
    }
    if (confirm('❌ "' + emp.name + '" xodimini o\'chirmoqchimisiz?')) {
        employees = employees.filter(function(e) { return e.id !== id; });
        localStorage.setItem('employees', JSON.stringify(employees));
        renderEmployees();
        alert('🗑 Xodim o\'chirildi!');
    }
}

// ===== MODALNI YOPISH =====
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    editingId = null;
}

document.getElementById('editModal').addEventListener('click', function(e) {
    if (e.target === this) closeEditModal();
});

// ===== BOSHLANG'ICH =====
renderEmployees();
console.log('Employees.js yuklandi! Xodimlar soni:', employees.length);
