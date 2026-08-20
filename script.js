// =========================
// 使用するHTML要素
// =========================

const tagList = document.querySelector(".tag-list");

const postGrid = document.querySelector(".post-grid");
const postCount = document.querySelector(".post-count");

const emptyPostMessage = document.querySelector(
  "#empty-post-message"
);

const postSearchInput = document.querySelector(
  "#post-search"
);

const clearSearchButton = document.querySelector(
  "#clear-search-button"
);
const deviceFilter = document.querySelector(
  "#device-filter"
);

const caseForm = document.querySelector("#case-form");
const caseImageInput = document.querySelector("#case-image");
const caseTitleInput = document.querySelector("#case-title");
const caseDescriptionInput = document.querySelector("#case-description");

const deviceTypeInput = document.querySelector("#device-type");
const deviceNameInput = document.querySelector("#device-name");

const caseNameInput = document.querySelector("#case-name");
const caseShopInput = document.querySelector("#case-shop");
const stickerNameInput = document.querySelector("#sticker-name");
const stickerShopInput = document.querySelector("#sticker-shop");
const keychainNameInput = document.querySelector("#keychain-name");
const keychainShopInput = document.querySelector("#keychain-shop");

const stickerFields = document.querySelector(
  "#sticker-fields"
);

const keychainFields = document.querySelector(
  "#keychain-fields"
);

const otherItemsInput = document.querySelector("#other-items");

const formStatus = document.querySelector("#form-status");

const tagInput = document.querySelector("#tag-input");
const addTagButton = document.querySelector("#add-tag-button");
const selectedTagsArea = document.querySelector("#selected-tags");

const imagePreview = document.querySelector("#image-preview");
const imagePreviewMessage = document.querySelector(
  "#image-preview-message"
);

// 現在選択されている絞り込みタグです
let selectedFilterTag = "all";

// 現在入力されている検索文字です
let currentSearchKeyword = "";

// 現在選択されている端末フィルターです
let selectedDeviceType = "all";

// 投稿フォームに追加されたタグを保存します
let selectedFormTags = [];

// プレビュー画像の一時URLです
let currentPreviewUrl = null;

// LocalStorageで使用する保存場所の名前です
const storageKey = "caseme-posts";

// 保存済みの投稿を入れる配列です
let savedPosts = [];

// =========================
// ハッシュタグ絞り込み
// =========================

function filterPosts(tag) {
  selectedFilterTag = tag;

  const tagButtons = document.querySelectorAll(".tag-button");
  const postCards = document.querySelectorAll(".post-card");

  tagButtons.forEach((button) => {
    const isSelected = button.dataset.tag === tag;
    button.classList.toggle("active", isSelected);
  });

  let visiblePostCount = 0;

  postCards.forEach((card) => {
    const cardTags = card.dataset.tags
      .split(" ")
      .filter((cardTag) => cardTag !== "");

    // ハッシュタグの条件
    const matchesTag =
      tag === "all" || cardTags.includes(tag);

    const postId = card.dataset.postId;

    const savedPost = savedPosts.find(
      (post) => post.id === postId
    );

    // 検索対象となる文字をまとめます
    let searchableText = card.textContent;

    if (savedPost) {
      searchableText = [
        savedPost.title,
        savedPost.description,
        ...(savedPost.tags ?? []),
        savedPost.deviceType,
        savedPost.deviceName,
        savedPost.caseName,
        savedPost.caseShop,
        savedPost.stickerName,
        savedPost.stickerShop,
        savedPost.keychainName,
        savedPost.keychainShop,
        savedPost.otherItems
      ]
        .filter((value) => {
          return typeof value === "string";
        })
        .join(" ");
    }

    // 大文字と小文字を区別せず検索します
    const normalizedSearchableText =
      searchableText.toLowerCase();

    const matchesSearch =
      currentSearchKeyword === "" ||
      normalizedSearchableText.includes(
        currentSearchKeyword
      );

    // 端末の条件
    const cardDeviceType = card.dataset.deviceType ?? "";

    const matchesDevice =
        selectedDeviceType === "all" ||
        cardDeviceType === selectedDeviceType;

    const shouldShow =
        matchesTag &&
        matchesSearch &&
        matchesDevice;

    card.hidden = !shouldShow;

    if (shouldShow) {
      visiblePostCount++;
    }
  });

  postCount.textContent = `${visiblePostCount}件の投稿`;
    
  // 表示中の投稿が0件なら案内を表示します
  emptyPostMessage.hidden = visiblePostCount !== 0;

  // 検索結果が0件の場合はメッセージを表示
  emptyPostMessage.hidden = visiblePostCount > 0;
}

tagList.addEventListener("click", (event) => {
  const clickedButton = event.target.closest(".tag-button");

  if (!clickedButton) {
    return;
  }

  filterPosts(clickedButton.dataset.tag);
});


// 検索文字が入力されるたびに絞り込みます
postSearchInput.addEventListener("input", () => {
  currentSearchKeyword = postSearchInput.value
    .trim()
    .toLowerCase();

  clearSearchButton.hidden =
    currentSearchKeyword === "";

  filterPosts(selectedFilterTag);
});

// ×ボタンで検索文字を消します
clearSearchButton.addEventListener("click", () => {
  postSearchInput.value = "";
  currentSearchKeyword = "";
  clearSearchButton.hidden = true;

  filterPosts(selectedFilterTag);
  postSearchInput.focus();
});

// 選択された端末で投稿を絞り込みます
deviceFilter.addEventListener("change", () => {
  selectedDeviceType = deviceFilter.value;
  filterPosts(selectedFilterTag);
});

// =========================
// 画像プレビュー
// =========================

caseImageInput.addEventListener("change", () => {
  const selectedFile = caseImageInput.files[0];

  if (!selectedFile) {
    clearImagePreview();
    return;
  }

  const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedImageTypes.includes(selectedFile.type)) {
    alert("JPG、PNG、WebP形式の画像を選択してください。");
    caseImageInput.value = "";
    clearImagePreview();
    return;
  }

  const maximumFileSize = 5 * 1024 * 1024;

  if (selectedFile.size > maximumFileSize) {
    alert("画像のサイズは5MB以下にしてください。");
    caseImageInput.value = "";
    clearImagePreview();
    return;
  }

  if (currentPreviewUrl) {
    URL.revokeObjectURL(currentPreviewUrl);
  }

  currentPreviewUrl = URL.createObjectURL(selectedFile);

  imagePreview.src = currentPreviewUrl;
  imagePreview.hidden = false;
  imagePreviewMessage.hidden = true;
});

