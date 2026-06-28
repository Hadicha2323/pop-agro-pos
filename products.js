// ============================================
// POP AGRO POSS - MAHSULOTLAR (FOIZ BILAN)
// ============================================

// ===== MA'LUMOTLAR =====
let products = JSON.parse(localStorage.getItem('products')) || [];
let editingId = null;

// Agar mahsulotlar bo'lmasa, BO'SH QOLDIRAMIZ
if (products.length === 0) {
    products = [];
    localStorage.setItem('products', JSON.stringify(products));
}

// ===== UNIT BELGILARI =====
const unitSymbols = {
    'kg': 'kg',
    'dona': 'dona',
    'metr': 'm',
    'litr': 'l',
    'gramm': 'g',
    'tonna': 't'
};

// ===== SANANI CHIQARISH =====
document.getElementById('currentDate').textContent = new Date().toLocaleString('uz-UZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
});

// ===== FOIZNI AVTOMAT HISOBLASH (SOTISH NARXIDAN) =====
document.getElementById('sellPrice').addEventListener('input', function() {
    var buyPrice = parseFloat(document.getElementById('buyPrice').value) || 0;
    var sellPrice = parseFloat(this.value) || 0;
    if (buyPrice > 0 && sellPrice > 0) {
        var profit = ((sellPrice - buyPrice) / buyPrice) * 100;
        document.getElementById('profitPercent').value = profit.toFixed(1);
    } else {
        document.getElementById('profitPercent').value = '';
    }
});

document.getElementById('buyPrice').addEventListener('input', function() {
    var buyPrice = parseFloat(this.value) || 0;
    var sellPrice = parseFloat(document.getElementById('sellPrice').value) || 0;
    if (buyPrice > 0 && sellPrice > 0) {
        var profit = ((sellPrice - buyPrice) / buyPrice) * 100;
        document.getElementById('profitPercent').value = profit.toFixed(1);
    } else {
        document.getElementById('profitPercent').value = '';
    }
});

// ===== FOIZNI QO'LDA YOZGANDAN KEYIN SOTISH NARXINI HISOBLASH =====
document.getElementById('profitPercent').addEventListener('input', function() {
    var buyPrice = parseFloat(document.getElementById('buyPrice').value) || 0;
    var profitPercent = parseFloat(this.value) || 0;
    
    if (buyPrice > 0 && profitPercent > 0) {
        var sellPrice = buyPrice + (buyPrice * profitPercent / 100);
        document.getElementById('sellPrice').value = Math.round(sellPrice);
    } else if (buyPrice > 0 && profitPercent === 0) {
        document.getElementById('sellPrice').value = buyPrice;
    } else {
        // buyPrice 0 bo'lsa, hech narsa qilma
    }
});

// ===== MAHSULOT QO'SHISH =====
document.getElementById('productForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    var name = document.getElementById('productName').value.trim();
    var code = document.getElementById('productCode').value.trim();
    var unit = document.getElementById('productUnit').value;
    var stock = parseFloat(document.getElementById('productStock').value) || 0;
    var buyPrice = parseFloat(document.getElementById('buyPrice').value);
    var sellPrice = parseFloat(document.getElementById('sellPrice').value);
    var profitPercent = parseFloat(document.getElementById('profitPercent').value) || 0;
    var imageFile = document.getElementById('productImage').files[0];
    
    if (!name || !code || !buyPrice || !sellPrice) {
        alert('❌ Iltimos, barcha maydonlarni to\'ldiring!');
        return;
    }
    
    if (buyPrice >= sellPrice) {
        alert('❌ Sotish narxi kelish narxidan katta bo\'lishi kerak!');
        return;
    }
    
    var newProduct = {
        id: Date.now(),
        name: name,
        code: code,
        unit: unit,
        stock: stock,
        buyPrice: buyPrice,
        price: sellPrice,
        sellPrice: sellPrice,
        profitPercent: profitPercent,
        emoji: '📦',
        image: null,
        created: new Date().toISOString()
    };
    
    // Rasmni base64 ga o'tkazish
    if (imageFile) {
        var reader = new FileReader();
        reader.onload = function(event) {
            newProduct.image = event.target.result;
            products.push(newProduct);
            localStorage.setItem('products', JSON.stringify(products));
            renderProducts();
            document.getElementById('productForm').reset();
            document.getElementById('profitPercent').value = '';
            document.getElementById('productStock').value = '10';
            alert('✅ Mahsulot muvaffaqiyatli qo\'shildi! Rasm saqlandi.');
        };
        reader.readAsDataURL(imageFile);
    } else {
        newProduct.image = null;
        products.push(newProduct);
        localStorage.setItem('products', JSON.stringify(products));
        renderProducts();
        document.getElementById('productForm').reset();
        document.getElementById('profitPercent').value = '';
        document.getElementById('productStock').value = '10';
        alert('✅ Mahsulot muvaffaqiyatli qo\'shildi!');
    }
});

