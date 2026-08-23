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
    avatarUrl: getProfileAvatarPublicUrl(
      data.avatar_url
    ),
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
    avatarUrl: getProfileAvatarPublicUrl(
      data.avatar_url
    ),    
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

// 複数の投稿者プロフィールを一度に取得します
async function fetchProfilesByIds(userIds) {
  const uniqueUserIds = [...new Set(
    userIds.filter(Boolean)
  )];

  if (uniqueUserIds.length === 0) {
    return new Map();
  }

  const { data, error } = await caseMeSupabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url"
    )
    .in("id", uniqueUserIds);

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((profile) => {
      return [
        profile.id,
        {
          id: profile.id,
          username: profile.username ?? "",
          displayName: profile.display_name ?? "",
          avatarUrl: getProfileAvatarPublicUrl(
            profile.avatar_url
          )
        }
      ];
    })
  );
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
    avatarUrl: getProfileAvatarPublicUrl(
      data.avatar_url
    ),    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

// =========================
// プロフィール画像
// =========================

// Storage内の画像パスから公開URLを作ります
function getProfileAvatarPublicUrl(imagePath) {
  if (!imagePath) {
    return "";
  }

  // すでにURLの場合はそのまま返します
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://")
  ) {
    return imagePath;
  }

  const { data } = caseMeSupabase.storage
    .from("profile-images")
    .getPublicUrl(imagePath);

  return data.publicUrl;
}

// ログイン中のユーザーのプロフィール画像を保存します
async function uploadCurrentProfileAvatar(imageFile) {
  const user = await getCurrentProfileUser();

  if (!user) {
    throw new Error(
      "プロフィール画像を変更するにはログインが必要です。"
    );
  }

  if (!imageFile) {
    throw new Error(
      "プロフィール画像を選択してください。"
    );
  }

  const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedImageTypes.includes(imageFile.type)) {
    throw new Error(
      "JPEG・PNG・WebP形式の画像を選択してください。"
    );
  }

  if (imageFile.size > 2 * 1024 * 1024) {
    throw new Error(
      "プロフィール画像は2MB以下にしてください。"
    );
  }

  const extensionByType = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  };

  const fileExtension =
    extensionByType[imageFile.type];

  const imagePath =
    `${user.id}/avatar-${Date.now()}.${fileExtension}`;

  // 現在登録されている画像パスを取得します
  const {
    data: currentProfile,
    error: profileReadError
  } = await caseMeSupabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (profileReadError) {
    throw profileReadError;
  }

  const previousImagePath =
    currentProfile.avatar_url ?? "";

  // 新しい画像をStorageへ保存します
  const { error: uploadError } =
    await caseMeSupabase.storage
      .from("profile-images")
      .upload(imagePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type
      });

  if (uploadError) {
    throw uploadError;
  }

  // profilesテーブルへ新しい画像パスを保存します
  const { error: updateError } =
    await caseMeSupabase
      .from("profiles")
      .update({
        avatar_url: imagePath,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

  if (updateError) {
    // DB更新に失敗した場合は、新しく保存した画像を片付けます
    await caseMeSupabase.storage
      .from("profile-images")
      .remove([imagePath]);

    throw updateError;
  }

  // 以前の画像があれば、更新成功後に削除します
  if (
    previousImagePath &&
    previousImagePath !== imagePath &&
    !previousImagePath.startsWith("http://") &&
    !previousImagePath.startsWith("https://")
  ) {
    const { error: removeError } =
      await caseMeSupabase.storage
        .from("profile-images")
        .remove([previousImagePath]);

    // 古い画像の削除失敗だけでは保存を失敗扱いにしません
    if (removeError) {
      console.error(
        "以前のプロフィール画像を削除できませんでした。",
        removeError
      );
    }
  }

  return {
    imagePath,
    imageUrl:
      getProfileAvatarPublicUrl(imagePath)
  };
}