function clearImagePreview() {
  if (currentPreviewUrl) {
    URL.revokeObjectURL(currentPreviewUrl);
    currentPreviewUrl = null;
  }

  imagePreview.src = "";
  imagePreview.hidden = true;
  imagePreviewMessage.hidden = false;
}

// =========================
// 投稿フォームのタグ追加
// =========================

function cleanTag(tagText) {
  return tagText
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, "");
}

function addFormTag() {
  const newTag = cleanTag(tagInput.value);

  if (newTag === "") {
    return;
  }

  if (selectedFormTags.includes(newTag)) {
    formStatus.textContent = `#${newTag}は追加済みです。`;

    // 重複していた場合も入力欄を空にします
    tagInput.value = "";
    tagInput.focus();
    return;
  }

  if (selectedFormTags.length >= 10) {
    formStatus.textContent =
      "ハッシュタグは10個まで追加できます。";
    return;
  }

  selectedFormTags.push(newTag);

displaySelectedFormTags();

// タグを表示した直後に入力欄を確実に空にします
tagInput.value = "";

requestAnimationFrame(() => {
  tagInput.value = "";
  tagInput.focus();
});

  formStatus.textContent = "";

  // 続けて次のタグを入力できる状態にします
  tagInput.focus();
}

function removeFormTag(tagToRemove) {
  selectedFormTags = selectedFormTags.filter(
    (tag) => tag !== tagToRemove
  );

  displaySelectedFormTags();
}

function displaySelectedFormTags() {
  selectedTagsArea.replaceChildren();

  selectedFormTags.forEach((tag) => {
    const tagItem = document.createElement("span");
    tagItem.className = "selected-tag";

    const tagText = document.createElement("span");
    tagText.textContent = `#${tag}`;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-tag-button";
    removeButton.textContent = "×";
    removeButton.setAttribute(
      "aria-label",
      `#${tag}を削除`
    );

    removeButton.addEventListener("click", () => {
      removeFormTag(tag);
    });

    tagItem.appendChild(tagText);
    tagItem.appendChild(removeButton);
    selectedTagsArea.appendChild(tagItem);
  });
}

// 「追加」ボタンが押されたとき
addTagButton.addEventListener("click", () => {
  addFormTag();
});

// タグ入力欄でEnterキーが押されたとき
tagInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
    return;
  }

  // Enterでフォーム全体が送信されるのを防ぎます
  event.preventDefault();
  addFormTag();
});

// =========================
// 絞り込み用タグボタンの作成
// =========================

// 「もっと表示」トグルのための状態管理変数
let isAllTagsExpanded = false;
const MAX_VISIBLE_TAGS = 8; // 初期表示する件数
const MAX_TOTAL_TAGS = 20; // 画面に表示するハッシュタグの最大総数（人気上位20件）

