// ==========================================
// CASEme 通知機能モジュール (Supabase)
// ==========================================

// プロフィール画像公開URL取得のフォールバック
function getNotificationAvatarUrl(imagePath) {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  // supabase-profiles.jsの関数が存在すればそれを使う
  if (typeof getProfileAvatarPublicUrl === "function") {
    return getProfileAvatarPublicUrl(imagePath);
  }
  // なければ直接作成する
  const { data } = caseMeSupabase.storage
    .from("profile-images")
    .getPublicUrl(imagePath);
  return data.publicUrl;
}

// 経過時間のフォーマット
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 7) return `${diffDay}日前`;
  return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

// ==========================================
// 通知API定義
// ==========================================

// 1. ログイン中のユーザーの通知一覧を取得
async function fetchNotifications() {
  const { data: { user }, error: userError } = await caseMeSupabase.auth.getUser();
  if (userError || !user) return [];

  const { data, error } = await caseMeSupabase
    .from("notifications")
    .select(`
      id,
      user_id,
      notifier_id,
      type,
      post_id,
      is_read,
      created_at,
      notifier:notifier_id ( display_name, avatar_url, username ),
      post:post_id ( title )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`通知を読み込めませんでした: ${error.message}`);
  }

  return (data ?? []).map(item => ({
    id: item.id,
    userId: item.user_id,
    notifierId: item.notifier_id,
    type: item.type,
    postId: item.post_id,
    isRead: item.is_read,
    createdAt: item.created_at,
    notifier: {
      displayName: item.notifier?.display_name || "CASEmeユーザー",
      username: item.notifier?.username || "",
      avatarUrl: getNotificationAvatarUrl(item.notifier?.avatar_url)
    },
    postTitle: item.post?.title || ""
  }));
}

// 2. 通知を作成・保存する
async function addNotification(targetUserId, type, postId = null) {
  const { data: { user }, error: userError } = await caseMeSupabase.auth.getUser();
  if (userError || !user) return;

  // 自分自身へのアクションは通知しない
  if (user.id === targetUserId) return;

  const { error } = await caseMeSupabase
    .from("notifications")
    .insert({
      user_id: targetUserId,
      notifier_id: user.id,
      type: type,
      post_id: postId
    });

  if (error) {
    console.error("通知の作成に失敗しました:", error.message);
  }
}

// 3. 特定の通知を既読にする
async function markNotificationAsRead(notificationId) {
  const { error } = await caseMeSupabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("通知の既読更新に失敗しました:", error.message);
  }
}

// 4. すべての通知を既読にする
async function markAllNotificationsAsRead() {
  const { data: { user }, error: userError } = await caseMeSupabase.auth.getUser();
  if (userError || !user) return;

  const { error } = await caseMeSupabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    throw new Error(`通知を一括既読にできませんでした: ${error.message}`);
  }
}

// 5. 未読の通知数を取得
async function fetchUnreadNotificationCount() {
  const { data: { user }, error: userError } = await caseMeSupabase.auth.getUser();
  if (userError || !user) return 0;

  const { count, error } = await caseMeSupabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("未読通知数の取得に失敗しました:", error.message);
    return 0;
  }

  return count ?? 0;
}

// ==========================================
// 通知UI初期化とインタラクション
// ==========================================

async function updateUnreadCount() {
  const badge = document.querySelector("#notification-badge");
  if (!badge) return;

  try {
    const unreadCount = await fetchUnreadNotificationCount();
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  } catch (error) {
    console.error("未読件数の更新に失敗しました:", error);
  }
}

// 通知ドロップダウンに表示するリストを描画
async function loadAndRenderNotifications() {
  const listContainer = document.querySelector("#notification-list");
  const statusMessage = document.querySelector("#notification-status");
  if (!listContainer) return;

  listContainer.replaceChildren();
  if (statusMessage) statusMessage.textContent = "読み込んでいます…";

  try {
    const notifications = await fetchNotifications();

    if (statusMessage) {
      statusMessage.textContent = notifications.length === 0 ? "新しい通知はありません。" : "";
    }

    notifications.forEach(notification => {
      const item = document.createElement("div");
      item.className = `notification-item ${notification.isRead ? "read" : "unread"}`;
      item.dataset.id = notification.id;

      // アバター画像
      const avatar = document.createElement("div");
      avatar.className = "notification-item-avatar";
      if (notification.notifier.avatarUrl) {
        avatar.style.backgroundImage = `url("${notification.notifier.avatarUrl}")`;
        avatar.classList.add("has-image");
      } else {
        avatar.textContent = notification.notifier.displayName.charAt(0).toUpperCase();
      }

      // 本文
      const content = document.createElement("div");
      content.className = "notification-item-content";

      const text = document.createElement("p");
      text.className = "notification-item-text";

      const name = document.createElement("strong");
      name.textContent = notification.notifier.displayName;

      text.appendChild(name);

      if (notification.type === "like") {
        text.appendChild(document.createTextNode(" さんがあなたの投稿 "));
        const postTitle = document.createElement("span");
        postTitle.className = "notification-post-title";
        postTitle.textContent = `「${notification.postTitle || "無題の投稿"}」`;
        text.appendChild(postTitle);
        text.appendChild(document.createTextNode(" をお気に入りに追加しました。"));
      } else if (notification.type === "follow") {
        text.appendChild(document.createTextNode(" さんがあなたをフォローしました。"));
      }

      const time = document.createElement("span");
      time.className = "notification-item-time";
      time.textContent = formatTimeAgo(notification.createdAt);

      content.appendChild(text);
      content.appendChild(time);

      // 未読ドット
      const dot = document.createElement("span");
      dot.className = "notification-unread-dot";

      item.appendChild(avatar);
      item.appendChild(content);
      item.appendChild(dot);

      // クリックイベントの登録
      item.addEventListener("click", async () => {
        // 既読にする
        if (!notification.isRead) {
          await markNotificationAsRead(notification.id);
          item.classList.remove("unread");
          item.classList.add("read");
          await updateUnreadCount();
        }

        // ドロップダウンを閉じる
        const dropdown = document.querySelector("#notification-dropdown");
        const button = document.querySelector("#header-notification-button");
        if (dropdown) dropdown.classList.remove("show");
        if (button) button.setAttribute("aria-expanded", "false");

        // 適切なページへ遷移
        if (notification.type === "like" && notification.postId) {
          // メインページ以外なら index.html に postId パラメータ付きで遷移
          const isMainPage = window.location.pathname.endsWith("index.html") || 
                             window.location.pathname.endsWith("/") ||
                             (!window.location.pathname.includes(".html") && !window.location.pathname.includes("user") && !window.location.pathname.includes("post") && !window.location.pathname.includes("profile"));
          
          if (isMainPage) {
            // index.html ならそのままモーダルを開く
            if (typeof openPostDetailById === "function") {
              openPostDetailById(notification.postId);
            } else {
              window.location.href = `index.html?postId=${notification.postId}`;
            }
          } else {
            window.location.href = `index.html?postId=${notification.postId}`;
          }
        } else if (notification.type === "follow") {
          window.location.href = `user.html?id=${encodeURIComponent(notification.notifierId)}`;
        }
      });

      listContainer.appendChild(item);
    });
  } catch (error) {
    console.error("通知のレンダリングに失敗しました:", error);
    if (statusMessage) {
      let msg = `エラー: ${error.message || "通知を読み込めませんでした。"}`;
      if (error.message && (error.message.includes("notifications") || error.message.includes("relation"))) {
        msg += " (setup_notifications.sql が実行されているかご確認ください)";
      }
      statusMessage.textContent = msg;
    }
  }
}

// ドロップダウンの開閉
function toggleNotificationDropdown(event) {
  event.stopPropagation();
  const dropdown = document.querySelector("#notification-dropdown");
  const button = document.querySelector("#header-notification-button");
  if (!dropdown || !button) return;

  const isVisible = dropdown.classList.contains("show");
  console.log("CASEme通知ドロップダウン トグル:", { currentVisibleState: isVisible });

  if (isVisible) {
    dropdown.classList.remove("show");
    button.setAttribute("aria-expanded", "false");
  } else {
    dropdown.classList.add("show");
    button.setAttribute("aria-expanded", "true");
    loadAndRenderNotifications();
  }
}

// ログイン状態に応じたUI切り替えを行う関数
async function checkAuthAndToggleUI(session = null) {
  if (typeof caseMeSupabase === "undefined") return;

  try {
    let currentSession = session;
    if (!currentSession) {
      const { data } = await caseMeSupabase.auth.getSession();
      currentSession = data.session;
    }
    const isLoggedIn = Boolean(currentSession);
    
    const notificationMenu = document.querySelector("#header-notification-menu");
    if (notificationMenu) {
      notificationMenu.hidden = !isLoggedIn;
    }

    if (isLoggedIn) {
      await updateUnreadCount();
      // 定期的に未読数を確認する (5分おき)
      if (!window.notificationIntervalId) {
        window.notificationIntervalId = setInterval(updateUnreadCount, 5 * 60 * 1000);
      }
    } else {
      if (window.notificationIntervalId) {
        clearInterval(window.notificationIntervalId);
        window.notificationIntervalId = null;
      }
      const badge = document.querySelector("#notification-badge");
      if (badge) {
        badge.hidden = true;
        badge.textContent = "0";
      }
      const dropdown = document.querySelector("#notification-dropdown");
      if (dropdown) {
        dropdown.classList.remove("show");
      }
      const button = document.querySelector("#header-notification-button");
      if (button) {
        button.setAttribute("aria-expanded", "false");
      }
    }
  } catch (error) {
    console.error("認証状態に合わせた通知UIの切り替えに失敗しました:", error);
  }
}

// UIの初期化
function initNotificationsUI() {
  const button = document.querySelector("#header-notification-button");
  const dropdown = document.querySelector("#notification-dropdown");
  const clearButton = document.querySelector("#notification-clear-button");

  if (button) {
    button.addEventListener("click", toggleNotificationDropdown);
  }

  if (dropdown) {
    dropdown.addEventListener("click", (e) => e.stopPropagation());
  }

  if (clearButton) {
    clearButton.addEventListener("click", async () => {
      try {
        clearButton.disabled = true;
        clearButton.textContent = "処理中…";
        await markAllNotificationsAsRead();
        await loadAndRenderNotifications();
        await updateUnreadCount();
      } catch (error) {
        console.error("通知の既読化に失敗しました:", error);
        alert("通知を既読にできませんでした。");
      } finally {
        clearButton.disabled = false;
        clearButton.textContent = "すべて既読にする";
      }
    });
  }

  // ドロップダウンの外側をクリックしたときに閉じる
  document.addEventListener("click", (e) => {
    const activeDropdown = document.querySelector("#notification-dropdown");
    const activeButton = document.querySelector("#header-notification-button");
    
    // クリックされた要素がベルマークボタン、またはその子要素である場合は何もしない
    if (activeButton && (activeButton === e.target || activeButton.contains(e.target))) {
      return;
    }
    
    // クリックされた要素がドロップダウン、またはその子要素である場合も何もしない
    if (activeDropdown && (activeDropdown === e.target || activeDropdown.contains(e.target))) {
      return;
    }

    if (activeDropdown) {
      activeDropdown.classList.remove("show");
    }
    if (activeButton) {
      activeButton.setAttribute("aria-expanded", "false");
    }
  });

  // ESCキーで閉じる
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const activeDropdown = document.querySelector("#notification-dropdown");
      const activeButton = document.querySelector("#header-notification-button");
      if (activeDropdown) activeDropdown.classList.remove("show");
      if (activeButton) activeButton.setAttribute("aria-expanded", "false");
    }
  });

  // 初期化時に認証状態をチェックしてUIを反映
  checkAuthAndToggleUI();
}

// 認証監視による表示制御
if (typeof caseMeSupabase !== "undefined") {
  caseMeSupabase.auth.onAuthStateChange(async (event, session) => {
    await checkAuthAndToggleUI(session);
  });

  // ドキュメント読み込み完了時にUIを設定
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNotificationsUI);
  } else {
    initNotificationsUI();
  }
}
