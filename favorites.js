// ==========================================
// CASEme お気に入り専用JS (favorites.js)
// ==========================================

const favoritesPostGrid = document.querySelector("#favorites-post-grid");
const favoritesCount = document.querySelector("#favorites-count");
const emptyPostMessage = document.querySelector("#empty-post-message");
const favoritesPageStatus = document.querySelector("#favorites-page-status");

const postDetailDialog = document.querySelector("#post-detail-dialog");
const detailCloseButton = document.querySelector("#detail-close-button");
const detailLikeButton = document.querySelector("#detail-like-button");
const editPostButton = document.querySelector("#edit-post-button");
const deletePostButton = document.querySelector("#delete-post-button");

let favoritePosts = [];
let openedPostId = null;

// Supabaseの認証状態を監視し、非ログイン時はログインページへリダイレクトします
caseMeSupabase.auth.onAuthStateChange(async (event, session) => {
  if (!session) {
    window.location.href = "auth.html";
  } else {
    await loadFavorites();
  }
});

// お気に入り一覧をロードして描画します
async function loadFavorites() {
  if (!favoritesPostGrid) return;

  try {
    favoritesPageStatus.textContent = "お気に入りを読み込んでいます…";
    favoritesPageStatus.hidden = false;
    emptyPostMessage.hidden = true;
    favoritesPostGrid.replaceChildren();

    // 1. お気に入り投稿のIDリストを取得します
    const favoritePostIds = await fetchFavoritePostIds();

    if (favoritePostIds.length === 0) {
      favoritePosts = [];
      favoritesCount.textContent = "0件のお気に入り";
      emptyPostMessage.hidden = false;
      favoritesPageStatus.hidden = true;
      return;
    }

    // 2. 全投稿を取得して、お気に入りしたものだけに絞り込みます
    const allPosts = await fetchSupabasePosts();
    favoritePosts = allPosts.filter((post) => favoritePostIds.includes(post.id));

    // 各投稿にお気に入りフラグをセット
    favoritePosts.forEach((post) => {
      post.isLiked = true;
    });

    favoritesCount.textContent = `${favoritePosts.length}件のお気に入り`;

    if (favoritePosts.length === 0) {
      emptyPostMessage.hidden = false;
    } else {
      // 降順（最新の投稿順）に並び替えてカードを追加
      [...favoritePosts].reverse().forEach((postData) => {
        const card = createFavoritePostCard(postData);
        favoritesPostGrid.appendChild(card);
      });
    }

    favoritesPageStatus.hidden = true;
  } catch (error) {
    console.error("お気に入りの読み込みに失敗しました:", error);
    favoritesPageStatus.textContent = "お気に入りを読み込めませんでした。";
  }
}

// お気に入り投稿カードの生成
function createFavoritePostCard(postData) {
  const article = document.createElement("article");
  article.className = "post-card user-post-card";
  article.dataset.postId = postData.id;
  article.style.cursor = "pointer";

  const image = document.createElement("img");
  image.className = "post-image";
  image.src = postData.imageUrl;
  image.alt = `${postData.title}のスマホケース画像`;

  const content = document.createElement("div");
  content.className = "post-content";

  const tags = document.createElement("div");
  tags.className = "post-tags";
  postData.tags.forEach((tag) => {
    const tagText = document.createElement("span");
    tagText.textContent = `#${tag}`;
    tags.appendChild(tagText);
  });

  const title = document.createElement("h3");
  title.textContent = postData.title;

  const cardActions = document.createElement("div");
  cardActions.className = "post-card-actions";

  const device = document.createElement("p");
  device.className = "device-name";
  const deviceInformation = [postData.deviceType, postData.deviceName].filter((val) => val !== "");
  device.textContent = deviceInformation.length > 0 ? deviceInformation.join(" / ") : "機種未登録";

  const likeButton = document.createElement("button");
  likeButton.type = "button";
  likeButton.className = "like-button active";
  likeButton.dataset.postId = postData.id;
  likeButton.textContent = "♥";
  likeButton.setAttribute("aria-label", "お気に入りから削除");

  cardActions.appendChild(device);
  cardActions.appendChild(likeButton);

  content.appendChild(tags);
  content.appendChild(title);
  content.appendChild(cardActions);

  article.appendChild(image);
  article.appendChild(content);

  return article;
}

