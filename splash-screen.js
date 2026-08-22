// ==========================================
// CASEme 起動画面
// ==========================================

(function initializeSplashScreen() {
  const splash = document.querySelector("#app-splash");

  if (!splash) {
    return;
  }

  // 同じタブでページを行き来するたびに表示されないよう、
  // 1回の利用中につき最初の1回だけ表示します。
  const hasShownSplash = sessionStorage.getItem(
    "caseme-splash-shown"
  );

  if (hasShownSplash) {
    splash.remove();
    return;
  }

  sessionStorage.setItem("caseme-splash-shown", "true");
  document.body.classList.add("splash-visible");

  window.setTimeout(() => {
    splash.classList.add("is-hiding");
    document.body.classList.remove("splash-visible");

    window.setTimeout(() => {
      splash.remove();
    }, 420);
  }, 1100);
})();