function updateFilterTagList() {
  if (!tagList) return;

  // 1. 各ハッシュタグの出現回数（人気度）を集計します
  const tagCounts = {};
  savedPosts.forEach((post) => {
    if (Array.isArray(post.tags)) {
      post.tags.forEach((tag) => {
        if (tag && tag.trim() !== "") {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      });
    }
  });

  // 2. 出現回数（人気度）が多い順にソートし、最大上限（上位20件）で切り詰めます
  const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
  const limitedTags = sortedTags.slice(0, MAX_TOTAL_TAGS);

  // 3. tagList の中身を初期化します（「すべて」ボタンだけを残します）
  const activeTag = selectedFilterTag || "all";
  tagList.replaceChildren();

  // 「すべて」ボタンを再生成
  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = `tag-button${activeTag === "all" ? " active" : ""}`;
  allButton.dataset.tag = "all";
  allButton.textContent = "すべて";
  tagList.appendChild(allButton);

  // 4. ソートされたタグボタンを生成して追加します
  limitedTags.forEach((tag, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tag-button${activeTag === tag ? " active" : ""}`;
    button.dataset.tag = tag;
    button.textContent = `#${tag}`;

    // MAX_VISIBLE_TAGS (8件) を超えるタグは非表示用のクラスを付与し、非展開時は非表示にします
    if (index >= MAX_VISIBLE_TAGS) {
      button.classList.add("hidden-tag");
      if (!isAllTagsExpanded) {
        button.style.display = "none";
      }
    }

    tagList.appendChild(button);
  });

  // 5. タグが MAX_VISIBLE_TAGS を超える場合、「もっと表示」トグルボタンを追加します
  if (limitedTags.length > MAX_VISIBLE_TAGS) {
    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.id = "tag-list-toggle-button";
    toggleButton.className = "tag-list-toggle-button";
    toggleButton.textContent = isAllTagsExpanded ? "一部のみ表示" : "もっと表示";
    
    toggleButton.addEventListener("click", () => {
      isAllTagsExpanded = !isAllTagsExpanded;
      const hiddenTags = tagList.querySelectorAll(".hidden-tag");
      hiddenTags.forEach((el) => {
        el.style.display = isAllTagsExpanded ? "inline-block" : "none";
      });
      toggleButton.textContent = isAllTagsExpanded ? "一部のみ表示" : "もっと表示";
    });

    tagList.appendChild(toggleButton);
  }
}

// =========================
// LocalStorageへの保存・読み込み
// =========================

function savePostsToLocalStorage() {
  try {
    // Supabase投稿はLocalStorageへ重複保存しません
    const localPosts = savedPosts.filter(
      (post) => post.storageType !== "supabase"
    );

    const postsText = JSON.stringify(localPosts);
    localStorage.setItem(storageKey, postsText);
    return true;
  } catch (error) {
    console.error("投稿の保存に失敗しました。", error);

    formStatus.textContent =
      "保存容量が不足しています。画像を小さくするか、投稿数を減らしてください。";

    return false;
  }
}

function loadPostsFromLocalStorage() {
  const savedPostsText = localStorage.getItem(storageKey);

  if (!savedPostsText) {
    savedPosts = [];
    return;
  }

  try {
    savedPosts = JSON.parse(savedPostsText);

    // 読み込んだデータが配列でなければ空にします
    if (!Array.isArray(savedPosts)) {
  savedPosts = [];
  return;
}

// 過去にLocalStorageへ混ざったSupabase投稿を取り除きます
savedPosts = savedPosts.filter(
  (post) => post.storageType !== "supabase"
);

// LocalStorageの中身も整理します
localStorage.setItem(
  storageKey,
  JSON.stringify(savedPosts)
);

savedPosts.forEach((postData) => {
      const postCard = createPostCard(postData);
      postGrid.prepend(postCard);
    });
  } catch (error) {
    console.error("保存された投稿を読み込めませんでした。", error);
    savedPosts = [];
  }
}

// =========================
// Supabaseの投稿を読み込んで表示
// =========================

async function displaySupabasePosts() {
  // 投稿一覧がないページでは処理しません
  if (!postGrid) {
    return;
  }

  try {
    // Supabaseから投稿を取得します
    const supabasePosts = await fetchSupabasePosts();

    let favoritePostIds = [];

    try {
      // ログイン中のユーザーのお気に入りを取得します
      favoritePostIds = await fetchFavoritePostIds();
    } catch (favoriteError) {
      // お気に入り取得に失敗しても投稿一覧は表示します
      console.error(
        "お気に入り情報を読み込めませんでした。",
        favoriteError
      );
    }

    const favoritePostIdSet = new Set(
      favoritePostIds
    );

    // 以前読み込んだSupabase投稿があれば配列から外します
    savedPosts = savedPosts.filter(
      (post) => post.storageType !== "supabase"
    );

    // 各投稿へお気に入り状態を設定します
    supabasePosts.forEach((postData) => {
      postData.isLiked = favoritePostIdSet.has(
        postData.id
      );
    });

    // 詳細表示・編集・削除でも使えるように配列へ追加します
    savedPosts.push(...supabasePosts);

    // 投稿カードを画面へ表示します
    supabasePosts.forEach((postData) => {
      const postCard = createPostCard(postData);
      postGrid.prepend(postCard);
    });

    updateFilterTagList();

    console.log(
      `${supabasePosts.length}件のSupabase投稿と、` +
      `${favoritePostIds.length}件のお気に入りを読み込みました。`
    );

    // URLパラメータに postId があれば、自動的に詳細を開きます
    const urlParams = new URLSearchParams(window.location.search);
    const autoOpenPostId = urlParams.get("postId");
    if (autoOpenPostId) {
      // 描画後、少し待ってから実行します
      setTimeout(() => {
        if (typeof openPostDetailById === "function") {
          openPostDetailById(autoOpenPostId);
        }
      }, 300);
    }
  } catch (error) {
    console.error(
      "Supabaseの投稿を読み込めませんでした。",
      error
    );
  }
}

// =========================
// 投稿カードの作成
// =========================

function createPostCard(postData) {
  const article = document.createElement("article");
article.className = "post-card user-post-card";
article.dataset.tags = postData.tags.join(" ");
article.dataset.postId = postData.id;
article.dataset.deviceType = postData.deviceType ?? "";

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

  const device = document.createElement("p");
  device.className = "device-name";

  const deviceInformation = [
    postData.deviceType,
    postData.deviceName
  ].filter((value) => value !== "");

  device.textContent =
    deviceInformation.length > 0
      ? deviceInformation.join(" / ")
      : "機種未登録";

  // カード下部の操作エリア
const cardActions = document.createElement("div");
cardActions.className = "post-card-actions";

const likeButton = document.createElement("button");
likeButton.type = "button";
likeButton.className = "like-button";
likeButton.dataset.postId = postData.id;
likeButton.setAttribute(
  "aria-label",
  "お気に入りに追加"
);

// 保存済みのお気に入り状態を反映します
if (postData.isLiked === true) {
  likeButton.classList.add("active");
  likeButton.textContent = "♥";
  likeButton.setAttribute(
    "aria-label",
    "お気に入りから削除"
  );
} else {
  likeButton.textContent = "♡";
}

cardActions.appendChild(device);
cardActions.appendChild(likeButton);

content.appendChild(tags);
content.appendChild(title);
content.appendChild(cardActions);

article.appendChild(image);
article.appendChild(content);

  return article;
}

// =========================
// 保存用画像の軽量化
// =========================

function convertImageToDataUrl(imageFile) {
  return new Promise((resolve, reject) => {
    const temporaryImageUrl = URL.createObjectURL(imageFile);
    const image = new Image();

    image.onload = () => {
      const maximumLength = 1200;

      const scale = Math.min(
        maximumLength / image.width,
        maximumLength / image.height,
        1
      );

      const resizedWidth = Math.round(image.width * scale);
      const resizedHeight = Math.round(image.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = resizedWidth;
      canvas.height = resizedHeight;

      const context = canvas.getContext("2d");

      // 透明部分がある画像の背景を白にします
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, resizedWidth, resizedHeight);

      context.drawImage(
        image,
        0,
        0,
        resizedWidth,
        resizedHeight
      );

      // JPEG形式・画質82%で文字列へ変換します
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);

      URL.revokeObjectURL(temporaryImageUrl);
      resolve(dataUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(temporaryImageUrl);
      reject(new Error("画像を読み込めませんでした。"));
    };

    image.src = temporaryImageUrl;
  });
}

// =========================
// フォーム送信
// =========================

caseForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const selectedImage = caseImageInput.files[0];
  const title = caseTitleInput.value.trim();
  const description = caseDescriptionInput.value.trim();
  const deviceType = deviceTypeInput.value;
  const deviceName = deviceNameInput.value.trim();

  const caseName = caseNameInput.value.trim();
  const caseShop = caseShopInput.value.trim();
  const stickers = collectMultipleItems(
  stickerFields,
  ".sticker-name-input",
  ".sticker-shop-input"
);

const keychains = collectMultipleItems(
  keychainFields,
  ".keychain-name-input",
  ".keychain-shop-input"
);

const otherItems = otherItemsInput.value.trim();

  const postBeingEdited = editingPostId
    ? savedPosts.find((post) => post.id === editingPostId)
    : null;

  // 新規投稿の場合だけ画像を必須にします
  if (!selectedImage && !postBeingEdited) {
    formStatus.textContent =
      "スマホケースの画像を選択してください。";
    return;
  }

  if (title === "") {
    formStatus.textContent =
      "投稿タイトルを入力してください。";
    return;
  }

  formStatus.textContent = postBeingEdited
    ? "変更を保存しています…"
    : "画像を準備しています…";

  // 編集時は現在の画像をそのまま使用します
  let postImageUrl = postBeingEdited
    ? postBeingEdited.imageUrl
    : "";

  // 新しい画像が選ばれた場合だけ変換します
  if (selectedImage) {
    try {
      postImageUrl =
        await convertImageToDataUrl(selectedImage);
    } catch (error) {
      formStatus.textContent =
        "画像の読み込みに失敗しました。別の画像をお試しください。";
      return;
    }
  }

  const postData = {
    id: postBeingEdited
      ? postBeingEdited.id
      : Date.now().toString(),

    title,
    description,
    tags: [...selectedFormTags],
    deviceType,
    deviceName,

    caseName,
    caseShop,
    stickers,
    keychains,
    otherItems,

    imageUrl: postImageUrl,

    // 編集しても最初の投稿日は残します
    createdAt: postBeingEdited
      ? postBeingEdited.createdAt
      : new Date().toISOString(),

    // 編集した日時を記録します
    updatedAt: postBeingEdited
      ? new Date().toISOString()
      : null
  };

if (postBeingEdited) {
  // 編集対象が配列の何番目にあるか確認します
  const postIndex = savedPosts.findIndex(
    (post) => post.id === editingPostId
  );

  if (postIndex === -1) {
    formStatus.textContent =
      "編集する投稿が見つかりませんでした。";
    return;
  }

  const previousPostData = savedPosts[postIndex];
  let updatedPostData;

  try {
    formStatus.textContent = "投稿を更新しています…";

    if (previousPostData.storageType === "supabase") {
      // Supabaseの投稿を更新します
      updatedPostData = await updateSupabasePost(
        postData,
        previousPostData
      );

      // 更新後のデータを画面管理用の配列へ入れます
      savedPosts[postIndex] = updatedPostData;
    } else {
      // 従来のLocalStorage投稿を更新します
      savedPosts[postIndex] = postData;
      updatedPostData = postData;

      const saveSucceeded = savePostsToLocalStorage();

      if (!saveSucceeded) {
        savedPosts[postIndex] = previousPostData;
        return;
      }
    }

    // 画面上の古いカードを新しいカードへ交換します
    const oldPostCard = Array.from(
      document.querySelectorAll(".user-post-card")
    ).find((card) => {
      return card.dataset.postId === editingPostId;
    });

    if (oldPostCard) {
      const updatedPostCard =
        createPostCard(updatedPostData);

      oldPostCard.replaceWith(updatedPostCard);
    }

    // 新しく追加されたタグボタンを作ります
    // タグ一覧を最新の人気度ソート・もっと表示で更新します
    updateFilterTagList();

    formStatus.textContent = "投稿を更新しました。";
  } catch (error) {
    console.error("投稿の更新に失敗しました。", error);

    formStatus.textContent =
      error.message || "投稿の更新に失敗しました。";

    return;
  }
  
  } else {
  try {
    formStatus.textContent = "投稿を保存しています…";

    // 画像と投稿情報をSupabaseへ保存します
    const createdPost = await createSupabasePost(postData);

    // 新規投稿データを配列へ追加し、画面にカードを追加します
    savedPosts.push(createdPost);
    const postCard = createPostCard(createdPost);
    postGrid.prepend(postCard);

    // ハッシュタグの人気度ソートとトグルボタンを更新します
    updateFilterTagList();

    formStatus.textContent = "投稿を保存しました。";

    console.log("Supabaseに保存した投稿:", createdPost);
  } catch (error) {
    console.error("投稿の保存に失敗しました:", error);

    formStatus.textContent =
      error.message || "投稿の保存に失敗しました。";

    return;
  }
}

  // フォームを新規投稿の状態へ戻します
  editingPostId = null;
  openedPostId = null;

  caseForm.reset();
  clearImagePreview();

  resetMultipleItemFields(stickerFields);
  resetMultipleItemFields(keychainFields);

  selectedFormTags = [];
  displaySelectedFormTags();

  caseImageInput.required = true;
submitButton.textContent = "投稿する";
cancelEditButton.hidden = true;

  filterPosts("all");

// 投稿専用ページから投稿した場合はホームへ移動します
if (document.body.classList.contains("post-page")) {
  // 一時保存していた編集情報を削除します
  sessionStorage.removeItem("caseme-editing-post-id");
  sessionStorage.removeItem("caseme-editing-post-data");

  window.location.href = "index.html#posts";
  return;
}

// ホーム内で処理された場合は投稿一覧へ移動します
document.querySelector("#posts").scrollIntoView({
  behavior: "smooth"
});
});

