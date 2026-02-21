// theme.js (global)
(function () {
  const THEME_KEY = 'ecv_theme';
  const html = document.documentElement;
  const btn = document.getElementById('themeToggle');

  function apply(theme) {
    const t = theme === 'light' ? 'light' : 'dark';
    html.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);

    if (btn) btn.textContent = t === 'light' ? '☀️ Tema' : '🌙 Tema';
  }

  const saved = localStorage.getItem(THEME_KEY);
  apply(saved || 'dark');

  if (btn) {
    btn.addEventListener('click', () => {
      const current = html.getAttribute('data-theme') || 'dark';
      apply(current === 'dark' ? 'light' : 'dark');
    });
  }
})();