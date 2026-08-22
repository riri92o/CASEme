// ==========================================
// CASEme スマホ用固定下部ナビゲーション制御
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  initBottomNav();
});

async function initBottomNav() {
  const path = window.location.pathname;

  // 1. アクティブ項目の設定
  if (path.includes("post.html")) {
    setActiveTab("bottom-nav-post");
  } else if (path.includes("search.html")) {
    setActiveTab("bottom-nav-search");
  } else if (path.includes("favorites.html")) {
    setActiveTab("bottom-nav-favorites");
  } else if (path.includes("user.html") || path.includes("profile.html")) {
    setActiveTab("bottom-nav-profile");
  } else if (path.includes("index.html") || path === "/" || path.endsWith("/")) {
    setActiveTab("bottom-nav-home");
  }

  // 2. プロフィールリンクの動的書き換え (ログイン判定)
  if (typeof caseMeSupabase !== "undefined") {
    try {
      const { data: { session } } = await caseMeSupabase.auth.getSession();
      const profileButton = document.getElementById("bottom-nav-profile");
      if (profileButton) {
        if (session && session.user) {
          profileButton.href = `user.html?id=${encodeURIComponent(session.user.id)}`;
        } else {
          profileButton.href = "auth.html";
        }
      }
    } catch (error) {
      console.error("下部ナビのセッション取得に失敗しました:", error);
    }
  }

}

function setActiveTab(activeId) {
  // すべてのアクティブクラスを解除
  const tabs = document.querySelectorAll(".bottom-nav-item");
  tabs.forEach((tab) => tab.classList.remove("active"));

  // 対象のタブにアクティブクラスを付与
  const activeTab = document.getElementById(activeId);
  if (activeTab) {
    activeTab.classList.add("active");
  }
}
