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

const profileAvatarInput = document.querySelector(
  "#profile-avatar-input"
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

// 保存済みのプロフィール画像を表示します
if (profile.avatarUrl) {
  profileAvatarPreview.style.backgroundImage =
    `url("${profile.avatarUrl}")`;

  profileAvatarPreview.classList.add(
    "has-image"
  );
} else {
  // 画像未設定の場合は表示名の1文字を使います
  profileAvatarPreview.style.backgroundImage = "";

  profileAvatarPreview.classList.remove(
    "has-image"
  );
}

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

// 丸いアイコンを押したら画像選択画面を開きます
profileAvatarPreview.addEventListener(
  "click",
  () => {
    profileAvatarInput.click();
  }
);

// 選択したプロフィール画像をプレビューします
profileAvatarInput.addEventListener(
  "change",
  () => {
    const selectedImage =
      profileAvatarInput.files[0];

    if (!selectedImage) {
      profileAvatarPreview.classList.remove(
        "has-image"
      );

      profileAvatarPreview.style.backgroundImage =
        "";

      updateProfileAvatarLetter();
      return;
    }

    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (
      !allowedImageTypes.includes(selectedImage.type)
    ) {
      profileStatus.textContent =
        "JPEG・PNG・WebP形式の画像を選択してください。";

      profileAvatarInput.value = "";
      return;
    }

    if (selectedImage.size > 2 * 1024 * 1024) {
      profileStatus.textContent =
        "プロフィール画像は2MB以下にしてください。";

      profileAvatarInput.value = "";
      return;
    }

    const previewUrl =
      URL.createObjectURL(selectedImage);

    profileAvatarPreview.style.backgroundImage =
      `url("${previewUrl}")`;

    profileAvatarPreview.classList.add(
      "has-image"
    );

    profileStatus.textContent =
      "画像を選択しました。まだ保存されていません。";
  }
);

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

// 新しい画像が選ばれていればSupabaseへ保存します
const selectedAvatar =
  profileAvatarInput.files[0];

if (selectedAvatar) {
  const uploadedAvatar =
    await uploadCurrentProfileAvatar(
      selectedAvatar
    );

  profileAvatarPreview.style.backgroundImage =
    `url("${uploadedAvatar.imageUrl}")`;

  profileAvatarPreview.classList.add(
    "has-image"
  );

  // 保存済みなのでファイル選択欄を空にします
  profileAvatarInput.value = "";
}

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