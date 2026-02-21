const KEYS = {
  users: 'ecv_users',
  session: 'ecv_session',
  purchases: 'ecv_purchases',
  comments: 'ecv_comments'
};

const CONTACT_TO_EMAIL = 'SEUEMAIL@DOMINIO.COM'; // ✅ coloque o email que vai receber as mensagens de contato

const profileTitle = document.getElementById('profileTitle');
const profileSubtitle = document.getElementById('profileSubtitle');
const pdfList = document.getElementById('pdfList');
const purchaseList = document.getElementById('purchaseList');
const commentForm = document.getElementById('commentForm');
const simuladosLink = document.getElementById('simuladosLink');
const logoutBtn = document.getElementById('logoutBtn');

const pdfCount = document.getElementById('pdfCount');
const purchaseCount = document.getElementById('purchaseCount');

const avatarEl = document.getElementById('profileAvatar');
const changePhotoBtn = document.getElementById('changePhotoBtn');
const avatarFileProfile = document.getElementById('avatarFileProfile');

const contactFormProfile = document.getElementById('contactFormProfile');

const toastEl = document.getElementById('toast');
let toastTimer = null;

/* Foto padrão (SVG data URI) */
const DEFAULT_AVATAR = (() => {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#e7f0ff"/>
        <stop offset="1" stop-color="#ffffff"/>
      </linearGradient>
    </defs>
    <rect width="160" height="160" rx="80" fill="url(#g)"/>
    <circle cx="80" cy="62" r="26" fill="#0f4fa8" opacity="0.20"/>
    <path d="M35 140c10-28 30-40 45-40s35 12 45 40" fill="#0f4fa8" opacity="0.20"/>
    <circle cx="80" cy="62" r="18" fill="#0f4fa8" opacity="0.35"/>
    <path d="M48 140c8-22 22-32 32-32s24 10 32 32" fill="#0f4fa8" opacity="0.35"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
})();

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
  return read(KEYS.comments, []);
}

/* TOAST */
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
  }, 2600);
}

function safeTrim(v) {
  return String(v ?? '').trim();
}

function formatDate(ts) {
  return new Date(ts).toLocaleString('pt-BR');
}

function requireLogin() {
  const session = getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  return session;
}

/* ===== MENU MOBILE (PROFILE) ===== */
const menuBtn = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');
const menuBackdrop = document.getElementById('menuBackdrop');

function setMenu(open) {
  if (!menuBtn || !mobileNav || !menuBackdrop) return;

  menuBtn.classList.toggle('open', open);
  mobileNav.classList.toggle('open', open);

  menuBackdrop.classList.toggle('hidden', !open);
  menuBackdrop.setAttribute('aria-hidden', String(!open));
  menuBtn.setAttribute('aria-expanded', String(open));

  document.body.style.overflow = open ? 'hidden' : '';
}

if (menuBtn && mobileNav && menuBackdrop) {
  menuBtn.addEventListener('click', () => {
    const isOpen = mobileNav.classList.contains('open');
    setMenu(!isOpen);
  });

  menuBackdrop.addEventListener('click', () => setMenu(false));

  mobileNav.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.tagName === 'A') setMenu(false);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) setMenu(false);
  });
}

/* Helpers upload */
function isImageFile(file) {
  return file && file.type && file.type.startsWith('image/');
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getUserByEmail(email) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.email === email);
  const user = idx >= 0 ? users[idx] : null;
  return { users, idx, user };
}

function setAvatarSrc(src) {
  if (!avatarEl) return;
  avatarEl.src = src || DEFAULT_AVATAR;
}

function createDownloadContent(pdfName, userName) {
  return `Enfermagem com a Valdineia\n\nMaterial: ${pdfName}\nAluno(a): ${userName}\n\nEste é um conteúdo de demonstração (download local).`;
}

function createEmptyItem(text) {
  const li = document.createElement('li');
  li.className = 'list-empty';
  li.textContent = text;
  return li;
}

function renderProfile() {
  const session = requireLogin();
  if (!session) return;

  profileTitle.textContent = `Meu Perfil`;
  profileSubtitle.textContent = `${session.fullName} • ${session.email}`;

  // foto do usuário ou padrão
  const { user } = getUserByEmail(session.email);
  setAvatarSrc(user?.avatar || DEFAULT_AVATAR);

const purchases = getPurchases().filter((item) => item.userEmail === session.email);
const hasSimuladoAccess = purchases.some((item) => item.hasSimulado);

  if (simuladosLink) simuladosLink.classList.toggle('hidden', !hasSimuladoAccess);

  pdfList.innerHTML = '';
  purchaseList.innerHTML = '';

  if (purchases.length === 0) {
    if (pdfCount) pdfCount.textContent = '0';
    if (purchaseCount) purchaseCount.textContent = '0';

    pdfList.appendChild(createEmptyItem('Nenhum material disponível ainda. Faça sua primeira compra.'));
    purchaseList.appendChild(createEmptyItem('Nenhuma compra registrada.'));
    return;
  }

  const pdfs = [...new Set(purchases.flatMap((p) => p.pdfs))];

  if (pdfCount) pdfCount.textContent = String(pdfs.length);
  if (purchaseCount) purchaseCount.textContent = String(purchases.length);

  pdfs.forEach((pdfName) => {
    const content = createDownloadContent(pdfName, session.fullName);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const li = document.createElement('li');
    li.className = 'list-row';

    const left = document.createElement('div');
    left.className = 'list-main';
    left.innerHTML = `<strong>${pdfName}</strong><span class="muted">Download liberado</span>`;

    const a = document.createElement('a');
    a.className = 'btn btn-small';
    a.href = url;
    a.download = `${pdfName}.txt`;
    a.textContent = 'Baixar';

    li.appendChild(left);
    li.appendChild(a);
    pdfList.appendChild(li);
  });

  purchases
    .slice()
    .reverse()
    .forEach((purchase) => {
      const li = document.createElement('li');
      li.className = 'list-row';

      const left = document.createElement('div');
      left.className = 'list-main';
      left.innerHTML = `<strong>${purchase.packageName}</strong><span class="muted">${purchase.price} • ${purchase.paymentMethod} • ${formatDate(purchase.createdAt)}</span>`;

      li.appendChild(left);
      purchaseList.appendChild(li);
    });
}

