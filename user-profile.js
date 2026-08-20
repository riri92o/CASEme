// =========================
// 公開プロフィール画面
// =========================

const userDisplayName = document.querySelector(
  "#user-display-name"
);

const userUsername = document.querySelector(
  "#user-username"
);

const userBio = document.querySelector(
  "#user-bio"
);

const userAvatar = document.querySelector(
  "#user-avatar"
);

const userPostGrid = document.querySelector(
  "#user-post-grid"
);

const userPostCount = document.querySelector(
  "#user-post-count"
);

const userPageStatus = document.querySelector(
  "#user-page-status"
);

const userFollowingCount = document.querySelector(
  "#user-following-count"
);

const userFollowerCount = document.querySelector(
  "#user-follower-count"
);

const userFollowButton = document.querySelector(
  "#user-follow-button"
);

const userFollowingListButton = document.querySelector(
  "#user-following-list-button"
);

const userFollowerListButton = document.querySelector(
  "#user-follower-list-button"
);

const followListDialog = document.querySelector(
  "#follow-list-dialog"
);

const followListTitle = document.querySelector(
  "#follow-list-title"
);

const followList = document.querySelector(
  "#follow-list"
);

const followListStatus = document.querySelector(
  "#follow-list-status"
);

const followListCloseButton = document.querySelector(
  "#follow-list-close-button"
);

// URLから表示するユーザーIDを取得します
function getProfileUserId() {
  const searchParameters =
    new URLSearchParams(window.location.search);

  return searchParameters.get("id");
}

// 公開プロフィール用の投稿カードを作ります
function createUserProfilePostCard(postData) {
  const article = document.createElement("article");
  article.className = "user-post-card";
  article.style.cursor = "pointer";

  // クリック時にその場で詳細ポップアップを開きます
  article.addEventListener("click", () => {
    openUserProfilePostDetail(postData);
  });

  const image = document.createElement("img");
  image.className = "user-post-image";
  image.src = postData.imageUrl;
  image.alt =
    `${postData.title}のスマホケース画像`;

  const content = document.createElement("div");
  content.className = "user-post-content";

  const tags = document.createElement("div");
  tags.className = "user-post-tags";

  (postData.tags ?? []).forEach((tag) => {
    const tagElement =
      document.createElement("span");

    tagElement.textContent = `#${tag}`;
    tags.appendChild(tagElement);
  });

  const title = document.createElement("h3");
  title.className = "user-post-title";
  title.textContent = postData.title;

  const device = document.createElement("p");
  device.className = "user-post-device";

  const deviceInformation = [
    postData.deviceType,
    postData.deviceName
  ].filter((value) => {
    return (
      typeof value === "string" &&
      value.trim() !== ""
    );
  });

  device.textContent =
    deviceInformation.length > 0
      ? deviceInformation.join(" / ")
      : "機種未登録";

  content.appendChild(tags);
  content.appendChild(title);
  content.appendChild(device);

  article.appendChild(image);
  article.appendChild(content);

  return article;
}

// フォロー数とフォロワー数を表示します
async function displayFollowCounts(userId) {
  const counts = await fetchFollowCounts(userId);

  userFollowingCount.textContent =
    counts.followingCount;

  userFollowerCount.textContent =
    counts.followerCount;
}

// ログイン状態に合わせてフォローボタンを準備します
async function prepareFollowButton(targetUserId) {
  const currentUser = await getCurrentFollowUser();

  // 未ログインの場合はボタンを表示しません
  if (!currentUser) {
    userFollowButton.hidden = true;
    return;
  }

  // 自分のプロフィールにはボタンを表示しません
  if (currentUser.id === targetUserId) {
    userFollowButton.hidden = true;
    return;
  }

  const isFollowing =
    await checkFollowing(targetUserId);

  userFollowButton.hidden = false;

  if (isFollowing) {
    userFollowButton.textContent = "フォロー中";
    userFollowButton.classList.add("following");
    userFollowButton.dataset.following = "true";
  } else {
    userFollowButton.textContent = "フォローする";
    userFollowButton.classList.remove("following");
    userFollowButton.dataset.following = "false";
  }
}

// フォロー一覧に表示するユーザーを作ります
function createFollowListItem(profile) {
  const link = document.createElement("a");
  link.className = "follow-list-item";
  link.href =
    `user.html?id=${encodeURIComponent(profile.id)}`;

  const avatar = document.createElement("span");
  avatar.className = "follow-list-avatar";
  avatar.setAttribute("aria-hidden", "true");

  const displayName =
    profile.displayName || "CASEmeユーザー";

  avatar.textContent =
    displayName.charAt(0).toUpperCase();

  if (profile.avatarUrl) {
    avatar.style.backgroundImage =
      `url("${profile.avatarUrl}")`;
    avatar.classList.add("has-image");
  }

  const textArea = document.createElement("span");
  textArea.className = "follow-list-user-text";

  const name = document.createElement("strong");
  name.textContent = displayName;

  const username = document.createElement("span");
  username.textContent = profile.username
    ? `@${profile.username}`
    : "ユーザー名未設定";

  textArea.appendChild(name);
  textArea.appendChild(username);
  link.appendChild(avatar);
  link.appendChild(textArea);

  return link;
}

