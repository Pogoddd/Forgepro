// ===================== DATA =====================
const EXERCISES_DB = [
  // Klatka
  {id:'bp', name:'Wyciskanie sztangi', cat:'Klatka', muscle:'Klatka piersiowa'},
  {id:'dbp', name:'Wyciskanie hantli', cat:'Klatka', muscle:'Klatka piersiowa'},
  {id:'fly', name:'Rozpiętki hantli', cat:'Klatka', muscle:'Klatka piersiowa'},
  {id:'cbp', name:'Wyciskanie na wyciągu', cat:'Klatka', muscle:'Klatka piersiowa'},
  {id:'dip', name:'Dipy', cat:'Klatka', muscle:'Klatka / Triceps'},
  {id:'incbp', name:'Wyciskanie skos górny', cat:'Klatka', muscle:'Górna klatka'},
  // Plecy
  {id:'dl', name:'Martwy ciąg', cat:'Plecy', muscle:'Plecy / Nogi'},
  {id:'row', name:'Wiosłowanie sztangą', cat:'Plecy', muscle:'Plecy'},
  {id:'pu', name:'Podciąganie', cat:'Plecy', muscle:'Plecy / Biceps'},
  {id:'latpd', name:'Ściąganie drążka', cat:'Plecy', muscle:'Plecy'},
  {id:'carow', name:'Wiosłowanie wyciąg', cat:'Plecy', muscle:'Plecy'},
  // Nogi
  {id:'sq', name:'Squat', cat:'Nogi', muscle:'Nogi'},
  {id:'fsq', name:'Front Squat', cat:'Nogi', muscle:'Czworogłowe'},
  {id:'leg', name:'Leg Press', cat:'Nogi', muscle:'Nogi'},
  {id:'rdk', name:'Martwy rumuński', cat:'Nogi', muscle:'Uda tylne'},
  {id:'lunge', name:'Wykroki', cat:'Nogi', muscle:'Pośladki / Czworogłowe'},
  {id:'legcurl', name:'Uginanie nóg', cat:'Nogi', muscle:'Uda tylne'},
  {id:'legext', name:'Prostowanie nóg', cat:'Nogi', muscle:'Czworogłowe'},
  {id:'calf', name:'Wspięcia na palce', cat:'Nogi', muscle:'Łydki'},
  // Ramiona
  {id:'ohp', name:'OHP (wycisk stojąc)', cat:'Barki', muscle:'Barki'},
  {id:'dbs', name:'Wycisk hantli barki', cat:'Barki', muscle:'Barki'},
  {id:'lrl', name:'Odwodzenie boczne', cat:'Barki', muscle:'Barki środkowe'},
  {id:'frl', name:'Odwodzenie przednie', cat:'Barki', muscle:'Barki przednie'},
  {id:'rrl', name:'Wznosy w opadzie', cat:'Barki', muscle:'Barki tylne'},
  // Biceps
  {id:'bbc', name:'Uginanie sztangi biceps', cat:'Biceps', muscle:'Biceps'},
  {id:'hbc', name:'Uginanie hantli', cat:'Biceps', muscle:'Biceps'},
  {id:'cbbc', name:'Uginanie wyciąg', cat:'Biceps', muscle:'Biceps'},
  {id:'hm', name:'Hammer curl', cat:'Biceps', muscle:'Biceps / Ramię'},
  // Triceps
  {id:'skullc', name:'Skull crushers', cat:'Triceps', muscle:'Triceps'},
  {id:'tpd', name:'Prostowanie wyciąg', cat:'Triceps', muscle:'Triceps'},
  {id:'tdip', name:'Dipy triceps', cat:'Triceps', muscle:'Triceps'},
  {id:'ot', name:'Wycisk nad głową triceps', cat:'Triceps', muscle:'Triceps'},
  // Core
  {id:'plank', name:'Plank', cat:'Core', muscle:'Core'},
  {id:'ab', name:'Brzuszki', cat:'Core', muscle:'Brzuch'},
  {id:'leg_raise', name:'Unoszenie nóg', cat:'Core', muscle:'Dolny brzuch'},
];

const CATS = ['Wszystkie','Klatka','Plecy','Nogi','Barki','Biceps','Triceps','Core'];
const STORAGE_KEY = 'forgepro_v3';
const RESET_STORAGE_KEYS = ['forgepro_v1', 'forgepro_v2'];
const AUTH_SESSION_KEY = 'forgepro_auth_session_v1';
const AUTH_USER_KEY = 'forgepro_auth_user_v1';

// ===================== STATE =====================
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

// ===================== LOCALSTORAGE =====================
function save(){localStorage.setItem(STORAGE_KEY, JSON.stringify(state));}
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

// ===================== NAVIGATION =====================
const screens = ['home','workout','ai','history','progress','workouts','new-workout'];
function goTo(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  const nb = document.getElementById('nav-'+name);
  if(nb) nb.classList.add('active');
  // workouts tab highlights the nav-workouts button
  if(name==='new-workout') document.getElementById('nav-workouts')?.classList.add('active');
  document.getElementById('app').scrollTop = 0;
  if(name==='home') renderHome();
  if(name==='history') renderHistory();
  if(name==='progress') renderProgress();
  if(name==='ai') initAI();
  if(name==='workouts') renderWorkoutsScreen();
  if(name==='new-workout') initNewWorkoutScreen();
  if(name==='workout') renderLiveWorkout();
  updateActiveWorkoutBanner();
}

function updateActiveWorkoutBanner(){
  const banner = document.getElementById('activeWktBanner');
  const wkt = state.currentWorkout;
  const onWorkoutScreen = document.getElementById('screen-workout').classList.contains('active');
  if(wkt && !wkt.done && !onWorkoutScreen){
    banner.classList.add('visible');
    document.getElementById('bannerWktName').textContent = wkt.name;
    // Dodaj padding do top-bar żeby nie zasłaniała contentu
    document.querySelectorAll('.top-bar').forEach(tb=>{
      if(!tb.dataset.origPadding) tb.dataset.origPadding = tb.style.paddingTop || '';
      tb.style.paddingTop = '80px';
    });
  } else {
    banner.classList.remove('visible');
    document.querySelectorAll('.top-bar').forEach(tb=>{
      if(tb.dataset.origPadding !== undefined) tb.style.paddingTop = tb.dataset.origPadding;
    });
  }
}

// Banner timer — aktualizuje się co sekundę
setInterval(()=>{
  const wkt = state.currentWorkout;
  const el = document.getElementById('bannerTimer');
  if(wkt && !wkt.done && el){
    const elapsed = Math.floor((Date.now()-wkt.startTime)/1000);
    const m = String(Math.floor(elapsed/60)).padStart(2,'0');
    const s = String(elapsed%60).padStart(2,'0');
    el.textContent = m+':'+s;
  }
}, 1000);

// ===================== WORKOUTS SCREEN =====================
let savedTemplates = []; // [{id, name, exercises:[]}]

function renderWorkoutsScreen(){
  // Load saved templates from state
  savedTemplates = state.savedTemplates || [];
  const importedPlans = state.importedPlans || [];
  const container = document.getElementById('workoutsTemplateList');

  let html = '';

  // Baner aktywnego treningu na ekranie treningów
  if(state.currentWorkout && !state.currentWorkout.done){
    html += `<div style="background:var(--orange-dim);border:1px solid var(--orange-mid);border-radius:var(--radius);padding:16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--orange);margin-bottom:3px;">🏋️ Trening aktywny</div>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px;">${esc(state.currentWorkout.name)}</div>
      </div>
      <button onclick="goTo('workout')" class="btn btn-primary" style="flex-shrink:0;width:auto;padding:10px 16px;font-size:13px;">Wróć →</button>
    </div>`;
  }

  // Imported plans section
  if(importedPlans.length){
    html += `<div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">📊 Od trenera</div>`;
    importedPlans.forEach(plan=>{
      plan.days.forEach(day=>{
        html += `<div class="wkt-template-card" onclick="startFromImportedPlan(${plan.id},'${encodeInlineArg(day.dayName)}')">
          <div class="wkt-template-name">${esc(day.dayName)}</div>
          <div class="wkt-template-meta">${esc(plan.planName)} · ${day.exercises.length} ćwiczeń</div>
          <div class="wkt-ex-chips">${day.exercises.slice(0,4).map(e=>`<div class="wkt-ex-chip">${shortLabel(e.name,3)}</div>`).join('')}${day.exercises.length>4?`<div class="wkt-ex-chip">+${day.exercises.length-4}</div>`:''}</div>
        </div>`;
      });
    });
  }

  // My templates
  if(savedTemplates.length){
    html += `<div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:${importedPlans.length?'16px':0} 0 8px;">💪 Moje treningi</div>`;
    savedTemplates.forEach(tpl=>{
      html += `<div class="wkt-template-card" style="display:flex;align-items:center;gap:12px;">
        <div style="flex:1;" onclick="startFromTemplate(${tpl.id})">
          <div class="wkt-template-name">${esc(tpl.name)}</div>
          <div class="wkt-template-meta">${tpl.exercises.length} ćwiczeń</div>
          <div class="wkt-ex-chips">${tpl.exercises.slice(0,4).map(e=>`<div class="wkt-ex-chip">${shortLabel(e.name,2)}</div>`).join('')}</div>
        </div>
        <button onclick="deleteTemplate(${tpl.id})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:20px;padding:4px;flex-shrink:0;">×</button>
      </div>`;
    });
  }

  if(!importedPlans.length && !savedTemplates.length){
    html = `<div class="empty" style="padding-top:60px;">
      <div class="eico">🏋️</div>
      <p>Brak treningów.<br>Dodaj swój pierwszy plan!</p>
    </div>`;
  }

  container.innerHTML = html;
}

function startFromTemplate(id){
  const tpl = savedTemplates.find(t=>t.id===id);
  if(!tpl) return;
  if(!withAbandonedCurrentWorkout()) return;
  state.currentWorkout = {
    id: Date.now(),
    name: tpl.name,
    startTime: Date.now(),
    exercises: tpl.exercises.map(e=>({...e, sets:[]})),
    done: false,
  };
  state.currentExIdx = 0;
  save();
  startWorkoutTimer();
  goTo('workout');
  renderLiveWorkout();
}

function deleteTemplate(id){
  if(!confirm('Usunąć szablon?')) return;
  state.savedTemplates = (state.savedTemplates||[]).filter(t=>t.id!==id);
  save();
  renderWorkoutsScreen();
}

// ===================== NEW WORKOUT SCREEN =====================
let newWktSelected = []; // [{id,name,cat,muscle}]
let newWktCat = 'Wszystkie';

function initNewWorkoutScreen(){
  newWktSelected = [];
  newWktCat = 'Wszystkie';
  document.getElementById('newWktNameInput').value = '';
  document.getElementById('newWktSearch').value = '';
  renderNewWktCats();
  renderNewWktExList();
  updateSelectedBar();
}

function renderNewWktCats(){
  const cats = ['Wszystkie','Klatka','Plecy','Nogi','Barki','Biceps','Triceps','Core'];
  document.getElementById('newWktCatTabs').innerHTML = cats.map(c=>`
    <div class="cat-tab${c===newWktCat?' active':''}" onclick="setNewWktCat('${c}')" style="flex-shrink:0;">${c}</div>
  `).join('');
}

function setNewWktCat(c){
  newWktCat = c;
  renderNewWktCats();
  renderNewWktExList();
}

function renderNewWktExList(){
  const q = (document.getElementById('newWktSearch').value||'').toLowerCase();
  const list = EXERCISES_DB.filter(e=>{
    const matchCat = newWktCat==='Wszystkie' || e.cat===newWktCat;
    const matchQ = !q || e.name.toLowerCase().includes(q) || e.muscle.toLowerCase().includes(q);
    return matchCat && matchQ;
  });
  const selIds = newWktSelected.map(e=>e.id);

  document.getElementById('newWktExList').innerHTML = list.map(ex=>{
    const isAdded = selIds.includes(ex.id);
    return `<div class="new-ex-row">
      <div>
        <div class="ex-name">${esc(ex.name)}</div>
        <div class="ex-cat">${esc(ex.cat)} · ${esc(ex.muscle)}</div>
      </div>
      <button class="add-btn ${isAdded?'added':'add'}" onclick="toggleNewWktEx('${ex.id}')">
        ${isAdded?'✓':'+'}
      </button>
    </div>`;
  }).join('') || '<div class="empty"><p>Brak wyników</p></div>';
}

function toggleNewWktEx(id){
  const ex = EXERCISES_DB.find(e=>e.id===id);
  if(!ex) return;
  const idx = newWktSelected.findIndex(e=>e.id===id);
  if(idx>=0) newWktSelected.splice(idx,1);
  else newWktSelected.push(ex);
  renderNewWktExList();
  updateSelectedBar();
}

function updateSelectedBar(){
  const bar = document.getElementById('selectedSummaryBar');
  const chips = document.getElementById('selectedChips');
  if(!newWktSelected.length){ bar.style.display='none'; return; }
  bar.style.display='block';
  chips.innerHTML = newWktSelected.map(e=>`
    <div class="sel-chip">
      ${shortLabel(e.name,2)}
      <button onclick="toggleNewWktEx('${e.id}')">×</button>
    </div>
  `).join('');
}

function addCustomExercise(){
  const name = cleanText(prompt('Nazwa cwiczenia:'), '');
  if(!name) return;
  const cat = 'Custom';
  const id = 'custom_'+Date.now();
  const ex = {id, name, cat, muscle:'Wlasne'};
  EXERCISES_DB.push(ex);
  newWktSelected.push(ex);
  renderNewWktExList();
  updateSelectedBar();
}

