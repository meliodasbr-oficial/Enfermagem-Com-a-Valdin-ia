// menu.js (global)
(function () {
  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');
  const menuBackdrop = document.getElementById('menuBackdrop');

  if (!menuBtn || !mobileNav || !menuBackdrop) return;

  function setMenu(open) {
    menuBtn.classList.toggle('open', open);
    mobileNav.classList.toggle('open', open);

    menuBackdrop.classList.toggle('hidden', !open);
    menuBackdrop.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open));

    // trava scroll no mobile (evita bug)
    document.body.style.overflow = open ? 'hidden' : '';
  }

  menuBtn.addEventListener('click', () => {
    setMenu(!mobileNav.classList.contains('open'));
  });

  menuBackdrop.addEventListener('click', () => setMenu(false));

  // fecha clicando em link/botão dentro do menu
  mobileNav.addEventListener('click', (e) => {
    const el = e.target;
    if (!el) return;

    const shouldClose =
      el.tagName === 'A' ||
      (el.tagName === 'BUTTON' && el.id !== 'menuBtn');

    if (shouldClose && window.matchMedia('(max-width: 860px)').matches) {
      setMenu(false);
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  window.addEventListener('resize', () => {
    if (!window.matchMedia('(max-width: 860px)').matches) setMenu(false);
  });
})();