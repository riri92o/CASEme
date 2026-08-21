// =========================
// CASEme Supabase投稿処理
// =========================

const CASE_IMAGE_BUCKET = "case-images";

// Data URL形式の画像を、アップロード用Blobへ変換します
async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

// Storage内の画像から公開URLを取得します
function getCaseImagePublicUrl(imagePath) {
  const { data } = caseMeSupabase.storage
    .from(CASE_IMAGE_BUCKET)
    .getPublicUrl(imagePath);

  return data.publicUrl;
}

// Supabaseの列名をCASEmeで使う名前へ変換します
function convertSupabasePost(data) {
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    description: data.description,
    tags: data.tags ?? [],
    deviceType: data.device_type ?? "",
    deviceName: data.device_name ?? "",

    caseName: data.case_name ?? "",
    caseShop: data.case_shop ?? "",

    stickers: data.stickers ?? [],
    keychains: data.keychains ?? [],

    otherItems: data.other_items ?? "",
    imagePath: data.image_path,
    imageUrl: getCaseImagePublicUrl(
      data.image_path
    ),

    createdAt: data.created_at,
    updatedAt: data.updated_at,
    isLiked: false,
    storageType: "supabase"
  };
}

// 新しい投稿をSupabaseへ保存します
async function createSupabasePost(postData) {
  // 現在ログイン中のユーザーを確認します
  const {
    data: { user },
    error: userError
  } = await caseMeSupabase.auth.getUser();

  if (userError || !user) {
    throw new Error(
      "投稿するにはログインが必要です。"
    );
  }

  // 画像をアップロード可能な形式へ変換します
  const imageBlob = await dataUrlToBlob(
    postData.imageUrl
  );

  const imageFileName = `${crypto.randomUUID()}.jpg`;

  // RLSのルールに合わせて、
  // ユーザーIDを先頭フォルダにします
  const imagePath =
    `${user.id}/${imageFileName}`;

  const { error: uploadError } =
    await caseMeSupabase.storage
      .from(CASE_IMAGE_BUCKET)
      .upload(imagePath, imageBlob, {
        contentType: "image/jpeg",
        upsert: false
      });

  if (uploadError) {
    throw new Error(
      `画像を保存できませんでした：${uploadError.message}`
    );
  }

  // 投稿情報をデータベースへ保存します
  const { data, error: insertError } =
    await caseMeSupabase
      .from("posts")
      .insert({
        user_id: user.id,
        title: postData.title,
        description: postData.description,
        tags: postData.tags,
        device_type: postData.deviceType || null,
        device_name: postData.deviceName || null,

        case_name: postData.caseName || null,
        case_shop: postData.caseShop || null,

        stickers: postData.stickers,
        keychains: postData.keychains,

        other_items: postData.otherItems || null,
        image_path: imagePath
      })
      .select()
      .single();

  if (insertError) {
    // データベース保存に失敗した場合は、
    // 先にアップロードした画像を取り除きます
    await caseMeSupabase.storage
      .from(CASE_IMAGE_BUCKET)
      .remove([imagePath]);

    throw new Error(
      `投稿情報を保存できませんでした：${insertError.message}`
    );
  }

  return convertSupabasePost(data);
}

// Supabaseから新しい順に投稿を取得します
async function fetchSupabasePosts() {
  const { data, error } = await caseMeSupabase
    .from("posts")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    throw new Error(
      `投稿を読み込めませんでした：${error.message}`
    );
  }

  return data.map((post) => {
    return convertSupabasePost(post);
  });
}

// =========================
// Supabase投稿の編集
// =========================

async function updateSupabasePost(
  postData,
  previousPost
) {
  const {
    data: { user },
    error: userError
  } = await caseMeSupabase.auth.getUser();

  if (userError || !user) {
    throw new Error(
      "投稿を編集するにはログインが必要です。"
    );
  }

  let imagePath = previousPost.imagePath;
  let newlyUploadedImagePath = null;

  // 新しい画像が選ばれた場合はData URLになります
  const hasNewImage =
    typeof postData.imageUrl === "string" &&
    postData.imageUrl.startsWith("data:");

  if (hasNewImage) {
    const imageBlob = await dataUrlToBlob(
      postData.imageUrl
    );

    const imageFileName =
      `${crypto.randomUUID()}.jpg`;

    newlyUploadedImagePath =
      `${user.id}/${imageFileName}`;

    const { error: uploadError } =
      await caseMeSupabase.storage
        .from(CASE_IMAGE_BUCKET)
        .upload(
          newlyUploadedImagePath,
          imageBlob,
          {
            contentType: "image/jpeg",
            upsert: false
          }
        );

    if (uploadError) {
      throw new Error(
        `新しい画像を保存できませんでした：${uploadError.message}`
      );
    }

    imagePath = newlyUploadedImagePath;
  }

  const { data, error: updateError } =
    await caseMeSupabase
      .from("posts")
      .update({
        title: postData.title,
        description: postData.description,
        tags: postData.tags,
        device_type: postData.deviceType || null,
        device_name: postData.deviceName || null,

        case_name: postData.caseName || null,
        case_shop: postData.caseShop || null,

        stickers: postData.stickers,
        keychains: postData.keychains,

        other_items: postData.otherItems || null,
        image_path: imagePath,
        updated_at: new Date().toISOString()
      })
      .eq("id", previousPost.id)
      .eq("user_id", user.id)
      .select()
      .single();

  if (updateError) {
    // 更新に失敗した場合、新しく追加した画像を削除します
    if (newlyUploadedImagePath) {
      await caseMeSupabase.storage
        .from(CASE_IMAGE_BUCKET)
        .remove([newlyUploadedImagePath]);
    }

    throw new Error(
      `投稿を更新できませんでした：${updateError.message}`
    );
  }

  // 更新成功後に古い画像を削除します
  if (
    newlyUploadedImagePath &&
    previousPost.imagePath
  ) {
    const { error: removeOldImageError } =
      await caseMeSupabase.storage
        .from(CASE_IMAGE_BUCKET)
        .remove([previousPost.imagePath]);

    if (removeOldImageError) {
      console.warn(
        "古い画像を削除できませんでした。",
        removeOldImageError
      );
    }
  }

  return convertSupabasePost(data);
}

// =========================
// Supabase投稿の削除
// =========================

async function deleteSupabasePost(postData) {
  const {
    data: { user },
    error: userError
  } = await caseMeSupabase.auth.getUser();

  if (userError || !user) {
    throw new Error(
      "投稿を削除するにはログインが必要です。"
    );
  }

  const { error: deleteError } =
    await caseMeSupabase
      .from("posts")
      .delete()
      .eq("id", postData.id)
      .eq("user_id", user.id);

  if (deleteError) {
    throw new Error(
      `投稿を削除できませんでした：${deleteError.message}`
    );
  }

  // データベース削除後に画像も削除します
  if (postData.imagePath) {
    const { error: imageDeleteError } =
      await caseMeSupabase.storage
        .from(CASE_IMAGE_BUCKET)
        .remove([postData.imagePath]);

    if (imageDeleteError) {
      console.warn(
        "投稿画像を削除できませんでした。",
        imageDeleteError
      );
    }
  }
}