function saveNewWorkoutAndStart(){
  if(!withAbandonedCurrentWorkout()) return;
  if(!newWktSelected.length){ alert('Dodaj co najmniej 1 cwiczenie!'); return; }
  const name = cleanText(document.getElementById('newWktNameInput').value) ||
    'Trening ' + new Date().toLocaleDateString('pl',{weekday:'long'});

  if(!state.savedTemplates) state.savedTemplates = [];
  const tpl = {
    id: Date.now(),
    name,
    exercises: newWktSelected.map(e=>({...e})),
    createdAt: Date.now(),
  };
  state.savedTemplates.push(tpl);

  state.currentWorkout = {
    id: Date.now()+1,
    name,
    startTime: Date.now(),
    exercises: newWktSelected.map(e=>({...e, sets:[]})),
    done: false,
  };
  state.currentExIdx = 0;
  save();
  startWorkoutTimer();
  goTo('workout');
  renderLiveWorkout();
}

function openPanel(id){
  if(id==='newWorkoutPanel') resetNewWorkout();
  document.getElementById(id).classList.add('open');
}
function closePanel(id){document.getElementById(id).classList.remove('open');}

// Close panel on backdrop click
document.querySelectorAll('.panel').forEach(p=>{
  p.addEventListener('click',e=>{if(e.target===p)p.classList.remove('open');});
});

// ===================== EXERCISE PANEL =====================
let exPanelMode = 'new'; // 'new' | 'live'
let selectedCat = 'Wszystkie';
let newWktExercises = []; // [{id, name, muscle, sets:[{kg,reps}]}]

function openExPanel(mode){
  exPanelMode = mode;
  document.getElementById('exSearch').value = '';
  selectedCat = 'Wszystkie';
  renderCatTabs();
  renderExList();
  document.getElementById('exPanel').classList.add('open');
}

function renderCatTabs(){
  document.getElementById('catTabs').innerHTML = CATS.map(c=>`
    <div class="cat-tab${c===selectedCat?' active':''}" onclick="selectCat('${c}')">${c}</div>
  `).join('');
}

function selectCat(c){
  selectedCat = c;
  renderCatTabs();
  renderExList();
}

