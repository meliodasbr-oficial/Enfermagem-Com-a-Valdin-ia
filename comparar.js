// comparar.js
const subtitle = document.getElementById("subtitle");
const aSelect = document.getElementById("aSelect");
const bSelect = document.getElementById("bSelect");
const compareBtn = document.getElementById("compareBtn");
const result = document.getElementById("result");
const statusEl = document.getElementById("status");

const params = new URLSearchParams(location.search);
const quizId = params.get("quizId");

const all = window.StorageAPI.readAttempts();
const attempts = quizId ? all.filter(a => a.quizId === quizId) : all;

subtitle.textContent = quizId
  ? `Simulado: ${attempts[0]?.quizTitle || quizId}`
  : "Selecione duas tentativas";

if (attempts.length < 2) {
  statusEl.textContent = "Você precisa de pelo menos 2 tentativas para comparar.";
  compareBtn.disabled = true;
}

fillSelect(aSelect, attempts);
fillSelect(bSelect, attempts);

compareBtn.addEventListener("click", () => {
  const aId = aSelect.value;
  const bId = bSelect.value;
  if (!aId || !bId || aId === bId) {
    statusEl.textContent = "Escolha duas tentativas diferentes.";
    return;
  }

  const A = window.StorageAPI.getAttemptById(aId);
  const B = window.StorageAPI.getAttemptById(bId);
  result.innerHTML = renderCompare(A, B);
  statusEl.textContent = "Comparação pronta.";
});

function fillSelect(sel, list) {
  sel.innerHTML = list.map(a => {
    const d = new Date(a.createdAt);
    const label = `${d.toLocaleString("pt-BR")} — ${a.scorePct}% (${a.correct}/${a.total})`;
    return `<option value="${a.id}">${escapeHtml(label)}</option>`;
  }).join("");
}

function renderCompare(A, B) {
  if (!A || !B) return `<div class="empty">Tentativas inválidas.</div>`;

  // Mapa por questionId
  const mapA = new Map(A.answers.map(x => [x.questionId, x]));
  const mapB = new Map(B.answers.map(x => [x.questionId, x]));
  const ids = Array.from(new Set([...mapA.keys(), ...mapB.keys()]));

  const summary = `
    <div class="summary">
      <div class="sum-card">
        <h3>Tentativa A</h3>
        <p><strong>${A.scorePct}%</strong> — ${A.correct}/${A.total}</p>
      </div>
      <div class="sum-card">
        <h3>Tentativa B</h3>
        <p><strong>${B.scorePct}%</strong> — ${B.correct}/${B.total}</p>
      </div>
      <div class="sum-card">
        <h3>Diferença</h3>
        <p><strong>${B.scorePct - A.scorePct}%</strong> (B - A)</p>
      </div>
    </div>
  `;

  const rows = ids.map((qid, i) => {
    const a = mapA.get(qid);
    const b = mapB.get(qid);

    const enun = a?.enunciado || b?.enunciado || `Questão ${i + 1}`;
    const aOk = a?.isCorrect ? "✅" : "❌";
    const bOk = b?.isCorrect ? "✅" : "❌";

    const aAns = a?.chosenIndex == null ? "—" : a.alternativas[a.chosenIndex];
    const bAns = b?.chosenIndex == null ? "—" : b.alternativas[b.chosenIndex];
    const corr = (a || b)?.alternativas[(a || b)?.correctIndex] || "—";

    return `
      <div class="cmp-q">
        <h4>${escapeHtml(enun)}</h4>
        <div class="cmp-grid">
          <div class="cmp-col">
            <p><strong>A:</strong> ${aOk}</p>
            <p>${escapeHtml(aAns)}</p>
          </div>
          <div class="cmp-col">
            <p><strong>B:</strong> ${bOk}</p>
            <p>${escapeHtml(bAns)}</p>
          </div>
          <div class="cmp-col">
            <p><strong>Correta:</strong></p>
            <p>${escapeHtml(corr)}</p>
          </div>
        </div>
      </div>
    `;
  }).join("");

  return summary + `<div class="cmp-list">${rows}</div>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[m]));
}