// 保存済みの投稿を読み込みます
loadPostsFromLocalStorage();
displaySupabasePosts();


// 最初の投稿件数を表示します
filterPosts("all");

// =========================
// 投稿詳細画面
// =========================

const postDetailDialog = document.querySelector(
  "#post-detail-dialog"
);

const detailCloseButton = document.querySelector(
  "#detail-close-button"
);

const editPostButton = document.querySelector(
  "#edit-post-button"
);

const deletePostButton = document.querySelector(
  "#delete-post-button"
);

const submitButton = document.querySelector(
  ".submit-button"
);

const cancelEditButton = document.querySelector(
  "#cancel-edit-button"
);

// 現在詳細画面で開いている投稿のIDです
let openedPostId = null;

// 現在編集中の投稿IDです
let editingPostId = null;

function setDetailItem(rowId, valueId, value) {
  const row = document.querySelector(`#${rowId}`);
  const valueElement = document.querySelector(`#${valueId}`);

  const hasValue =
    typeof value === "string" && value.trim() !== "";

  row.hidden = !hasValue;
  valueElement.textContent = hasValue ? value : "";
}

function formatMultipleItems(
  items,
  oldName = "",
  oldShop = ""
) {
  let normalizedItems = [];

  if (Array.isArray(items)) {
    normalizedItems = items;
  }

  // 以前の形式で保存された投稿にも対応します
  if (
    normalizedItems.length === 0 &&
    (oldName || oldShop)
  ) {
    normalizedItems = [
      {
        name: oldName,
        shop: oldShop
      }
    ];
  }

  return normalizedItems
    .filter((item) => {
      return item && (item.name || item.shop);
    })
    .map((item, index) => {
      const itemName =
        item.name && item.name.trim() !== ""
          ? item.name
          : "名称未入力";

      const shopText =
        item.shop && item.shop.trim() !== ""
          ? ` / 購入場所：${item.shop}`
          : "";

      return `${index + 1}. ${itemName}${shopText}`;
    })
    .join("\n");
}

