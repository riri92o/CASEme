// =========================
// CASEme ヘッダー認証表示
// =========================

const authLink = document.querySelector(
  "#auth-link"
);

const profileLink = document.querySelector(
  "#profile-link"
);

const logoutButton = document.querySelector(
  "#logout-button"
);

// =========================
// ログイン状態に合わせて表示を変更
// =========================

async function updateAuthDisplay() {
  const {
    data: { session },
    error
  } = await caseMeSupabase.auth.getSession();

  if (error) {
    console.error(
      "ログイン状態を確認できませんでした。",
      error
    );

    return;
  }

  const isLoggedIn = Boolean(session);

  // ログインリンクを切り替えます
  if (authLink) {
    authLink.hidden = isLoggedIn;
  }

  // プロフィールリンクはログイン中だけ表示します
  if (profileLink) {
    profileLink.hidden = !isLoggedIn;
  }

  // ログアウトボタンはログイン中だけ表示します
  if (logoutButton) {
    logoutButton.hidden = !isLoggedIn;
  }

  // 投稿ページはログイン中の利用者だけ開けます
  if (
    !isLoggedIn &&
    document.body.classList.contains("post-page")
  ) {
    sessionStorage.setItem(
      "caseme-return-after-login",
      "post.html"
    );

    window.location.href = "auth.html";
  }
}

// =========================
// ログアウト
// =========================

if (logoutButton) {
  logoutButton.addEventListener(
    "click",
    async () => {
      const shouldLogout = window.confirm(
        "CASEmeからログアウトしますか？"
      );

      if (!shouldLogout) {
        return;
      }

      logoutButton.disabled = true;
      logoutButton.textContent =
        "ログアウト中…";

      const { error } =
        await caseMeSupabase.auth.signOut();

      if (error) {
        window.alert(
          `ログアウトできませんでした。\n${error.message}`
        );

        logoutButton.disabled = false;
        logoutButton.textContent =
          "ログアウト";

        return;
      }

      window.location.href = "index.html";
    }
  );
}

// ページを開いたときに状態を確認します
updateAuthDisplay();

// ログイン状態が変化した場合も表示を更新します
caseMeSupabase.auth.onAuthStateChange(() => {
  updateAuthDisplay();
});