function renderExList(){
  const q = document.getElementById('exSearch').value.toLowerCase();
  const list = EXERCISES_DB.filter(e=>{
    const matchCat = selectedCat==='Wszystkie' || e.cat===selectedCat;
    const matchQ = !q || e.name.toLowerCase().includes(q) || e.muscle.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const added = newWktExercises.map(e=>e.id);

  document.getElementById('exList').innerHTML = list.map(e=>{
    const isAdded = added.includes(e.id);
    return `<div class="ex-item" onclick="addExercise('${e.id}')">
      <div>
        <div class="ex-name">${esc(e.name)}</div>
        <div class="ex-tag">${esc(e.cat)} · ${esc(e.muscle)}</div>
      </div>
      <div class="ex-add${isAdded?' added':''}">
        ${isAdded?'✓':'+'}
      </div>
    </div>`;
  }).join('') || '<div class="empty"><p>Brak wyników</p></div>';
}

function addExercise(id){
  const ex = EXERCISES_DB.find(e=>e.id===id);
  if(!ex) return;
  if(exPanelMode==='new'){
    if(!newWktExercises.find(e=>e.id===id)){
      newWktExercises.push({...ex, sets:[]});
      renderWktExList();
    } else {
      newWktExercises = newWktExercises.filter(e=>e.id!==id);
      renderWktExList();
    }
    renderExList();
  } else if(exPanelMode==='live'){
    // add to live workout
    if(!state.currentWorkout.exercises.find(e=>e.id===id)){
      state.currentWorkout.exercises.push({...ex, sets:[]});
      save();
    }
    closePanel('exPanel');
    renderLiveWorkout();
  }
}

// ===================== NEW WORKOUT =====================
function resetNewWorkout(){
  newWktExercises = [];
  document.getElementById('wktName').value = '';
  renderWktExList();
}

function renderWktExList(){
  const container = document.getElementById('wktExList');
  const empty = document.getElementById('wktExEmpty');
  if(newWktExercises.length===0){
    container.innerHTML = '<div id="wktExEmpty" style="padding:16px;font-size:13px;color:var(--muted);text-align:center;">Brak ćwiczeń — dodaj poniżej</div>';
    return;
  }
  container.innerHTML = newWktExercises.map((e,i)=>`
    <div class="plan-item">
      <div class="ex-info">
        <div class="ex-n">${esc(e.name)}</div>
        <div class="ex-s">${esc(e.muscle)}</div>
      </div>
      <button class="ex-rm" onclick="removeFromNew(${i})">×</button>
    </div>
  `).join('');
}

function removeFromNew(i){
  newWktExercises.splice(i,1);
  renderWktExList();
  renderExList();
}

function saveWorkoutTemplate(){
  if(!withAbandonedCurrentWorkout()) return;
  const name = cleanText(document.getElementById('wktName').value) || 'Trening ' + new Date().toLocaleDateString('pl');
  if(newWktExercises.length===0){alert('Dodaj co najmniej 1 ćwiczenie!');return;}

  state.currentWorkout = {
    id: Date.now(),
    name,
    startTime: Date.now(),
    exercises: newWktExercises.map(e=>({...e, sets:[]})),
    done: false,
  };
  state.currentExIdx = 0;
  save();

  closePanel('newWorkoutPanel');
  startWorkoutTimer();
  goTo('workout');
  renderLiveWorkout();
}

// ===================== LIVE WORKOUT =====================
let wktTimerInterval = null;
function startWorkoutTimer(){
  clearInterval(wktTimerInterval);
  wktTimerInterval = setInterval(()=>{
    if(!state.currentWorkout) return;
    const elapsed = Math.floor((Date.now()-state.currentWorkout.startTime)/1000);
    const m = String(Math.floor(elapsed/60)).padStart(2,'0');
    const s = String(elapsed%60).padStart(2,'0');
    const el = document.getElementById('wktTimer');
    if(el) el.textContent = m+':'+s;
  },1000);
}

function switchWktTab(tab){
  ['info','log','hist'].forEach(t=>{
    document.getElementById('tab-'+t).classList.toggle('active', t===tab);
    document.getElementById('wktTab'+t.charAt(0).toUpperCase()+t.slice(1)).style.display = t===tab?'block':'none';
  });
  if(tab==='log') renderLogTab();
  if(tab==='info') renderInfoTab();
  if(tab==='hist') renderHistTab();
  updateMainActionBtn(tab);
}

function updateMainActionBtn(tab){
  const wkt = state.currentWorkout;
  const btn = document.getElementById('mainActionBtn');
  if(!btn) return;
  if(!tab){
    // Auto-detect active tab
    tab = document.getElementById('tab-log').classList.contains('active') ? 'log' :
          document.getElementById('tab-hist').classList.contains('active') ? 'hist' : 'info';
  }
  if(tab==='log'){
    const totalLogged = wkt ? wkt.exercises.reduce((sum, ex) => sum + ex.sets.length, 0) : 0;
    const totalPlanned = wkt ? wkt.exercises.reduce((sum, ex) => sum + Math.max(ex.plannedSets || 3, ex.sets.length), 0) : 0;
    btn.textContent = `${totalLogged}/${totalPlanned} ZAPISZ`;
    btn.className='btn btn-primary';
    btn.style.background = '';
    btn.onclick=confirmFinish;
  } else if(tab==='info'){
    const allDone = wkt?.exercises.every(e=>e.sets.length>=(e.plannedSets||3));
    if(allDone){
      btn.textContent='🏁 Zakończ trening';
      btn.className='btn btn-primary';
      btn.style.background='var(--green)';
      btn.onclick=confirmFinish;
    } else {
      btn.textContent='▶ Zacznij logować';
      btn.style.background='';
      btn.className='btn btn-primary';
      btn.onclick=()=>switchWktTab('log');
    }
  } else {
    btn.textContent='🏁 Zakończ trening';
    btn.style.background='';
    btn.className='btn btn-primary';
    btn.onclick=confirmFinish;
  }
}

function renderInfoTab(){
  const wkt = state.currentWorkout;
  if(!wkt) return;
  const ICONS = {'Klatka':'🫁','Plecy':'🔙','Nogi':'🦵','Barki':'💪','Biceps':'💪','Triceps':'💪','Core':'🔥','Custom':'⚡','—':'⚡'};
  document.getElementById('exOverviewList').innerHTML = wkt.exercises.map((ex,i)=>{
    const totalSets = ex.plannedSets || 3;
    const doneSets = ex.sets.length;
    const icon = ICONS[ex.cat] || '🏋️';
    const allDone = doneSets >= totalSets;
    return `
      <div class="ex-overview-card${allDone?' all-done':''}">
        <div class="ex-overview-header">
          <div class="ex-thumb">${icon}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:15px;margin-bottom:2px;line-height:1.3;">${esc(ex.name)}</div>
            ${ex.notes?`<div style="font-size:11px;color:var(--orange);margin-bottom:2px;">${ex.notes}</div>`:''}
            <div style="font-size:12px;color:var(--muted);">${ex.plannedSets||3} serie · ${ex.plannedReps||'8-12'} powt.${ex.rest?' · '+ex.rest:''}</div>
          </div>
          <div style="flex-shrink:0;text-align:right;">
            <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:${allDone?'var(--green)':doneSets>0?'var(--orange)':'var(--muted)'};">${doneSets}/${totalSets}</div>
            <div style="font-size:10px;color:var(--muted);">serii</div>
          </div>
        </div>
        ${doneSets>0?`
        <div style="border-top:1px solid var(--border);">
          <div style="display:grid;grid-template-columns:44px 1fr 1fr;padding:6px 16px;background:var(--surface2);">
            <div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;">Seria</div>
            <div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;text-align:center;">kg</div>
            <div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;text-align:center;">Powt.</div>
          </div>
          ${ex.sets.map((s,si)=>`
            <div style="display:grid;grid-template-columns:44px 1fr 1fr;padding:9px 16px;border-top:1px solid var(--border);background:var(--green-dim);">
              <div style="width:28px;height:28px;border-radius:7px;background:var(--green);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;">${si+1}</div>
              <div style="text-align:center;font-size:15px;font-weight:700;">${s.kg} kg</div>
              <div style="text-align:center;font-size:15px;font-weight:700;">× ${s.reps}</div>
            </div>
          `).join('')}
        </div>`:''}
        <div style="padding:10px 14px;border-top:1px solid var(--border);">
          <button onclick="goToLogEx(${i})" class="btn ${allDone?'btn-ghost':'btn-primary'}" style="padding:11px;">
            ${allDone?'✓ Zalogowane — edytuj':'▶ Zaloguj to ćwiczenie'}
          </button>
        </div>
      </div>
    `;
  }).join('');
  updateMainActionBtn('info');
}

function goToLogEx(idx){
  state.currentExIdx = idx;
  save();
  switchWktTab('log');
  setTimeout(()=>{
    document.getElementById(`log-card-${idx}`)?.scrollIntoView({behavior:'smooth', block:'center'});
  }, 50);
}

function getPrevExerciseSets(exId){
  const history = state.workouts.filter(w=>w.done);
  for(let i=history.length-1;i>=0;i--){
    const ex = history[i].exercises.find(e=>e.id===exId);
    if(ex && ex.sets.length>0 && !ex.skipped){
      return ex.sets;
    }
  }
  return [];
}

function getDraftValues(ex, rowIdx){
  const prevSets = getPrevExerciseSets(ex.id);
  const prevRow = prevSets[rowIdx] || prevSets[prevSets.length-1];
  const lastLogged = ex.sets[ex.sets.length-1];
  const plannedReps = cleanText(ex.plannedReps || '');
  const repsMatch = plannedReps.match(/^(\d+)/);
  return {
    kg: lastLogged?.kg ?? prevRow?.kg ?? '',
    reps: lastLogged?.reps ?? prevRow?.reps ?? (repsMatch ? repsMatch[1] : '')
  };
}

function countWorkoutSets(){
  const wkt = state.currentWorkout;
  if(!wkt) return {logged:0, planned:0};
  return {
    logged: wkt.exercises.reduce((sum, ex) => sum + ex.sets.length, 0),
    planned: wkt.exercises.reduce((sum, ex) => sum + Math.max(ex.plannedSets || 3, ex.sets.length), 0)
  };
}

function getExerciseThumb(ex){
  return (cleanText(ex.name).trim().charAt(0) || 'T').toUpperCase();
}

function renderLogTab(){
  const wkt = state.currentWorkout;
  if(!wkt) return;

  const counts = countWorkoutSets();

  document.getElementById('logExerciseCards').innerHTML = wkt.exercises.map((ex, exIdx)=>{
    const prevSets = getPrevExerciseSets(ex.id);
    const totalRows = Math.max(ex.plannedSets || 3, ex.sets.length);
    const isCurrent = exIdx === state.currentExIdx;
    const thumb = getExerciseThumb(ex);
    return `
      <div id="log-card-${exIdx}" class="log-card ${isCurrent?'current':''}">
        <div class="log-card-head">
          <div class="log-card-meta">
            <div class="log-thumb">${thumb}</div>
            <div style="min-width:0;flex:1;">
              <div class="log-card-name">${esc(ex.name)}</div>
              <div class="log-card-plan">${ex.plannedSets||3} serii · ${esc(ex.plannedReps||'8-12')} powt.${ex.rest?` · ${esc(ex.rest)} przerwy`:''}</div>
            </div>
          </div>
          <div class="log-card-count">
            <strong>${ex.sets.length}/${totalRows}</strong>
            <span>serii</span>
          </div>
        </div>
        ${ex.notes?`<div class="log-note">${esc(ex.notes)}</div>`:''}
        <div class="log-grid-wrap">
          <div class="log-grid-head">
            <div>Seria</div>
            <div>Poprzednio</div>
            <div>kg</div>
            <div>Powt.</div>
            <div></div>
          </div>
          ${Array.from({length:totalRows},(_,rowIdx)=>{
            const loggedSet = ex.sets[rowIdx];
            const prevSet = prevSets[rowIdx] || prevSets[prevSets.length-1];
            const draft = getDraftValues(ex, rowIdx);
            return `
              <div class="log-grid-row">
                <div class="log-set-badge">${rowIdx+1}</div>
                <div class="log-prev ${prevSet?'':'empty'}">${prevSet?`${prevSet.kg} kg x ${prevSet.reps}`:'-'}</div>
                <input id="log-kg-${exIdx}-${rowIdx}" class="log-mini-inp" type="number" step="2.5" min="0" inputmode="decimal" value="${loggedSet?loggedSet.kg:draft.kg}" ${loggedSet?'disabled':''}>
                <input id="log-reps-${exIdx}-${rowIdx}" class="log-mini-inp" type="number" min="1" inputmode="numeric" value="${loggedSet?loggedSet.reps:draft.reps}" ${loggedSet?'disabled':''}>
                ${loggedSet
                  ? `<button onclick="removeLoggedSet(${exIdx},${rowIdx})" title="Usuń serię" class="log-check done">✓</button>`
                  : `<button onclick="logInlineSet(${exIdx},${rowIdx})" title="Zapisz serię" class="log-check save">✓</button>`
                }
              </div>`;
          }).join('')}
          <div class="log-row-actions">
            <button class="log-add-btn" onclick="addInlineSetRow(${exIdx})">Dodaj serię</button>
            ${ex.sets.length ? `<button class="log-copy-btn" onclick="copyLastLoggedSet(${exIdx})">Powtórz</button>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
  const btn = document.getElementById('mainActionBtn');
  if(btn){
    btn.textContent = `${counts.logged}/${counts.planned} ZAPISZ`;
  }
  updateMainActionBtn('log');
}

function renderHistTab(){
  const wkt = state.currentWorkout;
  if(!wkt) return;
  const allSets = wkt.exercises.flatMap(ex=>ex.sets.map(s=>({...s,exName:ex.name})));
  if(!allSets.length){
    document.getElementById('wktHistList').innerHTML='<div class="empty"><p>Brak zalogowanych serii jeszcze.</p></div>';
    return;
  }
  document.getElementById('wktHistList').innerHTML = wkt.exercises.filter(ex=>ex.sets.length>0).map(ex=>`
    <div style="margin-bottom:14px;">
      <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">${esc(ex.name)}</div>
      ${ex.sets.map((s,i)=>`
        <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;margin-bottom:4px;">
          <span style="color:var(--muted);font-size:13px;">Seria ${i+1}</span>
          <span style="font-weight:700;font-size:14px;">${s.kg} kg × ${s.reps}</span>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function confirmFinish(){
  if(!state.currentWorkout) return;
  const wkt = state.currentWorkout;
  const totalSets = wkt.exercises.reduce((s,e)=>s+e.sets.length,0);
  const doneExs = wkt.exercises.filter(e=>e.sets.length>0);
  const skippedExs = wkt.exercises.filter(e=>e.sets.length===0);
  const allDone = wkt.exercises.every(e=>e.sets.length>=(e.plannedSets||3));

  if(totalSets === 0){
    showFinishModal(0, [], wkt.exercises);
    return;
  }
  if(allDone){
    finishWorkout(true);
    return;
  }
  showFinishModal(totalSets, doneExs, skippedExs);
}

function showFinishModal(totalSets, doneExs, skippedExs){
  // Usuń poprzedni modal jeśli jest
  const old = document.getElementById('finishModal');
  if(old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'finishModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:500;display:flex;align-items:flex-end;';

  const skippedHtml = skippedExs.length ? `
    <div style="margin-bottom:14px;">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:8px;">Pominięte — nie liczą się do progresu</div>
      ${skippedExs.map(e=>`
        <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);">
          <span style="font-size:14px;">⬜</span>
          <span style="font-size:14px;color:var(--muted);">${esc(e.name)}</span>
        </div>
      `).join('')}
    </div>` : '';

  const doneHtml = doneExs.length ? `
    <div style="margin-bottom:14px;">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--green);margin-bottom:8px;">Zalogowane ✓</div>
      ${doneExs.map(e=>`
        <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:14px;">✅</span>
            <span style="font-size:14px;">${esc(e.name)}</span>
          </div>
          <span style="font-size:12px;color:var(--muted);">${e.sets.length} serii</span>
        </div>
      `).join('')}
    </div>` : '';

  modal.innerHTML = `
    <div style="width:100%;max-width:430px;margin:0 auto;background:var(--surface);border-radius:20px 20px 0 0;padding:24px 20px 40px;max-height:80dvh;overflow-y:auto;">
      <div style="width:36px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 20px;"></div>
      <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;margin-bottom:4px;">Zakończyć trening?</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:20px;">${totalSets > 0 ? `Zalogowano ${totalSets} serii` : 'Brak zalogowanych serii'}</div>
      ${doneHtml}${skippedHtml}
      ${skippedExs.length ? `<div style="background:var(--orange-dim);border:1px solid var(--orange-mid);border-radius:10px;padding:12px;margin-bottom:16px;font-size:13px;line-height:1.5;color:var(--text);">
        <strong style="color:var(--orange);">ℹ️ Pominięte ćwiczenia</strong> nie będą liczyć się do progresu. Następnym razem zobaczysz ostatni zalogowany wynik.
      </div>` : ''}
      <div style="display:flex;gap:8px;margin-top:4px;">
        <button onclick="document.getElementById('finishModal').remove()" style="flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:12px;padding:14px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;cursor:pointer;">Wróć</button>
        <button onclick="document.getElementById('finishModal').remove();finishWorkout(true);" style="flex:2;background:${totalSets>0?'var(--orange)':'var(--red)'};color:#fff;border:none;border-radius:12px;padding:14px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;cursor:pointer;">
          ${totalSets>0?'🏁 Zakończ':'Porzuć trening'}
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e=>{ if(e.target===modal) modal.remove(); });
}

function renderLiveWorkout(){
  const wkt = state.currentWorkout;
  if(!wkt) return;
  document.getElementById('liveWktName').textContent = wkt.name.toUpperCase().slice(0,24);
  switchWktTab('log');
}

function getPrevPerf(exId){
  const history = state.workouts.filter(w=>w.done);
  for(let i=history.length-1;i>=0;i--){
    const ex = history[i].exercises.find(e=>e.id===exId);
    // Pomiń ćwiczenia oznaczone jako skipped lub bez zalogowanych serii
    if(ex && ex.sets.length>0 && !ex.skipped){
      return ex.sets.map(s=>`${s.kg}kg×${s.reps}`).join(', ');
    }
  }
  return null;
}

function logExerciseSet(ex, kg, reps){
  if(reps===0) return;
  ex.sets.push({kg,reps,time:Date.now()});
  save();
  renderLogTab();
  renderInfoTab();
  aiLiveComment(ex, kg, reps);
}

function logInlineSet(exIdx, rowIdx){
  const wkt = state.currentWorkout;
  if(!wkt) return;
  const ex = wkt.exercises[exIdx];
  if(!ex || rowIdx !== ex.sets.length) return;
  const kg = parseFloat(document.getElementById(`log-kg-${exIdx}-${rowIdx}`)?.value)||0;
  const reps = parseInt(document.getElementById(`log-reps-${exIdx}-${rowIdx}`)?.value)||0;
  if(reps===0) return;
  state.currentExIdx = exIdx;
  logExerciseSet(ex, kg, reps);

  // Sprawdź czy wszystkie serie dla tego ćwiczenia zalogowane
  const plannedSets = ex.plannedSets || 3;
  const isLastEx = state.currentExIdx >= wkt.exercises.length - 1;
  if(ex.sets.length >= plannedSets && !isLastEx){
    // Pokaż przycisk "Następne ćwiczenie" zamiast rest timera
    showNextExButton();
  } else {
    const nextExName = wkt.exercises[state.currentExIdx + 1]?.name || '';
    startRest(150, nextExName);
  }
}

function logSet(){
  const wkt = state.currentWorkout;
  if(!wkt) return;
  const ex = wkt.exercises[state.currentExIdx];
  if(!ex) return;
  logInlineSet(state.currentExIdx, ex.sets.length);
}

function addInlineSetRow(exIdx){
  const wkt = state.currentWorkout;
  const ex = wkt?.exercises[exIdx];
  if(!ex) return;
  ex.plannedSets = Math.max(ex.plannedSets || 3, ex.sets.length + 1);
  state.currentExIdx = exIdx;
  save();
  renderLogTab();
}

function removeLoggedSet(exIdx, rowIdx){
  const wkt = state.currentWorkout;
  const ex = wkt?.exercises[exIdx];
  if(!ex || rowIdx < 0 || rowIdx >= ex.sets.length) return;
  ex.sets.splice(rowIdx, 1);
  state.currentExIdx = exIdx;
  save();
  renderLogTab();
  renderInfoTab();
}

function copyLastLoggedSet(exIdx){
  const wkt = state.currentWorkout;
  const ex = wkt?.exercises[exIdx];
  if(!ex || !ex.sets.length) return;
  const last = ex.sets[ex.sets.length-1];
  addInlineSetRow(exIdx);
  requestAnimationFrame(()=>{
    const kgInput = document.getElementById(`log-kg-${exIdx}-${ex.sets.length}`);
    const repsInput = document.getElementById(`log-reps-${exIdx}-${ex.sets.length}`);
    if(kgInput) kgInput.value = last.kg;
    if(repsInput) repsInput.value = last.reps;
  });
}

function showNextExButton(){
  const wkt = state.currentWorkout;
  if(!wkt) return;
  const nextEx = wkt.exercises[state.currentExIdx + 1];
  if(!nextEx) return;

  // Pokaż overlay z przyciskiem następnego ćwiczenia
  const restOv = document.getElementById('restOv');
  restOv.classList.add('on');
  // Zatrzymaj istniejący timer
  clearInterval(restInterval);

  // Podmień zawartość overlay tymczasowo
  restOv.innerHTML = `
    <div class="rest-card">
      <div class="rest-top">
        <span class="rest-lbl" style="color:var(--green);">✅ Ćwiczenie ukończone!</span>
      </div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:14px;">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Następne ćwiczenie</div>
        <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;">${nextEx.name}</div>
        <div style="font-size:12px;color:var(--orange);margin-top:2px;">${nextEx.plannedSets||3} serie · ${nextEx.plannedReps||'8-12'} powt.</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button onclick="restBeforeNext()" style="flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--muted);border-radius:12px;padding:12px;font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;">⏱ Odpocznij</button>
        <button onclick="skipToNextEx()" style="flex:2;background:var(--orange);color:#fff;border:none;border-radius:12px;padding:12px 20px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;cursor:pointer;">Następne →</button>
      </div>
    </div>
  `;
}

function skipToNextEx(){
  // Przywróć oryginalny HTML overlay
  restoreRestOverlay();
  document.getElementById('restOv').classList.remove('on');
  nextEx();
}

function restBeforeNext(){
  restoreRestOverlay();
  window._afterRestGoNext = true;
  const wkt = state.currentWorkout;
  const nextExName = wkt?.exercises[state.currentExIdx + 1]?.name || '';
  startRest(150, nextExName);
}

function restoreRestOverlay(){
  document.getElementById('restOv').innerHTML = `
    <div class="rest-card">
      <div class="rest-top">
        <span class="rest-lbl">⏱ Odpoczynek</span>
        <span id="restNextEx" style="font-size:12px;color:var(--muted);"></span>
      </div>
      <div class="rest-progress-bar">
        <div class="rest-progress-fill" id="restProgressFill" style="width:100%;"></div>
      </div>
      <div class="rest-big" id="restNum">2:30</div>
      <div style="display:flex;gap:8px;">
        <button onclick="addRest(30)" style="flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:12px;padding:12px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;">+30s</button>
        <button onclick="addRest(-15)" style="flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--muted);border-radius:12px;padding:12px;font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;">−15s</button>
        <button onclick="skipRest()" style="flex:2;background:var(--orange);color:#fff;border:none;border-radius:12px;padding:12px 20px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">Pomiń →</button>
      </div>
    </div>
  `;
}

async function aiLiveComment(ex, kg, reps){
  const prev = getPrevPerf(ex.id);
  const prompt = `Trening na żywo. Ćwiczenie: ${cleanText(ex.name)}. Seria ${ex.sets.length}: ${kg}kg x ${reps} powt. ${prev?'Poprzednio: '+prev:'Pierwsze podejście.'} Daj 1 krótkie zdanie motywacji lub wskazówki. Maksymalnie 20 słów. Po polsku.`;
  try{
    const r = await callAI(prompt,'Jesteś zwięzłym Pro Coachem siłowni. Odpowiadasz jednym zdaniem, po polsku, konkretnie i motywująco.');
    const el = document.getElementById('liveAiTxt');
    if(el) el.textContent = r;
  }catch(e){}
}

function prevEx(){
  if(state.currentExIdx>0){
    state.currentExIdx--;
    save();
    renderLogTab();
    document.getElementById(`log-card-${state.currentExIdx}`)?.scrollIntoView({behavior:'smooth', block:'center'});
  }
}
function nextEx(){
  if(state.currentWorkout&&state.currentExIdx<state.currentWorkout.exercises.length-1){
    state.currentExIdx++;
    save();
    renderLogTab();
    document.getElementById(`log-card-${state.currentExIdx}`)?.scrollIntoView({behavior:'smooth', block:'center'});
  }
}

function finishWorkout(skipConfirm){
  if(!skipConfirm && !confirm('Zakończyć trening?')) return;
  if(state.currentWorkout){
    const wkt = state.currentWorkout;
    wkt.done = true;
    wkt.endTime = Date.now();
    // Oznacz pominięte ćwiczenia — te bez serii nie będą liczyć się do historii/PRów
    wkt.exercises.forEach(ex=>{
      if(ex.sets.length === 0) ex.skipped = true;
    });
    // Usuń pominięte ćwiczenia z obiektu przed zapisem do historii
    // żeby nie psuły getPrevPerf
    const wktForHistory = {
      ...wkt,
      exercises: wkt.exercises.map(ex => ({
        ...ex,
        // sets pozostają puste dla pominiętych — getPrevPerf i tak szuka sets.length>0
      }))
    };
    state.workouts.push(wktForHistory);
    state.currentWorkout = null;
    save();
  }
  clearInterval(wktTimerInterval);
  calcStreak();
  updateActiveWorkoutBanner();
  goTo('home');
}

// ===================== REST TIMER =====================
let restInterval=null, restTotal=150, restRemaining=150;
let wakeLock=null;

async function acquireWakeLock(){
  try{
    if('wakeLock' in navigator){
      wakeLock = await navigator.wakeLock.request('screen');
    }
  }catch(e){}
}
function releaseWakeLock(){
  if(wakeLock){try{wakeLock.release();}catch(e){} wakeLock=null;}
}

function startRest(sec, nextExName){
  restTotal=sec; restRemaining=sec;
  document.getElementById('restOv').classList.add('on');
  // Pokaż nazwę następnego ćwiczenia
  const nextEl = document.getElementById('restNextEx');
  if(nextEl) nextEl.textContent = nextExName ? 'Następne: '+nextExName : '';
  clearInterval(restInterval);
  updateRestUI();
  acquireWakeLock();
  // Powiadomienie systemu (tytuł strony) — widoczne na ekranie blokady w niektórych przeglądarkach
  restInterval=setInterval(()=>{
    restRemaining--;
    if(restRemaining<=0){skipRest();return;}
    updateRestUI();
    const m=Math.floor(restRemaining/60), s=String(restRemaining%60).padStart(2,'0');
    document.title = `⏱ ${m}:${s} — ForgePro`;
  },1000);
}
function addRest(sec){
  restRemaining = Math.max(1, restRemaining+sec);
  updateRestUI();
}
function skipRest(){
  clearInterval(restInterval);
  document.getElementById('restOv').classList.remove('on');
  document.title = 'ForgePro';
  releaseWakeLock();
  if(window._afterRestGoNext){
    window._afterRestGoNext = false;
    nextEx();
  }
}
function startManualRest(){
  const wkt = state.currentWorkout;
  const nextExName = wkt?.exercises[state.currentExIdx + 1]?.name || '';
  startRest(150, nextExName);
}

function updateRestUI(){
  const m=Math.floor(restRemaining/60), s=String(restRemaining%60).padStart(2,'0');
  document.getElementById('restNum').textContent=m+':'+s;
  const pct = Math.max(0, (restRemaining/restTotal)*100);
  const fill = document.getElementById('restProgressFill');
  if(fill) fill.style.width = pct+'%';
}

// ===================== HOME =====================
function calcStreak(){
  const dates = [...new Set(state.workouts.filter(w=>w.done).map(w=>new Date(w.startTime).toDateString()))];
  let streak=0, d=new Date();
  while(dates.includes(d.toDateString())){streak++;d.setDate(d.getDate()-1);}
  // also check yesterday if today not done
  if(streak===0){d=new Date();d.setDate(d.getDate()-1);while(dates.includes(d.toDateString())){streak++;d.setDate(d.getDate()-1);}}
  state.streak=streak;
}

function renderAccountSummary(){
  const user = getAuthUser();
  const isLoggedIn = Boolean(user?.email);
  const email = cleanText(user?.email, 'Konto opcjonalne');
  const action = document.getElementById('accountAction');
  if(action){
    action.innerHTML = isLoggedIn
      ? `<button onclick="logoutApp()" style="background:var(--surface2);border:1px solid var(--border);color:var(--muted);border-radius:20px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;">Wyloguj</button>`
      : `<button onclick="window.location.href='/auth.html'" style="background:var(--surface2);border:1px solid var(--border);color:var(--muted);border-radius:20px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;">Logowanie</button>`;
  }
  document.getElementById('accountSummary').innerHTML = `
    <div style="padding:6px 16px 0;">
      <div class="card" style="padding:14px 16px;border-radius:18px;background:rgba(17,17,24,.82);">
        <div class="card-label">Konto</div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <div>
            <div style="font-size:15px;font-weight:700;margin-bottom:2px;">${esc(email)}</div>
            <div style="font-size:12px;color:var(--muted);">${isLoggedIn?'Dane treningowe zapisują się lokalnie tylko dla tego urządzenia.':'Możesz korzystać bez konta. Logowanie włączysz później po konfiguracji Firebase.'}</div>
          </div>
          <button class="btn btn-ghost" onclick="${isLoggedIn ? 'logoutApp()' : `window.location.href='/auth.html'`}" style="width:auto;padding:10px 14px;font-size:12px;flex-shrink:0;">${isLoggedIn ? 'Wyloguj' : 'Otwórz login'}</button>
        </div>
      </div>
    </div>`;
}

function renderHome(){
  calcStreak();
  document.getElementById('streakBadge').textContent = state.streak>0?`🔥 ${state.streak} dni`:'Start!';
  renderAccountSummary();

  // Week
  const days=['Pn','Wt','Śr','Cz','Pt','Sb','Nd'];
  const today=new Date().getDay(); // 0=Sun
  const todayIdx=today===0?6:today-1;
  const weekDates = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(todayIdx-i));return d.toDateString();});
  const doneDates=new Set(state.workouts.filter(w=>w.done).map(w=>new Date(w.startTime).toDateString()));
  document.getElementById('weekRow').innerHTML=days.map((d,i)=>`
    <div class="day-pill ${i===todayIdx?'today':doneDates.has(weekDates[i])?'done':''}">
      ${d}<div class="dp-dot"></div>
    </div>
  `).join('');

  // Last workout
  const last=state.workouts.filter(w=>w.done).slice(-1)[0];
  if(last){
    const dur=Math.round((last.endTime-last.startTime)/60000);
    const vol=last.exercises.reduce((s,e)=>s+e.sets.reduce((ss,st)=>ss+st.kg*st.reps,0),0);
    document.getElementById('lastWorkoutCard').innerHTML=`
      <div class="card">
        <div class="card-label">Ostatni trening · ${new Date(last.startTime).toLocaleDateString('pl',{weekday:'long'})}</div>
        <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;line-height:1.05;margin-bottom:6px;">${esc(last.name)}</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:14px;">${last.exercises.length} ćwiczeń · ${dur} min · ${vol} kg obj.</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          ${last.exercises.slice(0,3).map(e=>{
            const topSet=e.sets.reduce((a,b)=>b.kg>a.kg?b:a,{kg:0,reps:0});
            return topSet.kg?`<div><div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;">${topSet.kg}<span style="font-size:12px;color:var(--muted);">kg</span></div><div style="font-size:10px;color:var(--muted);">${shortLabel(e.name,2)}</div></div>`:''}).join('')}
        </div>
        <div class="ai-block" style="margin-top:12px;">
          <div class="ai-label"><span class="ai-dot"></span>Pro Coach</div>
          <p id="homeAiTxt" style="font-size:13px;line-height:1.5;">Analizuję ostatni trening...</p>
        </div>
      </div>`;
    loadHomeAI(last);
  } else {
    document.getElementById('lastWorkoutCard').innerHTML=`
      <div class="card" style="text-align:center;padding:28px 20px;">
        <div style="font-size:32px;margin-bottom:10px;">💪</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:6px;">Zacznij pierwszy trening!</div>
        <div style="font-size:13px;color:var(--muted);line-height:1.6;">Naciśnij "Nowy trening", wybierz ćwiczenia i zacznij śledzić swój progres z Pro Coachem.</div>
      </div>`;
  }

  // Stats - PRs
  renderHomeStats();
  // Show imported plans
  renderImportedPlans();
}

async function loadHomeAI(last){
  const summary = last.exercises.map(e=>`${cleanText(e.name)}: ${e.sets.map(s=>`${s.kg}kg x ${s.reps}`).join(', ')}`).join('; ');
  const cacheKey = `${last.id || ''}-${last.endTime || last.startTime}-${summary}`;
  if(aiInsightCache.homeKey === cacheKey && aiInsightCache.homeText){
    const cachedEl=document.getElementById('homeAiTxt');
    if(cachedEl) cachedEl.textContent=aiInsightCache.homeText;
    return;
  }
  try{
    const r=await callAI(`Trening: ${cleanText(last.name)}. ${summary}. Daj jedną krótką obserwację i jedną konkretną wskazówkę na następny trening. Maksymalnie 30 słów, bez wstępu.`,
      'Jesteś Pro Coachem siłowni. Odpowiadasz po polsku bardzo krótko, konkretnie i użytkowo. Maksymalnie 30 słów.');
    const el=document.getElementById('homeAiTxt');
    if(el) el.textContent=r;
    aiInsightCache.homeKey = cacheKey;
    aiInsightCache.homeText = r;
  }catch(e){
    const el=document.getElementById('homeAiTxt');
    if(el) el.textContent='Zaloguj kilka treningów aby AI mogło Cię przeanalizować.';
  }
}

function renderHomeStats(){
  const keyEx = ['Wyciskanie sztangi','Squat','Martwy ciąg'];
  const labels = ['Wyciskanie','Squat','Martwy'];
  const prs = keyEx.map(name=>{
    let max=0;
    state.workouts.forEach(w=>w.exercises.filter(e=>e.name===name).forEach(e=>e.sets.forEach(s=>{if(s.kg>max)max=s.kg;})));
    return max;
  });
  document.getElementById('statsRow').innerHTML=prs.map((pr,i)=>`
    <div class="stat-box ${pr>0?'has-val':''}">
      <div class="stat-val">${pr||'—'}<span class="stat-unit">${pr?'kg':''}</span></div>
      <div class="stat-lbl">${labels[i]}</div>
    </div>
  `).join('');
}

// ===================== HISTORY =====================
function renderHistory(){
  const list=document.getElementById('historyList');
  const done=state.workouts.filter(w=>w.done).slice().reverse();
  if(!done.length){
    list.innerHTML='<div class="empty"><div class="eico">📋</div><p>Brak treningów w historii.<br>Zacznij swój pierwszy trening!</p></div>';
    return;
  }
  list.innerHTML=done.map(w=>{
    const dur=Math.round((w.endTime-w.startTime)/60000);
    const vol=w.exercises.reduce((s,e)=>s+e.sets.reduce((ss,st)=>ss+st.kg*st.reps,0),0);
    const date=new Date(w.startTime);
    return `<div class="hist-item" onclick="showHistDetail(${w.id})">
      <div class="hist-date">${date.toLocaleDateString('pl',{weekday:'long',day:'numeric',month:'long'})}</div>
      <div class="hist-name">${esc(w.name)}</div>
      <div class="hist-meta">
        <span>${w.exercises.length} <strong>ćwiczeń</strong></span>
        <span>${dur} <strong>min</strong></span>
        <span>${vol} <strong>kg obj.</strong></span>
      </div>
    </div>`;
  }).join('');
}

function showHistDetail(id){
  const w=state.workouts.find(wk=>wk.id===id);
  if(!w) return;
  document.getElementById('histTitle').textContent=w.name;
  document.getElementById('histDetail').innerHTML=`
    <div style="font-size:12px;color:var(--muted);margin-bottom:14px;">${new Date(w.startTime).toLocaleDateString('pl',{weekday:'long',day:'numeric',month:'long'})} · ${Math.round((w.endTime-w.startTime)/60000)} min</div>
    ${w.exercises.map(e=>`
      <div style="margin-bottom:16px;">
        <div style="font-weight:700;font-size:15px;margin-bottom:6px;">${esc(e.name)}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${e.sets.map((s,i)=>`<div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-size:13px;font-weight:600;">${s.kg}kg × ${s.reps}</div>`).join('')}
        </div>
      </div>
    `).join('')}
    <button class="btn btn-danger" onclick="deleteWorkout(${id})" style="margin-top:8px;">Usuń trening</button>
  `;
  openPanel('histPanel');
}

function deleteWorkout(id){
  if(!confirm('Usunąć ten trening?')) return;
  state.workouts=state.workouts.filter(w=>w.id!==id);
  save();closePanel('histPanel');renderHistory();
}

// ===================== PROGRESS =====================
function renderProgress(){
  // Build exercise selector
  const allEx=new Set();
  state.workouts.forEach(w=>w.exercises.forEach(e=>allEx.add(e.name)));
  const sel=document.getElementById('chartExercise');
  const prev=sel.value;
  sel.innerHTML=[...allEx].map(n=>`<option${n===prev?' selected':''}>${n}</option>`).join('');
  if(!sel.value&&allEx.size>0) sel.value=[...allEx][0];
  renderChart();
  renderWeightTracking();
  renderPRs();
  renderInjuries();
  loadProgressAI();
}

function renderChart(){
  const exName=document.getElementById('chartExercise').value;
  const data=[];
  state.workouts.filter(w=>w.done).forEach(w=>{
    const ex=w.exercises.find(e=>e.name===exName);
    if(ex&&ex.sets.length>0){
      const max=Math.max(...ex.sets.map(s=>s.kg));
      data.push({date:new Date(w.startTime),kg:max});
    }
  });
  if(!data.length){
    document.getElementById('chartBars').innerHTML='<div style="color:var(--muted);font-size:13px;">Brak danych — zaloguj trening z tym ćwiczeniem.</div>';
    document.getElementById('chartLabels').innerHTML='';
    document.getElementById('chartMeta').innerHTML='';
    return;
  }
  const maxKg=Math.max(...data.map(d=>d.kg));
  const minKg=Math.min(...data.map(d=>d.kg));
  document.getElementById('chartBars').innerHTML=data.map((d,i)=>`
    <div class="bar${i===data.length-1?' hi':''}" style="height:${Math.round((d.kg/maxKg)*100)}%;" title="${d.kg}kg"></div>
  `).join('');
  document.getElementById('chartLabels').innerHTML=data.map((d,i)=>`
    <span>${i===0||i===data.length-1?d.date.toLocaleDateString('pl',{day:'numeric',month:'short'}):''}</span>
  `).join('');
  const diff=maxKg-minKg;
  document.getElementById('chartMeta').innerHTML=`
    <span>Start: ${minKg}kg</span>
    <span style="color:${diff>0?'var(--green)':'var(--muted)'}">+${diff}kg łącznie</span>
  `;
}

function renderPRs(){
  const prs={};
  state.workouts.forEach(w=>w.exercises.forEach(e=>e.sets.forEach(s=>{
    if(!prs[e.name]||s.kg>prs[e.name]) prs[e.name]=s.kg;
  })));
  const list=document.getElementById('prList');
  if(!Object.keys(prs).length){list.innerHTML='<div style="font-size:13px;color:var(--muted);">Brak danych — zaloguj trening.</div>';return;}
  list.innerHTML=Object.entries(prs).sort((a,b)=>b[1]-a[1]).map(([n,kg])=>`
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:14px;">🏆 ${n}</span>
      <span style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;">${kg}<span style="font-size:13px;color:var(--muted);">kg</span></span>
    </div>
  `).join('');
}

function getTodayDateValue(){
  return new Date().toISOString().slice(0,10);
}

function getSortedWeightEntries(){
  const latestByDate = new Map();
  (state.bodyWeight || []).forEach(entry => {
    const date = cleanText(entry.date);
    const value = Number(entry.value);
    if(!date || !Number.isFinite(value) || value <= 0) return;
    latestByDate.set(date, {
      date,
      value: Math.round(value * 10) / 10,
      updatedAt: Number(entry.updatedAt) || 0
    });
  });
  return [...latestByDate.values()].sort((a,b)=>a.date.localeCompare(b.date));
}

function saveWeightEntry(){
  const dateInput = document.getElementById('weightDateInput');
  const valueInput = document.getElementById('weightValueInput');
  if(!dateInput || !valueInput) return;
  const date = cleanText(dateInput.value);
  const value = Math.round((parseFloat(valueInput.value) || 0) * 10) / 10;
  if(!date || !Number.isFinite(value) || value <= 0){
    showNotice('Podaj poprawną datę i wagę.');
    return;
  }
  state.bodyWeight = (state.bodyWeight || []).filter(entry => cleanText(entry.date) !== date);
  state.bodyWeight.push({date, value, updatedAt: Date.now()});
  save();
  renderWeightTracking(date);
}

function deleteWeightEntry(date){
  state.bodyWeight = (state.bodyWeight || []).filter(entry => cleanText(entry.date) !== date);
  save();
  renderWeightTracking();
}

function renderWeightTracking(selectedDate){
  const dateInput = document.getElementById('weightDateInput');
  const valueInput = document.getElementById('weightValueInput');
  if(!dateInput || !valueInput) return;

  const entries = getSortedWeightEntries();
  const activeDate = selectedDate || dateInput.value || getTodayDateValue();
  const existing = entries.find(entry => entry.date === activeDate);
  dateInput.value = activeDate;
  valueInput.value = existing ? existing.value : '';

  const chartBars = document.getElementById('weightChartBars');
  const chartLabels = document.getElementById('weightChartLabels');
  const chartMeta = document.getElementById('weightChartMeta');
  const trendSummary = document.getElementById('weightTrendSummary');
  const recentList = document.getElementById('weightRecentList');

  if(!entries.length){
    chartBars.innerHTML = '<div style="color:var(--muted);font-size:13px;">Dodaj pierwszy pomiar wagi, żeby zobaczyć trend.</div>';
    chartLabels.innerHTML = '';
    chartMeta.innerHTML = '<span>Brak danych</span><span>Cel: regularność</span>';
    trendSummary.innerHTML = '<div style="font-family:\'Syne\',sans-serif;font-size:24px;font-weight:800;">—</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;">kg</div>';
    recentList.innerHTML = '';
    return;
  }

  const latestEntries = entries.slice(-14);
  const minValue = Math.min(...latestEntries.map(entry => entry.value));
  const maxValue = Math.max(...latestEntries.map(entry => entry.value));
  const span = Math.max(maxValue - minValue, 0.5);
  const firstValue = latestEntries[0].value;
  const lastValue = latestEntries[latestEntries.length-1].value;
  const diff = Math.round((lastValue - firstValue) * 10) / 10;
  const weekEntries = latestEntries.slice(-7);
  const weekAvg = weekEntries.reduce((sum, entry) => sum + entry.value, 0) / weekEntries.length;

  trendSummary.innerHTML = `
    <div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;">${lastValue.toFixed(1)}</div>
    <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;">aktualnie kg</div>`;

  chartBars.innerHTML = latestEntries.map((entry, idx)=>{
    const height = 30 + Math.round(((entry.value - minValue) / span) * 70);
    const isLatest = idx === latestEntries.length - 1;
    return `<div class="bar${isLatest?' hi':''}" style="height:${height}%;background:${isLatest?'linear-gradient(180deg,var(--orange),#f0a46d)':'linear-gradient(180deg,#78b9d4,#467487)'};" title="${entry.value.toFixed(1)} kg"></div>`;
  }).join('');
  chartLabels.innerHTML = latestEntries.map((entry, idx)=>`
    <span>${idx===0 || idx===latestEntries.length-1 || idx===Math.floor(latestEntries.length/2) ? new Date(entry.date).toLocaleDateString('pl',{day:'numeric',month:'short'}) : ''}</span>
  `).join('');
  chartMeta.innerHTML = `
    <span>Śr. 7 dni: ${weekAvg.toFixed(1)} kg</span>
    <span style="color:${diff>0?'var(--orange)':diff<0?'var(--green)':'var(--muted)'}">${diff>0?'+':''}${diff.toFixed(1)} kg</span>
  `;

  recentList.innerHTML = `
    <div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-top:2px;">Ostatnie wpisy</div>
    ${entries.slice(-6).reverse().map(entry=>`
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">
        <div>
          <div style="font-size:14px;font-weight:700;">${entry.value.toFixed(1)} kg</div>
          <div style="font-size:12px;color:var(--muted);">${new Date(entry.date).toLocaleDateString('pl',{day:'numeric',month:'long'})}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-ghost" onclick="renderWeightTracking('${entry.date}')" style="width:auto;padding:8px 12px;font-size:12px;">Edytuj</button>
          <button class="btn btn-ghost" onclick="deleteWeightEntry('${entry.date}')" style="width:auto;padding:8px 12px;font-size:12px;color:#ff8b8b;border-color:rgba(255,122,122,.2);">Usuń</button>
        </div>
      </div>
    `).join('')}
  `;
}

function renderInjuries(){
  const list=document.getElementById('injuryList');
  if(!state.injuries.length){list.innerHTML='<div style="font-size:13px;color:var(--muted);">Brak zgłoszonych kontuzji.</div>';return;}
  list.innerHTML=state.injuries.map((inj,i)=>`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
      <div>
        <span class="idot ${inj.active?'red':'green'}"></span>
        <span style="font-size:14px;font-weight:600;">${esc(inj.name)}</span>
        <div style="font-size:11px;color:var(--muted);margin-left:15px;">${esc(inj.desc)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:10px;padding:3px 8px;border-radius:6px;font-weight:700;
          background:${inj.active?'var(--red-dim)':'var(--green-dim)'};
          color:${inj.active?'var(--red)':'var(--green)'};">
          ${inj.active?'AKTYWNA':'OK'}
        </span>
        <button onclick="toggleInjury(${i})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px;">⟳</button>
      </div>
    </div>
  `).join('');
}

function addInjury(){
  const name=prompt('Nazwa kontuzji (np. Bark prawy, Kolano lewe):');
  if(!name) return;
  const desc=prompt('Opis (np. Ból przy OHP, faza 2 rehab):') || '';
  state.injuries.push({name,desc,active:true,date:Date.now()});
  save();renderInjuries();
}

function toggleInjury(i){
  state.injuries[i].active=!state.injuries[i].active;
  save();renderInjuries();
}

async function loadProgressAI(){
  const totalWkts=state.workouts.filter(w=>w.done).length;
  if(totalWkts<2){document.getElementById('progAiTxt').textContent='Zaloguj co najmniej 2 treningi aby AI mogło przeanalizować Twój progres.';return;}
  const prs=[];
  const exSet=new Set();
  state.workouts.forEach(w=>w.exercises.forEach(e=>exSet.add(e.name)));
  exSet.forEach(name=>{
    let max=0;
    state.workouts.forEach(w=>w.exercises.filter(e=>e.name===name).forEach(e=>e.sets.forEach(s=>{if(s.kg>max)max=s.kg;})));
    if(max) prs.push(`${name}: ${max}kg`);
  });
  const injuries=state.injuries.filter(i=>i.active).map(i=>i.name).join(', ');
  const weightEntries = getSortedWeightEntries();
  const lastWeight = weightEntries.at(-1);
  const firstWeight = weightEntries[0];
  const weightSummary = lastWeight ? `Waga: ${lastWeight.value.toFixed(1)} kg${firstWeight ? ` (zmiana ${((lastWeight.value-firstWeight.value)>0?'+':'')}${(lastWeight.value-firstWeight.value).toFixed(1)} kg)` : ''}.` : '';
  const cacheKey = `${totalWkts}|${prs.join('|')}|${injuries}|${weightSummary}`;
  if(aiInsightCache.progressKey === cacheKey && aiInsightCache.progressText){
    const cachedEl=document.getElementById('progAiTxt');
    if(cachedEl) cachedEl.textContent=aiInsightCache.progressText;
    return;
  }
  try{
    const r=await callAI(
      `Łącznie ${totalWkts} treningów. Rekordy: ${prs.join(', ')}. ${weightSummary} ${injuries?'Kontuzje: '+injuries+'. ':''}Oceń progres i daj 2 krótkie wskazówki. Maksymalnie 45 słów, bez lania wody.`,
      'Jesteś Pro Coachem siłowni. Odpowiadasz po polsku krótko, analitycznie i praktycznie. Maksymalnie 45 słów.');
    const el=document.getElementById('progAiTxt');
    if(el) el.textContent=r;
    aiInsightCache.progressKey = cacheKey;
    aiInsightCache.progressText = r;
  }catch(e){}
}

// ===================== AI CHAT =====================
let aiMode='coach';
// Historia konwersacji per tryb — AI pamięta wątek
let chatHistory = {coach:[], injury:[], nutrition:[], plan:[]};
// Limit wiadomości w historii (żeby nie przekroczyć kontekstu)
const CHAT_HISTORY_LIMIT = 6; // max par user/assistant w historii

function buildSystemContext(basePrompt){
  // Buduje system prompt wzbogacony o dane użytkownika z aplikacji
  const totalWkts = state.workouts.filter(w=>w.done).length;
  const activeInjuries = state.injuries.filter(i=>i.active).map(i=>`${i.name}${i.desc?' ('+i.desc+')':''}`);

  // Importowane plany
  const plans = (state.importedPlans||[]);
  let planInfo = '';
  if(plans.length){
    planInfo = plans.map(p=>{
      const days = p.days.map(d=>`${d.dayName}: ${d.exercises.map(e=>`${cleanText(e.name)} ${e.sets||''}x${e.reps||''}`).join(', ')}`).join(' | ');
      return `Plan "${p.planName}": ${days}`;
    }).join('\n');
  }

  // Rekordy
  const prs = [];
  const exSet = new Set();
  state.workouts.forEach(w=>w.exercises.forEach(e=>exSet.add(e.name)));
  exSet.forEach(name=>{
    let max=0;
    state.workouts.forEach(w=>w.exercises.filter(e=>e.name===name).forEach(e=>e.sets.forEach(s=>{if(s.kg>max)max=s.kg;})));
    if(max) prs.push(`${name}: ${max}kg`);
  });

  let context = basePrompt;
  if(totalWkts>0) context += `\n\nDANE UŻYTKOWNIKA:\n- Łącznie treningów: ${totalWkts}`;
  if(prs.length) context += `\n- Rekordy: ${prs.join(', ')}`;
  if(activeInjuries.length) context += `\n- Aktywne kontuzje: ${activeInjuries.join(', ')}`;
  if(planInfo) context += `\n- Plan treningowy:\n${planInfo}`;

  return context;
}

const modeConfig={
  coach:{hint:'Twój Pro Coach analizuje progres i odpowiada na pytania o trening.',
    sys:'Jesteś Pro Coachem siłowni w aplikacji ForgePro. Odpowiadasz po polsku, konkretnie i krótko. Maksymalnie 70 słów, bez długiego wstępu.',
    chips:['Jak przebić plateau?','Kiedy deload?','Ile serii tygodniowo?','Ocen mój progres']},
  injury:{hint:'Opisz kontuzję — AI doradzi ćwiczenia rehab i modyfikacje treningu.',
    sys:'Jesteś fizjoterapeutą sportowym w aplikacji ForgePro. Odpowiadasz po polsku krótko i ostrożnie. Daj konkret, ostrzeż gdy trzeba iść do lekarza. Maksymalnie 80 słów.',
    chips:['Ból barku przy OHP','Ból kolana przy przysiadach','Jak trenować z kontuzją?','Kiedy wróć do pełnego treningu?']},
  nutrition:{hint:'Pytania o dietę, kalorie, białko i suplementy.',
    sys:'Jesteś dietetykiem sportowym. Odpowiadasz po polsku praktycznie i zwięźle. Maksymalnie 70 słów.',
    chips:['Ile białka dziennie?','Jaka dieta na masę?','Suplementy dla siłowni','Odżywka po treningu']},
  plan:{hint:'AI ułoży lub oceni Twój plan treningowy.',
    sys:'Jesteś programistą treningowym. Odpowiadasz po polsku profesjonalnie, ale krótko. Maksymalnie 90 słów.',
    chips:['Ocen plan PPL','Ile dni na siłownię?','Push Pull Legs czy FBW?','Plan na siłę czy masę?']},
};

function initAI(){
  setMode(document.querySelector('.ttab.on')||document.querySelector('.ttab'), 'coach');
  if(document.getElementById('chatWrap').children.length===0){
    addMsg('ai','Jestem Twoim Pro Coachem. Pisz krótko, a ja odpowiem konkretnie.');
  }
}

function setMode(el,mode){
  document.querySelectorAll('.ttab').forEach(t=>t.classList.remove('on'));
  el.classList.add('on');
  aiMode=mode;
  document.getElementById('modeHint').textContent=modeConfig[mode].hint;
  document.getElementById('quickChips').innerHTML=modeConfig[mode].chips.map(c=>
    `<div class="chip" onclick="quickQ('${c}')">${c}</div>`
  ).join('');
}

function addMsg(role,text){
  const wrap=document.getElementById('chatWrap');
  const div=document.createElement('div');
  div.className=`msg ${role}`;
  div.textContent=text;
  wrap.appendChild(div);
  wrap.scrollTop=wrap.scrollHeight;
  return div;
}

function quickQ(q){document.getElementById('chatInp').value=q;sendChat();}

async function sendChat(){
  const inp=document.getElementById('chatInp');
  const msg=inp.value.trim();
  if(!msg) return;
  inp.value='';
  addMsg('user',msg);
  // Dodaj do historii
  chatHistory[aiMode].push({role:'user', content:msg});
  const thinking=addMsg('ai','…');
  thinking.classList.add('thinking');
  try{
    const sysPrompt = buildSystemContext(modeConfig[aiMode].sys);
    const r=await callAIWithHistory(sysPrompt, chatHistory[aiMode]);
    thinking.textContent=r;
    thinking.classList.remove('thinking');
    // Dodaj odpowiedź do historii
    chatHistory[aiMode].push({role:'assistant', content:r});
    // Ogranicz historię
    if(chatHistory[aiMode].length > CHAT_HISTORY_LIMIT*2){
      chatHistory[aiMode] = chatHistory[aiMode].slice(-CHAT_HISTORY_LIMIT*2);
    }
  }catch(e){
    thinking.textContent='Błąd połączenia. Sprawdź internet.';
    // Usuń nieudane zapytanie z historii
    chatHistory[aiMode].pop();
  }
  document.getElementById('chatWrap').scrollTop=9999;
}

// ===================== AI — przez backend =====================
async function callAIWithHistory(systemPrompt, messages){
  const r = await fetch('/api/ai', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      messages: [
        {role: 'system', content: systemPrompt},
        ...messages
      ],
      max_tokens: 220,
      temperature: 0.5
    })
  });
  if(!r.ok) throw new Error('Błąd serwera: ' + r.status);
  const d = await r.json();
  if(d.error) throw new Error(typeof d.error === 'string' ? d.error : (d.error.message || 'Błąd AI'));
  return d.choices?.[0]?.message?.content || '';
}

async function callAI(userMsg, systemPrompt){
  return callAIWithHistory(buildSystemContext(systemPrompt), [{role:'user', content:userMsg}]);
}

// ===================== EXCEL IMPORT =====================
let importStep = 1;
let parsedPlan = null; // [{dayName, exercises:[{name,sets,reps,notes}]}]

function openImportPanel(){
  importStep = 1;
  parsedPlan = null;
  updateImportStep(1);
  showImportUpload();
  openPanel('importPanel');
}

function updateImportStep(n){
  importStep = n;
  [1,2,3,4].forEach(i=>{
    const s = document.getElementById('step'+i);
    const l = document.getElementById('line'+i);
    s.className = 'step' + (i<n?' done':i===n?' active':'');
    if(l) l.className = 'step-line' + (i<n?' done':'');
  });
}

function showImportUpload(){
  document.getElementById('importContent').innerHTML = `
    <div style="padding:0 16px 24px;">

      <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;">Wybierz typ pliku</div>

      <!-- Excel option -->
      <div class="import-drop" style="margin-bottom:10px;"
        onclick="document.getElementById('xlsxInput').click()"
        ondragover="event.preventDefault();this.classList.add('drag')"
        ondragleave="this.classList.remove('drag')"
        ondrop="handleDrop(event,'excel')">
        <div style="display:flex;align-items:center;gap:14px;text-align:left;">
          <div style="font-size:36px;flex-shrink:0;">📊</div>
          <div>
            <div style="font-weight:700;font-size:15px;margin-bottom:3px;">Excel / CSV</div>
            <div style="font-size:12px;color:var(--muted);line-height:1.5;">Plan od trenera w tabeli<br><span style="color:var(--dim);">.xlsx .xls .csv</span></div>
          </div>
          <div style="margin-left:auto;color:var(--orange);font-size:20px;">›</div>
        </div>
      </div>

      <!-- PDF option -->
      <div class="import-drop"
        onclick="document.getElementById('pdfInput').click()"
        ondragover="event.preventDefault();this.classList.add('drag')"
        ondragleave="this.classList.remove('drag')"
        ondrop="handleDrop(event,'pdf')">
        <div style="display:flex;align-items:center;gap:14px;text-align:left;">
          <div style="font-size:36px;flex-shrink:0;">📄</div>
          <div>
            <div style="font-weight:700;font-size:15px;margin-bottom:3px;">PDF</div>
            <div style="font-size:12px;color:var(--muted);line-height:1.5;">Plan treningowy w PDF<br><span style="color:var(--dim);">AI odczyta i wgra automatycznie</span></div>
          </div>
          <div style="margin-left:auto;color:var(--orange);font-size:20px;">›</div>
        </div>
      </div>

      <div class="import-drop" style="margin-top:10px;"
        onclick="document.getElementById('imageInput').click()"
        ondragover="event.preventDefault();this.classList.add('drag')"
        ondragleave="this.classList.remove('drag')"
        ondrop="handleDrop(event,'image')">
        <div style="display:flex;align-items:center;gap:14px;text-align:left;">
          <div style="font-size:36px;flex-shrink:0;">📷</div>
          <div>
            <div style="font-weight:700;font-size:15px;margin-bottom:3px;">Zdjęcie planu</div>
            <div style="font-size:12px;color:var(--muted);line-height:1.5;">Plan od trenera jako zdjęcie lub screen<br><span style="color:var(--dim);">.jpg .jpeg .png .webp</span></div>
          </div>
          <div style="margin-left:auto;color:var(--orange);font-size:20px;">›</div>
        </div>
      </div>

      <div style="margin-top:14px;padding:12px 14px;background:var(--orange-dim);border:1px solid var(--orange-mid);border-radius:10px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:.08em;color:var(--orange);text-transform:uppercase;margin-bottom:5px;">✦ Jak to działa?</div>
        <div style="font-size:12px;color:var(--text);line-height:1.6;">AI automatycznie odczyta plan — wykryje dni, ćwiczenia, serie i powtórzenia z Excela, PDF albo zdjęcia.</div>
      </div>
    </div>
  `;
}

function handleDrop(e, type){
  e.preventDefault();
  e.currentTarget.classList.remove('drag');
  const file = e.dataTransfer.files[0];
  if(!file) return;
  if(type==='pdf') processPdfFile(file);
  else if(type==='image') processImageFile(file);
  else processExcelFile(file);
}

function handleFileSelect(e){
  const file = e.target.files[0];
  if(file) processExcelFile(file);
  e.target.value = '';
}

function handlePdfSelect(e){
  const file = e.target.files[0];
  if(file) processPdfFile(file);
  e.target.value = '';
}

function handleImageSelect(e){
  const file = e.target.files[0];
  if(file) processImageFile(file);
  e.target.value = '';
}

// ===== PDF PROCESSING =====
async function processPdfFile(file){
  updateImportStep(2);
  document.getElementById('importContent').innerHTML = `
    <div class="ai-parsing">
      <div class="ai-spinner"></div>
      <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;">Czytam PDF…</div>
      <div style="font-size:13px;color:var(--muted);">Wyciągam tekst z dokumentu</div>
    </div>
  `;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;

    // Extract text page by page, preserving line structure
    let allLines = [];
    const maxPages = Math.min(pdf.numPages, 8);

    for(let i = 1; i <= maxPages; i++){
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Group items by Y position to reconstruct lines
      const byY = {};
      for(const item of textContent.items){
        if(!item.str.trim()) continue;
        const y = Math.round(item.transform[5]);
        if(!byY[y]) byY[y] = [];
        byY[y].push({x: item.transform[4], text: item.str});
      }

      // Sort lines top→bottom, items left→right
      const sortedY = Object.keys(byY).map(Number).sort((a,b)=>b-a);
      for(const y of sortedY){
        const lineItems = byY[y].sort((a,b)=>a.x-b.x);
        const lineText = lineItems.map(i=>i.text).join(' ').trim();
        if(lineText) allLines.push(lineText);
      }
      allLines.push(''); // blank between pages
    }

    const fullText = allLines.join('\n');

    if(!fullText.trim() || fullText.length < 50){
      showImportError('PDF nie zawiera tekstu lub jest zeskanowany jako obraz.<br><br><small>Spróbuj z plikiem Excel.</small>');
      return;
    }

    // ---- TRY DIRECT PARSER FIRST (fast, no AI) ----
    document.getElementById('importContent').innerHTML = `
      <div class="ai-parsing">
        <div class="ai-spinner"></div>
        <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;">Analizuję plan…</div>
        <div style="font-size:13px;color:var(--muted);">Rozpoznaję strukturę treningu</div>
      </div>
    `;

    let plan = directParsePdfText(allLines, fullText);

    // ---- AI FALLBACK ----
    if(!plan || !plan.days || !plan.days.length){
      document.getElementById('importContent').innerHTML = `
        <div class="ai-parsing">
          <div class="ai-spinner"></div>
          <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;">AI analizuje plan…</div>
          <div style="font-size:13px;color:var(--muted);">Niestandardowy format — AI go odczyta</div>
        </div>
      `;

      try {
        const truncated = fullText.slice(0, 7000);
        const aiResult = await Promise.race([
          callAI(truncated, AI_PARSE_PROMPT),
          new Promise((_,rej) => setTimeout(()=>rej(new Error('timeout')), 30000))
        ]);
        const clean = aiResult.replace(/```json|```/g,'').trim();
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if(jsonMatch) plan = JSON.parse(jsonMatch[0]);
      } catch(err) {
        showImportError('Nie udało się przetworzyć pliku.<br><br><small style="color:var(--dim);">Sprawdź czy klucz AI jest ustawiony w Railway → Variables → GROQ_API_KEY</small>');
        return;
      }
    }

    if(!plan || !plan.days || !plan.days.length){
      showImportError('Nie znaleziono planu treningowego w PDF.<br><br><small>Upewnij się że plik zawiera ćwiczenia z seriami i powtórzeniami.</small>');
      return;
    }

    parsedPlan = plan;
    showImportPreview(plan);

  } catch(err) {
    showImportError('Błąd odczytu PDF: ' + err.message);
  }
}

async function processImageFile(file){
  updateImportStep(2);
  document.getElementById('importContent').innerHTML = `
    <div class="ai-parsing">
      <div class="ai-spinner"></div>
      <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;">Czytam zdjęcie…</div>
      <div style="font-size:13px;color:var(--muted);">OCR odczytuje tekst z obrazu</div>
    </div>
  `;

  try{
    if(typeof Tesseract === 'undefined'){
      showImportError('OCR nie załadował się poprawnie. Odśwież stronę i spróbuj ponownie.');
      return;
    }

    const result = await Tesseract.recognize(file, 'pol+eng');
    const rawText = String(result?.data?.text || '');
    const lines = rawText
      .split(/\r?\n/)
      .map(line => cleanText(line))
      .filter(Boolean);
    const fullText = lines.join('\n');

    if(!fullText || fullText.length < 40){
      showImportError('Nie udało się odczytać planu ze zdjęcia.<br><br><small>Spróbuj zrobić jaśniejsze i prostsze zdjęcie kartki lub screena.</small>');
      return;
    }

    document.getElementById('importContent').innerHTML = `
      <div class="ai-parsing">
        <div class="ai-spinner"></div>
        <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;">Analizuję zdjęcie…</div>
        <div style="font-size:13px;color:var(--muted);">Rozpoznaję dni, ćwiczenia, serie i powtórzenia</div>
      </div>
    `;

    let plan = directParsePdfText(lines, fullText);

    if(!plan || !plan.days || !plan.days.length){
      try{
        const truncated = fullText.slice(0, 6000);
        const aiResult = await Promise.race([
          callAI(truncated, AI_PARSE_PROMPT),
          new Promise((_,rej) => setTimeout(()=>rej(new Error('timeout')), 30000))
        ]);
        const clean = aiResult.replace(/```json|```/g,'').trim();
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if(jsonMatch) plan = JSON.parse(jsonMatch[0]);
      }catch(err){
        showImportError('Nie udało się przetworzyć zdjęcia planu.<br><br><small style="color:var(--dim);">Spróbuj prostego kadru bez cienia albo ustaw klucz AI w Railway.</small>');
        return;
      }
    }

    if(!plan || !plan.days || !plan.days.length){
      showImportError('Nie znaleziono planu treningowego na zdjęciu.<br><br><small>Zadbaj, żeby na obrazie było widać nazwy ćwiczeń i serie.</small>');
      return;
    }

    parsedPlan = plan;
    showImportPreview(plan);
  }catch(err){
    showImportError('Błąd odczytu zdjęcia: ' + err.message);
  }
}

// ===== DIRECT PDF TEXT PARSER =====
function directParsePdfText(lines, fullText){
  try {
    // Day header patterns
    const DAY_PATTERNS = [
      /^(GÓRA|DOŁ|DÓŁ|PUSH|PULL|ARMS|LEGS|FULL BODY|FBW|KLATKA|PLECY|NOGI|BARKI)\s*(PONIEDZIAŁEK|WTOREK|ŚRODA|CZWARTEK|PIĄTEK|SOBOTA|NIEDZIELA)?/i,
      /^(PONIEDZIAŁEK|WTOREK|ŚRODA|CZWARTEK|PIĄTEK|SOBOTA|NIEDZIELA)/i,
      /^(TRENING|DZIEŃ|DAY)\s*[ABCDE1234]/i,
      /^(FULL BODY WORKOUT|FBW WORKOUT)/i,
    ];

    // Stop keywords - these lines end the plan
    const STOP = ['ROZGRZEWKA','SERIE WSTĘPNE','METODA PROGRESJI','PONIŻEJ ZNAJDZIESZ','DZIĘKUJĘ','WIEM, JEDNAK','OPTYMALNEGO'];

    // Skip keywords - column headers, legal notes, etc.
    const SKIP = ['LP ','NAZWA ĆWICZENIA','ILOŚĆ SERII','TEMPO','PRZERWA','CIĘŻAR','STRATEGIE ZASTOSOWANE','OPIS METODY','KLIKNIJ W'];

    // Detect plan name from first non-empty line
    let planName = '4-dniowy plan treningowy';
    for(const line of lines){
      const l = line.trim();
      if(l.length > 5 && l.length < 80 && !SKIP.some(s=>l.toUpperCase().includes(s))){
        planName = l.replace(/\s+/g,' ').trim();
        break;
      }
    }

    const days = [];
    let currentDay = null;
    let stopParsing = false;

    for(let idx = 0; idx < lines.length; idx++){
      if(stopParsing) break;
      const raw = lines[idx];
      const line = raw.trim();
      const lineUp = line.toUpperCase();
      if(!line) continue;

      // Stop at guide sections
      if(STOP.some(s => lineUp.startsWith(s) || lineUp.includes(s)) && line.length < 80){
        stopParsing = true;
        break;
      }

      // Skip column headers and legal text
      if(SKIP.some(s => lineUp.includes(s))) continue;
      if(line.length > 150) continue; // too long = description text

      // Detect day header
      const isDay = DAY_PATTERNS.some(p => p.test(line)) && line.length < 70;
      if(isDay){
        currentDay = {dayName: line.trim(), exercises:[]};
        days.push(currentDay);
        continue;
      }

      if(!currentDay) continue;

      // Try to parse exercise row
      // Format: [LP] [Name] [Sets] [Reps] [Tempo] [Rest] ...
      // LP can be: 1, 2, 3A, 3B, 4, 5A, 5B etc.
      const ex = parsePdfExerciseLine(line);
      if(ex) currentDay.exercises.push(ex);
    }

    // Filter days with exercises
    const validDays = days.filter(d => d.exercises.length > 0);
    if(!validDays.length) return null;

    return {planName, days: validDays};
  } catch(e){
    console.error('PDF parse error:', e);
    return null;
  }
}

function parsePdfExerciseLine(line){
  // Pattern: starts with number or number+letter (LP column)
  // e.g. "1 Wyciskanie sztangi 3 6-8 2/0/X/1 120s-180s"
  // e.g. "3A Rozpiętki 3 10-12 2/0/X/0 20s"
  const lpMatch = line.match(/^(\d+[A-B]?)\s+(.+)/i);
  if(!lpMatch) return null;

  const lp = lpMatch[1];
  const rest = lpMatch[2].trim();
  const isSuper = /[AB]$/i.test(lp);

  // Extract sets (single digit 2-6) and reps from the end of the name
  // Reps patterns: "6-8", "8-10", "10-12", "12", "12-15 (na stronę)", "do upadku 8-10 do upadku"
  // Sets: single number 2-5 before reps
  const repsPattern = /(\d+[-–]\d+(?:\s*(?:na\s+\w+|do\s+upadku))?|\d+(?:\s+na\s+\w+)?)\s*(?:\d+[-–]\d+\s+do\s+upadku)?$/i;
  const setsPattern = /\b([2-6])\s+(?:\d+[-–]\d+|\d+)/;

  // Try to find sets and reps by looking for tempo pattern (X/X/X/X) as anchor
  const tempoMatch = rest.match(/\b(\d+)\/([0X])\/([X\d])\/([0-9])\b/);

  let name, sets = 3, reps = '8-12', tempo = '', restTime = '';

  if(tempoMatch){
    // Everything before the tempo-adjacent number block is the name
    const tempoIdx = rest.indexOf(tempoMatch[0]);
    const beforeTempo = rest.slice(0, tempoIdx).trim();
    tempo = tempoMatch[0];
    restTime = rest.slice(tempoIdx + tempoMatch[0].length).trim().split(' ')[0] || '';

    // Last tokens before tempo are sets+reps
    const tokens = beforeTempo.split(/\s+/);
    // Find reps (last token with digits/dash)
    let repsIdx = -1;
    for(let i = tokens.length-1; i >= 0; i--){
      if(/^\d+[-–]\d+$/.test(tokens[i]) || /^\d+$/.test(tokens[i])){
        repsIdx = i;
        break;
      }
    }
    if(repsIdx > 0 && /^\d$/.test(tokens[repsIdx-1])){
      sets = parseInt(tokens[repsIdx-1]) || 3;
      reps = tokens[repsIdx];
      name = tokens.slice(0, repsIdx-1).join(' ');
    } else if(repsIdx >= 0){
      reps = tokens[repsIdx];
      name = tokens.slice(0, repsIdx).join(' ');
    } else {
      name = beforeTempo;
    }
  } else {
    // No tempo - simpler parse: grab last 1-2 numbers as sets/reps
    const tokens = rest.split(/\s+/);
    let repsIdx = -1;
    for(let i = tokens.length-1; i >= 0; i--){
      if(/^\d+[-–]\d+$/.test(tokens[i]) || /^\d+$/.test(tokens[i])){
        repsIdx = i; break;
      }
    }
    if(repsIdx > 0 && /^[2-6]$/.test(tokens[repsIdx-1])){
      sets = parseInt(tokens[repsIdx-1]);
      reps = tokens[repsIdx];
      name = tokens.slice(0, repsIdx-1).join(' ');
    } else if(repsIdx >= 0){
      reps = tokens[repsIdx];
      name = tokens.slice(0, repsIdx).join(' ');
    } else {
      name = rest;
    }
  }

  // Clean up name
  name = name.trim().replace(/\s+/g,' ');

  // Handle "do upadku" reps
  if(rest.toLowerCase().includes('do upadku')){
    const m = rest.match(/(\d+[-–]\d+)\s+do\s+upadku/i);
    if(m) reps = m[1] + ' (do upadku)';
  }

  // Handle "2S6-8P" format (2 serie 6-8 powt + 1 backoff)
  const sSeriesMatch = rest.match(/(\d+)S(\d+[-–]\d+)P/);
  if(sSeriesMatch){
    sets = parseInt(sSeriesMatch[1]);
    reps = sSeriesMatch[2];
    const backOff = rest.includes('Back off') ? ' +1 back off' : '';
    reps += backOff;
  }

  if(!name || name.length < 3) return null;

  // Ignore lines that are clearly not exercises
  const NON_EX = ['ROZGRZEWKA','PORADNIK','TEMPO TO','METODA','STRATEGIE','UZUPEŁNIANIE','PRZYKŁAD'];
  if(NON_EX.some(n => name.toUpperCase().includes(n))) return null;
  if(name.length > 100) return null;

  return {
    name,
    sets: isNaN(sets) ? 3 : sets,
    reps: reps || '8-12',
    rest: restTime,
    tempo,
    notes: isSuper ? '🔗 Superseria' : ''
  };
}


function processExcelFile(file){
  updateImportStep(2);
  document.getElementById('importContent').innerHTML = `
    <div class="ai-parsing">
      <div class="ai-spinner"></div>
      <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;">Czytam plik…</div>
      <div style="font-size:13px;color:var(--muted);">Wczytuję Excel i analizuję strukturę</div>
    </div>
  `;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      // Parse Excel with SheetJS
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, {type:'array'});

      // Convert all sheets to text with date fix
      let allText = '';
      wb.SheetNames.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        // Use raw values to avoid date conversion issues
        const json = XLSX.utils.sheet_to_json(ws, {header:1, raw:false, dateNF:'d-m'});
        const csv = json.map(row => row.join(',')).join('\n');
        if(csv.trim().length > 10){
          allText += `\n\n=== ARKUSZ: ${sheetName} ===\n${csv}`;
        }
      });

      if(!allText.trim()){
        showImportError('Plik jest pusty lub nie zawiera danych.');
        return;
      }

      // Limit text size for API
      const truncated = allText.slice(0, 6000);

      // Try direct JS parsing first (fast, no API needed)
      document.getElementById('importContent').innerHTML = `
        <div class="ai-parsing">
          <div class="ai-spinner"></div>
          <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;">Analizuję plan…</div>
          <div style="font-size:13px;color:var(--muted);">Czytam strukturę planu treningowego</div>
        </div>
      `;

      // ---- DIRECT PARSER ----
      let plan = directParsePlan(wb);

      // ---- AI FALLBACK (with timeout) ----
      if(!plan || !plan.days || plan.days.length === 0){
        document.getElementById('importContent').innerHTML = `
          <div class="ai-parsing">
            <div class="ai-spinner"></div>
            <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;">AI analizuje plan…</div>
            <div style="font-size:13px;color:var(--muted);">Niestandardowy format — Claude go odczyta</div>
          </div>
        `;
        try {
          const aiResult = await Promise.race([
            callAI(truncated.slice(0,3000), AI_PARSE_PROMPT),
            new Promise((_,rej) => setTimeout(()=>rej(new Error('timeout')), 25000))
          ]);
          const clean = aiResult.replace(/```json|```/g,'').trim();
          const jsonMatch = clean.match(/\{[\s\S]*\}/);
          if(jsonMatch) plan = JSON.parse(jsonMatch[0]);
        } catch(aiErr) {
          showImportError(`Nie udało się odczytać planu.<br><br>
            <small style="color:var(--dim);">Upewnij się że plik zawiera plan treningowy z kolumnami: ćwiczenie, serie, powtórzenia.</small>`);
          return;
        }
      }

      if(!plan || !plan.days || plan.days.length === 0){
        showImportError('Nie znaleziono dni treningowych w pliku.<br><br><small style="color:var(--dim);">Spróbuj z plikiem który ma wyraźny podział na dni (np. "Dzień A", "Push", "Poniedziałek").</small>');
        return;
      }

      parsedPlan = plan;
      showImportPreview(plan);

    } catch(err) {
      showImportError('Błąd odczytu pliku: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function showImportPreview(plan){
  updateImportStep(3);
  const totalEx = plan.days.reduce((s,d)=>s+d.exercises.length,0);

  document.getElementById('importContent').innerHTML = `
    <div style="padding:0 16px;">
      <div style="background:var(--green-dim);border:1px solid rgba(0,196,140,.3);border-radius:12px;padding:14px;margin-bottom:14px;">
        <div style="font-size:10px;font-weight:800;letter-spacing:.1em;color:var(--green);text-transform:uppercase;margin-bottom:4px;">✓ Plan rozpoznany</div>
        <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;">${esc(plan.planName)}</div>
        <div style="font-size:13px;color:var(--muted);margin-top:4px;">${plan.days.length} dni treningowych · ${totalEx} ćwiczeń</div>
      </div>

      <div style="max-height:340px;overflow-y:auto;margin-bottom:14px;">
        ${plan.days.map(day=>`
          <div class="plan-day-card">
            <div class="plan-day-title">${esc(day.dayName)}</div>
            ${day.exercises.map(ex=>`
              <div class="plan-ex-row">
                <div>
                  <div style="font-weight:600;">${esc(ex.name)}</div>
                  ${ex.notes?`<div class="plan-ex-sets">${ex.notes}</div>`:''}
                </div>
                <div style="text-align:right;flex-shrink:0;margin-left:12px;">
                  <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;">${ex.sets}×${ex.reps}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>

      <div style="display:flex;gap:10px;">
        <button class="btn btn-ghost" onclick="showImportUpload();updateImportStep(1);" style="flex:1;">← Inny plik</button>
        <button class="btn btn-primary" onclick="importPlanToApp()" style="flex:2;">Importuj plan →</button>
      </div>
    </div>
  `;
}

function importPlanToApp(){
  if(!parsedPlan) return;
  updateImportStep(4);

  // Save plan to state
  if(!state.importedPlans) state.importedPlans = [];
  state.importedPlans.push({
    id: Date.now(),
    ...parsedPlan,
    importedAt: Date.now(),
  });
  save();

  const totalEx = parsedPlan.days.reduce((s,d)=>s+d.exercises.length,0);

  document.getElementById('importContent').innerHTML = `
    <div style="padding:0 16px;text-align:center;">
      <div style="font-size:47px;margin:24px 0 12px;">🎉</div>
      <div style="font-family:'Syne',sans-serif;font-size:26px;font-weight:800;margin-bottom:8px;">Plan zaimportowany!</div>
      <div style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:24px;">
        <strong style="color:var(--text);">${parsedPlan.planName}</strong><br>
        ${parsedPlan.days.length} dni · ${totalEx} ćwiczeń<br>
        gotowe do trenowania
      </div>

      <div style="background:var(--orange-dim);border:1px solid var(--orange-mid);border-radius:12px;padding:14px;text-align:left;margin-bottom:20px;">
        <div style="font-size:10px;font-weight:800;letter-spacing:.1em;color:var(--orange);text-transform:uppercase;margin-bottom:6px;">Jak używać?</div>
        <div style="font-size:13px;line-height:1.7;color:var(--text);">
          Naciśnij <strong>+ Nowy trening</strong> → wybierz dzień z planu trenera → zacznij ćwiczyć. Plan będzie dostępny jako gotowy szablon.
        </div>
      </div>

      <button class="btn btn-primary" onclick="closePanel('importPanel');renderHome();">Wróć do głównej →</button>
    </div>
  `;

  // Refresh home to show imported plan section
  setTimeout(()=>renderImportedPlans(), 300);
}

function showImportError(msg){
  updateImportStep(1);
  document.getElementById('importContent').innerHTML = `
    <div style="padding:0 16px;">
      <div style="background:var(--red-dim);border:1px solid rgba(255,59,92,.3);border-radius:12px;padding:18px;margin-bottom:14px;text-align:center;">
        <div style="font-size:28px;margin-bottom:8px;">⚠️</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:6px;">Nie udało się odczytać planu</div>
        <div style="font-size:13px;color:var(--muted);line-height:1.6;">${msg}</div>
      </div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:14px;">
        <div style="font-size:10px;font-weight:800;letter-spacing:.1em;color:var(--muted);text-transform:uppercase;margin-bottom:8px;">✅ Formaty które działają</div>
        <div style="font-size:12px;color:var(--text);line-height:1.8;">
          • Kolumny: <strong>Ćwiczenie | Serie | Powtórzenia</strong><br>
          • Format: <strong>Wyciskanie sztangi | 4 | 8-10</strong><br>
          • Lub: <strong>Bench press 3x10</strong><br>
          • Podział na dni: <strong>Push Day, Dzień A, Poniedziałek</strong>
        </div>
      </div>
      <button class="btn btn-ghost" onclick="showImportUpload()">← Spróbuj z innym plikiem</button>
    </div>
  `;
}

function renderImportedPlans(){
  // Show imported plans on home screen as quick-start templates
  if(!state.importedPlans || !state.importedPlans.length) return;
  const container = document.getElementById('lastWorkoutCard');
  const existingImport = document.getElementById('importedPlansSection');
  if(existingImport) existingImport.remove();

  const section = document.createElement('div');
  section.id = 'importedPlansSection';
  section.innerHTML = `
    <div style="padding:12px 14px 0;">
      <div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">📊 Plany od trenera</div>
      ${state.importedPlans.map(plan=>`
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
            <div>
              <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;">${esc(plan.planName)}</div>
              <div style="font-size:11px;color:var(--muted);margin-top:2px;">${plan.days.length} dni treningowych · Importowany ${new Date(plan.importedAt).toLocaleDateString('pl')}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:4px;">
            ${plan.days.map(day=>`
              <button onclick="startFromImportedPlan(${plan.id},'${encodeInlineArg(day.dayName)}')"
                style="flex-shrink:0;background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;padding:10px 14px;cursor:pointer;text-align:left;transition:all .15s;"
                onmouseover="this.style.borderColor='var(--orange)';this.style.background='var(--orange-dim)'"
                onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--surface2)'">
                <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--text);white-space:nowrap;">${esc(day.dayName)}</div>
                <div style="font-size:10px;color:var(--muted);margin-top:2px;white-space:nowrap;">${day.exercises.length} ćwiczeń</div>
              </button>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  container.parentNode.insertBefore(section, container.nextSibling);
}

function startFromImportedPlan(planId, encodedDayName){
  if(!withAbandonedCurrentWorkout()) return;
  const dayName = decodeURIComponent(encodedDayName);
  const plan = state.importedPlans.find(p=>p.id===planId);
  if(!plan) return;
  const day = plan.days.find(d=>d.dayName===dayName);
  if(!day) return;

  // Map exercises to app format
  // WAŻNE: zachowaj oryginalną nazwę z planu — dopasuj do DB tylko dla uzyskania kategorii/mięśnia
  const exercises = day.exercises.map(ex=>{
    const found = EXERCISES_DB.find(e=>
      e.name.toLowerCase().includes(ex.name.toLowerCase().split(' ')[0]) ||
      ex.name.toLowerCase().includes(e.name.toLowerCase().split(' ')[0])
    );
    // Zawsze używaj oryginalnej nazwy z planu, nie z DB
    return {
      id: found ? found.id+'_plan' : 'custom_'+Date.now()+'_'+Math.random(),
      name: ex.name,  // oryginalna nazwa — NIEZMIENIONA
      cat: found ? found.cat : 'Custom',
      muscle: found ? found.muscle : '—',
      sets: [],
      plannedSets: ex.sets,
      plannedReps: ex.reps,
      rest: ex.rest || '',
      notes: ex.notes || ''
    };
  });

  state.currentWorkout = {
    id: Date.now(),
    name: `${plan.planName} — ${dayName}`,
    startTime: Date.now(),
    exercises,
    done: false,
  };
  state.currentExIdx = 0;
  save();
  startWorkoutTimer();
  goTo('workout');
  renderLiveWorkout();
}

// ===================== DIRECT EXCEL PARSER =====================
const AI_PARSE_PROMPT = `Jesteś parserem planów treningowych. Otrzymujesz tekst z pliku (Excel CSV lub PDF) od polskiego trenera personalnego.
Odpowiedz TYLKO czystym JSON bez markdown, backticks ani żadnego dodatkowego tekstu:
{"planName":"nazwa planu","days":[{"dayName":"nazwa dnia","exercises":[{"name":"ćwiczenie","sets":3,"reps":"8-10","rest":"120s","notes":""}]}]}
Zasady:
- Szukaj dni treningowych: PUSH/PULL/FBW/ARMS/LEGS/PONIEDZIAŁEK/WTOREK/ŚRODA/CZWARTEK/PIĄTEK/SOBOTA/NIEDZIELA/DZIEŃ A/B/C/D
- Ignoruj opisy, poradniki, wstępy, informacje o diecie, regeneracji
- sets = liczba całkowita (np. 3, 4). Format "2S6-8P" = 2 serie + 1 back off = sets:3
- reps = zakres lub liczba (np. "8-10", "12", "10 na rękę")
- Daty w formacie d-m to zakresy powtórzeń (np. "8-6" = "6-8 powt.")
- Ćwiczenia z A/B przy numerze (5A, 5B) to superserie — dodaj notes: "Superseria"
- Jeśli brak podziału na dni — stwórz jeden dzień "Trening A"
- KRYTYCZNE: Przepisuj nazwy ćwiczeń DOKŁADNIE jak w oryginale, bez żadnych zmian ani tłumaczeń`;

function directParsePlan(wb){
  try {
    // Find the training plan sheet (not guide/poradnik)
    const sheetName = wb.SheetNames.find(n =>
      !n.toLowerCase().includes('poradnik') &&
      !n.toLowerCase().includes('guide') &&
      !n.toLowerCase().includes('opis')
    ) || wb.SheetNames[0];

    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, {header:1, raw:true, defval:null});

    const DAY_KEYWORDS = ['PONIEDZIAŁEK','WTOREK','ŚRODA','CZWARTEK','PIĄTEK','SOBOTA','NIEDZIELA',
      'FULL BODY','FBW','PUSH','PULL','ARMS','LEGS','KLATKA','PLECY','NOGI','DZIEŃ','DZIEN','DAY','TRENING A','TRENING B','TRENING C','TRENING D'];
    const SKIP_KEYWORDS = ['LP','NAZWA','ILOŚĆ','TEMPO','PRZERWA','CIĘŻAR','RIR','OPIS','KLIKNIJ','DELOAD','METODA'];
    // Sections that signal end of exercise list — skip everything after
    const STOP_SECTION_KEYWORDS = ['ROZGRZEWKA','PORADNIK','PROGRESJA','METODA PROGRESJI','OPIS METODY','PONIŻEJ','PRZED ROZPOCZĘCIEM','ABY PLAN','REGENERACJA','DIETA'];
    // Sentences = clearly descriptive text, not exercise names
    const SENTENCE_WORDS = ['POWINIENEŚ','POWINNA','POZWOLI','MOŻESZ','NALEŻY','NALEŻY','ZACZNIJ','WYKONAJ','PAMIĘTAJ','JEŚLI','NATOMIAST','PRZYKŁAD','CZYLI','ORAZ','JEDNAK','RÓWNIEŻ','TWOJE','TWÓJ','MUSISZ'];
    // Find plan name (first non-empty row)
    let planName = '4 Dniowy Plan Treningowy';
    for(let r of rows){
      const cell = r.find(c => c && String(c).trim().length > 5);
      if(cell && !String(cell).toUpperCase().includes('OPIS') && !String(cell).toUpperCase().includes('KLIKNIJ')){
        planName = String(cell).trim();
        // Trim long descriptions
        if(planName.length > 60) planName = planName.slice(0,60).trim() + '…';
        break;
      }
    }

    // Find column indices AND the row index of the first header
    let colSets = -1, colReps = -1, colName = -1, colRest = -1, colTempo = -1;
    let firstHeaderRowIdx = 0;
    for(let i = 0; i < rows.length; i++){
      const r = rows[i];
      const strs = r.map(c => c ? String(c).toUpperCase().trim() : '');
      const nameIdx = strs.findIndex(s => s.includes('NAZWA') || s.includes('ĆWICZENIE') || s.includes('CWICZENIE') || s === 'EXERCISE');
      if(nameIdx >= 0){
        colName = nameIdx;
        firstHeaderRowIdx = i;
        colSets = strs.findIndex(s => s.includes('SERII') || s.includes('SERIE') || s.includes('SETS') || s.includes('ILOŚĆ S'));
        colReps = strs.findIndex(s => s.includes('POWTÓRZ') || s.includes('POWT') || s.includes('REPS') || s.includes('ILOŚĆ P'));
        colRest = strs.findIndex(s => s.includes('PRZERWA') || s.includes('REST'));
        colTempo = strs.findIndex(s => s.includes('TEMPO'));
        if(colSets < 0) colSets = colName + 1;
        if(colReps < 0) colReps = colName + 2;
        break;
      }
    }
    if(colName < 0) colName = 1;

    // Parse rows into days and exercises
    const days = [];
    let currentDay = null;
    let stopParsing = false;

    for(let rowIdx = 0; rowIdx < rows.length; rowIdx++){
      const row = rows[rowIdx];
      if(stopParsing) break;
      if(!row || row.every(c => c === null || c === undefined || String(c).trim() === '')) continue;

      const firstCell = row.find(c => c !== null && c !== undefined);
      const cellStr = firstCell ? String(firstCell).trim() : '';
      const cellUp = cellStr.toUpperCase();

      // Skip all rows before the first column header — these are title/description rows
      if(rowIdx < firstHeaderRowIdx) continue;

      // Skip header/guide rows
      if(SKIP_KEYWORDS.some(k => cellUp.startsWith(k))) continue;

      // Stop if we hit a non-training section
      if(STOP_SECTION_KEYWORDS.some(k => cellUp.includes(k)) && cellStr.length < 60){
        stopParsing = true; break;
      }

      // Skip descriptive sentences (contain sentence words, usually long)
      if(cellStr.length > 50 && SENTENCE_WORDS.some(w => cellUp.includes(w))) continue;
      if(cellStr.length > 100) continue; // definitely a description

      // Check if this row is a day header
      const isDay = DAY_KEYWORDS.some(k => cellUp.includes(k)) && cellStr.length < 60;
      if(isDay){
        currentDay = {dayName: cleanDayName(cellStr), exercises:[]};
        days.push(currentDay);
        continue;
      }

      // Check if this is an exercise row
      if(!currentDay) continue;
      const nameCell = row[colName];
      if(!nameCell || String(nameCell).trim().length < 3) continue;

      const exName = String(nameCell).trim();
      if(SKIP_KEYWORDS.some(k => exName.toUpperCase().startsWith(k))) continue;
      if(exName.length > 120) continue;

      // Parse sets — format "2S6-8P" = 2 serie + back off (back off liczymy jako normalną serię)
      const setsRaw = colSets >= 0 ? row[colSets] : null;
      let sets = 3;
      if(setsRaw !== null && setsRaw !== undefined){
        const setsStr = String(setsRaw).trim();
        // Format "2S6-8P" lub "3S8P" — numer przed S to serie, P to back off = +1 seria
        const backOffMatch = setsStr.match(/^(\d+)[sS]/);
        if(backOffMatch){
          const mainSets = parseInt(backOffMatch[1]);
          const hasBackOff = /[pP]/.test(setsStr);
          sets = hasBackOff ? mainSets + 1 : mainSets;
        } else {
          sets = Math.round(parseFloat(setsStr)) || 3;
        }
      }

      // Parse reps — handle Excel date bug
      const repsRaw = colReps >= 0 ? row[colReps] : null;
      let reps = parseReps(repsRaw);

      // Rest
      const restRaw = colRest >= 0 ? row[colRest] : null;
      const rest = restRaw ? String(restRaw).trim() : '';

      // Tempo
      const tempoRaw = colTempo >= 0 ? row[colTempo] : null;
      const tempo = tempoRaw ? String(tempoRaw).trim() : '';

      // Superserie detection (LP column: 5A, 5B, 3A, 3B etc.)
      const lpCell = row[0] ? String(row[0]).trim() : '';
      const isSuper = /^\d+[AB]$/i.test(lpCell);
      const notes = isSuper ? '🔗 Superseria' : '';

      if(sets > 0 && exName.length > 2){
        currentDay.exercises.push({name:exName, sets, reps, rest, tempo, notes});
      }
    }

    if(days.length === 0 || days.every(d => d.exercises.length === 0)) return null;

    return {planName, days};
  } catch(e){
    console.error('Direct parse error:', e);
    return null;
  }
}

function cleanDayName(str){
  // Remove noise, capitalize nicely
  return str.replace(/\s+/g,' ').trim()
    .replace(/^(FULL BODY WORKOUT\s*)/i,'FBW — ')
    .replace(/\s*(PONIEDZIAŁEK|WTOREK|ŚRODA|CZWARTEK|PIĄTEK|SOBOTA|NIEDZIELA)/i, m => ' ' + m.trim());
}

function parseReps(raw){
  if(raw === null || raw === undefined) return '8-12';
  // If it's a JS Date object (Excel date bug)
  if(raw instanceof Date){
    const d = raw.getDate(), m = raw.getMonth()+1;
    return `${m}-${d}`; // reverse: month-day = original range
  }
  // If it's a number that looks like a date serial (e.g. 45451)
  if(typeof raw === 'number' && raw > 1000){
    // Excel date serial — convert
    const date = new Date(Math.round((raw - 25569)*86400*1000));
    const d = date.getUTCDate(), m = date.getUTCMonth()+1;
    return `${m}-${d}`;
  }
  const str = String(raw).trim();
  // Already looks like reps
  if(/^\d+[-–]\d+/.test(str)) return str;
  if(/^\d+$/.test(str)) return str;
  return str || '8-12';
}

// ===================== INIT =====================
clearLegacyLocalData();
load();
renderHome();
initAI();
updateActiveWorkoutBanner();

// If workout was in progress (e.g. page refresh), resume
if(state.currentWorkout&&!state.currentWorkout.done){
  startWorkoutTimer();
}

