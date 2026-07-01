// ============================================
// POP AGRO POSS - MAHSULOTLAR (TO'LIQ ISHLAYDI)
// ============================================

console.log("🚀 Products.js yuklandi!");

// ===== O'ZGARUVCHILAR =====
let products = [];

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

// ============================================
// SUPABASE STORAGE - RASM O'CHIRISH
// ============================================
async function deleteImageFromStorage(imageUrl) {
    if (!imageUrl) return true;
    if (!imageUrl.includes('supabase')) return true;
    
    try {
        let filePath = '';
        
        if (imageUrl.includes('/storage/v1/object/public/')) {
            const parts = imageUrl.split('/storage/v1/object/public/');
            if (parts.length > 1) {
                let pathPart = parts[1];
                const pathParts = pathPart.split('/');
                if (pathParts.length > 0) {
                    pathParts.shift();
                    filePath = pathParts.join('/');
                }
            }
        }
        
        if (!filePath) {
            const productsIndex = imageUrl.indexOf('products');
            if (productsIndex !== -1) {
                const afterBucket = imageUrl.substring(productsIndex);
                const parts = afterBucket.split('/');
                if (parts.length > 1) {
                    parts.shift();
                    filePath = parts.join('/');
                } else {
                    filePath = afterBucket;
                }
            }
        }
        
        if (!filePath) {
            const lastSlash = imageUrl.lastIndexOf('/');
            if (lastSlash !== -1) {
                const fileName = imageUrl.substring(lastSlash + 1);
                if (fileName) {
                    filePath = `products/${fileName}`;
                }
            }
        }
        
        if (!filePath) {
            console.warn('⚠️ File path aniqlanmadi:', imageUrl);
            return false;
        }
        
        console.log('🗑️ O\'chiriladigan fayl:', filePath);
        
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
// PREVIEW IMAGE
// ============================================
function previewImage(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById("imagePreview");
        if (preview) {
            preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" />`;
        }
    };
    reader.readAsDataURL(file);
}

function previewEditImage(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById("editImagePreview");
        if (preview) {
            preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" />`;
        }
    };
    reader.readAsDataURL(file);
}

// ============================================
// SUPABASE - MAHSULOTLARNI YUKLASH
// ============================================
async function loadProducts() {
    console.log("📥 loadProducts() boshlandi...");
    
    try {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            console.error("❌ LOAD ERROR:", error);
            products = JSON.parse(localStorage.getItem('products')) || [];
            renderProducts();
            return [];
        }

        if (data && data.length > 0) {
            products = data;
            localStorage.setItem('products', JSON.stringify(products));
        } else {
            const stored = localStorage.getItem('products');
            products = stored ? JSON.parse(stored) : [];
        }
        
        renderProducts();
        console.log("✅ Mahsulotlar yuklandi:", products.length, "ta");
        return products;
        
    } catch (err) {
        console.error("❌ Yuklashda xatolik:", err);
        products = JSON.parse(localStorage.getItem('products')) || [];
        renderProducts();
        return products;
    }
}

