// =========================
// CASEme ログイン・新規登録
// =========================

const loginTab = document.querySelector("#login-tab");
const signupTab = document.querySelector("#signup-tab");
const authTabs = document.querySelector(".auth-tabs");

const loginForm = document.querySelector("#login-form");
const signupForm = document.querySelector("#signup-form");
const resetRequestForm = document.querySelector("#reset-request-form");
const newPasswordForm = document.querySelector("#new-password-form");

const loginStatus = document.querySelector("#login-status");
const signupStatus = document.querySelector("#signup-status");
const resetRequestStatus = document.querySelector("#reset-request-status");
const newPasswordStatus = document.querySelector("#new-password-status");

const resetEmailInput = document.querySelector("#reset-email");
const resetRequestSubmitButton = resetRequestForm.querySelector(".auth-submit-button");

const newPasswordInput = document.querySelector("#new-password");
const newPasswordConfirmationInput = document.querySelector("#new-password-confirmation");
const newPasswordSubmitButton = newPasswordForm.querySelector(".auth-submit-button");

const forgotPasswordLink = document.querySelector("#forgot-password-link");
const backToLoginButton = document.querySelector("#back-to-login-button");

// =========================
// タブ・フォーム切り替え
// =========================

function showLoginForm() {
  loginForm.hidden = false;
  signupForm.hidden = true;
  resetRequestForm.hidden = true;
  newPasswordForm.hidden = true;
  authTabs.hidden = false;

  loginTab.classList.add("active");
  signupTab.classList.remove("active");

  loginTab.setAttribute("aria-selected", "true");
  signupTab.setAttribute("aria-selected", "false");

  loginStatus.textContent = "";
  signupStatus.textContent = "";
}

function showSignupForm() {
  loginForm.hidden = true;
  signupForm.hidden = false;
  resetRequestForm.hidden = true;
  newPasswordForm.hidden = true;
  authTabs.hidden = false;

  loginTab.classList.remove("active");
  signupTab.classList.add("active");

  loginTab.setAttribute("aria-selected", "false");
  signupTab.setAttribute("aria-selected", "true");

  loginStatus.textContent = "";
  signupStatus.textContent = "";
}

function showResetRequestForm() {
  loginForm.hidden = true;
  signupForm.hidden = true;
  resetRequestForm.hidden = false;
  newPasswordForm.hidden = true;
  authTabs.hidden = true;

  resetRequestStatus.textContent = "";
}

function showNewPasswordForm() {
  loginForm.hidden = true;
  signupForm.hidden = true;
  resetRequestForm.hidden = true;
  newPasswordForm.hidden = false;
  authTabs.hidden = true;

  newPasswordStatus.textContent = "";
}


loginTab.addEventListener("click", () => {
  showLoginForm();
});

signupTab.addEventListener("click", () => {
  showSignupForm();
});

// =========================
// 新規登録
// =========================

const signupEmailInput = document.querySelector(
  "#signup-email"
);

const signupPasswordInput = document.querySelector(
  "#signup-password"
);

const signupPasswordConfirmationInput =
  document.querySelector(
    "#signup-password-confirmation"
  );

const signupSubmitButton = signupForm.querySelector(
  ".auth-submit-button"
);

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = signupEmailInput.value.trim();
  const password = signupPasswordInput.value;
  const passwordConfirmation =
    signupPasswordConfirmationInput.value;

  signupStatus.classList.remove("error");
  signupStatus.textContent = "";

  if (password !== passwordConfirmation) {
    signupStatus.classList.add("error");
    signupStatus.textContent =
      "確認用パスワードが一致していません。";
    return;
  }

  if (password.length < 8) {
    signupStatus.classList.add("error");
    signupStatus.textContent =
      "パスワードは8文字以上で設定してください。";
    return;
  }

  signupSubmitButton.disabled = true;
  signupSubmitButton.textContent = "登録しています…";

  const { data, error } =
    await caseMeSupabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          `${window.location.origin}/auth.html`
      }
    });

  signupSubmitButton.disabled = false;
  signupSubmitButton.textContent =
    "アカウントを作成";

  if (error) {
    signupStatus.classList.add("error");
    signupStatus.textContent =
      `登録できませんでした：${error.message}`;
    return;
  }

  signupForm.reset();

  if (data.session) {
    signupStatus.textContent =
      "アカウントを作成し、ログインしました。";
    return;
  }

  signupStatus.textContent =
    "確認メールを送信しました。メール内のリンクを開いて登録を完了してください。";
});

// =========================
// ログイン
// =========================

const loginEmailInput = document.querySelector(
  "#login-email"
);

const loginPasswordInput = document.querySelector(
  "#login-password"
);

