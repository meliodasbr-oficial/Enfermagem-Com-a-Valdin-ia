// simulado.js (feedback imediato + sequência)

const quizTitle = document.getElementById("quizTitle");
const quizDesc = document.getElementById("quizDesc");
const questionCard = document.getElementById("questionCard");
const nextBtn = document.getElementById("nextBtn");
const finishBtn = document.getElementById("finishBtn");
const statusEl = document.getElementById("status");

const progressText = document.getElementById("progressText");
const streakText = document.getElementById("streakText");
const barFill = document.getElementById("barFill");

const toastEl = document.getElementById("toast");

const params = new URLSearchParams(location.search);
const quizId = params.get("quizId");
const quiz = (window.QUIZ_BANK || []).find(q => q.id === quizId);

let currentIndex = 0;
let locked = false;

let correctCount = 0;
let streak = 0;

const startedAt = Date.now();
const answers = [];

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[m]));
}

function streakMessage(n){
  if (n >= 10) return `🔥 Perfeito! ${n} seguidas — você tá voando!`;
  if (n >= 7) return `🚀 Incrível! ${n} seguidas — continua assim!`;
  if (n >= 5) return `👏 Muito bem! ${n} seguidas — ótimo ritmo!`;
  if (n >= 3) return `✅ Boa! ${n} seguidas — já pegou o jeito!`;
  return "";
}

let toastTimer = null;
function showToast(msg){
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add("hidden"), 2400);
}

function updateProgress(){
  const total = quiz?.questoes?.length || 0;
  const idx = Math.min(currentIndex + 1, total);
  progressText.textContent = `Questão ${idx} de ${total}`;
  streakText.textContent = `🔥 Sequência: ${streak}`;
  barFill.style.width = total ? `${Math.round((currentIndex / total) * 100)}%` : "0%";
}

function renderQuestion(){
  if (!quiz){
    quizTitle.textContent = "Simulado não encontrado";
    quizDesc.textContent = "";
    questionCard.innerHTML = `<div class="feedback bad"><h3>Ops…</h3><p>ID inválido ou simulado removido.</p></div>`;
    nextBtn.classList.add("hidden");
    finishBtn.disabled = true;
    return;
  }

  const q = quiz.questoes[currentIndex];
  locked = false;
  nextBtn.classList.add("hidden");
  statusEl.textContent = "";

  const letters = ["A","B","C","D"];
  const optsHtml = q.alternativas.map((alt, i) => `
    <button class="opt" type="button" data-opt="${i}">
      <span class="letter">${letters[i]}</span>
      <span>${escapeHtml(alt)}</span>
    </button>
  `).join("");

  questionCard.innerHTML = `
    <div class="q-title">
      <h2>Questão ${currentIndex + 1}</h2>
      <span class="tag">${escapeHtml(quiz.categoria || "Simulado")}</span>
    </div>
    <p class="q-text">${escapeHtml(q.enunciado)}</p>
    <div class="options">${optsHtml}</div>
    <div id="feedback" class="feedback hidden"></div>
  `;

  questionCard.querySelectorAll("[data-opt]").forEach(btn => {
    btn.addEventListener("click", () => onChoose(Number(btn.getAttribute("data-opt"))));
  });

  updateProgress();
}

function onChoose(chosenIndex){
  if (locked) return;
  locked = true;

  const q = quiz.questoes[currentIndex];
  const correctIndex = q.corretaIndex;
  const isCorrect = chosenIndex === correctIndex;

  const opts = Array.from(questionCard.querySelectorAll(".opt"));
  opts.forEach(b => b.disabled = true);
  opts.forEach((b, i) => {
    if (i === correctIndex) b.classList.add("correct");
    if (i === chosenIndex && !isCorrect) b.classList.add("wrong");
  });

  if (isCorrect){
    correctCount++;
    streak++;
  } else {
    streak = 0;
  }

  const msg = streakMessage(streak);
  if (msg) showToast(msg);

  const feedback = document.getElementById("feedback");
  const correctLetter = ["A","B","C","D"][correctIndex];
  const chosenLetter = ["A","B","C","D"][chosenIndex];

  const explain = q.explicacao || "A alternativa correta é a que melhor atende ao conceito cobrado no enunciado.";
  const title = isCorrect
    ? `✅ Correto! Resposta: ${correctLetter}`
    : `❌ Incorreto. Você marcou ${chosenLetter}, mas a correta é ${correctLetter}`;

  const text = isCorrect
    ? `Vejo que você está dominando essa área. Motivo: ${explain}`
    : `Você errou porque a ideia principal é: ${explain}`;

  feedback.classList.remove("hidden");
  feedback.classList.toggle("good", isCorrect);
  feedback.classList.toggle("bad", !isCorrect);
  feedback.innerHTML = `<h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p>`;

  answers.push({
    questionId: q.id,
    chosenIndex,
    correctIndex,
    isCorrect,
    enunciado: q.enunciado,
    alternativas: q.alternativas,
    explicacao: explain
  });

  streakText.textContent = `🔥 Sequência: ${streak}`;

  const isLast = currentIndex >= quiz.questoes.length - 1;
  if (!isLast) nextBtn.classList.remove("hidden");
  else statusEl.textContent = "Última questão! Você já pode finalizar.";

  const total = quiz.questoes.length;
  barFill.style.width = `${Math.round(((currentIndex+1) / total) * 100)}%`;
}

nextBtn.addEventListener("click", () => {
  if (!locked){ showToast("Responda a questão antes de avançar."); return; }
  currentIndex++;
  renderQuestion();
});

finishBtn.addEventListener("click", () => {
  if (!quiz) return;

  const total = quiz.questoes.length;

  // completa respostas não respondidas
  for (let i = answers.length; i < total; i++){
    const q = quiz.questoes[i];
    answers.push({
      questionId: q.id,
      chosenIndex: null,
      correctIndex: q.corretaIndex,
      isCorrect: false,
      enunciado: q.enunciado,
      alternativas: q.alternativas,
      explicacao: q.explicacao || ""
    });
  }

  const correct = answers.filter(a => a.isCorrect).length;
  const scorePct = total ? Math.round((correct / total) * 100) : 0;
  const durationSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

  const attempt = {
    id: cryptoId(),
    quizId: quiz.id,
    quizTitle: quiz.titulo,
    createdAt: new Date().toISOString(),
    durationSec,
    total,
    correct,
    scorePct,
    answers
  };

  window.StorageAPI.saveAttempt(attempt);
  statusEl.textContent = `Salvo! Você acertou ${correct}/${total} (${scorePct}%).`;

  setTimeout(() => {
    location.href = `historico.html?quizId=${encodeURIComponent(quiz.id)}`;
  }, 700);
});

function cryptoId() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return "att_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

if (quiz){
  quizTitle.textContent = quiz.titulo;
  quizDesc.textContent = quiz.descricao || "";
}
renderQuestion();
