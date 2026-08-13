// =========================
// Supabase お気に入り管理
// =========================

// ログイン中のユーザー情報を取得します
async function getFavoriteUser() {
  const {
    data: { user },
    error
  } = await caseMeSupabase.auth.getUser();

  // 未ログイン時はSupabaseの英語エラーを表示しません
  if (!user) {
    return null;
  }

  if (error) {
    throw error;
  }

  return user;
}

// ログイン中のユーザーがお気に入りにした投稿IDを取得します
async function fetchFavoritePostIds() {
  const user = await getFavoriteUser();

  // 未ログインの場合は空の配列を返します
  if (!user) {
    return [];
  }

  const { data, error } = await caseMeSupabase
    .from("favorites")
    .select("post_id")
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  return (data ?? []).map((favorite) => {
    return favorite.post_id;
  });
}

// 投稿をお気に入りへ追加します
async function addSupabaseFavorite(postId) {
  const user = await getFavoriteUser();

  if (!user) {
    throw new Error(
      "お気に入りを追加するにはログインが必要です。"
    );
  }

  const { error } = await caseMeSupabase
    .from("favorites")
    .insert({
      user_id: user.id,
      post_id: postId
    });

  if (error) {
    throw error;
  }
}

// 投稿をお気に入りから削除します
async function removeSupabaseFavorite(postId) {
  const user = await getFavoriteUser();

  if (!user) {
    throw new Error(
      "お気に入りを解除するにはログインが必要です。"
    );
  }

  const { error } = await caseMeSupabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("post_id", postId);

  if (error) {
    throw error;
  }
}