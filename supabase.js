console.log("🟢 supabase.js yuklandi!");

const SUPABASE_URL = "https://qpoytyonrvidqgkmuyrp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZB12frZ9czkBu79T0h7gAA_PoMyHsKn";

window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("✅ Supabase ulandi!");
// ============================================
// RASMNI SUPABASE STORAGE GA YUKLASH
// ============================================
async function uploadImageToStorage(file) {
    if (!file) return null;
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
        const filePath = `products/${fileName}`;
        
        const { data, error } = await supabase.storage
            .from('products')
            .upload(filePath, file);
        
        if (error) {
            console.error('❌ Rasm yuklashda xatolik:', error);
            return null;
        }
        
        const { data: urlData } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);
        
        return urlData.publicUrl;
        
    } catch (err) {
        console.error('❌ Xatolik:', err);
        return null;
    }
}