// 投稿詳細に投稿者プロフィールを表示します
async function displayDetailAuthor(postData) {
  const detailAuthor = document.querySelector(
    "#detail-author"
  );

  const detailAuthorAvatar = document.querySelector(
    "#detail-author-avatar"
  );

  const detailAuthorName = document.querySelector(
    "#detail-author-name"
  );

  const detailAuthorUsername = document.querySelector(
    "#detail-author-username"
  );

  // 前に表示した投稿者情報を一度隠します
  detailAuthor.hidden = true;
  detailAuthorName.textContent = "";
  detailAuthorUsername.textContent = "";

  // LocalStorage投稿など、ユーザーIDがない投稿では表示しません
  if (!postData.userId) {
    return;
  }

  try {
    const profile = await fetchProfileById(
      postData.userId
    );

    if (!profile) {
      return;
    }

    const displayName =
      profile.displayName || "CASEmeユーザー";

    detailAuthorName.textContent = displayName;

    detailAuthorUsername.textContent =
      profile.username
        ? `@${profile.username}`
        : "ユーザー名未設定";

 detailAuthorAvatar.textContent =
  displayName.charAt(0).toUpperCase();

// プロフィール画像があれば表示します
if (profile.avatarUrl) {
  detailAuthorAvatar.style.backgroundImage =
    `url("${profile.avatarUrl}")`;

  detailAuthorAvatar.classList.add(
    "has-image"
  );
} else {
  detailAuthorAvatar.style.backgroundImage = "";

  detailAuthorAvatar.classList.remove(
    "has-image"
  );
}

detailAuthor.href =
  `user.html?id=${encodeURIComponent(postData.userId)}`;

detailAuthor.hidden = false;

  } catch (error) {
    // プロフィール取得に失敗しても投稿詳細は表示します
    console.error(
      "投稿者プロフィールを読み込めませんでした。",
      error
    );

    detailAuthor.hidden = true;
  }
}

async function openPostDetail(postData) {
    // 現在開いている投稿を記録します
    openedPostId = postData.id;

  const detailImage = document.querySelector("#detail-image");
  const detailTags = document.querySelector("#detail-tags");
  const detailTitle = document.querySelector("#detail-title");
  const detailDevice = document.querySelector("#detail-device");
  const detailDescription = document.querySelector(
    "#detail-description"
  );

  // 画像
  detailImage.src = postData.imageUrl;
  detailImage.alt = `${postData.title}のスマホケース画像`;

  // ハッシュタグ
  detailTags.replaceChildren();

  postData.tags.forEach((tag) => {
    const tagElement = document.createElement("span");
    tagElement.textContent = `#${tag}`;
    detailTags.appendChild(tagElement);
  });

  // タイトル
  detailTitle.textContent = postData.title;

  // 端末情報
  const deviceInformation = [
    postData.deviceType,
    postData.deviceName
  ].filter((value) => {
    return typeof value === "string" && value.trim() !== "";
  });

  detailDevice.textContent =
    deviceInformation.length > 0
      ? deviceInformation.join(" / ")
      : "機種未登録";

  // 説明文
  detailDescription.textContent =
    postData.description &&
    postData.description.trim() !== ""
      ? postData.description
      : "説明はありません。";

  // アイテム情報
  setDetailItem(
    "detail-case-row",
    "detail-case",
    postData.caseName
  );

  setDetailItem(
    "detail-case-shop-row",
    "detail-case-shop",
    postData.caseShop
  );

  const formattedStickers = formatMultipleItems(
  postData.stickers,
  postData.stickerName,
  postData.stickerShop
);

const formattedKeychains = formatMultipleItems(
  postData.keychains,
  postData.keychainName,
  postData.keychainShop
);

setDetailItem(
  "detail-sticker-row",
  "detail-sticker",
  formattedStickers
);

// 購入場所はステッカー名と一緒に表示します
setDetailItem(
  "detail-sticker-shop-row",
  "detail-sticker-shop",
  ""
);

setDetailItem(
  "detail-keychain-row",
  "detail-keychain",
  formattedKeychains
);

// 購入場所はキーホルダー名と一緒に表示します
setDetailItem(
  "detail-keychain-shop-row",
  "detail-keychain-shop",
  ""
);

  setDetailItem(
    "detail-other-row",
    "detail-other",
    postData.otherItems
  );

  // アイテム情報がすべて空なら、項目全体を隠します
  const itemValues = [
  postData.caseName,
  postData.caseShop,
  formattedStickers,
  formattedKeychains,
  postData.otherItems
];

  const hasAnyItemInformation = itemValues.some((value) => {
    return typeof value === "string" && value.trim() !== "";
  });

  document.querySelector(
    "#detail-items-section"
  ).hidden = !hasAnyItemInformation;

// 投稿者プロフィールを表示します
await displayDetailAuthor(postData);

// Supabase投稿は、投稿した本人だけ編集・削除できます
if (postData.storageType === "supabase") {
  const {
    data: { user }
} = await caseMeSupabase.auth.getUser();

  const isOwner =
    user && user.id === postData.userId;

  editPostButton.hidden = !isOwner;
  deletePostButton.hidden = !isOwner;
} else {
  // 従来のLocalStorage投稿はこれまでどおり操作できます
  editPostButton.hidden = false;
  deletePostButton.hidden = false;
}

  postDetailDialog.showModal();
}