// ============================================
// SUPABASE - MAHSULOTLARNI YUKLASH (ESKI NOM)
// ============================================
async function loadProductsFromSupabase() {
    return loadProducts();
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
async function addProduct(name, price, cost, unit, stock, code, emoji, imageFile) {
    console.log("🟢 addProduct() ishga tushdi!");

    // Agar parametr sifatida berilgan bo'lsa, formadan o'qish shart emas
    let productName = name || document.getElementById("productName").value.trim();
    let productCode = code || document.getElementById("productCode").value.trim();
    let productUnit = unit || document.getElementById("productUnit").value;
    let productStock = stock !== undefined ? stock : parseFloat(document.getElementById("productStock").value) || 0;
    let productCost = cost !== undefined ? cost : parseFloat(document.getElementById("productCost").value) || 0;
    let productPrice = price !== undefined ? price : parseFloat(document.getElementById("productPrice").value) || 0;
    let productProfit = parseFloat(document.getElementById("productProfit").value) || 0;
    let productEmoji = emoji || document.getElementById("productEmoji").value || "📦";
    let productImageFile = imageFile || document.getElementById("productImageFile").files[0];

    console.log("📦 Mahsulot ma'lumotlari:", { 
        name: productName, 
        code: productCode, 
        unit: productUnit, 
        stock: productStock, 
        cost: productCost, 
        price: productPrice, 
        profit: productProfit, 
        emoji: productEmoji 
    });

    // Tekshirish
    if (!productName) { alert("⚠️ Mahsulot nomini kiriting!"); return null; }
    if (productCost <= 0) { alert("⚠️ Kelish narxini kiriting!"); return null; }
    if (productPrice <= productCost) { alert("⚠️ Sotish narxi kelish narxidan katta bo'lishi kerak!"); return null; }

    // Kod avtomatik
    if (!productCode) {
        let prefix = productName.substring(0, 2).toUpperCase();
        productCode = prefix + "-" + String(Date.now()).slice(-4);
        console.log("🔑 Avtomatik kod:", productCode);
    }

    // Rasmni yuklash
    let finalImageUrl = null;
    if (productImageFile) {
        console.log("📤 Rasm yuklanmoqda...");
        finalImageUrl = await uploadImageToStorage(productImageFile);
        if (finalImageUrl) {
            console.log("✅ Rasm yuklandi:", finalImageUrl);
        } else {
            console.warn("⚠️ Rasm yuklanmadi, davom etilmoqda...");
        }
    }

    try {
        console.log("📤 Supabase ga yozish boshlandi...");
        
        const { error } = await supabase
            .from("products")
            .insert([{
                name: productName,
                code: productCode,
                unit: productUnit,
                stock: productStock,
                cost: productCost,
                price: productPrice,
                profit: productProfit,
                emoji: productEmoji,
                image: finalImageUrl || null
            }]);

        if (error) {
            console.error("❌ Qo'shishda xatolik:", error);
            alert("Xatolik: " + error.message);
            return null;
        }

        console.log("✅ Mahsulot qo'shildi!");
        clearForm();
        await loadProducts();
        alert("✅ Mahsulot qo'shildi!");
        return { success: true };

    } catch (err) {
        console.error("❌ Qo'shishda xatolik:", err);
        alert("Xatolik yuz berdi!");
        return null;
    }
}

// ============================================
// TEZ QO'SHISH (QUICK ADD)
// ============================================
async function quickAddProduct() {
    console.log("⚡ quickAddProduct() ishga tushdi!");
    
    const name = document.getElementById("q_name")?.value?.trim();
    const price = document.getElementById("q_price")?.value;

    if (!name) {
        alert("⚠️ Mahsulot nomini kiriting!");
        return;
    }
    
    if (!price || parseFloat(price) <= 0) {
        alert("⚠️ Narxni kiriting!");
        return;
    }

    // Quick add uchun default qiymatlar
    const cost = parseFloat(price) * 0.7; // 70% kelish narxi
    const unit = 'dona';
    const stock = 0;
    const emoji = '📦';
    
    // Mahsulot qo'shish
    const result = await addProduct(name, parseFloat(price), cost, unit, stock, null, emoji, null);
    
    if (result && result.success) {
        // Formani tozalash
        const qName = document.getElementById("q_name");
        const qPrice = document.getElementById("q_price");
        if (qName) qName.value = "";
        if (qPrice) qPrice.value = "";
        
        // Fokusni nomga qaytarish
        if (qName) qName.focus();
    }
}

// ============================================
// MAHSULOTLARNI CHIQARISH
// ============================================
function renderProducts(productsData) {
    const data = productsData || products;
    
    var tbody = document.getElementById('productsTable');
    var count = document.getElementById('productCount');
    
    const totalProductsEl = document.getElementById("totalProducts");
    const totalCostEl = document.getElementById("totalCost");
    const totalSaleEl = document.getElementById("totalSale");
    const totalProfitEl = document.getElementById("totalProfit");
    
    if (!tbody) {
        console.error("❌ productsTable topilmadi!");
        return;
    }
    
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;color:#6b7280;padding:40px;"><i class="fas fa-box" style="font-size:32px;display:block;margin-bottom:10px;"></i>Hali mahsulot mavjud emas<br><small style="font-size:12px;color:#9ca3af;">Yangi mahsulot qo\'shish uchun formani to\'ldiring</small></td></tr>';
        if (count) count.textContent = '0 ta';
        
        if (totalProductsEl) totalProductsEl.textContent = "0 ta";
        if (totalCostEl) totalCostEl.textContent = "0 so'm";
        if (totalSaleEl) totalSaleEl.textContent = "0 so'm";
        if (totalProfitEl) totalProfitEl.textContent = "0 so'm";
        return;
    }
    
    var html = '';
    for (var i = 0; i < data.length; i++) {
        var p = data[i];
        
        var cost = Number(p.cost || p.buyPrice || 0);
        var price = Number(p.price || p.sellPrice || 0);
        var stock = Number(p.stock || 0);
        
        var profit = cost > 0 ? ((price - cost) / cost) * 100 : 0;
        var stockClass = stock <= 5 ? "low" : (stock <= 20 ? "medium" : "high");
        var stockText = stock <= 5 ? "🔴 Kam" : (stock <= 20 ? "🟡 O'rtacha" : "🟢 Yetarli");
        
        var imgHtml = p.image ? `<img src="${p.image}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;" />` : (p.emoji || "📦");
        
        var unitSymbol = unitSymbols[p.unit] || p.unit || 'kg';
        var stockDisplay = stock % 1 === 0 ? stock : stock.toFixed(3);
        
        html += '<tr>';
        html += '<td>' + (i + 1) + '</td>';
        html += '<td><div class="product-image-cell">' + imgHtml + '</div></td>';
        html += '<td><strong>' + (p.name || 'Nomsiz') + '</strong></td>';
        html += '<td><span style="background:#f1f5f9;padding:2px 10px;border-radius:12px;font-size:12px;">' + (p.code || '-') + '</span></td>';
        html += '<td>' + unitSymbol + '</td>';
        html += '<td style="font-weight:600;color:' + (stock < 10 ? '#dc2626' : '#064e3b') + ';">' + stockDisplay + '</td>';
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
    if (count) count.textContent = data.length + ' ta';
    
    // JAMI HISOBLAR
    let totalProducts = data.length;
    let totalCost = 0;
    let totalSale = 0;
    let totalProfit = 0;
    
    data.forEach(function(p) {
        const stock = Number(p.stock || 0);
        const cost = Number(p.cost || p.buyPrice || 0);
        const price = Number(p.price || p.sellPrice || 0);
        
        totalCost += cost * stock;
        totalSale += price * stock;
        totalProfit += (price - cost) * stock;
    });
    
    if (totalProductsEl) totalProductsEl.textContent = totalProducts + " ta";
    if (totalCostEl) totalCostEl.textContent = totalCost.toLocaleString() + " so'm";
    if (totalSaleEl) totalSaleEl.textContent = totalSale.toLocaleString() + " so'm";
    if (totalProfitEl) totalProfitEl.textContent = totalProfit.toLocaleString() + " so'm";
}

// ============================================
// DELETE PRODUCT
// ============================================
async function deleteProduct(id) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    
    try {
        const product = products.find(p => p.id === id);
        
        if (product && product.image) {
            console.log("🗑️ Rasm o'chirilmoqda...");
            await deleteImageFromStorage(product.image);
        }
        
        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("❌ DELETE ERROR:", error);
            alert("O'chirishda xatolik!");
            return;
        }

        console.log("✅ Mahsulot o'chirildi!");
        await loadProducts();
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
    
    document.getElementById('editId').value = id;
    document.getElementById('editName').value = product.name;
    document.getElementById('editCode').value = product.code || '';
    document.getElementById('editUnit').value = product.unit || 'kg';
    document.getElementById('editStock').value = product.stock || 0;
    document.getElementById('editBuyPrice').value = product.cost || 0;
    document.getElementById('editSellPrice').value = product.price || 0;
    document.getElementById('editImageUrl').value = product.image || '';
    
    const editPreview = document.getElementById('editImagePreview');
    if (editPreview) {
        if (product.image) {
            editPreview.innerHTML = `<img src="${product.image}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" />`;
        } else {
            editPreview.innerHTML = '<span style="color:#9ca3af;font-size:40px;"><i class="fas fa-image"></i></span>';
        }
    }
    
    const editFileInput = document.getElementById('editImageFile');
    if (editFileInput) {
        editFileInput.value = '';
    }
    
    var profit = product.cost > 0 ? ((product.price - product.cost) / product.cost) * 100 : 0;
    document.getElementById('editProfitPercent').value = profit.toFixed(1);
    
    document.getElementById('editModal').classList.add('active');
}

