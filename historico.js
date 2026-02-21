// historico.js
const listEl = document.getElementById("historyList");
const subtitle = document.getElementById("subtitle");
const statusEl = document.getElementById("status");

const params = new URLSearchParams(location.search);
const quizId = params.get("quizId");

const attempts = window.StorageAPI.readAttempts();
const filtered = quizId ? attempts.filter(a => a.quizId === quizId) : attempts;

subtitle.textContent = quizId
  ? `Mostrando tentativas do simulado: ${filtered[0]?.quizTitle || quizId}`
  : "Todas as tentativas";

render();

function render() {
  if (!filtered.length) {
    listEl.innerHTML = `<div class="empty">Nenhuma tentativa ainda.</div>`;
    statusEl.textContent = "";
    return;
  }

  listEl.innerHTML = filtered.map(a => {
    const date = new Date(a.createdAt);
    const when = isNaN(date.getTime()) ? a.createdAt : date.toLocaleString("pt-BR");
    return `
      <article class="card">
        <div class="card-top">
          <h3 class="card-title">${escapeHtml(a.quizTitle)}</h3>
          <span class="badge">${a.scorePct}%</span>
        </div>

        <div class="meta">
          <span>${when}</span>
          <span>${a.correct}/${a.total} acertos</span>
          <span>${a.durationSec}s</span>
        </div>

        <div class="card-actions">
          <a class="btn btn-ghost" href="comparar.html?quizId=${encodeURIComponent(a.quizId)}">
            Comparar tentativas
          </a>
          <button class="btn" data-review="${a.id}">Ver o que errei/acertei</button>
        </div>

        <div class="review hidden" id="rev_${a.id}"></div>
      </article>
    `;
  }).join("");

  listEl.querySelectorAll("[data-review]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-review");
      const box = document.getElementById(`rev_${id}`);
      box.classList.toggle("hidden");
      if (!box.dataset.loaded) {
        const attempt = window.StorageAPI.getAttemptById(id);
        box.innerHTML = renderReview(attempt);
        box.dataset.loaded = "1";
      }
    });
  });

  statusEl.textContent = `${filtered.length} tentativa(s) encontrada(s).`;
}

function renderReview(attempt) {
  if (!attempt) return `<div class="empty">Tentativa não encontrada.</div>`;

  return `
    <div class="review-inner">
      ${attempt.answers.map((ans, i) => {
        const chosenText = ans.chosenIndex === null ? "Não respondeu" : ans.alternativas[ans.chosenIndex];
        const correctText = ans.alternativas[ans.correctIndex];
        return `
          <div class="review-q ${ans.isCorrect ? "ok" : "bad"}">
            <h4>Q${i + 1}: ${escapeHtml(ans.enunciado)}</h4>
            <p><strong>Sua resposta:</strong> ${escapeHtml(chosenText)}</p>
            <p><strong>Correta:</strong> ${escapeHtml(correctText)}</p>
            ${ans.explicacao ? `<p class="exp"><strong>Explicação:</strong> ${escapeHtml(ans.explicacao)}</p>` : ""}
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[m]));
}