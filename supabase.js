const SUPABASE_URL = "https://qpoytyonrvidqgkmuyrp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_4QscGpNNUuaU_QgQ7QKp8Q_ZDzMnh65";

window.supabase = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log("✅ Supabase ulandi");