// simulados.js
const container = document.getElementById("simuladosContainer");
const statusEl = document.getElementById("status");
const searchInput = document.getElementById("searchInput");
const accessPill = document.getElementById("accessPill");

const suggestBtn = document.getElementById("suggestBtn");
const suggestModal = document.getElementById("suggestModal");
const suggestForm = document.getElementById("suggestForm");
const sugTitle = document.getElementById("sugTitle");
const sugDesc = document.getElementById("sugDesc");
const sugEmail = document.getElementById("sugEmail");

function setStatus(msg){ statusEl.textContent = msg || ""; }

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[m]));
}

function normalize(s){
  return (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getFilteredQuizzes(){
  const q = normalize(searchInput?.value);
  const quizzes = window.QUIZ_BANK || [];
  if (!q) return quizzes;

  return quizzes.filter(item => {
    const blob = normalize(`${item.titulo} ${item.descricao} ${item.categoria} ${item.nivel}`);
    return blob.includes(q);
  });
}

function render(){
  const quizzes = getFilteredQuizzes();

  if (!quizzes.length){
    container.innerHTML = `
      <div class="empty">
        Nenhum simulado encontrado.
        <div style="margin-top:10px;">
          <button class="btn btn-ghost" id="emptySuggest">+ Sugerir simulado</button>
        </div>
      </div>
    `;
    document.getElementById("emptySuggest")?.addEventListener("click", openSuggest);
    return;
  }

  container.innerHTML = quizzes.map(qz => {
    const attempts = window.StorageAPI.getAttemptsByQuizId(qz.id);
    const best = attempts.length ? Math.max(...attempts.map(a => a.scorePct)) : null;

    return `
      <article class="card">
        <div class="card-top">
          <h3 class="card-title">${escapeHtml(qz.titulo)}</h3>
          <span class="badge">${escapeHtml(qz.categoria || "Simulado")}</span>
        </div>

        <p class="card-desc">${escapeHtml(qz.descricao || "")}</p>

        <div class="meta">
          <span>${qz.questoes.length} questões</span>
          <span>Nível: ${escapeHtml(qz.nivel || "—")}</span>
        </div>

        <div class="card-actions">
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn" data-start="${qz.id}">Fazer simulado</button>
            <a class="btn btn-ghost" href="historico.html?quizId=${encodeURIComponent(qz.id)}">Histórico</a>
          </div>
          ${best !== null ? `<span class="best">Melhor: ${best}%</span>` : `<span class="best">Sem tentativas</span>`}
        </div>
      </article>
    `;
  }).join("");

  container.querySelectorAll("[data-start]").forEach(btn => {
    btn.addEventListener("click", () => {
      const quizId = btn.getAttribute("data-start");
      location.href = `simulado.html?quizId=${encodeURIComponent(quizId)}`;
    });
  });
}

function openSuggest(){
  if (!suggestModal) return;
  suggestModal.classList.remove("hidden");
  suggestModal.setAttribute("aria-hidden", "false");
  sugTitle?.focus();
}
function closeSuggest(){
  if (!suggestModal) return;
  suggestModal.classList.add("hidden");
  suggestModal.setAttribute("aria-hidden", "true");
  suggestForm?.reset();
}

suggestBtn?.addEventListener("click", openSuggest);
suggestModal?.addEventListener("click", (e) => {
  const close = e.target?.dataset?.close === "1";
  if (close) closeSuggest();
});

suggestForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = sugTitle.value.trim();
  const desc = sugDesc.value.trim();
  const email = sugEmail.value.trim();

  const payload = {
    id: (crypto?.randomUUID ? crypto.randomUUID() : ("sug_" + Date.now())),
    title,
    desc,
    email,
    createdAt: new Date().toISOString()
  };

  window.StorageAPI.saveSuggestion(payload);

  // aqui depois você liga na sua API de email
  // fetch("/api/email", { method:"POST", headers:{...}, body: JSON.stringify(payload) })

  setStatus("Sugestão enviada! Obrigado — vamos analisar e adicionar em breve. ✅");
  closeSuggest();
});

searchInput?.addEventListener("input", render);

// pill acesso
if (accessPill){
  accessPill.textContent = "Acesso Premium: OK ✅";
}

render();
setStatus("Simulados carregados.");