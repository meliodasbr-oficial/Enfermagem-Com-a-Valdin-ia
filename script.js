/* =========================
   STORAGE KEYS
========================= */
const KEYS = {
  users: 'ecv_users',
  session: 'ecv_session',
  purchases: 'ecv_purchases',
  comments: 'ecv_comments'
};

/* =========================
   DEFAULT COMMENTS
========================= */
const DEFAULT_COMMENTS = [
  { name: 'Ana Paula', text: 'Os PDFs são muito práticos para o plantão.', rating: 5, createdAt: Date.now() - 86400000 * 3 },
  { name: 'Carla Souza', text: 'Material profissional e fácil de entender.', rating: 5, createdAt: Date.now() - 86400000 * 2 },
  { name: 'Juliana Lima', text: 'O checklist me ajudou muito na rotina.', rating: 4, createdAt: Date.now() - 86400000 * 6 },
  { name: 'Marina Alves', text: 'Muito bem organizado e direto ao ponto.', rating: 5, createdAt: Date.now() - 86400000 * 10 },
  { name: 'Bárbara Reis', text: 'As revisões ajudam muito antes da P1.', rating: 4, createdAt: Date.now() - 86400000 * 14 }
];

/* =========================
   HELPERS
========================= */
function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function safeTrim(v) {
  return String(v ?? '').trim();
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('pt-BR');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}

function getSession() {
  return read(KEYS.session, null);
}

function getUsers() {
  return read(KEYS.users, []);
}

function getPurchases() {
  return read(KEYS.purchases, []);
}

function getComments() {
  const data = read(KEYS.comments, null);
  if (Array.isArray(data) && data.length) return data;
  write(KEYS.comments, DEFAULT_COMMENTS);
  return DEFAULT_COMMENTS;
}

/* =========================
   TOAST
========================= */
const toastEl = document.getElementById('toast');
let toastTimer = null;

function showToast(message, type = 'success', detail = '') {
  if (!toastEl) return;

  if (toastTimer) clearTimeout(toastTimer);

  toastEl.classList.remove('hidden', 'success', 'error', 'show');
  toastEl.classList.add(type);

  toastEl.innerHTML = detail ? `${message}<small>${detail}</small>` : `${message}`;

  void toastEl.offsetWidth;
  toastEl.classList.add('show');

  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.classList.add('hidden'), 230);
  }, 2800);
}

/* =========================
   AUTH HEADER
========================= */
const profileLink = document.getElementById('profileLink');
const openLogin = document.getElementById('openLogin');
const logoutBtn = document.getElementById('logoutBtn');

function updateHeaderAuth() {
  const session = getSession();

  if (!session) {
    profileLink?.classList.add('hidden');
    logoutBtn?.classList.add('hidden');
    openLogin?.classList.remove('hidden');
    return;
  }

  profileLink?.classList.remove('hidden');
  logoutBtn?.classList.remove('hidden');
  openLogin?.classList.add('hidden');
}

/* =========================
   MENU MOBILE (HAMBURGUER)
========================= */
const menuBtn = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');
const menuBackdrop = document.getElementById('menuBackdrop');

function openMenu() {
  if (!menuBtn || !mobileNav || !menuBackdrop) return;
  mobileNav.classList.add('open');
  menuBtn.classList.add('open');
  menuBtn.setAttribute('aria-expanded', 'true');
  menuBackdrop.classList.remove('hidden');
}

function closeMenu() {
  if (!menuBtn || !mobileNav || !menuBackdrop) return;
  mobileNav.classList.remove('open');
  menuBtn.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBackdrop.classList.add('hidden');
}

function toggleMenu() {
  if (!mobileNav) return;
  mobileNav.classList.contains('open') ? closeMenu() : openMenu();
}

menuBtn?.addEventListener('click', toggleMenu);
menuBackdrop?.addEventListener('click', closeMenu);

mobileNav?.querySelectorAll('a.link, a.btn').forEach((a) => {
  a.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 860px)').matches) closeMenu();
  });
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu();
});