/* Alterar foto */
if (changePhotoBtn && avatarFileProfile) {
  changePhotoBtn.addEventListener('click', () => avatarFileProfile.click());

  avatarFileProfile.addEventListener('change', async () => {
    const session = requireLogin();
    if (!session) return;

    const file = avatarFileProfile.files?.[0] || null;
    if (!file) return;

    if (!isImageFile(file)) {
      showToast('Arquivo inválido', 'error', 'Envie uma imagem (JPG/PNG).');
      avatarFileProfile.value = '';
      return;
    }

    const maxBytes = 1.2 * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast('Imagem muito grande', 'error', 'Envie uma imagem menor que 1,2MB.');
      avatarFileProfile.value = '';
      return;
    }

    let dataUrl = null;
    try {
      dataUrl = await fileToDataURL(file);
    } catch {
      showToast('Erro ao ler a foto', 'error', 'Tente novamente.');
      avatarFileProfile.value = '';
      return;
    }

    const { users, idx, user } = getUserByEmail(session.email);
    if (!user || idx < 0) {
      showToast('Conta não encontrada', 'error', 'Faça login novamente.');
      avatarFileProfile.value = '';
      return;
    }

    users[idx] = { ...user, avatar: dataUrl };
    write(KEYS.users, users);

    setAvatarSrc(dataUrl);
    showToast('Foto atualizada!', 'success', 'Sua foto foi salva no perfil.');
    avatarFileProfile.value = '';
  });
}

/* Comentário (salva avatar também) */
if (commentForm) {
  commentForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const session = requireLogin();
    if (!session) return;

    const text = document.getElementById('commentText').value.trim();
    const rating = Number(document.getElementById('commentRating').value) || 5;
    if (!text) return;

    const { user } = getUserByEmail(session.email);

    const comments = getComments();
    comments.push({
      name: session.fullName,
      email: session.email,
      text,
      rating,
      avatarSeed: session.fullName,
      avatar: user?.avatar || null,
      createdAt: Date.now()
    });

    write(KEYS.comments, comments);

    commentForm.reset();
    showToast('Comentário publicado!', 'success', 'Ele já aparece na página inicial.');
  });
}

/* CONTATO (PROFILE) */
function buildMailto({ name, email, msg, source }) {
  const subject = encodeURIComponent(`Contato (${source}) - ${name}`);
  const body = encodeURIComponent(
    `Nome: ${name}\nEmail: ${email}\nOrigem: ${source}\n\nMensagem:\n${msg}\n`
  );
  return `mailto:${encodeURIComponent(CONTACT_TO_EMAIL)}?subject=${subject}&body=${body}`;
}

function fillContactDefaults() {
  const session = getSession();
  if (!session) return;

  const nameEl = document.getElementById('contactNameProfile');
  const emailEl = document.getElementById('contactEmailProfile');
  if (nameEl) nameEl.value = session.fullName || '';
  if (emailEl) emailEl.value = session.email || '';
}

fillContactDefaults();

if (contactFormProfile) {
  contactFormProfile.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = safeTrim(document.getElementById('contactNameProfile')?.value);
    const email = safeTrim(document.getElementById('contactEmailProfile')?.value).toLowerCase();
    const msg = safeTrim(document.getElementById('contactMsgProfile')?.value);

    if (!name || !email || !msg) {
      showToast('Preencha todos os campos', 'error', 'Nome, email e mensagem são obrigatórios.');
      return;
    }

    if (!email.includes('@')) {
      showToast('Email inválido', 'error', 'Digite um email válido.');
      return;
    }

    try {
      const mailto = buildMailto({ name, email, msg, source: 'Perfil' });
      window.location.href = mailto;

      showToast('Mensagem pronta!', 'success', 'Abrimos seu app de email para enviar.');
      contactFormProfile.reset();
      fillContactDefaults();
    } catch {
      showToast('Erro ao preparar envio', 'error', 'Tente novamente.');
    }
  });
}

/* LOGOUT */
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(KEYS.session);
    showToast('Você saiu da conta', 'success', 'Até mais 👋');
    setTimeout(() => (window.location.href = 'index.html'), 500);
  });
}

renderProfile();