// =========================
// CASEme ヘッダー認証表示
// =========================

const authLink = document.querySelector("#auth-link");
const profileLink = document.querySelector("#profile-link");
const logoutButton = document.querySelector(
  "#logout-button"
);

const headerMenuLogoutButton = document.querySelector(
  "#header-menu-logout-button"
);

// プロフィールアイコンとメニュー
const headerProfileMenu = document.querySelector(
  "#header-profile-menu"
);

const headerProfileButton = document.querySelector(
  "#header-profile-button"
);

const headerProfileAvatar = document.querySelector(
  "#header-profile-avatar"
);

const headerProfileDropdown = document.querySelector(
  "#header-profile-dropdown"
);

const headerMyProfileLink = document.querySelector(
  "#header-my-profile-link"
);

// =========================
// プロフィールメニューを閉じる
// =========================

function closeHeaderProfileMenu() {
  if (!headerProfileDropdown || !headerProfileButton) {
    return;
  }

  headerProfileDropdown.hidden = true;

  headerProfileButton.setAttribute(
    "aria-expanded",
    "false"
  );
}

// =========================
// ヘッダーにプロフィールを表示
// =========================

async function displayHeaderProfile() {
  if (
    !headerProfileMenu ||
    !headerProfileAvatar
  ) {
    return;
  }

  try {
    const profile = await fetchCurrentProfile();

    if (!profile) {
      return;
    }

    // 公開プロフィールへのリンクを設定します
    if (headerMyProfileLink) {
      headerMyProfileLink.href =
        `user.html?id=${encodeURIComponent(profile.id)}`;
    }

    // プロフィール画像が登録されている場合
    if (profile.avatarUrl) {
      headerProfileAvatar.style.backgroundImage =
        `url("${profile.avatarUrl}")`;

      headerProfileAvatar.classList.add("has-image");
    } else {
      // 画像がない場合は名前の最初の文字を表示します
      const displayName =
        profile.displayName ||
        profile.username ||
        "C";

      headerProfileAvatar.style.backgroundImage = "";

      headerProfileAvatar.classList.remove(
        "has-image"
      );

      headerProfileAvatar.textContent =
        displayName.slice(0, 1).toUpperCase();
    }
  } catch (error) {
    console.error(
      "ヘッダーのプロフィールを表示できませんでした。",
      error
    );
  }
}

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

  if (authLink) {
    authLink.hidden = isLoggedIn;
  }

  // 以前の文字のプロフィールリンクは非表示にします
  if (profileLink) {
    profileLink.hidden = true;
  }

  if (logoutButton) {
    logoutButton.hidden = !isLoggedIn;
  }

  if (headerProfileMenu) {
    headerProfileMenu.hidden = !isLoggedIn;
  }

  if (isLoggedIn) {
    await displayHeaderProfile();
  } else {
    closeHeaderProfileMenu();
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
// プロフィールメニューの開閉
// =========================

if (
  headerProfileButton &&
  headerProfileDropdown
) {
  headerProfileButton.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();

      const willOpen =
        headerProfileDropdown.hidden;

      headerProfileDropdown.hidden = !willOpen;

      headerProfileButton.setAttribute(
        "aria-expanded",
        String(willOpen)
      );
    }
  );

  headerProfileDropdown.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();
    }
  );

  document.addEventListener("click", () => {
    closeHeaderProfileMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeHeaderProfileMenu();
    }
  });
}

// =========================
// ログアウト
// =========================

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    const shouldLogout = window.confirm(
      "CASEmeからログアウトしますか？"
    );

    if (!shouldLogout) {
      return;
    }

    logoutButton.disabled = true;
    logoutButton.textContent = "ログアウト中…";

    const { error } =
      await caseMeSupabase.auth.signOut();

    if (error) {
      alert(
        `ログアウトできませんでした。\n${error.message}`
      );

      logoutButton.disabled = false;
      logoutButton.textContent = "ログアウト";
      return;
    }

    window.location.href = "index.html";
  });
}

// メニュー内のログアウトボタンから、
// 既存のログアウト処理を実行します
if (headerMenuLogoutButton && logoutButton) {
  headerMenuLogoutButton.addEventListener(
    "click",
    () => {
      closeHeaderProfileMenu();
      logoutButton.click();
    }
  );
}

// ページを開いたときに状態を確認します
updateAuthDisplay();

// ログイン状態が変化した場合も表示を更新します
caseMeSupabase.auth.onAuthStateChange(() => {
  updateAuthDisplay();
});