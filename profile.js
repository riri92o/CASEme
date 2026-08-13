// =========================
// プロフィール画面
// =========================

const profileForm = document.querySelector(
  "#profile-form"
);

const profileDisplayNameInput = document.querySelector(
  "#profile-display-name"
);

const profileUsernameInput = document.querySelector(
  "#profile-username"
);

const profileBioInput = document.querySelector(
  "#profile-bio"
);

const profileBioCount = document.querySelector(
  "#profile-bio-count"
);

const profileAvatarPreview = document.querySelector(
  "#profile-avatar-preview"
);

const profileSaveButton = document.querySelector(
  "#profile-save-button"
);

const profileStatus = document.querySelector(
  "#profile-status"
);

const profileLogoutButton = document.querySelector(
  "#profile-logout-button"
);

// 表示名の最初の1文字を仮アイコンに表示します
function updateProfileAvatarLetter() {
  const displayName =
    profileDisplayNameInput.value.trim();

  profileAvatarPreview.textContent =
    displayName !== ""
      ? displayName.charAt(0).toUpperCase()
      : "C";
}

// 自己紹介の文字数を表示します
function updateProfileBioCount() {
  const currentLength =
    profileBioInput.value.length;

  profileBioCount.textContent =
    `${currentLength} / 160`;
}

// ログイン中のプロフィールをフォームへ表示します
async function loadProfilePage() {
  try {
    profileStatus.textContent =
      "プロフィールを読み込んでいます…";

    const profile = await fetchCurrentProfile();

    // 未ログインの場合はログインページへ移動します
    if (!profile) {
      sessionStorage.setItem(
        "caseme-auth-return-url",
        "profile.html"
      );

      window.location.href = "auth.html";
      return;
    }

    profileDisplayNameInput.value =
      profile.displayName;

    profileUsernameInput.value =
      profile.username;

    profileBioInput.value =
      profile.bio;

    updateProfileAvatarLetter();
    updateProfileBioCount();

    profileStatus.textContent = "";
  } catch (error) {
    console.error(
      "プロフィールを読み込めませんでした。",
      error
    );

    profileStatus.textContent =
      error.message ||
      "プロフィールを読み込めませんでした。";
  }
}

// 表示名が変更されたら仮アイコンも変更します
profileDisplayNameInput.addEventListener(
  "input",
  updateProfileAvatarLetter
);

// 自己紹介が変更されたら文字数を更新します
profileBioInput.addEventListener(
  "input",
  updateProfileBioCount
);

// プロフィールを保存します
profileForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    try {
      profileSaveButton.disabled = true;
      profileSaveButton.textContent =
        "保存しています…";

      profileStatus.textContent = "";

      const updatedProfile =
        await updateCurrentProfile({
          displayName:
            profileDisplayNameInput.value,
          username:
            profileUsernameInput.value,
          bio:
            profileBioInput.value
        });

      profileDisplayNameInput.value =
        updatedProfile.displayName;

      profileUsernameInput.value =
        updatedProfile.username;

      profileBioInput.value =
        updatedProfile.bio;

      updateProfileAvatarLetter();
      updateProfileBioCount();

      profileStatus.textContent =
        "プロフィールを保存しました。";
    } catch (error) {
      console.error(
        "プロフィールを保存できませんでした。",
        error
      );

      profileStatus.textContent =
        error.message ||
        "プロフィールを保存できませんでした。";
    } finally {
      profileSaveButton.disabled = false;
      profileSaveButton.textContent =
        "変更を保存";
    }
  }
);

// ログアウトします
profileLogoutButton.addEventListener(
  "click",
  async () => {
    const shouldLogout = window.confirm(
      "ログアウトしますか？"
    );

    if (!shouldLogout) {
      return;
    }

    const { error } =
      await caseMeSupabase.auth.signOut();

    if (error) {
      profileStatus.textContent =
        "ログアウトできませんでした。";
      return;
    }

    window.location.href = "index.html";
  }
);

updateProfileBioCount();
loadProfilePage();