// お気に入り状態を切り替えます
async function toggleFavorite(postId, likeButton) {
  // 同じIDがある場合は最新の投稿データを使います
  const targetPost = [...savedPosts]
    .reverse()
    .find((post) => post.id === postId);

  if (!targetPost) {
    return;
  }

  const previousLikedState =
    targetPost.isLiked === true;

  try {
    // 連続クリックを防ぎます
    likeButton.disabled = true;

    if (targetPost.storageType === "supabase") {
      if (previousLikedState) {
        // お気に入り登録済みなら解除します
        await removeSupabaseFavorite(postId);
      } else {
        // 未登録ならお気に入りへ追加します
        await addSupabaseFavorite(postId);
        // 投稿者に通知を送信します
        if (typeof addNotification === "function") {
          await addNotification(targetPost.userId, "like", postId);
        }
      }
    }

    // Supabaseへの保存成功後に画面上の状態を変更します
    targetPost.isLiked = !previousLikedState;

    // LocalStorage投稿の場合は従来どおり保存します
    if (targetPost.storageType !== "supabase") {
      const saveSucceeded =
        savePostsToLocalStorage();

      if (!saveSucceeded) {
        targetPost.isLiked = previousLikedState;
        return;
      }
    }

    if (targetPost.isLiked) {
      likeButton.classList.add("active");
      likeButton.textContent = "♥";
      likeButton.setAttribute(
        "aria-label",
        "お気に入りから削除"
      );
    } else {
      likeButton.classList.remove("active");
      likeButton.textContent = "♡";
      likeButton.setAttribute(
        "aria-label",
        "お気に入りに追加"
      );
    }

  } catch (error) {
    console.error(
      "お気に入りの変更に失敗しました。",
      error
    );

    window.alert(
      error.message ||
      "お気に入りの変更に失敗しました。"
    );
  } finally {
    likeButton.disabled = false;
  }
}

// 投稿IDから投稿詳細を直接開きます（通知機能用）
async function openPostDetailById(postId) {
  let post = savedPosts.find((p) => p.id === postId);
  if (!post) {
    // 読み込みにラグがある場合を考慮して少し待機して再試行
    await new Promise((resolve) => setTimeout(resolve, 500));
    post = savedPosts.find((p) => p.id === postId);
  }

  if (post) {
    openPostDetail(post);
  } else {
    console.warn(`ID: ${postId} の投稿が見つかりませんでした。`);
  }
}
window.openPostDetailById = openPostDetailById;



// 投稿一覧内がクリックされたとき
postGrid.addEventListener("click", (event) => {
  // ハートが押された場合
  const clickedLikeButton = event.target.closest(
    ".like-button"
  );

  if (clickedLikeButton) {
    const postId = clickedLikeButton.dataset.postId;

    toggleFavorite(postId, clickedLikeButton);

    // 投稿詳細は開きません
    return;
  }

  // 投稿カードが押された場合
  const clickedCard = event.target.closest(
    ".user-post-card"
  );

  if (!clickedCard) {
    return;
  }

  const clickedPostId = clickedCard.dataset.postId;

  const clickedPost = [...savedPosts]
  .reverse()
  .find((post) => post.id === clickedPostId);

  if (!clickedPost) {
    return;
  }

  openPostDetail(clickedPost);
});

// ×ボタンで閉じます
detailCloseButton.addEventListener("click", () => {
  postDetailDialog.close();
});

// 詳細画面の暗い背景を押した場合も閉じます
postDetailDialog.addEventListener("click", (event) => {
  if (event.target === postDetailDialog) {
    postDetailDialog.close();
  }
});

// =========================
// 投稿の削除
// =========================

function removeUnusedTagButtons() {
  const postCards = document.querySelectorAll(".post-card");
  const usedTags = new Set();

  postCards.forEach((card) => {
    const cardTags = card.dataset.tags
      .split(" ")
      .filter((tag) => tag !== "");

    cardTags.forEach((tag) => {
      usedTags.add(tag);
    });
  });

  const tagButtons = document.querySelectorAll(".tag-button");

  tagButtons.forEach((button) => {
    const tag = button.dataset.tag;

    // 「すべて」ボタンは削除しません
    if (tag === "all") {
      return;
    }

    // どの投稿にも使われていないタグを削除します
    if (!usedTags.has(tag)) {
      button.remove();
    }
  });
}

deletePostButton.addEventListener("click", async () => {
  if (!openedPostId) {
    return;
  }

  const postToDelete = savedPosts.find(
    (post) => post.id === openedPostId
  );

  if (!postToDelete) {
    return;
  }

  const shouldDelete = window.confirm(
    `「${postToDelete.title}」を削除しますか？\nこの操作は元に戻せません。`
  );

  if (!shouldDelete) {
    return;
  }

  try {
    deletePostButton.disabled = true;
    deletePostButton.textContent = "削除中…";

    // Supabase投稿の場合はデータベースと画像を削除します
    if (postToDelete.storageType === "supabase") {
      await deleteSupabasePost(postToDelete);
    }

    // 画面管理用の配列から削除します
    savedPosts = savedPosts.filter(
      (post) => post.id !== openedPostId
    );

    // LocalStorage投稿だけを保存し直します
    savePostsToLocalStorage();

    // 画面上の投稿カードを削除します
    const postCards = document.querySelectorAll(
      ".user-post-card"
    );

    postCards.forEach((card) => {
      if (card.dataset.postId === openedPostId) {
        card.remove();
      }
    });

    openedPostId = null;

    removeUnusedTagButtons();
    postDetailDialog.close();
    filterPosts("all");

    formStatus.textContent = "投稿を削除しました。";
  } catch (error) {
    console.error("投稿の削除に失敗しました。", error);

    formStatus.textContent =
      error.message || "投稿の削除に失敗しました。";
  } finally {
    deletePostButton.disabled = false;
    deletePostButton.textContent = "削除";
  }
});