// ===== MAHSULOTLARNI CHIQARISH =====
function renderProducts() {
    var tbody = document.getElementById('productsTable');
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#6b7280;padding:40px;"><i class="fas fa-box" style="font-size:32px;display:block;margin-bottom:10px;"></i>Hali mahsulot mavjud emas<br><small style="font-size:12px;color:#9ca3af;">Yangi mahsulot qo\'shish uchun formani to\'ldiring</small></td></tr>';
        document.getElementById('productTotal').textContent = '0 ta';
        return;
    }
    
    var html = '';
    for (var i = 0; i < products.length; i++) {
        var p = products[i];
        var buyPrice = p.buyPrice || p.price || 0;
        var sellPrice = p.sellPrice || p.price || 0;
        var profit = buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0;
        var profitClass = 'profit-medium';
        if (profit >= 30) profitClass = 'profit-high';
        else if (profit < 10) profitClass = 'profit-low';
        
        var imageSrc = p.image || 'https://cdn-icons-png.flaticon.com/128/2176/2176903.png';
        var unitSymbol = unitSymbols[p.unit] || p.unit || 'kg';
        var stockDisplay = p.stock !== undefined ? p.stock : 0;
        
        html += '<tr>';
        html += '<td>' + (i + 1) + '</td>';
        html += '<td><img src="' + imageSrc + '" class="product-image-thumb" alt="' + p.name + '" onerror="this.src=\'https://cdn-icons-png.flaticon.com/128/2176/2176903.png\'" /></td>';
        html += '<td><strong>' + p.name + '</strong></td>';
        html += '<td><span style="background:#f1f5f9;padding:2px 10px;border-radius:12px;font-size:12px;">' + (p.code || '-') + '</span></td>';
        html += '<td>' + unitSymbol + '</td>';
        html += '<td style="font-weight:600;color:' + (stockDisplay < 10 ? '#dc2626' : '#064e3b') + ';">' + (stockDisplay % 1 === 0 ? stockDisplay : stockDisplay.toFixed(3)) + '</td>';
        html += '<td>' + buyPrice.toLocaleString() + " so'm</td>";
        html += '<td style="color:#059669;font-weight:700;">' + sellPrice.toLocaleString() + " so'm</td>";
        html += '<td><span class="profit-badge ' + profitClass + '">' + profit.toFixed(1) + '%</span></td>';
        html += '<td>';
        html += '<button class="btn-action btn-edit" onclick="editProduct(' + p.id + ')"><i class="fas fa-edit"></i></button>';
        html += '<button class="btn-action btn-delete" onclick="deleteProduct(' + p.id + ')"><i class="fas fa-trash"></i></button>';
        html += '</td>';
        html += '</tr>';
    }
    tbody.innerHTML = html;
    document.getElementById('productTotal').textContent = products.length + ' ta';
}

// ===== MAHSULOTNI TAHRIRLASH =====
function editProduct(id) {
    var product = products.find(function(p) { return p.id === id; });
    if (!product) return;
    
    editingId = id;
    document.getElementById('editId').value = id;
    document.getElementById('editName').value = product.name;
    document.getElementById('editCode').value = product.code || '';
    document.getElementById('editUnit').value = product.unit || 'kg';
    document.getElementById('editStock').value = product.stock || 0;
    document.getElementById('editBuyPrice').value = product.buyPrice || product.price || 0;
    document.getElementById('editSellPrice').value = product.sellPrice || product.price || 0;
    
    var buyPrice = product.buyPrice || product.price || 0;
    var sellPrice = product.sellPrice || product.price || 0;
    var profit = buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0;
    document.getElementById('editProfitPercent').value = profit.toFixed(1);
    
    document.getElementById('editModal').classList.add('active');
}

// ===== TAHRIRLASHNI SAQLASH =====
document.getElementById('editForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    var id = parseInt(document.getElementById('editId').value);
    var name = document.getElementById('editName').value.trim();
    var code = document.getElementById('editCode').value.trim();
    var unit = document.getElementById('editUnit').value;
    var stock = parseFloat(document.getElementById('editStock').value) || 0;
    var buyPrice = parseFloat(document.getElementById('editBuyPrice').value);
    var sellPrice = parseFloat(document.getElementById('editSellPrice').value);
    var profitPercent = parseFloat(document.getElementById('editProfitPercent').value) || 0;
    
    if (!name || !buyPrice || !sellPrice) {
        alert('❌ Iltimos, barcha maydonlarni to\'ldiring!');
        return;
    }
    
    if (buyPrice >= sellPrice) {
        alert('❌ Sotish narxi kelish narxidan katta bo\'lishi kerak!');
        return;
    }
    
    var index = products.findIndex(function(p) { return p.id === id; });
    if (index !== -1) {
        products[index] = { 
            ...products[index], 
            name: name, 
            code: code, 
            unit: unit,
            stock: stock,
            buyPrice: buyPrice,
            price: sellPrice,
            sellPrice: sellPrice,
            profitPercent: profitPercent
        };
        localStorage.setItem('products', JSON.stringify(products));
        renderProducts();
        closeEditModal();
        alert('✅ Mahsulot muvaffaqiyatli yangilandi!');
    }
});

// ===== MAHSULOTNI O'CHIRISH =====
function deleteProduct(id) {
    var product = products.find(function(p) { return p.id === id; });
    if (!product) return;
    
    if (confirm('❌ "' + product.name + '" mahsulotini o\'chirmoqchimisiz?')) {
        products = products.filter(function(p) { return p.id !== id; });
        localStorage.setItem('products', JSON.stringify(products));
        renderProducts();
        alert('🗑 Mahsulot o\'chirildi!');
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
renderProducts();
console.log('Products.js yuklandi! Mahsulotlar soni:', products.length);


