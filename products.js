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
// SUPABASE STORAGE - RASM O'CHIRISH (1-MUAMMO TUZATILDI)
// ============================================
async function deleteImageFromStorage(imageUrl) {
    if (!imageUrl) return true;
    if (!imageUrl.includes('supabase')) return true;
    
    try {
        // URL dan fayl path ni ajratib olish
        let filePath = '';
        
        // Public URL format: https://xxxxx.supabase.co/storage/v1/object/public/products/products/1718182828.png
        // Storage remove() uchun: products/1718182828.png (bucket ichidagi path)
        
        // 1-USUL: /storage/v1/object/public/ dan keyingi qism
        if (imageUrl.includes('/storage/v1/object/public/')) {
            const parts = imageUrl.split('/storage/v1/object/public/');
            if (parts.length > 1) {
                // products/products/1718182828.png
                let pathPart = parts[1];
                const pathParts = pathPart.split('/');
                
                // Bucket nomini olib tashlash (birinchi element)
                if (pathParts.length > 0) {
                    pathParts.shift(); // 'products' bucket nomini olib tashlaymiz
                    filePath = pathParts.join('/');
                }
            }
        }
        
        // 2-USUL: Agar yuqoridagi usul ishlamasa
        if (!filePath) {
            // products/products/1718182828.png dan products/1718182828.png ga
            const productsIndex = imageUrl.indexOf('products');
            if (productsIndex !== -1) {
                const afterBucket = imageUrl.substring(productsIndex);
                const parts = afterBucket.split('/');
                if (parts.length > 1) {
                    // Birinchi 'products' bucket nomi, qolgani path
                    parts.shift(); // Bucket nomini olib tashlaymiz
                    filePath = parts.join('/');
                } else {
                    filePath = afterBucket;
                }
            }
        }
        
        // 3-USUL: Agar filePath bo'sh bo'lsa, oxirgi qismni olamiz
        if (!filePath) {
            console.warn('⚠️ File path aniqlanmadi, oxirgi qismdan olishga harakat:', imageUrl);
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
async function loadProductsFromSupabase() {
    console.log("📥 loadProductsFromSupabase() boshlandi...");
    
    try {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            console.error("❌ SUPABASE ERROR:", error);
            products = JSON.parse(localStorage.getItem('products')) || [];
            renderProducts();
            return;
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
// MAHSULOT QO'SHISH (3, 5-MUAMMOLAR TUZATILDI)
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
    
    let imageFile = document.getElementById("productImageFile").files[0];

    console.log("📦 Mahsulot ma'lumotlari:", { name, code, unit, stock, cost, price, profit, emoji });

    // 2. TEKSHIRISH (5-MUAMMO TUZATILDI)
    if (!name) { alert("⚠️ Mahsulot nomini kiriting!"); return; }
    if (cost <= 0) { alert("⚠️ Kelish narxini kiriting!"); return; }
    if (price <= cost) { alert("⚠️ Sotish narxi kelish narxidan katta bo'lishi kerak!"); return; }

    // 3. KOD AVTOMATIK
    if (!code) {
        let prefix = name.substring(0, 2).toUpperCase();
        code = prefix + "-" + String(Date.now()).slice(-4);
        console.log("🔑 Avtomatik kod:", code);
    }

    // 4. RASMNI STORAGE GA YUKLASH
    let finalImageUrl = null;
    if (imageFile) {
        console.log("📤 Rasm yuklanmoqda...");
        finalImageUrl = await uploadImageToStorage(imageFile);
        if (finalImageUrl) {
            console.log("✅ Rasm yuklandi:", finalImageUrl);
        } else {
            console.warn("⚠️ Rasm yuklanmadi, davom etilmoqda...");
        }
    }

    // 5. SUPABASE GA QO'SHISH (3-MUAMMO TUZATILDI)
    try {
        console.log("📤 Supabase ga yozish boshlandi...");
        
        const { error } = await supabase
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
                image: finalImageUrl || null
            }]);

        if (error) {
            console.error("❌ Qo'shishda xatolik:", error);
            alert("Xatolik: " + error.message);
            return;
        }

        console.log("✅ Mahsulot qo'shildi!");
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
    
    const totalProductsEl = document.getElementById("totalProducts");
    const totalCostEl = document.getElementById("totalCost");
    const totalSaleEl = document.getElementById("totalSale");
    const totalProfitEl = document.getElementById("totalProfit");
    
    if (!tbody) {
        console.error("❌ productsTable topilmadi!");
        return;
    }
    
    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;color:#6b7280;padding:40px;"><i class="fas fa-box" style="font-size:32px;display:block;margin-bottom:10px;"></i>Hali mahsulot mavjud emas<br><small style="font-size:12px;color:#9ca3af;">Yangi mahsulot qo\'shish uchun formani to\'ldiring</small></td></tr>';
        if (count) count.textContent = '0 ta';
        
        if (totalProductsEl) totalProductsEl.textContent = "0 ta";
        if (totalCostEl) totalCostEl.textContent = "0 so'm";
        if (totalSaleEl) totalSaleEl.textContent = "0 so'm";
        if (totalProfitEl) totalProfitEl.textContent = "0 so'm";
        return;
    }
    
    var html = '';
    for (var i = 0; i < products.length; i++) {
        var p = products[i];
        
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
    if (count) count.textContent = products.length + ' ta';
    
    // JAMI HISOBLAR
    let totalProducts = products.length;
    let totalCost = 0;
    let totalSale = 0;
    let totalProfit = 0;
    
    products.forEach(function(p) {
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
    
    document.getElementById('editId').value = id;
    document.getElementById('editName').value = product.name;
    document.getElementById('editCode').value = product.code || '';
    document.getElementById('editUnit').value = product.unit || 'kg';
    document.getElementById('editStock').value = product.stock || 0;
    document.getElementById('editBuyPrice').value = product.cost || 0;
    document.getElementById('editSellPrice').value = product.price || 0;
    document.getElementById('editImageUrl').value = product.image || '';
    
    // Eski rasmni ko'rsatish
    const editPreview = document.getElementById('editImagePreview');
    if (editPreview) {
        if (product.image) {
            editPreview.innerHTML = `<img src="${product.image}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" />`;
        } else {
            editPreview.innerHTML = '<span style="color:#9ca3af;font-size:40px;"><i class="fas fa-image"></i></span>';
        }
    }
    
    // Rasm fayl inputini tozalash
    const editFileInput = document.getElementById('editImageFile');
    if (editFileInput) {
        editFileInput.value = '';
    }
    
    var profit = product.cost > 0 ? ((product.price - product.cost) / product.cost) * 100 : 0;
    document.getElementById('editProfitPercent').value = profit.toFixed(1);
    
    document.getElementById('editModal').classList.add('active');
}

// ============================================
// TAHRIRLASHNI SAQLASH (2-MUAMMO TUZATILDI)
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
    
    // 5-MUAMMO - TEKSHIRISH
    if (!name) { alert('❌ Mahsulot nomini kiriting!'); return; }
    if (!cost || cost <= 0) { alert('❌ Kelish narxini kiriting!'); return; }
    if (!price || price <= cost) { alert('❌ Sotish narxi kelish narxidan katta bo\'lishi kerak!'); return; }
    
    try {
        let finalImageUrl = currentImageUrl;
        let oldImageUrl = null;
        let newImageUploaded = false;
        
        // 1. AGAR YANGI RASM YUKLANGAN BO'LSA, AVVAL YUKLAYMIZ
        if (imageFile) {
            console.log("📤 Yangi rasm yuklanmoqda...");
            const newImageUrl = await uploadImageToStorage(imageFile);
            
            if (newImageUrl) {
                // Yangi rasm muvaffaqiyatli yuklandi
                finalImageUrl = newImageUrl;
                oldImageUrl = currentImageUrl; // Eski rasm URL sini saqlaymiz
                newImageUploaded = true;
                console.log("✅ Yangi rasm yuklandi:", finalImageUrl);
            } else {
                console.warn("⚠️ Yangi rasm yuklanmadi, eski rasm saqlanadi");
                finalImageUrl = currentImageUrl;
            }
        }
        
        // 2. DATABASE NI YANGILAYMIZ
        console.log("📤 Database yangilanmoqda...");
        const { error } = await supabase
            .from("products")
            .update({ 
                name, 
                code, 
                unit, 
                stock, 
                cost, 
                price, 
                profit,
                image: finalImageUrl || null
            })
            .eq("id", id);

        if (error) {
            console.error("❌ Yangilashda xatolik:", error);
            alert("Yangilashda xatolik!");
            return;
        }
        
        // 3. DATABASE MUVAFFAQIYATLI YANGILANDI, ENDI ESKI RASMNI O'CHIRAMIZ
        if (newImageUploaded && oldImageUrl && oldImageUrl.includes('supabase')) {
            console.log("🗑️ Eski rasm o'chirilmoqda...");
            await deleteImageFromStorage(oldImageUrl);
        }

        console.log("✅ Mahsulot yangilandi!");
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
    loadProductsFromSupabase();
    
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
});