window.addEventListener('resize', () => {
  if (!window.matchMedia('(max-width: 860px)').matches) closeMenu();
});

/* =========================
   LOGIN DIALOG
========================= */
const loginDialog = document.getElementById('loginDialog');
const loginForm = document.getElementById('loginForm');
const closeLogin = document.getElementById('closeLogin');

openLogin?.addEventListener('click', () => loginDialog?.showModal());
closeLogin?.addEventListener('click', () => loginDialog?.close());

loginForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = safeTrim(document.getElementById('loginEmail')?.value).toLowerCase();
  const password = String(document.getElementById('loginPassword')?.value ?? '');

  const user = getUsers().find((item) => item.email === email && item.password === password);
  if (!user) {
    showToast('Credenciais inválidas', 'error', 'Verifique email e senha.');
    return;
  }

  write(KEYS.session, { fullName: user.fullName, email: user.email });
  loginForm.reset();
  loginDialog?.close();

  updateHeaderAuth();
  showToast('Login realizado', 'success', `Bem-vinda(o), ${user.fullName}.`);
});

/* =========================
   LOGOUT
========================= */
logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem(KEYS.session);
  updateHeaderAuth();
  showToast('Você saiu da conta', 'success', 'Até mais 👋');
  closeMenu();
});

/* =========================
   COMMENTS (CAROUSEL)
========================= */
const commentsTrack = document.getElementById('commentsTrack');
const prevComment = document.getElementById('prevComment');
const nextComment = document.getElementById('nextComment');

let autoScrollTimer = null;

function clampRating(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function getInitials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function renderStars(rating) {
  const r = clampRating(rating);
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${i <= r ? 'filled' : ''}">★</span>`;
  }
  return html;
}

function renderAvatar(name) {
  const initials = getInitials(name);
  return `<div class="comment-avatar" aria-hidden="true">${initials}</div>`;
}

function renderComments() {
  if (!commentsTrack) return;

  commentsTrack.innerHTML = '';
  const comments = getComments().slice().reverse();

  comments.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'comment-item';

    const name = item.name ?? 'Anônimo';
    const rating = item.rating ?? 5;
    const date = item.createdAt ? formatDate(item.createdAt) : '';

    card.innerHTML = `
      <div class="comment-top">
        ${renderAvatar(name)}
        <div class="comment-meta">
          <p class="comment-name">${name}</p>
          <div class="comment-stars" aria-label="${clampRating(rating)} de 5 estrelas">
            ${renderStars(rating)}
          </div>
        </div>
        <span class="comment-date">${date}</span>
      </div>

      <p class="comment-text">“${item.text ?? ''}”</p>
    `;

    commentsTrack.appendChild(card);
  });
}

function scrollComments(dir) {
  if (!commentsTrack) return;
  commentsTrack.scrollBy({ left: dir * 320, behavior: 'smooth' });
}

function stopAutoScroll() {
  if (autoScrollTimer) {
    clearInterval(autoScrollTimer);
    autoScrollTimer = null;
  }
}

function startAutoScroll() {
  if (!commentsTrack) return;

  stopAutoScroll();
  autoScrollTimer = setInterval(() => {
    const nearEnd =
      commentsTrack.scrollLeft + commentsTrack.clientWidth >= commentsTrack.scrollWidth - 10;

    if (nearEnd) {
      commentsTrack.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      scrollComments(1);
    }
  }, 4500);
}

prevComment?.addEventListener('click', () => scrollComments(-1));
nextComment?.addEventListener('click', () => scrollComments(1));

commentsTrack?.addEventListener('mouseenter', stopAutoScroll);
commentsTrack?.addEventListener('mouseleave', startAutoScroll);

/* =========================
   CHECKOUT
========================= */
const checkoutDialog = document.getElementById('checkoutDialog');
const checkoutForm = document.getElementById('checkoutForm');
const closeCheckout = document.getElementById('closeCheckout');
const selectedPackage = document.getElementById('selectedPackage');

