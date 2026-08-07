// =========================
// CASEme Supabase接続設定
// =========================

// SupabaseのProject URLを入力します
const CASEME_SUPABASE_URL =
  "https://hnqobrazwllfnhpwznvw.supabase.co";

// SupabaseのPublishable keyを入力します
const CASEME_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_qe1-OUAV0LQOD7un_6f8Rg_-RuVT2qG";

// Supabaseへ接続するクライアントを作成します
const caseMeSupabase = window.supabase.createClient(
  CASEME_SUPABASE_URL,
  CASEME_SUPABASE_PUBLISHABLE_KEY
);

