// ============================================
// POP AGRO POSS - MAHSULOTLAR (TO'LIQ ISHLAYDI)
// ============================================

console.log("🚀 Products.js yuklandi!");

// ===== O'ZGARUVCHILAR =====
let products = [];
let editingId = null;

// ===== SUPABASE ULASH =====
if (typeof supabase === 'undefined') {
    console.error('❌ Supabase ulanishi topilmadi!');
} else {
    console.log('✅ Supabase ulanishi mavjud!');
}

const STORAGE_BUCKET = 'products';

// ============================================
// UNIT BELGILARI
// ============================================
const unitSymbols = {
    'kg': 'kg',
    'dona': 'dona',
    'metr': 'm',
    'litr': 'l',
    'gramm': 'g',
    'tonna': 't'
};

// ============================================
// SUPABASE STORAGE - RASM YUKLASH
// ============================================
async function uploadImageToStorage(file) {
    if (!file) return null;
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
        const filePath = `products/${fileName}`;
        
        console.log('📤 Rasm yuklanmoqda:', fileName);
        
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file);
        
        if (error) {
            console.error('❌ Rasm yuklashda xatolik:', error);
            return null;
        }
        
        console.log('✅ Rasm yuklandi:', data);
        
        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);
        
        return urlData.publicUrl;
        
    } catch (err) {
        console.error('❌ Rasm yuklashda xatolik:', err);
        return null;
    }
}

async function deleteImageFromStorage(imageUrl) {
    if (!imageUrl) return true;
    if (!imageUrl.includes('supabase')) return true;
    
    try {
        const urlParts = imageUrl.split('/');
        const productsIndex = urlParts.indexOf('products');
        if (productsIndex === -1) return true;
        
        const filePath = urlParts.slice(productsIndex).join('/');
        
        if (!filePath) return true;
        
        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([filePath]);
        
        if (error) {
            console.error('❌ Rasm o\'chirishda xatolik:', error);
            return false;
        }
        
        console.log('✅ Rasm o\'chirildi:', filePath);
        return true;
        
    } catch (err) {
        console.error('❌ Rasm o\'chirishda xatolik:', err);
        return false;
    }
}

// ============================================
// SUPABASE - MAHSULOTLARNI YUKLASH
// ============================================
async function loadProductsFromSupabase() {
    console.log("📥 loadProductsFromSupabase() boshlandi...");
    
    try {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            console.error("❌ SUPABASE ERROR:", error);
            // Xatolik bo'lsa localStorage dan o'qiymiz
            products = JSON.parse(localStorage.getItem('products')) || [];
            renderProducts();
            return;
        }

        if (data && data.length > 0) {
            products = data;
            localStorage.setItem('products', JSON.stringify(products));
        } else {
            // Supabase da ma'lumot bo'lmasa localStorage dan o'qiymiz
            const stored = localStorage.getItem('products');
            products = stored ? JSON.parse(stored) : [];
        }
        
        renderProducts();
        console.log("✅ Mahsulotlar yuklandi:", products.length, "ta");
        
    } catch (err) {
        console.error("❌ Yuklashda xatolik:", err);
        products = JSON.parse(localStorage.getItem('products')) || [];
        renderProducts();
    }
}