// フォロー中またはフォロワーの一覧を開きます
async function openFollowList(listType) {
  const userId = getProfileUserId();

  if (!userId) {
    return;
  }

  const isFollowingList = listType === "following";

  followListTitle.textContent = isFollowingList
    ? "フォロー中"
    : "フォロワー";

  followList.replaceChildren();
  followListStatus.textContent = "読み込んでいます…";
  followListDialog.showModal();

  try {
    const profiles = isFollowingList
      ? await fetchFollowingProfiles(userId)
      : await fetchFollowerProfiles(userId);

    profiles.forEach((profile) => {
      followList.appendChild(
        createFollowListItem(profile)
      );
    });

    followListStatus.textContent =
      profiles.length === 0
        ? isFollowingList
          ? "フォロー中のユーザーはいません。"
          : "フォロワーはまだいません。"
        : "";
  } catch (error) {
    console.error(
      "フォロー一覧を読み込めませんでした。",
      error
    );

    followListStatus.textContent =
      "一覧を読み込めませんでした。";
  }
}

// ユーザーのプロフィールと投稿を読み込みます
async function loadPublicProfile() {
  const userId = getProfileUserId();

  if (!userId) {
    userDisplayName.textContent =
      "ユーザーが指定されていません";

    userPageStatus.textContent =
      "投稿詳細からユーザーを選択してください。";

    return;
  }

  try {
    userPageStatus.textContent =
      "プロフィールを読み込んでいます…";

    const [profile, allPosts] =
      await Promise.all([
        fetchProfileById(userId),
        fetchSupabasePosts()
      ]);

    if (!profile) {
      userDisplayName.textContent =
        "ユーザーが見つかりません";

      userPageStatus.textContent =
        "プロフィールが削除された可能性があります。";

      return;
    }

    const displayName =
      profile.displayName || "CASEmeユーザー";

    userDisplayName.textContent = displayName;

    userUsername.textContent =
      profile.username
        ? `@${profile.username}`
        : "ユーザー名未設定";

    userBio.textContent =
      profile.bio ||
      "自己紹介はまだ設定されていません。";

    userAvatar.textContent =
      displayName.charAt(0).toUpperCase();

    // プロフィール画像があれば表示します
    if (profile.avatarUrl) {
      userAvatar.style.backgroundImage =
        `url("${profile.avatarUrl}")`;

      userAvatar.classList.add("has-image");
    } else {
      userAvatar.style.backgroundImage = "";
      userAvatar.classList.remove("has-image");
    }

    // フォロー機能だけでエラーが起きても、
    // プロフィール本体はそのまま表示します
    try {
      await Promise.all([
        displayFollowCounts(userId),
        prepareFollowButton(userId)
      ]);
    } catch (followError) {
      console.error(
        "フォロー情報を読み込めませんでした。",
        followError
      );

      userFollowingCount.textContent = "−";
      userFollowerCount.textContent = "−";
      userFollowButton.hidden = true;
    }

    // このユーザーが投稿したものだけに絞ります
    const userPosts = allPosts.filter(
      (post) => post.userId === userId
    );

    userPostGrid.replaceChildren();

    userPosts.forEach((postData) => {
      const postCard =
        createUserProfilePostCard(postData);

      userPostGrid.appendChild(postCard);
    });

    userPostCount.textContent =
      `${userPosts.length}件`;

    userPageStatus.textContent =
      userPosts.length === 0
        ? "このユーザーの投稿はまだありません。"
        : "";

    document.title =
      `${displayName} | CASEme`;
  } catch (error) {
    console.error(
      "公開プロフィールを読み込めませんでした。",
      error
    );

    userDisplayName.textContent =
      "プロフィールを読み込めませんでした";

    userPageStatus.textContent =
      error.message ||
      "時間をおいて、もう一度お試しください。";
  }
}

// フォローボタンが押されたとき
userFollowButton.addEventListener(
  "click",
  async () => {
    const targetUserId = getProfileUserId();

    if (!targetUserId) {
      return;
    }

    const isFollowing =
      userFollowButton.dataset.following === "true";

    userFollowButton.disabled = true;
    userFollowButton.textContent = "処理中…";

    try {
      if (isFollowing) {
        await unfollowUser(targetUserId);
      } else {
        await followUser(targetUserId);
        // フォローされたユーザーに通知を送信します
        if (typeof addNotification === "function") {
          await addNotification(targetUserId, "follow", null);
        }
      }

      // ボタンと人数を最新状態へ更新します
      await Promise.all([
        prepareFollowButton(targetUserId),
        displayFollowCounts(targetUserId)
      ]);
    } catch (error) {
      console.error(
        "フォロー状態を変更できませんでした。",
        error
      );

      alert(
        error.message ||
        "フォロー状態を変更できませんでした。"
      );

      // エラー時も元の表示へ戻します
      await prepareFollowButton(targetUserId);
    } finally {
      userFollowButton.disabled = false;
    }
  }
);