// ============================================
// UPDATE PRODUCT
// ============================================
async function updateProduct(id, updates) {
    console.log("📤 updateProduct() boshlandi...");
    
    try {
        const { error } = await supabase
            .from("products")
            .update(updates)
            .eq("id", id);

        if (error) {
            console.error("❌ UPDATE ERROR:", error);
            return { success: false, error };
        }

        console.log("✅ Mahsulot yangilandi!");
        await loadProducts();
        return { success: true };
    } catch (err) {
        console.error("❌ Yangilashda xatolik:", err);
        return { success: false, error: err };
    }
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
    
    var imageFile = document.getElementById('editImageFile').files[0];
    var currentImageUrl = document.getElementById('editImageUrl').value;
    
    if (!name) { alert('❌ Mahsulot nomini kiriting!'); return; }
    if (!cost || cost <= 0) { alert('❌ Kelish narxini kiriting!'); return; }
    if (!price || price <= cost) { alert('❌ Sotish narxi kelish narxidan katta bo\'lishi kerak!'); return; }
    
    try {
        let finalImageUrl = currentImageUrl;
        let oldImageUrl = null;
        let newImageUploaded = false;
        
        if (imageFile) {
            console.log("📤 Yangi rasm yuklanmoqda...");
            const newImageUrl = await uploadImageToStorage(imageFile);
            
            if (newImageUrl) {
                finalImageUrl = newImageUrl;
                oldImageUrl = currentImageUrl;
                newImageUploaded = true;
                console.log("✅ Yangi rasm yuklandi:", finalImageUrl);
            } else {
                console.warn("⚠️ Yangi rasm yuklanmadi, eski rasm saqlanadi");
                finalImageUrl = currentImageUrl;
            }
        }
        
        const updates = {
            name: name,
            code: code,
            unit: unit,
            stock: stock,
            cost: cost,
            price: price,
            profit: profit,
            image: finalImageUrl || null
        };
        
        const result = await updateProduct(id, updates);
        
        if (!result.success) {
            alert("Yangilashda xatolik!");
            return;
        }
        
        if (newImageUploaded && oldImageUrl && oldImageUrl.includes('supabase')) {
            console.log("🗑️ Eski rasm o'chirilmoqda...");
            await deleteImageFromStorage(oldImageUrl);
        }

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
}

function clearEditImage() {
    let preview = document.getElementById("editImagePreview");
    if (preview) preview.innerHTML = '<span style="color:#9ca3af;font-size:40px;"><i class="fas fa-image"></i></span>';
    let fileInput = document.getElementById("editImageFile");
    if (fileInput) fileInput.value = "";
    let hidden = document.getElementById("editImageUrl");
    if (hidden) hidden.value = "";
}

// ============================================
// NARX HISOBLASH
// ============================================
function calculatePrice() {
    let cost = parseFloat(document.getElementById("productCost").value) || 0;
    let profit = parseFloat(document.getElementById("productProfit").value) || 0;
    if (cost > 0 && profit > 0) {
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
}

// ============================================
// QIDIRISH
// ============================================
function searchProducts() {
    var query = document.getElementById('searchProduct')?.value?.toLowerCase()?.trim() || '';
    var rows = document.querySelectorAll('#productsTable tr');
    rows.forEach(function(row) {
        var text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

// ============================================
// EXCEL EXPORT (MAHSULOTLAR)
// ============================================
function exportToExcel() {
    console.log("📊 exportToExcel() boshlandi!");
    
    if (!products || products.length === 0) {
        alert("⚠️ Eksport qilish uchun mahsulot yo‘q!");
        return;
    }

    try {
        // XLSX kutubxonasi mavjudligini tekshirish
        if (typeof XLSX === 'undefined') {
            alert("⚠️ XLSX kutubxonasi yuklanmagan! Iltimos, sahifani yangilang.");
            return;
        }

        const data = products.map(function(p) {
            return {
                '№': products.indexOf(p) + 1,
                'Nomi': p.name || 'Nomsiz',
                'Kod': p.code || '-',
                'Birlik': p.unit || '-',
                'Qoldiq': p.stock || 0,
                'Kelish narxi': (p.cost || 0).toLocaleString() + " so'm",
                'Sotish narxi': (p.price || 0).toLocaleString() + " so'm",
                'Foyda foizi': p.profit || 0,
                'Holat': p.stock <= 5 ? 'Kam' : (p.stock <= 20 ? "O'rtacha" : "Yetarli")
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Mahsulotlar");

        // Ustunlar kengligini sozlash
        ws['!cols'] = [
            { wch: 5 },   // №
            { wch: 25 },  // Nomi
            { wch: 15 },  // Kod
            { wch: 10 },  // Birlik
            { wch: 12 },  // Qoldiq
            { wch: 18 },  // Kelish narxi
            { wch: 18 },  // Sotish narxi
            { wch: 12 },  // Foyda foizi
            { wch: 12 }   // Holat
        ];

        // Joriy sana bilan fayl nomi
        const now = new Date();
        const dateStr = now.getFullYear() + '-' + 
                       String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(now.getDate()).padStart(2, '0');
        const fileName = `mahsulotlar_${dateStr}.xlsx`;

        XLSX.writeFile(wb, fileName);
        console.log("✅ Excel fayl yuklandi:", fileName);
        alert("✅ Mahsulotlar Excel formatida yuklandi!");

    } catch (err) {
        console.error("❌ Excel eksportda xatolik:", err);
        alert("Xatolik yuz berdi: " + err.message);
    }
}

// ============================================
// EXCEL IMPORT (MAHSULOT QO'SHISH) - QO'SHILDI
// ============================================
function importFromExcel(event) {
    console.log("📥 importFromExcel() boshlandi!");
    
    const file = event.target.files[0];
    if (!file) {
        alert("⚠️ Iltimos, Excel fayl tanlang!");
        return;
    }

    // Fayl kengaytmasini tekshirish
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
        alert("⚠️ Iltimos, .xlsx, .xls yoki .csv formatdagi fayl tanlang!");
        event.target.value = ''; // Inputni tozalash
        return;
    }

    // XLSX kutubxonasi mavjudligini tekshirish
    if (typeof XLSX === 'undefined') {
        alert("⚠️ XLSX kutubxonasi yuklanmagan! Iltimos, sahifani yangilang.");
        event.target.value = '';
        return;
    }

    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            const json = XLSX.utils.sheet_to_json(sheet);

            console.log("📥 Excel data:", json);
            console.log("📥 Jami qatorlar:", json.length);

            if (json.length === 0) {
                alert("⚠️ Excel faylda ma'lumot topilmadi!");
                return;
            }

            let addedCount = 0;
            let skippedCount = 0;
            let errors = [];

            // progress bar yoki loading ko'rsatish
            const totalItems = json.length;
            let processed = 0;

            for (let item of json) {
                try {
                    // Har xil ustun nomlarini qo'llab-quvvatlash
                    const name = item.Nomi || item.name || item['Mahsulot nomi'] || item['Nomi'] || item['Mahsulot'] || null;
                    const code = item.Kod || item.code || item['Mahsulot kodi'] || null;
                    const unit = item.Birlik || item.unit || item['O\'lchov birligi'] || "dona";
                    const stock = Number(item.Qoldiq || item.stock || item['Miqdor'] || 0);
                    const cost = Number(item.KelishNarx || item.cost || item['Kelish narxi'] || 0);
                    const price = Number(item.SotishNarx || item.price || item['Sotish narxi'] || 0);
                    const profit = Number(item.FoydaFoiz || item.profit || item['Foyda foizi'] || 0);

                    if (!name) {
                        skippedCount++;
                        continue;
                    }

                    // Agar kod bo'lmasa, avtomatik yaratish
                    let finalCode = code;
                    if (!finalCode) {
                        const prefix = name.substring(0, 2).toUpperCase();
                        finalCode = prefix + "-" + String(Date.now()).slice(-4) + "-" + String(addedCount).padStart(2, '0');
                    }

                    // Supabase ga qo'shish
                    const { error } = await supabase
                        .from("products")
                        .insert([{
                            name: name,
                            code: finalCode,
                            unit: unit || "dona",
                            stock: stock || 0,
                            cost: cost || 0,
                            price: price || 0,
                            profit: profit || 0,
                            emoji: "📦",
                            image: null
                        }]);

                    if (error) {
                        console.error("❌ Qo'shishda xatolik:", error, item);
                        errors.push(`❌ ${name}: ${error.message}`);
                        skippedCount++;
                    } else {
                        addedCount++;
                        console.log(`✅ ${addedCount}. ${name} qo'shildi`);
                    }

                    processed++;
                    // Progressni ko'rsatish (agar progress bar bo'lsa)
                    if (typeof updateImportProgress === 'function') {
                        updateImportProgress(processed, totalItems);
                    }

                } catch (itemError) {
                    console.error("❌ Qatorni qo'shishda xatolik:", itemError, item);
                    errors.push(`❌ Xatolik: ${itemError.message}`);
                    skippedCount++;
                }
            }

            // Xulosa
            let msg = "✅ Excel import yakunlandi!\n\n";
            msg += "📊 Natija:\n";
            msg += `✅ Qo'shilgan: ${addedCount} ta\n`;
            msg += `⏭️ O'tkazib yuborilgan: ${skippedCount} ta\n`;
            msg += `📁 Jami qatorlar: ${totalItems} ta\n`;

            if (errors.length > 0) {
                msg += "\n⚠️ Xatoliklar:\n";
                errors.slice(0, 5).forEach(function(err) {
                    msg += `  ${err}\n`;
                });
                if (errors.length > 5) {
                    msg += `  ... va ${errors.length - 5} ta xatolik`;
                }
            }

            alert(msg);
            console.log("📊 Import statistikasi:", { addedCount, skippedCount, totalItems, errors });

            // Mahsulotlarni qayta yuklash
            await loadProducts();

            // Inputni tozalash
            event.target.value = '';

        } catch (err) {
            console.error("❌ Excel import xatolik:", err);
            alert("❌ Excel importda xatolik yuz berdi!\n" + err.message);
            event.target.value = '';
        }
    };

    reader.onerror = function(err) {
        console.error("❌ Faylni o'qishda xatolik:", err);
        alert("❌ Faylni o'qishda xatolik yuz berdi!");
        event.target.value = '';
    };

    reader.readAsArrayBuffer(file);
}

// ============================================
// BOSHLANG'ICH
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("📦 DOM ready - Mahsulotlar sahifasi yuklandi!");
    
    // Sana va vaqt
    updateDate();
    setInterval(updateDate, 1000);
    
    // Supabase ulanishini tekshirish
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
    
    // Mahsulotlarni yuklash
    loadProducts();
    
    // Qidirish inputiga event listener
    const searchInput = document.getElementById('searchProduct');
    if (searchInput) {
        searchInput.addEventListener('input', searchProducts);
    }
    
    // Rasm yuklash inputiga event listener
    const imageInput = document.getElementById('productImageFile');
    if (imageInput) {
        imageInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                previewImage(this.files[0]);
            }
        });
    }
    
    // Tahrirlash oynasidagi rasm yuklash inputiga event listener
    const editImageInput = document.getElementById('editImageFile');
    if (editImageInput) {
        editImageInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                previewEditImage(this.files[0]);
            }
        });
    }
    
    // Quick add uchun Enter tugmasi
    const qName = document.getElementById('q_name');
    const qPrice = document.getElementById('q_price');
    
    if (qName) {
        qName.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const priceInput = document.getElementById('q_price');
                if (priceInput) priceInput.focus();
            }
        });
    }
    
    if (qPrice) {
        qPrice.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                quickAddProduct();
            }
        });
    }
    
    // Excel eksport tugmasi
    const exportBtn = document.getElementById('exportExcelBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }
    
    // Excel import inputi
    const importInput = document.getElementById('importExcelInput');
    if (importInput) {
        importInput.addEventListener('change', importFromExcel);
    }window.quickAddProduct = quickAddProduct;
window.exportToExcel = exportToExcel;
});