const loginSubmitButton = loginForm.querySelector(
  ".auth-submit-button"
);

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;

  loginStatus.classList.remove("error");
  loginStatus.textContent = "";

  loginSubmitButton.disabled = true;
  loginSubmitButton.textContent = "ログイン中…";

  const { error } =
    await caseMeSupabase.auth.signInWithPassword({
      email,
      password
    });

  loginSubmitButton.disabled = false;
  loginSubmitButton.textContent = "ログイン";

  if (error) {
    loginStatus.classList.add("error");

    if (error.message === "Invalid login credentials") {
      loginStatus.textContent =
        "メールアドレスまたはパスワードが正しくありません。";
    } else {
      loginStatus.textContent =
        `ログインできませんでした：${error.message}`;
    }

    return;
  }

  loginStatus.textContent = "ログインしました。";

  // ログイン後にホームへ移動します
setTimeout(() => {
  const returnPage = sessionStorage.getItem(
    "caseme-return-after-login"
  );

  sessionStorage.removeItem(
    "caseme-return-after-login"
  );

  window.location.href = returnPage || "index.html";
}, 600);
});

// =========================
// パスワード再設定用イベントリスナー
// =========================

forgotPasswordLink.addEventListener("click", () => {
  showResetRequestForm();
});

backToLoginButton.addEventListener("click", () => {
  showLoginForm();
});

// =========================
// パスワード再設定メール送信処理
// =========================

resetRequestForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = resetEmailInput.value.trim();

  resetRequestStatus.classList.remove("error");
  resetRequestStatus.textContent = "";

  resetRequestSubmitButton.disabled = true;
  resetRequestSubmitButton.textContent = "送信中…";

  const { error } = await caseMeSupabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth.html?type=recovery`
  });

  resetRequestSubmitButton.disabled = false;
  resetRequestSubmitButton.textContent = "再設定メールを送信";

  if (error) {
    resetRequestStatus.classList.add("error");
    resetRequestStatus.textContent = `送信できませんでした：${error.message}`;
    return;
  }

  resetRequestForm.reset();
  resetRequestStatus.textContent = "再設定メールを送信しました。メール内のリンクを開いて新しいパスワードを設定してください。";
});

// =========================
// 新しいパスワード設定処理
// =========================

newPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const password = newPasswordInput.value;
  const passwordConfirmation = newPasswordConfirmationInput.value;

  newPasswordStatus.classList.remove("error");
  newPasswordStatus.textContent = "";

  if (password !== passwordConfirmation) {
    newPasswordStatus.classList.add("error");
    newPasswordStatus.textContent = "確認用パスワードが一致していません。";
    return;
  }

  if (password.length < 8) {
    newPasswordStatus.classList.add("error");
    newPasswordStatus.textContent = "パスワードは8文字以上で設定してください。";
    return;
  }

  newPasswordSubmitButton.disabled = true;
  newPasswordSubmitButton.textContent = "更新中…";

  const { error } = await caseMeSupabase.auth.updateUser({
    password: password
  });

  newPasswordSubmitButton.disabled = false;
  newPasswordSubmitButton.textContent = "パスワードを更新";

  if (error) {
    newPasswordStatus.classList.add("error");
    newPasswordStatus.textContent = `更新できませんでした：${error.message}`;
    return;
  }

  newPasswordForm.reset();
  newPasswordStatus.textContent = "パスワードを更新しました。ホームへ移動します。";

  setTimeout(() => {
    window.location.href = "index.html";
  }, 1500);
});

// =========================
// 初期表示の制御
// =========================

const urlParams = new URLSearchParams(window.location.search);
const isRecovery = urlParams.get("type") === "recovery";

if (isRecovery) {
  showNewPasswordForm();
}

// =========================
// パスワード表示トグル初期化
// =========================
function initPasswordToggle(inputId, buttonId) {
  const inputEl = document.getElementById(inputId);
  const buttonEl = document.getElementById(buttonId);

  if (!inputEl || !buttonEl) return;

  buttonEl.addEventListener("click", () => {
    const isPassword = inputEl.type === "password";
    inputEl.type = isPassword ? "text" : "password";

    // aria-labelの切り替え
    buttonEl.setAttribute(
      "aria-label",
      isPassword ? "パスワードを非表示にする" : "パスワードを表示する"
    );

    // クラスをトグルしてアイコンの表示を切り替え
    buttonEl.classList.toggle("show-password", isPassword);
  });
}

// 各パスワード入力欄のトグル初期化
initPasswordToggle("login-password", "toggle-login-password");
initPasswordToggle("signup-password", "toggle-signup-password");
initPasswordToggle("signup-password-confirmation", "toggle-signup-password-confirmation");
initPasswordToggle("new-password", "toggle-new-password");
initPasswordToggle("new-password-confirmation", "toggle-new-password-confirmation");