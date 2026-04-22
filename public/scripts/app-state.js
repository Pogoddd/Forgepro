const STORAGE_KEY = 'forgepro_v3';
const RESET_STORAGE_KEYS = ['forgepro_v1', 'forgepro_v2'];
const AUTH_SESSION_KEY = 'forgepro_auth_session_v1';
const AUTH_USER_KEY = 'forgepro_auth_user_v1';

function createDefaultState(){
  return {
    workouts: [],
    currentWorkout: null,
    currentExIdx: 0,
    injuries: [],
    streak: 0,
    savedTemplates: [],
    importedPlans: [],
    bodyWeight: [],
    meta: {version: 3}
  };
}

let state = createDefaultState();
const aiInsightCache = {homeKey:'', homeText:'', progressKey:'', progressText:''};

function cleanText(value, fallback=''){
  if(value===null || value===undefined) return fallback;
  const text = String(value).replace(/[\u0000-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim();
  return text || fallback;
}

function esc(value){
  return cleanText(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function shortLabel(value, words=2){
  return esc(cleanText(value).split(' ').slice(0,words).join(' '));
}

function encodeInlineArg(value){
  return encodeURIComponent(cleanText(value)).replace(/'/g,'%27');
}

function migrateState(raw){
  if(!raw || typeof raw !== 'object' || Array.isArray(raw)) return createDefaultState();
  return {
    ...createDefaultState(),
    ...raw,
    workouts: Array.isArray(raw.workouts) ? raw.workouts : [],
    currentWorkout: raw.currentWorkout && typeof raw.currentWorkout === 'object' ? raw.currentWorkout : null,
    currentExIdx: Number.isInteger(raw.currentExIdx) ? raw.currentExIdx : 0,
    injuries: Array.isArray(raw.injuries) ? raw.injuries : [],
    streak: Number.isFinite(raw.streak) ? raw.streak : 0,
    savedTemplates: Array.isArray(raw.savedTemplates) ? raw.savedTemplates : [],
    importedPlans: Array.isArray(raw.importedPlans) ? raw.importedPlans : [],
    bodyWeight: Array.isArray(raw.bodyWeight) ? raw.bodyWeight : [],
    meta: {version: 3}
  };
}

function withAbandonedCurrentWorkout(){
  if(!state.currentWorkout || state.currentWorkout.done) return true;
  if(!confirm('Masz aktywny trening: "' + cleanText(state.currentWorkout.name,'Trening') + '"\n\nCzy chcesz go porzucic i zaczac nowy?')) return false;
  state.currentWorkout.done = true;
  state.currentWorkout.abandoned = true;
  state.currentWorkout.endTime = Date.now();
  state.workouts.push(state.currentWorkout);
  state.currentWorkout = null;
  clearInterval(wktTimerInterval);
  save();
  return true;
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearLegacyLocalData(){
  RESET_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
}

function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return;
  try{
    state = migrateState(JSON.parse(raw));
  }catch(err){
    console.warn('Nie udalo sie wczytac danych aplikacji:', err);
    state = createDefaultState();
  }
}

function createBackupPayload(){
  return {
    exportedAt: Date.now(),
    app: 'ForgePro',
    schemaVersion: 3,
    data: migrateState(state)
  };
}

function exportAppBackup(){
  try{
    const payload = createBackupPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `forgepro-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showNotice('Backup został zapisany na urządzeniu.');
  }catch(err){
    console.warn('Nie udało się wyeksportować backupu:', err);
    showNotice('Nie udało się utworzyć backupu.');
  }
}

function openBackupImport(){
  const input = document.getElementById('backupInput');
  if(!input) return;
  input.value = '';
  input.click();
}

async function handleBackupImport(event){
  const file = event?.target?.files?.[0];
  if(!file) return;
  try{
    const text = await file.text();
    const parsed = JSON.parse(text);
    const imported = parsed?.data ?? parsed;
    const nextState = migrateState(imported);
    if(!nextState || !Array.isArray(nextState.workouts) || !Array.isArray(nextState.savedTemplates)){
      showNotice('Ten plik nie wygląda jak poprawny backup ForgePro.');
      return;
    }
    state = nextState;
    save();
    renderHome();
    updateActiveWorkoutBanner();
    showNotice('Backup został zaimportowany.');
  }catch(err){
    console.warn('Nie udało się zaimportować backupu:', err);
    showNotice('Nie udało się wczytać backupu.');
  }
}

function getAuthUser(){
  try{
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(err){
    return null;
  }
}

function hasAuthSession(){
  try{
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if(!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.uid);
  }catch(err){
    return false;
  }
}

function requireAuthSession(){
  return hasAuthSession();
}

function logoutApp(){
  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  window.location.replace('/auth.html?logout=1');
}