// ============================================
// SANANI CHIQARISH
// ============================================
function updateDate() {
    const now = new Date();
    let dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.textContent = now.toLocaleString('uz-UZ', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

// ============================================
// MAHSULOT QO'SHISH
// ============================================
async function addProduct() {
    console.log("🟢 addProduct() ishga tushdi!");

    // 1. MA'LUMOTLARNI O'QISH
    let name = document.getElementById("productName").value.trim();
    let code = document.getElementById("productCode").value.trim();
    let unit = document.getElementById("productUnit").value;
    let stock = parseFloat(document.getElementById("productStock").value) || 0;
    let cost = parseFloat(document.getElementById("productCost").value) || 0;
    let price = parseFloat(document.getElementById("productPrice").value) || 0;
    let profit = parseFloat(document.getElementById("productProfit").value) || 0;
    let emoji = document.getElementById("productEmoji").value || "📦";
    let image = document.getElementById("productImage").value;

    console.log("📦 Mahsulot ma'lumotlari:", { name, code, unit, stock, cost, price, profit, emoji });

    // 2. TEKSHIRISH
    if (!name) { alert("⚠️ Mahsulot nomini kiriting!"); return; }
    if (price <= 0) { alert("⚠️ Sotish narxini kiriting!"); return; }

    // 3. KOD AVTOMATIK
    if (!code) {
        let prefix = name.substring(0, 2).toUpperCase();
        code = prefix + "-" + String(Date.now()).slice(-4);
        console.log("🔑 Avtomatik kod:", code);
    }

    // 4. SUPABASE GA QO'SHISH
    try {
        console.log("📤 Supabase ga yozish boshlandi...");
        
        const { data, error } = await supabase
            .from("products")
            .insert([{
                name: name,
                code: code,
                unit: unit,
                stock: stock,
                cost: cost,
                price: price,
                profit: profit,
                emoji: emoji,
                image: image || null
            }]);

        // 5. XATOLIKNI TEKSHIRISH
        if (error) {
            console.error("❌ Qo'shishda xatolik:", error);
            alert("Xatolik: " + error.message);
            return;
        }

        // 6. MUVAFFAQIYAT
        console.log("✅ Mahsulot qo'shildi!", data);
        clearForm();
        await loadProductsFromSupabase();
        alert("✅ Mahsulot qo'shildi!");

    } catch (err) {
        console.error("❌ Qo'shishda xatolik:", err);
        alert("Xatolik yuz berdi!");
    }
}

// ============================================
// MAHSULOTLARNI CHIQARISH
// ============================================
function renderProducts() {
    var tbody = document.getElementById('productsTable');
    var count = document.getElementById('productCount');
    
    if (!tbody) {
        console.error("❌ productsTable topilmadi!");
        return;
    }
    
    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;color:#6b7280;padding:40px;"><i class="fas fa-box" style="font-size:32px;display:block;margin-bottom:10px;"></i>Hali mahsulot mavjud emas<br><small style="font-size:12px;color:#9ca3af;">Yangi mahsulot qo\'shish uchun formani to\'ldiring</small></td></tr>';
        if (count) count.textContent = '0 ta';
        return;
    }
    
    var html = '';
    for (var i = 0; i < products.length; i++) {
        var p = products[i];
        var cost = p.cost || p.buyPrice || 0;
        var price = p.price || p.sellPrice || 0;
        var profit = cost > 0 ? ((price - cost) / cost) * 100 : 0;
        var stockClass = (p.stock || 0) <= 5 ? "low" : ((p.stock || 0) <= 20 ? "medium" : "high");
        var stockText = (p.stock || 0) <= 5 ? "🔴 Kam" : ((p.stock || 0) <= 20 ? "🟡 O'rtacha" : "🟢 Yetarli");
        
        var imageSrc = p.image || p.emoji || '📦';
        var imgHtml = p.image && p.image.startsWith('data:') ? 
            `<img src="${p.image}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;" />` : 
            (p.emoji || "📦");
        
        var unitSymbol = unitSymbols[p.unit] || p.unit || 'kg';
        var stockDisplay = (p.stock || 0) % 1 === 0 ? (p.stock || 0) : (p.stock || 0).toFixed(3);
        
        html += '<tr>';
        html += '<td>' + (i + 1) + '</td>';
        html += '<td><div class="product-image-cell">' + imgHtml + '</div></td>';
        html += '<td><strong>' + (p.name || 'Nomsiz') + '</strong></td>';
        html += '<td><span style="background:#f1f5f9;padding:2px 10px;border-radius:12px;font-size:12px;">' + (p.code || '-') + '</span></td>';
        html += '<td>' + unitSymbol + '</td>';
        html += '<td style="font-weight:600;color:' + ((p.stock || 0) < 10 ? '#dc2626' : '#064e3b') + ';">' + stockDisplay + '</td>';
        html += '<td>' + cost.toLocaleString() + " so'm</td>";
        html += '<td style="color:#059669;font-weight:700;">' + price.toLocaleString() + " so'm</td>";
        html += '<td><span class="price-profit">+' + profit.toFixed(1) + '%</span></td>';
        html += '<td><span class="badge-stock ' + stockClass + '">' + stockText + '</span></td>';
        html += '<td>';
        html += '<button class="btn-action btn-edit" onclick="editProduct(' + p.id + ')"><i class="fas fa-edit"></i></button>';
        html += '<button class="btn-action btn-delete" onclick="deleteProduct(' + p.id + ')"><i class="fas fa-trash"></i></button>';
        html += '</td>';
        html += '</tr>';
    }
    tbody.innerHTML = html;
    if (count) count.textContent = products.length + ' ta';
}

// ============================================
// DELETE PRODUCT
// ============================================
async function deleteProduct(id) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    
    try {
        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("❌ O'chirishda xatolik:", error);
            alert("O'chirishda xatolik!");
            return;
        }

        console.log("✅ Mahsulot o'chirildi!");
        await loadProductsFromSupabase();
        alert("✅ Mahsulot o'chirildi!");
    } catch (err) {
        console.error("❌ O'chirishda xatolik:", err);
        alert("Xatolik yuz berdi!");
    }
}

// ============================================
// TAHRIRLASH
// ============================================
function editProduct(id) {
    var product = products.find(function(p) { return p.id === id; });
    if (!product) return;
    
    editingId = id;
    document.getElementById('editId').value = id;
    document.getElementById('editName').value = product.name;
    document.getElementById('editCode').value = product.code || '';
    document.getElementById('editUnit').value = product.unit || 'kg';
    document.getElementById('editStock').value = product.stock || 0;
    document.getElementById('editBuyPrice').value = product.cost || 0;
    document.getElementById('editSellPrice').value = product.price || 0;
    
    var profit = product.cost > 0 ? ((product.price - product.cost) / product.cost) * 100 : 0;
    document.getElementById('editProfitPercent').value = profit.toFixed(1);
    
    document.getElementById('editModal').classList.add('active');
}

