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

// 実際のフォロー数を表示します
await displayFollowCounts(userId);

// フォローボタンの状態を準備します
await prepareFollowButton(userId);

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

loadPublicProfile();