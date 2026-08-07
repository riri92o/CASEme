// =========================
// 使用するHTML要素
// =========================

const tagList = document.querySelector(".tag-list");

const postGrid = document.querySelector(".post-grid");
const postCount = document.querySelector(".post-count");

const emptyPostMessage = document.querySelector(
  "#empty-post-message"
);

const favoriteFilterButton = document.querySelector(
  "#favorite-filter-button"
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

// お気に入りだけを表示しているか記録します
let isFavoriteFilterActive = false;

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

    // お気に入りの条件
    let matchesFavorite = true;

    if (isFavoriteFilterActive) {
      matchesFavorite =
        savedPost && savedPost.isLiked === true;
    }

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
        matchesFavorite &&
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

favoriteFilterButton.addEventListener("click", () => {
  isFavoriteFilterActive = !isFavoriteFilterActive;

  favoriteFilterButton.classList.toggle(
    "active",
    isFavoriteFilterActive
  );

  favoriteFilterButton.setAttribute(
    "aria-pressed",
    String(isFavoriteFilterActive)
  );

  favoriteFilterButton.textContent =
    isFavoriteFilterActive
      ? "♥ お気に入り表示中"
      : "♡ お気に入り";

  filterPosts(selectedFilterTag);
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

function addFilterTagButton(tag) {
  const tagButtons = document.querySelectorAll(".tag-button");

  const tagAlreadyExists = Array.from(tagButtons).some(
    (button) => button.dataset.tag === tag
  );

  if (tagAlreadyExists) {
    return;
  }

  const newTagButton = document.createElement("button");

  newTagButton.type = "button";
  newTagButton.className = "tag-button";
  newTagButton.dataset.tag = tag;
  newTagButton.textContent = `#${tag}`;

  tagList.appendChild(newTagButton);
}

// =========================
// LocalStorageへの保存・読み込み
// =========================

function savePostsToLocalStorage() {
  try {
    const postsText = JSON.stringify(savedPosts);
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

    savedPosts.forEach((postData) => {
      const postCard = createPostCard(postData);
      postGrid.prepend(postCard);

      postData.tags.forEach((tag) => {
        addFilterTagButton(tag);
      });
    });
  } catch (error) {
    console.error("保存された投稿を読み込めませんでした。", error);
    savedPosts = [];
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
  const stickerName = stickerNameInput.value.trim();
  const stickerShop = stickerShopInput.value.trim();
  const keychainName = keychainNameInput.value.trim();
  const keychainShop = keychainShopInput.value.trim();
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
    stickerName,
    stickerShop,
    keychainName,
    keychainShop,
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

    const previousPostData = savedPosts[postIndex];

    // 配列の投稿データを更新します
    savedPosts[postIndex] = postData;

    const saveSucceeded = savePostsToLocalStorage();

    if (!saveSucceeded) {
      // 保存に失敗した場合は変更前へ戻します
      savedPosts[postIndex] = previousPostData;
      return;
    }

    // 画面上の古いカードを新しいカードへ交換します
    const oldPostCard = Array.from(
      document.querySelectorAll(".user-post-card")
    ).find((card) => {
      return card.dataset.postId === editingPostId;
    });

    if (oldPostCard) {
      const updatedPostCard = createPostCard(postData);
      oldPostCard.replaceWith(updatedPostCard);
    }

    // 新しく追加されたタグボタンを作ります
    selectedFormTags.forEach((tag) => {
      addFilterTagButton(tag);
    });

    // 使われなくなったタグボタンを整理します
    removeUnusedTagButtons();

    formStatus.textContent = "投稿を更新しました。";
  } else {
    // 新規投稿として保存します
    savedPosts.push(postData);

    const saveSucceeded = savePostsToLocalStorage();

    if (!saveSucceeded) {
      savedPosts.pop();
      return;
    }

    const newPostCard = createPostCard(postData);
    postGrid.prepend(newPostCard);

    selectedFormTags.forEach((tag) => {
      addFilterTagButton(tag);
    });

    formStatus.textContent = "投稿を追加しました。";
  }

  // フォームを新規投稿の状態へ戻します
  editingPostId = null;
  openedPostId = null;

  caseForm.reset();
  clearImagePreview();

  selectedFormTags = [];
  displaySelectedFormTags();

  caseImageInput.required = true;
submitButton.textContent = "投稿する";
cancelEditButton.hidden = true;

  filterPosts("all");

  document.querySelector("#posts").scrollIntoView({
    behavior: "smooth"
  });
});

// 保存済みの投稿を読み込みます
loadPostsFromLocalStorage();

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

function openPostDetail(postData) {
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

  setDetailItem(
    "detail-sticker-row",
    "detail-sticker",
    postData.stickerName
  );

  setDetailItem(
    "detail-sticker-shop-row",
    "detail-sticker-shop",
    postData.stickerShop
  );

  setDetailItem(
    "detail-keychain-row",
    "detail-keychain",
    postData.keychainName
  );

  setDetailItem(
    "detail-keychain-shop-row",
    "detail-keychain-shop",
    postData.keychainShop
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
    postData.stickerName,
    postData.stickerShop,
    postData.keychainName,
    postData.keychainShop,
    postData.otherItems
  ];

  const hasAnyItemInformation = itemValues.some((value) => {
    return typeof value === "string" && value.trim() !== "";
  });

  document.querySelector(
    "#detail-items-section"
  ).hidden = !hasAnyItemInformation;

  postDetailDialog.showModal();
}

// お気に入り状態を切り替えます
function toggleFavorite(postId, likeButton) {
  const targetPost = savedPosts.find(
    (post) => post.id === postId
  );

  if (!targetPost) {
    return;
  }

  const previousLikedState = targetPost.isLiked === true;

  // 現在と反対の状態にします
  targetPost.isLiked = !previousLikedState;

  const saveSucceeded = savePostsToLocalStorage();

  if (!saveSucceeded) {
    // 保存に失敗した場合は元の状態へ戻します
    targetPost.isLiked = previousLikedState;
    return;
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

    // お気に入り一覧の表示中なら一覧を更新します
  if (isFavoriteFilterActive) {
    filterPosts(selectedFilterTag);
  }
}

// 投稿一覧内のカードが押されたとき
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

  const clickedPost = savedPosts.find(
    (post) => post.id === clickedPostId
  );

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

deletePostButton.addEventListener("click", () => {
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

  // 配列から投稿を削除します
  savedPosts = savedPosts.filter(
    (post) => post.id !== openedPostId
  );

  // LocalStorageの内容も更新します
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

  // 使用されなくなったタグボタンを整理します
  removeUnusedTagButtons();

  // 詳細画面を閉じます
  postDetailDialog.close();

  // すべての投稿を表示し、件数を更新します
  filterPosts("all");

  formStatus.textContent = "投稿を削除しました。";
});

// =========================
// 投稿編集の開始
// =========================

editPostButton.addEventListener("click", () => {
  if (!openedPostId) {
    return;
  }

  const postToEdit = savedPosts.find(
    (post) => post.id === openedPostId
  );

  if (!postToEdit) {
    return;
  }

  editingPostId = postToEdit.id;

  // フォームを一度初期状態にします
  caseForm.reset();
  clearImagePreview();

  // 基本情報をフォームへ戻します
  caseTitleInput.value = postToEdit.title ?? "";
  caseDescriptionInput.value =
    postToEdit.description ?? "";

  deviceTypeInput.value = postToEdit.deviceType ?? "";
  deviceNameInput.value = postToEdit.deviceName ?? "";

  // アイテム情報をフォームへ戻します
  caseNameInput.value = postToEdit.caseName ?? "";
  caseShopInput.value = postToEdit.caseShop ?? "";

  stickerNameInput.value = postToEdit.stickerName ?? "";
  stickerShopInput.value = postToEdit.stickerShop ?? "";

  keychainNameInput.value =
    postToEdit.keychainName ?? "";

  keychainShopInput.value =
    postToEdit.keychainShop ?? "";

  otherItemsInput.value = postToEdit.otherItems ?? "";

  // ハッシュタグをフォームへ戻します
  selectedFormTags = [...(postToEdit.tags ?? [])];
  displaySelectedFormTags();

  // 現在の投稿画像をプレビューします
  imagePreview.src = postToEdit.imageUrl;
  imagePreview.hidden = false;
  imagePreviewMessage.hidden = true;

  // 編集時は新しい画像の選択を必須にしません
  caseImageInput.required = false;

  submitButton.textContent = "変更を保存";
cancelEditButton.hidden = false;

formStatus.textContent =
  "投稿を編集中です。画像を選び直すと変更できます。";

  // 詳細画面を閉じます
  postDetailDialog.close();

  // 投稿フォームへ移動します
  document.querySelector("#post-form").scrollIntoView({
    behavior: "smooth"
  });

  // タイトル欄へカーソルを移動します
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