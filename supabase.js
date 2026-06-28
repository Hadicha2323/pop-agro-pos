// supabase.js

const SUPABASE_URL = "https://totfrawgnooklgdrixqs.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZB12frZ9czkBu79T0h7gAA_PoMyHsKn";

// Supabase client yaratish
const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// global qilish (products.html ishlashi uchun)
window.supabase = client;

console.log("✅ Supabase ulandi");