userFollowingListButton.addEventListener(
  "click",
  () => {
    openFollowList("following");
  }
);

userFollowerListButton.addEventListener(
  "click",
  () => {
    openFollowList("followers");
  }
);

followListCloseButton.addEventListener(
  "click",
  () => {
    followListDialog.close();
  }
);

// モーダルの外側を押した場合も閉じます
followListDialog.addEventListener(
  "click",
  (event) => {
    if (event.target === followListDialog) {
      followListDialog.close();
    }
  }
);

initUserProfileDetailHandlers();
loadPublicProfile();

// ==========================================
// 投稿詳細ポップアップ表示の制御 (user.html専用)
// ==========================================

let openedPostId = null;

function setDetailItem(rowId, valueId, value) {
  const row = document.querySelector(`#${rowId}`);
  const valueElement = document.querySelector(`#${valueId}`);
  if (!row || !valueElement) return;

  const hasValue = typeof value === "string" && value.trim() !== "";
  row.hidden = !hasValue;
  valueElement.textContent = hasValue ? value : "";
}

function formatMultipleItems(items, oldName = "", oldShop = "") {
  let normalizedItems = [];
  if (Array.isArray(items)) {
    normalizedItems = items;
  }
  if (normalizedItems.length === 0 && (oldName || oldShop)) {
    normalizedItems = [{ name: oldName, shop: oldShop }];
  }
  return normalizedItems
    .filter((item) => item && (item.name || item.shop))
    .map((item, index) => {
      const itemName = item.name && item.name.trim() !== "" ? item.name : "名称未入力";
      const shopText = item.shop && item.shop.trim() !== "" ? ` / 購入場所：${item.shop}` : "";
      return `${index + 1}. ${itemName}${shopText}`;
    })
    .join("\n");
}

async function displayDetailAuthor(postData) {
  const detailAuthor = document.querySelector("#detail-author");
  const detailAuthorAvatar = document.querySelector("#detail-author-avatar");
  const detailAuthorName = document.querySelector("#detail-author-name");
  const detailAuthorUsername = document.querySelector("#detail-author-username");
  
  if (!detailAuthor || !detailAuthorAvatar || !detailAuthorName || !detailAuthorUsername) return;

  detailAuthor.hidden = true;
  detailAuthorName.textContent = "";
  detailAuthorUsername.textContent = "";

  if (!postData.userId) return;

  try {
    const profile = await fetchProfileById(postData.userId);
    if (!profile) return;

    const displayName = profile.displayName || "CASEmeユーザー";
    detailAuthorName.textContent = displayName;
    detailAuthorUsername.textContent = profile.username ? `@${profile.username}` : "ユーザー名未設定";
    detailAuthorAvatar.textContent = displayName.charAt(0).toUpperCase();

    if (profile.avatarUrl) {
      detailAuthorAvatar.style.backgroundImage = `url("${profile.avatarUrl}")`;
      detailAuthorAvatar.classList.add("has-image");
    } else {
      detailAuthorAvatar.style.backgroundImage = "";
      detailAuthorAvatar.classList.remove("has-image");
    }
    detailAuthor.href = `user.html?id=${encodeURIComponent(postData.userId)}`;
    detailAuthor.hidden = false;
  } catch (error) {
    console.error("投稿者プロフィールを読み込めませんでした。", error);
    detailAuthor.hidden = true;
  }
}

