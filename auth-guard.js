// auth-guard.js
// Garante que o usuário esteja logado e (no caso de simulados) tenha acesso.

(function () {
  const logoutBtn = document.getElementById("logoutBtn");

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function getSession() {
    return read("ecv_session", null);
  }

  function hasSimuladoAccess() {
    // 1) mock local: StorageAPI.setPremiumAccess(true)
    if (window.StorageAPI?.hasPremiumAccess?.()) return true;

    // 2) compras (da tela inicial)
    const session = getSession();
    if (!session?.email) return false;
    const purchases = read("ecv_purchases", []);
    return purchases.some((p) => p.userEmail === session.email && p.hasSimulado === true);
  }

  // Se a página tiver o selo de acesso, é página premium.
  const isPremiumPage = !!document.getElementById("accessPill");

  const session = getSession();
  if (!session?.email) {
    // Não logado → volta pra home
    location.replace("index.html");
    return;
  }

  if (isPremiumPage && !hasSimuladoAccess()) {
    location.replace("index.html");
    return;
  }

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("ecv_session");
    location.replace("index.html");
  });
})();
