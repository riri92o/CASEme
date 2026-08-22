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
  const imagePaths =
    Array.isArray(data.image_paths) && data.image_paths.length > 0
      ? data.image_paths
      : data.image_path
        ? [data.image_path]
        : [];

  const imageUrls = imagePaths.map((imagePath) => {
    return getCaseImagePublicUrl(imagePath);
  });

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
    imagePaths,
    imageUrls,
    imagePath: imagePaths[0] ?? "",
    imageUrl: imageUrls[0] ?? "",

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

  const sourceImageUrls =
    Array.isArray(postData.imageUrls) && postData.imageUrls.length > 0
      ? postData.imageUrls
      : [postData.imageUrl];

  const imagePaths = [];

  try {
    for (const imageUrl of sourceImageUrls) {
      const imageBlob = await dataUrlToBlob(imageUrl);
      const imagePath = `${user.id}/${crypto.randomUUID()}.jpg`;

      const { error: uploadError } =
        await caseMeSupabase.storage
          .from(CASE_IMAGE_BUCKET)
          .upload(imagePath, imageBlob, {
            contentType: "image/jpeg",
            upsert: false
          });

      if (uploadError) {
        throw uploadError;
      }

      imagePaths.push(imagePath);
    }
  } catch (uploadError) {
    if (imagePaths.length > 0) {
      await caseMeSupabase.storage
        .from(CASE_IMAGE_BUCKET)
        .remove(imagePaths);
    }

    throw new Error(
      `画像を保存できませんでした：${uploadError.message}`
    );
  }

  const imagePath = imagePaths[0];

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
        image_path: imagePath,
        image_paths: imagePaths
      })
      .select()
      .single();

  if (insertError) {
    // データベース保存に失敗した場合は、
    // 先にアップロードした画像を取り除きます
    await caseMeSupabase.storage
      .from(CASE_IMAGE_BUCKET)
      .remove(imagePaths);

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

  let imagePaths =
    Array.isArray(previousPost.imagePaths) &&
    previousPost.imagePaths.length > 0
      ? [...previousPost.imagePaths]
      : [previousPost.imagePath].filter(Boolean);

  let newlyUploadedImagePaths = [];

  // 新しい画像が選ばれた場合はData URLになります
  const submittedImageUrls =
    Array.isArray(postData.imageUrls) && postData.imageUrls.length > 0
      ? postData.imageUrls
      : [postData.imageUrl].filter(Boolean);

  const hasNewImage = submittedImageUrls.some((imageUrl) => {
    return typeof imageUrl === "string" && imageUrl.startsWith("data:");
  });

  if (hasNewImage) {
    try {
      for (const imageUrl of submittedImageUrls) {
        const imageBlob = await dataUrlToBlob(imageUrl);
        const newImagePath =
          `${user.id}/${crypto.randomUUID()}.jpg`;

        const { error: uploadError } =
          await caseMeSupabase.storage
            .from(CASE_IMAGE_BUCKET)
            .upload(newImagePath, imageBlob, {
              contentType: "image/jpeg",
              upsert: false
            });

        if (uploadError) {
          throw uploadError;
        }

        newlyUploadedImagePaths.push(newImagePath);
      }
    } catch (uploadError) {
      if (newlyUploadedImagePaths.length > 0) {
        await caseMeSupabase.storage
          .from(CASE_IMAGE_BUCKET)
          .remove(newlyUploadedImagePaths);
      }

      throw new Error(
        `新しい画像を保存できませんでした：${uploadError.message}`
      );
    }

    imagePaths = [...newlyUploadedImagePaths];
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
        image_path: imagePaths[0],
        image_paths: imagePaths,
        updated_at: new Date().toISOString()
      })
      .eq("id", previousPost.id)
      .eq("user_id", user.id)
      .select()
      .single();

  if (updateError) {
    // 更新に失敗した場合、新しく追加した画像を削除します
    if (newlyUploadedImagePaths.length > 0) {
      await caseMeSupabase.storage
        .from(CASE_IMAGE_BUCKET)
        .remove(newlyUploadedImagePaths);
    }

    throw new Error(
      `投稿を更新できませんでした：${updateError.message}`
    );
  }

  // 更新成功後に古い画像を削除します
  if (
    newlyUploadedImagePaths.length > 0
  ) {
    const previousImagePaths =
      Array.isArray(previousPost.imagePaths) &&
      previousPost.imagePaths.length > 0
        ? previousPost.imagePaths
        : [previousPost.imagePath].filter(Boolean);

    const { error: removeOldImageError } =
      await caseMeSupabase.storage
        .from(CASE_IMAGE_BUCKET)
        .remove(previousImagePaths);

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

  let deletedImagePath = postData.imagePath;

  // お気に入り・通知などの関連データも含めて、
  // Supabase側で安全に投稿を削除します。
  const {
    data: rpcImagePath,
    error: rpcDeleteError
  } = await caseMeSupabase.rpc(
    "delete_owned_post",
    {
      target_post_id: postData.id
    }
  );

  if (!rpcDeleteError) {
    deletedImagePath = rpcImagePath || deletedImagePath;
  } else {
    // SQL関数をまだ導入していない環境では、
    // 従来の削除方法も一度だけ試します。
    const isMissingRpc =
      rpcDeleteError.code === "PGRST202" ||
      rpcDeleteError.message
        ?.toLowerCase()
        .includes("delete_owned_post");

    if (!isMissingRpc) {
      throw new Error(
        `投稿を削除できませんでした：${rpcDeleteError.message}`
      );
    }

    const {
      data: deletedPosts,
      error: deleteError
    } = await caseMeSupabase
      .from("posts")
      .delete()
      .eq("id", postData.id)
      .eq("user_id", user.id)
      .select("id");

    if (deleteError) {
      if (deleteError.code === "23503") {
        throw new Error(
          "お気に入りなどの関連データが残っているため削除できません。Supabaseで setup_post_management.sql を一度実行してください。"
        );
      }

      throw new Error(
        `投稿を削除できませんでした：${deleteError.message}`
      );
    }

    if (!deletedPosts || deletedPosts.length === 0) {
      throw new Error(
        "投稿を削除できませんでした。ログイン状態または投稿の所有者を確認してください。"
      );
    }
  }

  // データベース削除後に画像も削除します
  const deletedImagePaths =
    Array.isArray(postData.imagePaths) && postData.imagePaths.length > 0
      ? postData.imagePaths
      : [deletedImagePath].filter(Boolean);

  if (deletedImagePaths.length > 0) {
    const { error: imageDeleteError } =
      await caseMeSupabase.storage
        .from(CASE_IMAGE_BUCKET)
        .remove(deletedImagePaths);

    if (imageDeleteError) {
      console.warn(
        "投稿画像を削除できませんでした。",
        imageDeleteError
      );
    }
  }
}
