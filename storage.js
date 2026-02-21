// storage.js
const LS_KEYS = {
  attempts: "simulados_attempts_v1"
};

function readAttempts() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.attempts)) || [];
  } catch {
    return [];
  }
}

function writeAttempts(attempts) {
  localStorage.setItem(LS_KEYS.attempts, JSON.stringify(attempts));
}

function saveAttempt(attempt) {
  const attempts = readAttempts();
  attempts.unshift(attempt); // mais recente primeiro
  writeAttempts(attempts);
}

function getAttemptsByQuizId(quizId) {
  return readAttempts().filter(a => a.quizId === quizId);
}

function getAttemptById(attemptId) {
  return readAttempts().find(a => a.id === attemptId);
}

window.StorageAPI = {
  readAttempts,
  saveAttempt,
  getAttemptsByQuizId,
  getAttemptById
};

// --- Sugestões de simulados ---
const LS_KEYS2 = {
  suggestions: "simulados_suggestions_v1",
  access: "simulados_access_v1" // controle local do acesso premium
};

function readSuggestions(){
  try { return JSON.parse(localStorage.getItem(LS_KEYS2.suggestions)) || []; }
  catch { return []; }
}
function saveSuggestion(sug){
  const list = readSuggestions();
  list.unshift(sug);
  localStorage.setItem(LS_KEYS2.suggestions, JSON.stringify(list));
}

// --- Acesso (mock local) ---
// Depois você troca para Firebase (claims / assinatura / compra)
function hasPremiumAccess(){
  // Exemplo: { premium: true, until: "2026-12-31" }
  try{
    const obj = JSON.parse(localStorage.getItem(LS_KEYS2.access));
    return !!obj?.premium;
  }catch{
    return false;
  }
}

// Helpers pra você testar agora:
function setPremiumAccess(value){
  localStorage.setItem(LS_KEYS2.access, JSON.stringify({ premium: !!value }));
}

window.StorageAPI.readSuggestions = readSuggestions;
window.StorageAPI.saveSuggestion = saveSuggestion;
window.StorageAPI.hasPremiumAccess = hasPremiumAccess;
window.StorageAPI.setPremiumAccess = setPremiumAccess;