// 投稿詳細ポップアップの表示
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

async function openPostDetail(postData) {
  openedPostId = postData.id;

  const detailImage = document.querySelector("#detail-image");
  const detailTags = document.querySelector("#detail-tags");
  const detailTitle = document.querySelector("#detail-title");
  const detailDevice = document.querySelector("#detail-device");
  const detailDescription = document.querySelector("#detail-description");

  if (!detailImage || !detailTags || !detailTitle || !detailDevice || !detailDescription || !postDetailDialog) return;

  if (typeof window.renderPostImageGallery === "function") {
    window.renderPostImageGallery(
      document.querySelector(".detail-image-area"),
      postData
    );
  } else {
    detailImage.src = postData.imageUrl;
    detailImage.alt = `${postData.title}のスマホケース画像`;
  }

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

  // お気に入り（ハート）ボタンの表示反映
  if (detailLikeButton) {
    detailLikeButton.classList.add("active");
    detailLikeButton.textContent = "♥";
    detailLikeButton.setAttribute("aria-label", "お気に入りから削除");
  }

  // 自分の投稿だけ編集・削除ボタンを表示
  try {
    const { data: { user } } = await caseMeSupabase.auth.getUser();
    const isOwner = user && user.id === postData.userId;
    if (editPostButton) editPostButton.hidden = !isOwner;
    if (deletePostButton) deletePostButton.hidden = !isOwner;
  } catch (e) {
    if (editPostButton) editPostButton.hidden = true;
    if (deletePostButton) deletePostButton.hidden = true;
  }

  postDetailDialog.showModal();
}

// お気に入り解除トグルの処理
async function handleToggleFavorite(postId, likeButton) {
  if (likeButton) {
    likeButton.disabled = true;
  }

  const targetPost = favoritePosts.find((p) => p.id === postId);
  if (!targetPost) return;

  try {
    // favorites.js のお気に入り画面では「解除」アクションのみが想定されます
    await removeSupabaseFavorite(postId);
    
    // 一覧から該当のカードを削除し、件数を更新します
    favoritePosts = favoritePosts.filter((p) => p.id !== postId);
    
    const cardEl = document.querySelector(`.post-card[data-post-id="${postId}"]`);
    if (cardEl) {
      cardEl.remove();
    }

    favoritesCount.textContent = `${favoritePosts.length}件のお気に入り`;

    if (favoritePosts.length === 0) {
      emptyPostMessage.hidden = false;
    }

    if (postDetailDialog.open && openedPostId === postId) {
      postDetailDialog.close();
    }
  } catch (error) {
    console.error("お気に入りの削除に失敗しました:", error);
    alert(error.message || "お気に入りの解除に失敗しました。");
  } finally {
    if (likeButton) {
      likeButton.disabled = false;
    }
  }
}

// グリッドクリックの委譲処理（詳細表示 & 直接のハート解除）
if (favoritesPostGrid) {
  favoritesPostGrid.addEventListener("click", async (event) => {
    const clickedLikeButton = event.target.closest(".like-button");
    if (clickedLikeButton) {
      const postId = clickedLikeButton.dataset.postId;
      await handleToggleFavorite(postId, clickedLikeButton);
      return;
    }

    const clickedCard = event.target.closest(".user-post-card");
    if (!clickedCard) return;

    const clickedPostId = clickedCard.dataset.postId;
    const post = favoritePosts.find((p) => p.id === clickedPostId);
    if (post) {
      openPostDetail(post);
    }
  });
}

// 詳細ダイアログ内のハート解除
if (detailLikeButton) {
  detailLikeButton.addEventListener("click", async () => {
    if (!openedPostId) return;
    await handleToggleFavorite(openedPostId, detailLikeButton);
  });
}

// 詳細ダイアログを閉じる処理
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