let selected = null;

closeCheckout?.addEventListener('click', () => checkoutDialog?.close());

document.querySelectorAll('.buy-btn').forEach((button) => {
  button.addEventListener('click', () => {
    selected = {
      packageName: button.dataset.name,
      price: button.dataset.price,
      hasSimulado: button.dataset.simulado === 'true',
      pdfs: String(button.dataset.pdfs || '').split('|').filter(Boolean)
    };

    if (selectedPackage) selectedPackage.textContent = `${selected.packageName} • ${selected.price}`;
    checkoutDialog?.showModal();
    closeMenu();
  });
});

checkoutForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!selected) return;

  const fullName = safeTrim(document.getElementById('fullName')?.value);
  const address = safeTrim(document.getElementById('address')?.value);
  const cpf = safeTrim(document.getElementById('cpf')?.value);
  const email = safeTrim(document.getElementById('email')?.value).toLowerCase();
  const password = String(document.getElementById('password')?.value ?? '');
  const paymentMethod = String(document.getElementById('paymentMethod')?.value ?? '');

  if (!fullName || !address || !cpf || !email || !password || !paymentMethod) {
    showToast('Preencha todos os campos', 'error', 'Todos os campos do checkout são obrigatórios.');
    return;
  }

  if (!isValidEmail(email)) {
    showToast('Email inválido', 'error', 'Digite um email válido.');
    return;
  }

  if (password.length < 6) {
    showToast('Senha fraca', 'error', 'Use pelo menos 6 caracteres.');
    return;
  }

  const users = getUsers();
  const existingUserIndex = users.findIndex((u) => u.email === email);
  const existingUser = existingUserIndex >= 0 ? users[existingUserIndex] : null;

  if (existingUser && existingUser.password !== password) {
    showToast('Email já cadastrado', 'error', 'Use a senha correta para comprar.');
    return;
  }

  if (!existingUser) {
    users.push({
      fullName,
      address,
      cpf,
      email,
      password,
      createdAt: Date.now()
    });
  } else {
    users[existingUserIndex] = {
      ...existingUser,
      fullName,
      address,
      cpf,
      password
    };
  }
  write(KEYS.users, users);

  const purchases = getPurchases();
  purchases.push({
    userEmail: email,
    userName: fullName,
    packageName: selected.packageName,
    price: selected.price,
    pdfs: selected.pdfs,
    hasSimulado: selected.hasSimulado,
    paymentMethod,
    createdAt: Date.now()
  });
  write(KEYS.purchases, purchases);

  write(KEYS.session, { fullName, email });

  checkoutForm.reset();
  checkoutDialog?.close();

  updateHeaderAuth();
  showToast('Compra concluída!', 'success', 'Sua conta foi criada/atualizada.');
});

/* =========================
   CONTACT (HOME) - API placeholder
========================= */
const contactFormIndex = document.getElementById('contactFormIndex');

contactFormIndex?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = safeTrim(document.getElementById('contactNameIndex')?.value);
  const email = safeTrim(document.getElementById('contactEmailIndex')?.value).toLowerCase();
  const msg = safeTrim(document.getElementById('contactMsgIndex')?.value);

  if (!name || !email || !msg) {
    showToast('Preencha todos os campos', 'error', 'Nome, email e mensagem são obrigatórios.');
    return;
  }

  if (!isValidEmail(email)) {
    showToast('Email inválido', 'error', 'Digite um email válido.');
    return;
  }

  try {
    // ✅ Aqui você liga na sua API:
    // await fetch('SUA_URL_API', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ name, email, message: msg, source: 'Site (Home)' })
    // });

    showToast('Mensagem enviada!', 'success', 'Recebemos seu contato ✅');
    contactFormIndex.reset();
  } catch {
    showToast('Erro ao enviar', 'error', 'Tente novamente.');
  }
});

/* =========================
   INIT
========================= */
updateHeaderAuth();
renderComments();
startAutoScroll();

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();