async function openUserProfilePostDetail(postData) {
  console.log("CASEme詳細ポップアップ開く処理開始", postData);
  try {
    openedPostId = postData.id;

    const detailImage = document.querySelector("#detail-image");
    const detailTags = document.querySelector("#detail-tags");
    const detailTitle = document.querySelector("#detail-title");
    const detailDevice = document.querySelector("#detail-device");
    const detailDescription = document.querySelector("#detail-description");
    const editPostButton = document.querySelector("#edit-post-button");
    const deletePostButton = document.querySelector("#delete-post-button");
    const postDetailDialog = document.querySelector("#post-detail-dialog");

    if (!detailImage || !detailTags || !detailTitle || !detailDevice || !detailDescription || !postDetailDialog) {
      console.warn("ポップアップに必要なDOM要素が見つかりません:", {
        detailImage: !!detailImage,
        detailTags: !!detailTags,
        detailTitle: !!detailTitle,
        detailDevice: !!detailDevice,
        detailDescription: !!detailDescription,
        postDetailDialog: !!postDetailDialog
      });
      return;
    }

    detailImage.src = postData.imageUrl;
    detailImage.alt = `${postData.title}のスマホケース画像`;

    detailTags.replaceChildren();
    (postData.tags ?? []).forEach((tag) => {
      const tagElement = document.createElement("span");
      tagElement.textContent = `#${tag}`;
      detailTags.appendChild(tagElement);
    });

    detailTitle.textContent = postData.title;

    const deviceInformation = [postData.deviceType, postData.deviceName].filter(
      (value) => typeof value === "string" && value.trim() !== ""
    );
    detailDevice.textContent = deviceInformation.length > 0 ? deviceInformation.join(" / ") : "機種未登録";

    detailDescription.textContent =
      postData.description && postData.description.trim() !== "" ? postData.description : "説明はありません。";

    setDetailItem("detail-case-row", "detail-case", postData.caseName);
    setDetailItem("detail-case-shop-row", "detail-case-shop", postData.caseShop);

    const formattedStickers = formatMultipleItems(postData.stickers, postData.stickerName, postData.stickerShop);
    const formattedKeychains = formatMultipleItems(postData.keychains, postData.keychainName, postData.keychainShop);

    setDetailItem("detail-sticker-row", "detail-sticker", formattedStickers);
    setDetailItem("detail-sticker-shop-row", "detail-sticker-shop", "");
    setDetailItem("detail-keychain-row", "detail-keychain", formattedKeychains);
    setDetailItem("detail-keychain-shop-row", "detail-keychain-shop", "");
    setDetailItem("detail-other-row", "detail-other", postData.otherItems);

    const itemValues = [postData.caseName, postData.caseShop, formattedStickers, formattedKeychains, postData.otherItems];
    const hasAnyItemInformation = itemValues.some((value) => typeof value === "string" && value.trim() !== "");
    const itemsSection = document.querySelector("#detail-items-section");
    if (itemsSection) {
      itemsSection.hidden = !hasAnyItemInformation;
    }

    await displayDetailAuthor(postData);

    // 自分の投稿だけ編集・削除ボタンを表示
    if (postData.storageType === "supabase") {
      try {
        const { data: { user } } = await caseMeSupabase.auth.getUser();
        const isOwner = user && user.id === postData.userId;
        if (editPostButton) editPostButton.hidden = !isOwner;
        if (deletePostButton) deletePostButton.hidden = !isOwner;
      } catch (e) {
        if (editPostButton) editPostButton.hidden = true;
        if (deletePostButton) deletePostButton.hidden = true;
      }
    } else {
      if (editPostButton) editPostButton.hidden = false;
      if (deletePostButton) deletePostButton.hidden = false;
    }

    console.log("showModal 実行直前");
    postDetailDialog.showModal();
    console.log("showModal 完了");
  } catch (error) {
    console.error("詳細ポップアップの表示中にエラーが発生しました:", error);
    alert(`詳細ポップアップを開けませんでした: ${error.message}`);
  }
}

// ポップアップのクローズ処理や編集・削除ハンドラの初期化
function initUserProfileDetailHandlers() {
  const detailCloseButton = document.querySelector("#detail-close-button");
  const postDetailDialog = document.querySelector("#post-detail-dialog");
  const editPostButton = document.querySelector("#edit-post-button");
  const deletePostButton = document.querySelector("#delete-post-button");

  if (detailCloseButton && postDetailDialog) {
    detailCloseButton.addEventListener("click", () => {
      postDetailDialog.close();
    });

    postDetailDialog.addEventListener("click", (event) => {
      if (event.target === postDetailDialog) {
        postDetailDialog.close();
      }
    });
  }

  if (editPostButton) {
    editPostButton.addEventListener("click", () => {
      if (!openedPostId) return;
      window.location.href = `post.html?editId=${openedPostId}`;
    });
  }

  if (deletePostButton) {
    deletePostButton.addEventListener("click", async () => {
      if (!openedPostId) return;
      const confirmDelete = confirm("この投稿を削除してもよろしいですか？");
      if (!confirmDelete) return;

      try {
        deletePostButton.disabled = true;
        deletePostButton.textContent = "削除中…";

        if (typeof deleteSupabasePost === "function") {
          await deleteSupabasePost(openedPostId);
        }
        
        postDetailDialog.close();
        alert("投稿を削除しました。");

        const userId = getProfileUserId();
        if (userId) {
          await loadPublicProfile();
        }
      } catch (error) {
        console.error("投稿の削除に失敗しました:", error);
        alert("投稿の削除に失敗しました。");
      } finally {
        deletePostButton.disabled = false;
        deletePostButton.textContent = "この投稿を削除";
      }
    });
  }
}