// =========================
// 投稿編集の開始
// =========================

editPostButton.addEventListener("click", () => {
  if (!openedPostId) {
    return;
  }

  // 同じIDがある場合は、最後に読み込んだ最新データを使います
  const postToEdit = [...savedPosts]
    .reverse()
    .find((post) => post.id === openedPostId);

  if (!postToEdit) {
    return;
  }

  // ホームから編集する場合は投稿情報を一時保存して移動します
  if (document.body.classList.contains("home-page")) {
    sessionStorage.setItem(
      "caseme-editing-post-id",
      postToEdit.id
    );

    sessionStorage.setItem(
      "caseme-editing-post-data",
      JSON.stringify(postToEdit)
    );

    postDetailDialog.close();
    window.location.href = "post.html#post-form";
    return;
  }

  editingPostId = postToEdit.id;

  // フォームを初期状態にします
  caseForm.reset();
  clearImagePreview();

  // 基本情報をフォームへ戻します
  caseTitleInput.value = postToEdit.title ?? "";
  caseDescriptionInput.value =
    postToEdit.description ?? "";

  deviceTypeInput.value =
    postToEdit.deviceType ?? "";

  deviceNameInput.value =
    postToEdit.deviceName ?? "";

  // ケース情報をフォームへ戻します
  caseNameInput.value = postToEdit.caseName ?? "";
  caseShopInput.value = postToEdit.caseShop ?? "";

  // ステッカー情報をフォームへ戻します
  fillMultipleItemFields(
    stickerFields,
    postToEdit.stickers,
    postToEdit.stickerName,
    postToEdit.stickerShop,
    ".sticker-name-input",
    ".sticker-shop-input"
  );

  // キーホルダー情報をフォームへ戻します
  fillMultipleItemFields(
    keychainFields,
    postToEdit.keychains,
    postToEdit.keychainName,
    postToEdit.keychainShop,
    ".keychain-name-input",
    ".keychain-shop-input"
  );

  otherItemsInput.value =
    postToEdit.otherItems ?? "";

  // ハッシュタグをフォームへ戻します
  selectedFormTags = [...(postToEdit.tags ?? [])];
  displaySelectedFormTags();

  // 現在の投稿画像を表示します
  if (postToEdit.imageUrl) {
    imagePreview.src = postToEdit.imageUrl;
    imagePreview.hidden = false;
    imagePreviewMessage.hidden = true;
  }

  // 編集時は画像の選択を必須にしません
  caseImageInput.required = false;

  submitButton.textContent = "変更を保存";
  cancelEditButton.hidden = false;

  formStatus.textContent =
    "投稿を編集中です。画像を選び直すと変更できます。";

  if (postDetailDialog.open) {
    postDetailDialog.close();
  }

  document.querySelector("#post-form").scrollIntoView({
    behavior: "smooth"
  });

  setTimeout(() => {
    caseTitleInput.focus();
  }, 500);
});

// =========================
// 投稿編集のキャンセル
// =========================

cancelEditButton.addEventListener("click", () => {
  const shouldCancel = window.confirm(
    "投稿の編集をキャンセルしますか？\n変更した内容は保存されません。"
  );

  if (!shouldCancel) {
    return;
  }

  // 編集状態を解除します
  editingPostId = null;
  openedPostId = null;

  // フォームを空にします
  caseForm.reset();
  clearImagePreview();

  // 編集中のタグを空にします
  selectedFormTags = [];
  displaySelectedFormTags();

  // 新規投稿の状態へ戻します
  caseImageInput.required = true;
  submitButton.textContent = "投稿する";
  cancelEditButton.hidden = true;

  formStatus.textContent =
    "編集をキャンセルしました。";
});

// =========================
// 別ページからの編集引き継ぎ
// =========================

function startPendingEdit() {
  if (!document.body.classList.contains("post-page")) {
    return;
  }

  const pendingEditId = sessionStorage.getItem(
    "caseme-editing-post-id"
  );

  if (!pendingEditId) {
    return;
  }

  const postToEdit = savedPosts.find(
    (post) => post.id === pendingEditId
  );

  // 一時データは読み込んだら削除します
  sessionStorage.removeItem("caseme-editing-post-id");

  if (!postToEdit) {
    formStatus.textContent =
      "編集する投稿を読み込めませんでした。";
    return;
  }

  // 既存の編集処理を動かすため、開いている投稿IDを設定します
  openedPostId = postToEdit.id;

  // 編集ボタンを押したときと同じ処理を実行します
  editPostButton.click();
}

startPendingEdit();

// =========================
// 複数アイテム入力欄
// =========================

function rowHasItemValue(row) {
  const inputs = row.querySelectorAll("input");

  return Array.from(inputs).some((input) => {
    return input.value.trim() !== "";
  });
}

function updateItemRemoveButtons(container) {
  const rows = container.querySelectorAll(
    ".multiple-item-row"
  );

  rows.forEach((row) => {
    const removeButton = row.querySelector(
      ".remove-item-button"
    );

    // 何か入力されている行だけ削除可能にします
    removeButton.hidden = !rowHasItemValue(row);
  });
}

function appendEmptyItemRow(container) {
  const firstRow = container.querySelector(
    ".multiple-item-row"
  );

  const newRow = firstRow.cloneNode(true);

  newRow.querySelectorAll("input").forEach((input) => {
    input.value = "";
  });

  const removeButton = newRow.querySelector(
    ".remove-item-button"
  );

  removeButton.hidden = true;

  container.appendChild(newRow);
}

