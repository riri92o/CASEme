// =========================
// CASEme ログイン・新規登録
// =========================

const loginTab = document.querySelector("#login-tab");
const signupTab = document.querySelector("#signup-tab");

const loginForm = document.querySelector("#login-form");
const signupForm = document.querySelector("#signup-form");

const loginStatus = document.querySelector("#login-status");
const signupStatus = document.querySelector("#signup-status");

// =========================
// タブ切り替え
// =========================

function showLoginForm() {
  loginForm.hidden = false;
  signupForm.hidden = true;

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

  loginTab.classList.remove("active");
  signupTab.classList.add("active");

  loginTab.setAttribute("aria-selected", "false");
  signupTab.setAttribute("aria-selected", "true");

  loginStatus.textContent = "";
  signupStatus.textContent = "";
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