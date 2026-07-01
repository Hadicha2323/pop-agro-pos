// ============================================
// SUPABASE KONFIGURATSIYA
// ============================================

console.log("🟢 Supabase INIT START");

// ===============================
// CONFIG
// ===============================
const SUPABASE_URL = "https://qpoytyonrvidqgkmuyrp.supabase.co";

// 👉 SUPABASE DASHBOARD'DAN OLINGAN ANON KEY
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb3l0eW9ucnZpZHFna211eXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NTEzNTgsImV4cCI6MjA5ODIyNzM1OH0.WrDjx7eVcr0pAecVawLs7Cyb4ngfhMMEK4CKat6zs80";

// ===============================
// INIT CLIENT
// ===============================
if (typeof supabase === 'undefined') {
    console.error('❌ Supabase JS library topilmadi!');
} else {
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Supabase CONNECTED");
}

// ===============================
// TEST CONNECTION
// ===============================
async function testSupabase() {
    try {
        const { data, error } = await supabase.from("products").select("*").limit(1);
        
        console.log("🧪 TEST RESULT:");
        console.log("DATA:", data);
        console.log("ERROR:", error);
        
        if (error) {
            console.error("❌ Supabase ulanishida xatolik:", error.message);
            return { success: false, error };
        }
        
        console.log("✅ Supabase ulanishi muvaffaqiyatli!");
        return { success: true, data };
    } catch (err) {
        console.error("❌ Testda xatolik:", err);
        return { success: false, error: err };
    }
}

// ===============================
// LOAD PRODUCTS
// ===============================
async function loadProductsFromSupabase() {
    console.log("📥 loadProductsFromSupabase() boshlandi...");
    
    try {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            console.error("❌ LOAD ERROR:", error);
            return { success: false, error, data: [] };
        }

        console.log("🟢 PRODUCTS LOADED:", data?.length || 0, "ta");
        return { success: true, data: data || [] };
        
    } catch (err) {
        console.error("❌ Yuklashda xatolik:", err);
        return { success: false, error: err, data: [] };
    }
}

// ===============================
// ADD PRODUCT
// ===============================
async function addProductToSupabase(product) {
    console.log("📤 addProductToSupabase() boshlandi...");
    
    try {
        const { data, error } = await supabase
            .from("products")
            .insert([product])
            .select();

        if (error) {
            console.error("❌ INSERT ERROR:", error);
            return { success: false, error, data: null };
        }

        console.log("🟢 PRODUCT ADDED:", data);
        return { success: true, data: data ? data[0] : null };
        
    } catch (err) {
        console.error("❌ Qo'shishda xatolik:", err);
        return { success: false, error: err, data: null };
    }
}

// ===============================
// UPDATE PRODUCT
// ===============================
async function updateProductInSupabase(id, updates) {
    console.log("📤 updateProductInSupabase() boshlandi...");
    
    try {
        const { data, error } = await supabase
            .from("products")
            .update(updates)
            .eq("id", id)
            .select();

        if (error) {
            console.error("❌ UPDATE ERROR:", error);
            return { success: false, error, data: null };
        }

        console.log("🟢 PRODUCT UPDATED:", data);
        return { success: true, data: data ? data[0] : null };
        
    } catch (err) {
        console.error("❌ Yangilashda xatolik:", err);
        return { success: false, error: err, data: null };
    }
}

// ===============================
// DELETE PRODUCT
// ===============================
async function deleteProductFromSupabase(id) {
    console.log("📤 deleteProductFromSupabase() boshlandi...");
    
    try {
        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("❌ DELETE ERROR:", error);
            return { success: false, error };
        }

        console.log("🟢 PRODUCT DELETED:", id);
        return { success: true };
        
    } catch (err) {
        console.error("❌ O'chirishda xatolik:", err);
        return { success: false, error: err };
    }
}

// ===============================
// IMAGE UPLOAD (STORAGE)
// ===============================
async function uploadImageToStorage(file) {
    if (!file) {
        console.warn("⚠️ Fayl topilmadi!");
        return null;
    }

    try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        console.log("📤 Rasm yuklanmoqda:", fileName);

        const { data, error } = await supabase.storage
            .from("products")
            .upload(filePath, file);

        if (error) {
            console.error("❌ UPLOAD ERROR:", error);
            return null;
        }

        console.log("✅ Rasm yuklandi:", data);

        const { data: urlData } = supabase.storage
            .from("products")
            .getPublicUrl(filePath);

        return urlData.publicUrl;

    } catch (err) {
        console.error("❌ Rasm yuklashda xatolik:", err);
        return null;
    }
}

// ===============================
// DELETE IMAGE (STORAGE)
// ===============================
async function deleteImageFromStorage(imageUrl) {
    if (!imageUrl) return true;
    if (!imageUrl.includes('supabase')) return true;
    
    try {
        // URL dan fayl path ni ajratib olish
        let filePath = '';
        
        if (imageUrl.includes('/storage/v1/object/public/')) {
            const parts = imageUrl.split('/storage/v1/object/public/');
            if (parts.length > 1) {
                let pathPart = parts[1];
                const pathParts = pathPart.split('/');
                if (pathParts.length > 0) {
                    pathParts.shift(); // Bucket nomini olib tashlaymiz
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
            .from("products")
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

// ===============================
// GLOBAL DEBUG
// ===============================
window.testSupabase = testSupabase;
window.loadProductsFromSupabase = loadProductsFromSupabase;
window.addProductToSupabase = addProductToSupabase;
window.updateProductInSupabase = updateProductInSupabase;
window.deleteProductFromSupabase = deleteProductFromSupabase;
window.uploadImageToStorage = uploadImageToStorage;
window.deleteImageFromStorage = deleteImageFromStorage;

console.log("🚀 Supabase ready!");
console.log("📚 Available functions:");
console.log("  - testSupabase()");
console.log("  - loadProductsFromSupabase()");
console.log("  - addProductToSupabase(product)");
console.log("  - updateProductInSupabase(id, updates)");
console.log("  - deleteProductFromSupabase(id)");
console.log("  - uploadImageToStorage(file)");
console.log("  - deleteImageFromStorage(imageUrl)");