// ============================================
// TAHRIRLASHNI SAQLASH
// ============================================
document.getElementById('editForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var id = parseInt(document.getElementById('editId').value);
    var name = document.getElementById('editName').value.trim();
    var code = document.getElementById('editCode').value.trim();
    var unit = document.getElementById('editUnit').value;
    var stock = parseFloat(document.getElementById('editStock').value) || 0;
    var cost = parseFloat(document.getElementById('editBuyPrice').value);
    var price = parseFloat(document.getElementById('editSellPrice').value);
    var profit = parseFloat(document.getElementById('editProfitPercent').value) || 0;
    
    if (!name) { alert('❌ Mahsulot nomini kiriting!'); return; }
    if (!cost || !price) { alert('❌ Narxlarni kiriting!'); return; }
    if (cost >= price) { alert('❌ Sotish narxi kelish narxidan katta bo\'lishi kerak!'); return; }
    
    try {
        const { error } = await supabase
            .from("products")
            .update({ name, code, unit, stock, cost, price, profit })
            .eq("id", id);

        if (error) {
            console.error("❌ Yangilashda xatolik:", error);
            alert("Yangilashda xatolik!");
            return;
        }

        await loadProductsFromSupabase();
        closeEditModal();
        alert('✅ Mahsulot yangilandi!');
    } catch (err) {
        console.error("❌ Yangilashda xatolik:", err);
        alert("Xatolik yuz berdi!");
    }
});

// ============================================
// FORMA TOZALASH
// ============================================
function clearForm() {
    document.getElementById("productName").value = "";
    document.getElementById("productCode").value = "";
    document.getElementById("productStock").value = "0";
    document.getElementById("productCost").value = "0";
    document.getElementById("productPrice").value = "0";
    document.getElementById("productProfit").value = "0";
    document.getElementById("productEmoji").value = "📦";
    document.getElementById("profitDisplay").textContent = "Foyda: 0 so'm";
    clearImage();
}

function clearImage() {
    let preview = document.getElementById("imagePreview");
    if (preview) preview.innerHTML = '<span class="placeholder"><i class="fas fa-image"></i></span>';
    let fileInput = document.getElementById("productImageFile");
    if (fileInput) fileInput.value = "";
    let hidden = document.getElementById("productImage");
    if (hidden) hidden.value = "";
}

// ============================================
// NARX HISOBLASH
// ============================================
function calculatePrice() {
    let cost = parseFloat(document.getElementById("productCost").value) || 0;
    let profit = parseFloat(document.getElementById("productProfit").value) || 0;
    if (profit > 0) {
        let price = cost + (cost * profit / 100);
        document.getElementById("productPrice").value = Math.round(price);
        updateProfitDisplay(cost, price);
    }
}

function calculateProfit() {
    let cost = parseFloat(document.getElementById("productCost").value) || 0;
    let price = parseFloat(document.getElementById("productPrice").value) || 0;
    if (cost > 0 && price > 0) {
        let profit = ((price - cost) / cost) * 100;
        document.getElementById("productProfit").value = profit.toFixed(1);
        updateProfitDisplay(cost, price);
    }
}

function calculatePriceFromProfit() {
    let cost = parseFloat(document.getElementById("productCost").value) || 0;
    let profit = parseFloat(document.getElementById("productProfit").value) || 0;
    if (cost > 0 && profit > 0) {
        let price = cost + (cost * profit / 100);
        document.getElementById("productPrice").value = Math.round(price);
        updateProfitDisplay(cost, price);
    }
}

function updateProfitDisplay(cost, price) {
    let profitAmount = price - cost;
    let profitPercent = cost > 0 ? ((profitAmount / cost) * 100).toFixed(1) : 0;
    let el = document.getElementById("profitDisplay");
    if (el) {
        el.textContent = `Foyda: ${profitAmount.toLocaleString()} so'm (${profitPercent}%)`;
        el.style.color = profitAmount > 0 ? "#059669" : "#dc2626";
    }
}

// ============================================
// MODAL YOPISH
// ============================================
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    editingId = null;
}

function closeReturnModal() {
    document.getElementById('returnModal').classList.remove('active');
}

// ============================================
// QIDIRISH
// ============================================
document.getElementById('searchProduct')?.addEventListener('input', function() {
    var query = this.value.toLowerCase().trim();
    var rows = document.querySelectorAll('#productsTable tr');
    rows.forEach(function(row) {
        var text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
});

// ============================================
// BOSHLANG'ICH
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("📦 DOM ready - Mahsulotlar sahifasi yuklandi!");
    
    updateDate();
    setInterval(updateDate, 1000);
    
    if (typeof supabase === 'undefined') {
        console.error("❌ Supabase ulanishi topilmadi!");
        let tbody = document.getElementById("productsTable");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="11" class="empty-state" style="color:red;">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Supabase ulanishi topilmadi!</strong><br>
                <span style="font-size:13px;">supabase.js faylini tekshiring</span>
            </td></tr>`;
        }
        return;
    }
    
    loadProductsFromSupabase();
});