function setupMultipleItemFields(container) {
  // index.html側など、対象がないページでは処理しません
  if (!container) {
    return;
  }

  container.addEventListener("input", () => {
    const rows = container.querySelectorAll(
      ".multiple-item-row"
    );

    const lastRow = rows[rows.length - 1];

    // 最後の行へ入力されたら新しい空欄を追加します
    if (rowHasItemValue(lastRow)) {
      appendEmptyItemRow(container);
    }

    updateItemRemoveButtons(container);
  });

  container.addEventListener("click", (event) => {
    const removeButton = event.target.closest(
      ".remove-item-button"
    );

    if (!removeButton) {
      return;
    }

    const row = removeButton.closest(
      ".multiple-item-row"
    );

    row.remove();

    const remainingRows = container.querySelectorAll(
      ".multiple-item-row"
    );

    // 万が一すべてなくなったら空欄を作り直します
    if (remainingRows.length === 0) {
      appendEmptyItemRow(container);
    }

    updateItemRemoveButtons(container);
  });

  updateItemRemoveButtons(container);
}

setupMultipleItemFields(stickerFields);
setupMultipleItemFields(keychainFields);

// =========================
// 複数アイテムのデータ取得
// =========================

function collectMultipleItems(
  container,
  nameSelector,
  shopSelector
) {
  if (!container) {
    return [];
  }

  const rows = container.querySelectorAll(
    ".multiple-item-row"
  );

  return Array.from(rows)
    .map((row) => {
      const nameInput = row.querySelector(nameSelector);
      const shopInput = row.querySelector(shopSelector);

      return {
        name: nameInput.value.trim(),
        shop: shopInput.value.trim()
      };
    })
    .filter((item) => {
      // 名前か購入場所のどちらかがあれば保存します
      return item.name !== "" || item.shop !== "";
    });
}

function resetMultipleItemFields(container) {
  if (!container) {
    return;
  }

  const rows = Array.from(
    container.querySelectorAll(".multiple-item-row")
  );

  // 1行目以外を削除します
  rows.slice(1).forEach((row) => {
    row.remove();
  });

  const firstRow = container.querySelector(
    ".multiple-item-row"
  );

  firstRow.querySelectorAll("input").forEach((input) => {
    input.value = "";
  });

  updateItemRemoveButtons(container);
}

// =========================
// 複数アイテムを編集フォームへ戻す
// =========================

function fillMultipleItemFields(
  container,
  items,
  oldName,
  oldShop,
  nameSelector,
  shopSelector
) {
  if (!container) {
    return;
  }

  let normalizedItems = Array.isArray(items)
    ? items.filter((item) => {
        return item && (item.name || item.shop);
      })
    : [];

  // 以前の形式で保存された投稿にも対応します
  if (
    normalizedItems.length === 0 &&
    (oldName || oldShop)
  ) {
    normalizedItems = [
      {
        name: oldName,
        shop: oldShop
      }
    ];
  }

  const originalRow = container.querySelector(
    ".multiple-item-row"
  );

  const rowTemplate = originalRow.cloneNode(true);

  // 現在表示されている行を一度すべて取り除きます
  container.replaceChildren();

  function createEmptyRow() {
    const row = rowTemplate.cloneNode(true);

    row.querySelectorAll("input").forEach((input) => {
      input.value = "";
    });

    const removeButton = row.querySelector(
      ".remove-item-button"
    );

    removeButton.hidden = true;

    return row;
  }

  // 保存済みのアイテムを1行ずつ作ります
  normalizedItems.forEach((item) => {
    const row = createEmptyRow();

    row.querySelector(nameSelector).value =
      item.name ?? "";

    row.querySelector(shopSelector).value =
      item.shop ?? "";

    container.appendChild(row);
  });

  // 最後に新規入力用の空欄を1つ追加します
  container.appendChild(createEmptyRow());

  updateItemRemoveButtons(container);
}

// =========================
// 別ページで投稿内容を復元
// =========================

function restoreEditingPostFromSession() {
  // 投稿フォームがないページでは処理しません
  if (!caseForm) {
    return;
  }

  const editingPostText = sessionStorage.getItem(
    "caseme-editing-post-data"
  );

  if (!editingPostText) {
    return;
  }

  try {
    const postToEdit = JSON.parse(editingPostText);

    // 編集中の投稿として設定します
    editingPostId = postToEdit.id;
    postBeingEdited = true;

    // Supabase投稿の情報を配列にも追加します
    const alreadyExists = savedPosts.some(
      (post) => post.id === postToEdit.id
    );

    if (!alreadyExists) {
      savedPosts.push(postToEdit);
    }

    // フォームを初期状態にします
    caseForm.reset();
    clearImagePreview();

    // 基本情報をフォームへ戻します
    caseTitleInput.value = postToEdit.title ?? "";
    caseDescriptionInput.value =
      postToEdit.description ?? "";

    deviceTypeInput.value =
      postToEdit.deviceType ?? "";

    deviceNameInput.value =
      postToEdit.deviceName ?? "";

    // ケース情報を戻します
    caseNameInput.value = postToEdit.caseName ?? "";
    caseShopInput.value = postToEdit.caseShop ?? "";

    // 複数のステッカー情報を戻します
    fillMultipleItemFields(
      stickerFields,
      postToEdit.stickers,
      postToEdit.stickerName,
      postToEdit.stickerShop,
      ".sticker-name-input",
      ".sticker-shop-input"
    );

    // 複数のキーホルダー情報を戻します
    fillMultipleItemFields(
      keychainFields,
      postToEdit.keychains,
      postToEdit.keychainName,
      postToEdit.keychainShop,
      ".keychain-name-input",
      ".keychain-shop-input"
    );

    otherItemsInput.value =
      postToEdit.otherItems ?? "";

    // ハッシュタグを戻します
    selectedFormTags = [...(postToEdit.tags ?? [])];
    displaySelectedFormTags();

    // 現在の投稿画像を表示します
    if (postToEdit.imageUrl) {
      imagePreview.src = postToEdit.imageUrl;
      imagePreview.hidden = false;
      imagePreviewMessage.hidden = true;
    }

    // 編集時は画像の再選択を必須にしません
    caseImageInput.required = false;

    submitButton.textContent = "変更を保存";
    cancelEditButton.hidden = false;

    formStatus.textContent =
      "投稿を編集中です。画像を選び直すと変更できます。";
  } catch (error) {
    console.error(
      "編集する投稿情報を読み込めませんでした。",
      error
    );

    formStatus.textContent =
      "編集する投稿情報を読み込めませんでした。";
  }
}

restoreEditingPostFromSession();