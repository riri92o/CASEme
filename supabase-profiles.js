// =========================
// Supabase プロフィール管理
// =========================

// ログイン中のユーザー情報を取得します
async function getCurrentProfileUser() {
  const {
    data: { user },
    error
  } = await caseMeSupabase.auth.getUser();

  if (!user) {
    return null;
  }

  if (error) {
    throw error;
  }

  return user;
}

// ログイン中のユーザーのプロフィールを取得します
async function fetchCurrentProfile() {
  const user = await getCurrentProfileUser();

  if (!user) {
    return null;
  }

  const { data, error } = await caseMeSupabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, avatar_url, created_at, updated_at"
    )
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    username: data.username ?? "",
    displayName: data.display_name ?? "",
    bio: data.bio ?? "",
    avatarUrl: data.avatar_url ?? "",
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

// 指定したユーザーの公開プロフィールを取得します
async function fetchProfileById(userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await caseMeSupabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, avatar_url, created_at, updated_at"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    username: data.username ?? "",
    displayName: data.display_name ?? "",
    bio: data.bio ?? "",
    avatarUrl: data.avatar_url ?? "",
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

// ログイン中のユーザーのプロフィールを更新します
async function updateCurrentProfile(profileData) {
  const user = await getCurrentProfileUser();

  if (!user) {
    throw new Error(
      "プロフィールを編集するにはログインが必要です。"
    );
  }

  const displayName =
    profileData.displayName.trim();

  const username = profileData.username
    .trim()
    .toLowerCase()
    .replace(/^@+/, "");

  const bio = profileData.bio.trim();

  if (displayName === "") {
    throw new Error("表示名を入力してください。");
  }

  if (
    username !== "" &&
    !/^[a-z0-9_]{3,20}$/.test(username)
  ) {
    throw new Error(
      "ユーザー名は半角英数字と_を使い、3〜20文字で入力してください。"
    );
  }

  if (bio.length > 160) {
    throw new Error(
      "自己紹介は160文字以内で入力してください。"
    );
  }

  const { data, error } = await caseMeSupabase
    .from("profiles")
    .update({
      display_name: displayName,
      username: username || null,
      bio,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id)
    .select(
      "id, username, display_name, bio, avatar_url, created_at, updated_at"
    )
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "このユーザー名はすでに使用されています。"
      );
    }

    throw error;
  }

  return {
    id: data.id,
    username: data.username ?? "",
    displayName: data.display_name ?? "",
    bio: data.bio ?? "",
    avatarUrl: data.avatar_url ?? "",
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}