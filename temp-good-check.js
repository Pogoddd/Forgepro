// ===================== DATA =====================
const EXERCISES_DB = [
  // Klatka
  {id:'bp', name:'Wyciskanie sztangi', cat:'Klatka', muscle:'Klatka piersiowa'},
  {id:'dbp', name:'Wyciskanie hantli', cat:'Klatka', muscle:'Klatka piersiowa'},
  {id:'fly', name:'Rozpiêtki hantli', cat:'Klatka', muscle:'Klatka piersiowa'},
  {id:'cbp', name:'Wyciskanie na wyci¹gu', cat:'Klatka', muscle:'Klatka piersiowa'},
  {id:'dip', name:'Dipy', cat:'Klatka', muscle:'Klatka / Triceps'},
  {id:'incbp', name:'Wyciskanie skos górny', cat:'Klatka', muscle:'Górna klatka'},
  // Plecy
  {id:'dl', name:'Martwy ci¹g', cat:'Plecy', muscle:'Plecy / Nogi'},
  {id:'row', name:'Wios³owanie sztang¹', cat:'Plecy', muscle:'Plecy'},
  {id:'pu', name:'Podci¹ganie', cat:'Plecy', muscle:'Plecy / Biceps'},
  {id:'latpd', name:'Œci¹ganie dr¹¿ka', cat:'Plecy', muscle:'Plecy'},
  {id:'carow', name:'Wios³owanie wyci¹g', cat:'Plecy', muscle:'Plecy'},
  // Nogi
  {id:'sq', name:'Squat', cat:'Nogi', muscle:'Nogi'},
  {id:'fsq', name:'Front Squat', cat:'Nogi', muscle:'Czworog³owe'},
  {id:'leg', name:'Leg Press', cat:'Nogi', muscle:'Nogi'},
  {id:'rdk', name:'Martwy rumuñski', cat:'Nogi', muscle:'Uda tylne'},
  {id:'lunge', name:'Wykroki', cat:'Nogi', muscle:'Poœladki / Czworog³owe'},
  {id:'legcurl', name:'Uginanie nóg', cat:'Nogi', muscle:'Uda tylne'},
  {id:'legext', name:'Prostowanie nóg', cat:'Nogi', muscle:'Czworog³owe'},
  {id:'calf', name:'Wspiêcia na palce', cat:'Nogi', muscle:'£ydki'},
  // Ramiona
  {id:'ohp', name:'OHP (wycisk stoj¹c)', cat:'Barki', muscle:'Barki'},
  {id:'dbs', name:'Wycisk hantli barki', cat:'Barki', muscle:'Barki'},
  {id:'lrl', name:'Odwodzenie boczne', cat:'Barki', muscle:'Barki œrodkowe'},
  {id:'frl', name:'Odwodzenie przednie', cat:'Barki', muscle:'Barki przednie'},
  {id:'rrl', name:'Wznosy w opadzie', cat:'Barki', muscle:'Barki tylne'},
  // Biceps
  {id:'bbc', name:'Uginanie sztangi biceps', cat:'Biceps', muscle:'Biceps'},
  {id:'hbc', name:'Uginanie hantli', cat:'Biceps', muscle:'Biceps'},
  {id:'cbbc', name:'Uginanie wyci¹g', cat:'Biceps', muscle:'Biceps'},
  {id:'hm', name:'Hammer curl', cat:'Biceps', muscle:'Biceps / Ramiê'},
  // Triceps
  {id:'skullc', name:'Skull crushers', cat:'Triceps', muscle:'Triceps'},
  {id:'tpd', name:'Prostowanie wyci¹g', cat:'Triceps', muscle:'Triceps'},
  {id:'tdip', name:'Dipy triceps', cat:'Triceps', muscle:'Triceps'},
  {id:'ot', name:'Wycisk nad g³ow¹ triceps', cat:'Triceps', muscle:'Triceps'},
  // Core
  {id:'plank', name:'Plank', cat:'Core', muscle:'Core'},
  {id:'ab', name:'Brzuszki', cat:'Core', muscle:'Brzuch'},
  {id:'leg_raise', name:'Unoszenie nóg', cat:'Core', muscle:'Dolny brzuch'},
];

const CATS = ['Wszystkie','Klatka','Plecy','Nogi','Barki','Biceps','Triceps','Core'];
const STORAGE_KEY = 'forgepro_v2';
const LEGACY_STORAGE_KEY = 'forgepro_v1';

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
    meta: {version: 2}
  };
}

let state = createDefaultState();

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
    meta: {version: 2}
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
function load(){
  const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  if(!raw) return;
  try{
    state = migrateState(JSON.parse(raw));
    if(localStorage.getItem(LEGACY_STORAGE_KEY) && !localStorage.getItem(STORAGE_KEY)) save();
  }catch(err){
    console.warn('Nie udalo sie wczytac danych aplikacji:', err);
    state = createDefaultState();
  }
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
    // Dodaj padding do top-bar ¿eby nie zas³ania³a contentu
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

// Banner timer — aktualizuje siê co sekundê
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
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--orange);margin-bottom:3px;">??? Trening aktywny</div>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px;">${esc(state.currentWorkout.name)}</div>
      </div>
      <button onclick="goTo('workout')" class="btn btn-primary" style="flex-shrink:0;width:auto;padding:10px 16px;font-size:13px;">Wróæ ›</button>
    </div>`;
  }

  // Imported plans section
  if(importedPlans.length){
    html += `<div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">?? Od trenera</div>`;
    importedPlans.forEach(plan=>{
      plan.days.forEach(day=>{
        html += `<div class="wkt-template-card" onclick="startFromImportedPlan(${plan.id},'${encodeInlineArg(day.dayName)}')">
          <div class="wkt-template-name">${esc(day.dayName)}</div>
          <div class="wkt-template-meta">${esc(plan.planName)} · ${day.exercises.length} æwiczeñ</div>
          <div class="wkt-ex-chips">${day.exercises.slice(0,4).map(e=>`<div class="wkt-ex-chip">${shortLabel(e.name,3)}</div>`).join('')}${day.exercises.length>4?`<div class="wkt-ex-chip">+${day.exercises.length-4}</div>`:''}</div>
        </div>`;
      });
    });
  }

  // My templates
  if(savedTemplates.length){
    html += `<div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:${importedPlans.length?'16px':0} 0 8px;">?? Moje treningi</div>`;
    savedTemplates.forEach(tpl=>{
      html += `<div class="wkt-template-card" style="display:flex;align-items:center;gap:12px;">
        <div style="flex:1;" onclick="startFromTemplate(${tpl.id})">
          <div class="wkt-template-name">${esc(tpl.name)}</div>
          <div class="wkt-template-meta">${tpl.exercises.length} æwiczeñ</div>
          <div class="wkt-ex-chips">${tpl.exercises.slice(0,4).map(e=>`<div class="wkt-ex-chip">${shortLabel(e.name,2)}</div>`).join('')}</div>
        </div>
        <button onclick="deleteTemplate(${tpl.id})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:20px;padding:4px;flex-shrink:0;">×</button>
      </div>`;
    });
  }

  if(!importedPlans.length && !savedTemplates.length){
    html = `<div class="empty" style="padding-top:60px;">
      <div class="eico">???</div>
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
  switchWktTab('info');
}

function deleteTemplate(id){
  if(!confirm('Usun¹æ szablon?')) return;
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
        ${isAdded?'?':'+'}
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
  switchWktTab('info');
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
        ${isAdded?'?':'+'}
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
    container.innerHTML = '<div id="wktExEmpty" style="padding:16px;font-size:13px;color:var(--muted);text-align:center;">Brak æwiczeñ — dodaj poni¿ej</div>';
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
  if(newWktExercises.length===0){alert('Dodaj co najmniej 1 æwiczenie!');return;}

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
    // SprawdŸ czy to ostatnia seria ostatniego æwiczenia
    const ex = wkt?.exercises[state.currentExIdx];
    const allDone = wkt?.exercises.every(e=>e.sets.length>=(e.plannedSets||3));
    if(allDone){
      btn.textContent='?? Zakoñcz trening';
      btn.className='btn btn-primary';
      btn.style.background='var(--green)';
      btn.onclick=confirmFinish;
    } else {
      btn.textContent='? Zapisz seriê';
      btn.style.background='';
      btn.className='btn btn-primary';
      btn.onclick=logSet;
    }
  } else if(tab==='info'){
    const allDone = wkt?.exercises.every(e=>e.sets.length>=(e.plannedSets||3));
    if(allDone){
      btn.textContent='?? Zakoñcz trening';
      btn.className='btn btn-primary';
      btn.style.background='var(--green)';
      btn.onclick=confirmFinish;
    } else {
      btn.textContent='? Zacznij logowaæ';
      btn.style.background='';
      btn.className='btn btn-primary';
      btn.onclick=()=>switchWktTab('log');
    }
  } else {
    btn.textContent='?? Zakoñcz trening';
    btn.style.background='';
    btn.className='btn btn-primary';
    btn.onclick=confirmFinish;
  }
}

function renderInfoTab(){
  const wkt = state.currentWorkout;
  if(!wkt) return;
  const ICONS = {'Klatka':'??','Plecy':'??','Nogi':'??','Barki':'??','Biceps':'??','Triceps':'??','Core':'??','Custom':'?','—':'?'};
  document.getElementById('exOverviewList').innerHTML = wkt.exercises.map((ex,i)=>{
    const totalSets = ex.plannedSets || 3;
    const doneSets = ex.sets.length;
    const icon = ICONS[ex.cat] || '???';
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
            ${allDone?'? Zalogowane — edytuj':'? Zaloguj to æwiczenie'}
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
}

function renderLogTab(){
  const wkt = state.currentWorkout;
  if(!wkt) return;
  const ex = wkt.exercises[state.currentExIdx];
  if(!ex) return;

  // Exercise pills
  document.getElementById('exPillRow').innerHTML = wkt.exercises.map((e,i)=>{
    const done = e.sets.length >= (e.plannedSets||3);
    const current = i === state.currentExIdx;
    return `<div class="ex-pill-btn ${current?'current':done?'done-pill':''}" onclick="goToLogEx(${i})">${shortLabel(e.name,2)}</div>`;
  }).join('');

  // Exercise name + plan info
  document.getElementById('logExName').textContent = ex.name;
  document.getElementById('logPlanInfo').textContent = ex.plannedSets ? `Plan: ${ex.plannedSets}×${ex.plannedReps}${ex.rest?' · przerwa '+ex.rest:''}` : '';
  const prev = getPrevPerf(ex.id);
  document.getElementById('logPrevInfo').textContent = prev ? `Poprzednio: ${prev}` : 'Pierwsze podejœcie!';

  // Series table
  const totalSets = Math.max(ex.sets.length + 1, ex.plannedSets || 3);
  document.getElementById('logSetsTable').innerHTML = Array.from({length:totalSets},(_,i)=>{
    const set = ex.sets[i];
    const isActive = i === ex.sets.length;
    const isDone = !!set;
    return `<div class="set-table-row ${isDone?'done-row':isActive?'active-row':''}" onclick="${isActive?'':''}">
      <div class="set-num ${isDone?'done':isActive?'active':''}">${i+1}</div>
      <div class="set-val ${isDone||isActive?'':'muted'}">${isDone?set.kg+' kg':isActive?'—':'? kg'}</div>
      <div class="set-val ${isDone||isActive?'':'muted'}">${isDone?'× '+set.reps:isActive?'—':'× ?'}</div>
    </div>`;
  }).join('');

  // Pre-fill inputs
  if(ex.sets.length > 0){
    document.getElementById('liveKg').value = ex.sets[ex.sets.length-1].kg;
    document.getElementById('liveReps').value = ex.sets[ex.sets.length-1].reps;
  } else if(prev){
    const m = prev.match(/(\d+)kg/);
    if(m) document.getElementById('liveKg').value = m[1];
    const repsM = (ex.plannedReps||'').match(/^(\d+)/);
    if(repsM) document.getElementById('liveReps').value = repsM[1];
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
  // Usuñ poprzedni modal jeœli jest
  const old = document.getElementById('finishModal');
  if(old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'finishModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:500;display:flex;align-items:flex-end;';

  const skippedHtml = skippedExs.length ? `
    <div style="margin-bottom:14px;">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:8px;">Pominiête — nie licz¹ siê do progresu</div>
      ${skippedExs.map(e=>`
        <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);">
          <span style="font-size:14px;">?</span>
          <span style="font-size:14px;color:var(--muted);">${esc(e.name)}</span>
        </div>
      `).join('')}
    </div>` : '';

  const doneHtml = doneExs.length ? `
    <div style="margin-bottom:14px;">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--green);margin-bottom:8px;">Zalogowane ?</div>
      ${doneExs.map(e=>`
        <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:14px;">?</span>
            <span style="font-size:14px;">${esc(e.name)}</span>
          </div>
          <span style="font-size:12px;color:var(--muted);">${e.sets.length} serii</span>
        </div>
      `).join('')}
    </div>` : '';

  modal.innerHTML = `
    <div style="width:100%;max-width:430px;margin:0 auto;background:var(--surface);border-radius:20px 20px 0 0;padding:24px 20px 40px;max-height:80dvh;overflow-y:auto;">
      <div style="width:36px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 20px;"></div>
      <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;margin-bottom:4px;">Zakoñczyæ trening?</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:20px;">${totalSets > 0 ? `Zalogowano ${totalSets} serii` : 'Brak zalogowanych serii'}</div>
      ${doneHtml}${skippedHtml}
      ${skippedExs.length ? `<div style="background:var(--orange-dim);border:1px solid var(--orange-mid);border-radius:10px;padding:12px;margin-bottom:16px;font-size:13px;line-height:1.5;color:var(--text);">
        <strong style="color:var(--orange);">?? Pominiête æwiczenia</strong> nie bêd¹ liczyæ siê do progresu. Nastêpnym razem zobaczysz ostatni zalogowany wynik.
      </div>` : ''}
      <div style="display:flex;gap:8px;margin-top:4px;">
        <button onclick="document.getElementById('finishModal').remove()" style="flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:12px;padding:14px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;cursor:pointer;">Wróæ</button>
        <button onclick="document.getElementById('finishModal').remove();finishWorkout(true);" style="flex:2;background:${totalSets>0?'var(--orange)':'var(--red)'};color:#fff;border:none;border-radius:12px;padding:14px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;cursor:pointer;">
          ${totalSets>0?'?? Zakoñcz':'Porzuæ trening'}
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
  renderInfoTab();
}

function getPrevPerf(exId){
  const history = state.workouts.filter(w=>w.done);
  for(let i=history.length-1;i>=0;i--){
    const ex = history[i].exercises.find(e=>e.id===exId);
    // Pomiñ æwiczenia oznaczone jako skipped lub bez zalogowanych serii
    if(ex && ex.sets.length>0 && !ex.skipped){
      return ex.sets.map(s=>`${s.kg}kg×${s.reps}`).join(', ');
    }
  }
  return null;
}

function logSet(){
  const wkt = state.currentWorkout;
  if(!wkt) return;
  const ex = wkt.exercises[state.currentExIdx];
  if(!ex) return;
  const kg = parseFloat(document.getElementById('liveKg').value)||0;
  const reps = parseInt(document.getElementById('liveReps').value)||0;
  if(reps===0) return;
  ex.sets.push({kg,reps,time:Date.now()});
  save();
  renderLogTab();
  renderInfoTab();
  aiLiveComment(ex, kg, reps);

  // SprawdŸ czy wszystkie serie dla tego æwiczenia zalogowane
  const plannedSets = ex.plannedSets || 3;
  const isLastEx = state.currentExIdx >= wkt.exercises.length - 1;
  if(ex.sets.length >= plannedSets && !isLastEx){
    // Poka¿ przycisk "Nastêpne æwiczenie" zamiast rest timera
    showNextExButton();
  } else {
    const nextExName = wkt.exercises[state.currentExIdx + 1]?.name || '';
    startRest(150, nextExName);
  }
}

function showNextExButton(){
  const wkt = state.currentWorkout;
  if(!wkt) return;
  const nextEx = wkt.exercises[state.currentExIdx + 1];
  if(!nextEx) return;

  // Poka¿ overlay z przyciskiem nastêpnego æwiczenia
  const restOv = document.getElementById('restOv');
  restOv.classList.add('on');
  // Zatrzymaj istniej¹cy timer
  clearInterval(restInterval);

  // Podmieñ zawartoœæ overlay tymczasowo
  restOv.innerHTML = `
    <div class="rest-card">
      <div class="rest-top">
        <span class="rest-lbl" style="color:var(--green);">? Æwiczenie ukoñczone!</span>
      </div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:14px;">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Nastêpne æwiczenie</div>
        <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;">${nextEx.name}</div>
        <div style="font-size:12px;color:var(--orange);margin-top:2px;">${nextEx.plannedSets||3} serie · ${nextEx.plannedReps||'8-12'} powt.</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button onclick="restBeforeNext()" style="flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--muted);border-radius:12px;padding:12px;font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;">? Odpocznij</button>
        <button onclick="skipToNextEx()" style="flex:2;background:var(--orange);color:#fff;border:none;border-radius:12px;padding:12px 20px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;cursor:pointer;">Nastêpne ›</button>
      </div>
    </div>
  `;
}

function skipToNextEx(){
  // Przywróæ oryginalny HTML overlay
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
        <span class="rest-lbl">? Odpoczynek</span>
        <span id="restNextEx" style="font-size:12px;color:var(--muted);"></span>
      </div>
      <div class="rest-progress-bar">
        <div class="rest-progress-fill" id="restProgressFill" style="width:100%;"></div>
      </div>
      <div class="rest-big" id="restNum">2:30</div>
      <div style="display:flex;gap:8px;">
        <button onclick="addRest(30)" style="flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:12px;padding:12px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;">+30s</button>
        <button onclick="addRest(-15)" style="flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--muted);border-radius:12px;padding:12px;font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;">-15s</button>
        <button onclick="skipRest()" style="flex:2;background:var(--orange);color:#fff;border:none;border-radius:12px;padding:12px 20px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">Pomiñ ›</button>
      </div>
    </div>
  `;
}

async function aiLiveComment(ex, kg, reps){
  const prev = getPrevPerf(ex.id);
  const prompt = `Trening na ?ywo. ?wiczenie: ${cleanText(ex.name)}. Seria ${ex.sets.length}: ${kg}kg ? ${reps} powt. ${prev?'Poprzednio: '+prev:'Pierwsze podej?cie.'} Daj 1 kr?tkie zdanie motywacji/wskaz?wk?. Max 20 s??w. Po polsku.`;
  try{
    const r = await callAI(prompt,'Jesteœ zwiêz³ym Pro Coachem si³owni. Odpowiadasz jednym zdaniem, po polsku, konkretnie i motywuj¹co.');
    const el = document.getElementById('liveAiTxt');
    if(el) el.textContent = r;
  }catch(e){}
}

function prevEx(){
  if(state.currentExIdx>0){state.currentExIdx--;save();renderLogTab();}
}
function nextEx(){
  if(state.currentWorkout&&state.currentExIdx<state.currentWorkout.exercises.length-1){
    state.currentExIdx++;save();renderLogTab();
  }
}

function finishWorkout(skipConfirm){
  if(!skipConfirm && !confirm('Zakoñczyæ trening?')) return;
  if(state.currentWorkout){
    const wkt = state.currentWorkout;
    wkt.done = true;
    wkt.endTime = Date.now();
    // Oznacz pominiête æwiczenia — te bez serii nie bêd¹ liczyæ siê do historii/PRów
    wkt.exercises.forEach(ex=>{
      if(ex.sets.length === 0) ex.skipped = true;
    });
    // Usuñ pominiête æwiczenia z obiektu przed zapisem do historii
    // ¿eby nie psu³y getPrevPerf
    const wktForHistory = {
      ...wkt,
      exercises: wkt.exercises.map(ex => ({
        ...ex,
        // sets pozostaj¹ puste dla pominiêtych — getPrevPerf i tak szuka sets.length>0
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
  // Poka¿ nazwê nastêpnego æwiczenia
  const nextEl = document.getElementById('restNextEx');
  if(nextEl) nextEl.textContent = nextExName ? 'Nastêpne: '+nextExName : '';
  clearInterval(restInterval);
  updateRestUI();
  acquireWakeLock();
  // Powiadomienie systemu (tytu³ strony) — widoczne na ekranie blokady w niektórych przegl¹darkach
  restInterval=setInterval(()=>{
    restRemaining--;
    if(restRemaining<=0){skipRest();return;}
    updateRestUI();
    const m=Math.floor(restRemaining/60), s=String(restRemaining%60).padStart(2,'0');
    document.title = `? ${m}:${s} — ForgePro`;
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

function renderHome(){
  calcStreak();
  document.getElementById('streakBadge').textContent = state.streak>0?`?? ${state.streak} dni`:'Start!';

  // Week
  const days=['Pn','Wt','Œr','Cz','Pt','Sb','Nd'];
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
        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;margin-bottom:4px;">${esc(last.name)}</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:14px;">${last.exercises.length} æwiczeñ · ${dur} min · ${vol} kg obj.</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          ${last.exercises.slice(0,3).map(e=>{
            const topSet=e.sets.reduce((a,b)=>b.kg>a.kg?b:a,{kg:0,reps:0});
            return topSet.kg?`<div><div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;">${topSet.kg}<span style="font-size:12px;color:var(--muted);">kg</span></div><div style="font-size:10px;color:var(--muted);">${shortLabel(e.name,2)}</div></div>`:''}).join('')}
        </div>
        <div class="ai-block" style="margin-top:12px;">
          <div class="ai-label"><span class="ai-dot"></span>Pro Coach</div>
          <p id="homeAiTxt" style="font-size:13px;line-height:1.5;">Analizujê Twój trening…</p>
        </div>
      </div>`;
    loadHomeAI(last);
  } else {
    document.getElementById('lastWorkoutCard').innerHTML=`
      <div class="card" style="text-align:center;padding:28px 20px;">
        <div style="font-size:32px;margin-bottom:10px;">??</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:6px;">Zacznij pierwszy trening!</div>
        <div style="font-size:13px;color:var(--muted);line-height:1.6;">Naciœnij "Nowy trening", wybierz æwiczenia i zacznij œledziæ swój progres z Pro Coachem.</div>
      </div>`;
  }

  // Stats - PRs
  renderHomeStats();
  // Show imported plans
  renderImportedPlans();
}

async function loadHomeAI(last){
  const summary = last.exercises.map(e=>`${cleanText(e.name)}: ${e.sets.map(s=>`${s.kg}kg?${s.reps}`).join(', ')}`).join('; ');
  try{
    const r=await callAI(`Trening: ${cleanText(last.name)}. ${summary}. Daj kr?tk? analiz? i 1 konkretny tip na nast?pny trening. Max 50 s??w. Po polsku.`, 
      'Jesteœ Pro Coachem si³owni. Zwiêz³y, konkretny, motywuj¹cy. Po polsku.');
    const el=document.getElementById('homeAiTxt');
    if(el) el.textContent=r;
  }catch(e){
    const el=document.getElementById('homeAiTxt');
    if(el) el.textContent='Zaloguj kilka treningów aby AI mog³o Ciê przeanalizowaæ.';
  }
}

function renderHomeStats(){
  const keyEx = ['Wyciskanie sztangi','Squat','Martwy ci¹g'];
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
    list.innerHTML='<div class="empty"><div class="eico">??</div><p>Brak treningów w historii.<br>Zacznij swój pierwszy trening!</p></div>';
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
        <span>${w.exercises.length} <strong>æwiczeñ</strong></span>
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
    <button class="btn btn-danger" onclick="deleteWorkout(${id})" style="margin-top:8px;">Usuñ trening</button>
  `;
  openPanel('histPanel');
}

function deleteWorkout(id){
  if(!confirm('Usun¹æ ten trening?')) return;
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
    document.getElementById('chartBars').innerHTML='<div style="color:var(--muted);font-size:13px;">Brak danych — zaloguj trening z tym æwiczeniem.</div>';
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
    <span style="color:${diff>0?'var(--green)':'var(--muted)'}">+${diff}kg ³¹cznie</span>
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
      <span style="font-size:14px;">?? ${n}</span>
      <span style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;">${kg}<span style="font-size:13px;color:var(--muted);">kg</span></span>
    </div>
  `).join('');
}

function renderInjuries(){
  const list=document.getElementById('injuryList');
  if(!state.injuries.length){list.innerHTML='<div style="font-size:13px;color:var(--muted);">Brak zg³oszonych kontuzji.</div>';return;}
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
        <button onclick="toggleInjury(${i})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px;">?</button>
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
  if(totalWkts<2){document.getElementById('progAiTxt').textContent='Zaloguj co najmniej 2 treningi aby AI mog³o przeanalizowaæ Twój progres.';return;}
  const prs=[];
  const exSet=new Set();
  state.workouts.forEach(w=>w.exercises.forEach(e=>exSet.add(e.name)));
  exSet.forEach(name=>{
    let max=0;
    state.workouts.forEach(w=>w.exercises.filter(e=>e.name===name).forEach(e=>e.sets.forEach(s=>{if(s.kg>max)max=s.kg;})));
    if(max) prs.push(`${name}: ${max}kg`);
  });
  const injuries=state.injuries.filter(i=>i.active).map(i=>i.name).join(', ');
  try{
    const r=await callAI(
      `£¹cznie ${totalWkts} treningów. Rekordy: ${prs.join(', ')}. ${injuries?'Kontuzje: '+injuries+'.':''} Przeanalizuj progres i daj 2-3 konkretne wskazówki. Max 80 s³ów. Po polsku.`,
      'Jesteœ Pro Coachem si³owni. Analityczny, konkretny, po polsku.');
    const el=document.getElementById('progAiTxt');
    if(el) el.textContent=r;
  }catch(e){}
}

// ===================== AI CHAT =====================
let aiMode='coach';
// Historia konwersacji per tryb — AI pamiêta w¹tek
let chatHistory = {coach:[], injury:[], nutrition:[], plan:[]};
// Limit wiadomoœci w historii (¿eby nie przekroczyæ kontekstu)
const CHAT_HISTORY_LIMIT = 10; // max par user/assistant w historii

function buildSystemContext(basePrompt){
  // Buduje system prompt wzbogacony o dane u¿ytkownika z aplikacji
  const totalWkts = state.workouts.filter(w=>w.done).length;
  const activeInjuries = state.injuries.filter(i=>i.active).map(i=>`${i.name}${i.desc?' ('+i.desc+')':''}`);

  // Importowane plany
  const plans = (state.importedPlans||[]);
  let planInfo = '';
  if(plans.length){
    planInfo = plans.map(p=>{
      const days = p.days.map(d=>`${d.dayName}: ${d.exercises.map(e=>`${cleanText(e.name)} ${e.sets||''}?${e.reps||''}`).join(', ')}`).join(' | ');
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
  if(totalWkts>0) context += `\n\nDANE U¯YTKOWNIKA:\n- £¹cznie treningów: ${totalWkts}`;
  if(prs.length) context += `\n- Rekordy: ${prs.join(', ')}`;
  if(activeInjuries.length) context += `\n- Aktywne kontuzje: ${activeInjuries.join(', ')}`;
  if(planInfo) context += `\n- Plan treningowy:\n${planInfo}`;

  return context;
}

const modeConfig={
  coach:{hint:'Twój Pro Coach analizuje progres i odpowiada na pytania o trening.',
    sys:'Jesteœ Pro Coachem si³owni w aplikacji ForgePro. Odpowiadasz po polsku, konkretnie, jak doœwiadczony trener. Max 120 s³ów.',
    chips:['Jak przebiæ plateau?','Kiedy deload?','Ile serii tygodniowo?','Ocen mój progres']},
  injury:{hint:'Opisz kontuzjê — AI doradzi æwiczenia rehab i modyfikacje treningu.',
    sys:'Jesteœ fizjoterapeut¹ sportowym w aplikacji ForgePro. Odpowiadasz po polsku profesjonalnie. Sugerujesz æwiczenia rehab, ostrzegasz kiedy iœæ do lekarza. Max 150 s³ów.',
    chips:['Ból barku przy OHP','Ból kolana przy przysiadach','Jak trenowaæ z kontuzj¹?','Kiedy wróæ do pe³nego treningu?']},
  nutrition:{hint:'Pytania o dietê, kalorie, bia³ko i suplementy.',
    sys:'Jesteœ dietetykiem sportowym. Odpowiadasz po polsku, praktycznie. Max 120 s³ów.',
    chips:['Ile bia³ka dziennie?','Jaka dieta na masê?','Suplementy dla si³owni','Od¿ywka po treningu']},
  plan:{hint:'AI u³o¿y lub oceni Twój plan treningowy.',
    sys:'Jesteœ programist¹ treningowym. Odpowiadasz po polsku, profesjonalnie. Max 150 s³ów.',
    chips:['Ocen plan PPL','Ile dni na si³owniê?','Push Pull Legs czy FBW?','Plan na si³ê czy masê?']},
};

function initAI(){
  setMode(document.querySelector('.ttab.on')||document.querySelector('.ttab'), 'coach');
  if(document.getElementById('chatWrap').children.length===0){
    addMsg('ai','Hej! Jestem Twoim Pro Coachem. Jak mogê Ci pomóc? ??');
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
    // Dodaj odpowiedŸ do historii
    chatHistory[aiMode].push({role:'assistant', content:r});
    // Ogranicz historiê
    if(chatHistory[aiMode].length > CHAT_HISTORY_LIMIT*2){
      chatHistory[aiMode] = chatHistory[aiMode].slice(-CHAT_HISTORY_LIMIT*2);
    }
  }catch(e){
    thinking.textContent='B³¹d po³¹czenia. SprawdŸ internet.';
    // Usuñ nieudane zapytanie z historii
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
      ]
    })
  });
  if(!r.ok) throw new Error('B³¹d serwera: ' + r.status);
  const d = await r.json();
  if(d.error) throw new Error(typeof d.error === 'string' ? d.error : (d.error.message || 'B³¹d AI'));
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
          <div style="font-size:36px;flex-shrink:0;">??</div>
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
          <div style="font-size:36px;flex-shrink:0;">??</div>
          <div>
            <div style="font-weight:700;font-size:15px;margin-bottom:3px;">PDF</div>
            <div style="font-size:12px;color:var(--muted);line-height:1.5;">Plan treningowy w PDF<br><span style="color:var(--dim);">AI odczyta i wgra automatycznie</span></div>
          </div>
          <div style="margin-left:auto;color:var(--orange);font-size:20px;">›</div>
        </div>
      </div>

      <div style="margin-top:14px;padding:12px 14px;background:var(--orange-dim);border:1px solid var(--orange-mid);border-radius:10px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:.08em;color:var(--orange);text-transform:uppercase;margin-bottom:5px;">? Jak to dzia³a?</div>
        <div style="font-size:12px;color:var(--text);line-height:1.6;">AI automatycznie odczyta plan — wykryje dni, æwiczenia, serie i powtórzenia niezale¿nie od formatu.</div>
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

// ===== PDF PROCESSING =====
async function processPdfFile(file){
  updateImportStep(2);
  document.getElementById('importContent').innerHTML = `
    <div class="ai-parsing">
      <div class="ai-spinner"></div>
      <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;">Czytam PDF…</div>
      <div style="font-size:13px;color:var(--muted);">Wyci¹gam tekst z dokumentu</div>
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

      // Sort lines top›bottom, items left›right
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
        <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;">Analizujê plan…</div>
        <div style="font-size:13px;color:var(--muted);">Rozpoznajê strukturê treningu</div>
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
        showImportError('Nie uda³o siê przetworzyæ pliku.<br><br><small style="color:var(--dim);">SprawdŸ czy klucz AI jest ustawiony w Railway › Variables › GROQ_API_KEY</small>');
        return;
      }
    }

    if(!plan || !plan.days || !plan.days.length){
      showImportError('Nie znaleziono planu treningowego w PDF.<br><br><small>Upewnij siê ¿e plik zawiera æwiczenia z seriami i powtórzeniami.</small>');
      return;
    }

    parsedPlan = plan;
    showImportPreview(plan);

  } catch(err) {
    showImportError('B³¹d odczytu PDF: ' + err.message);
  }
}

// ===== DIRECT PDF TEXT PARSER =====
function directParsePdfText(lines, fullText){
  try {
    // Day header patterns
    const DAY_PATTERNS = [
      /^(GÓRA|DO£|DÓ£|PUSH|PULL|ARMS|LEGS|FULL BODY|FBW|KLATKA|PLECY|NOGI|BARKI)\s*(PONIEDZIA£EK|WTOREK|ŒRODA|CZWARTEK|PI¥TEK|SOBOTA|NIEDZIELA)?/i,
      /^(PONIEDZIA£EK|WTOREK|ŒRODA|CZWARTEK|PI¥TEK|SOBOTA|NIEDZIELA)/i,
      /^(TRENING|DZIEÑ|DAY)\s*[ABCDE1234]/i,
      /^(FULL BODY WORKOUT|FBW WORKOUT)/i,
    ];

    // Stop keywords - these lines end the plan
    const STOP = ['ROZGRZEWKA','SERIE WSTÊPNE','METODA PROGRESJI','PONI¯EJ ZNAJDZIESZ','DZIÊKUJÊ','WIEM, JEDNAK','OPTYMALNEGO'];

    // Skip keywords - column headers, legal notes, etc.
    const SKIP = ['LP ','NAZWA ÆWICZENIA','ILOŒÆ SERII','TEMPO','PRZERWA','CIÊ¯AR','STRATEGIE ZASTOSOWANE','OPIS METODY','KLIKNIJ W'];

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
  // e.g. "3A Rozpiêtki 3 10-12 2/0/X/0 20s"
  const lpMatch = line.match(/^(\d+[A-B]?)\s+(.+)/i);
  if(!lpMatch) return null;

  const lp = lpMatch[1];
  const rest = lpMatch[2].trim();
  const isSuper = /[AB]$/i.test(lp);

  // Extract sets (single digit 2-6) and reps from the end of the name
  // Reps patterns: "6-8", "8-10", "10-12", "12", "12-15 (na stronê)", "do upadku 8-10 do upadku"
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
  const NON_EX = ['ROZGRZEWKA','PORADNIK','TEMPO TO','METODA','STRATEGIE','UZUPE£NIANIE','PRZYK£AD'];
  if(NON_EX.some(n => name.toUpperCase().includes(n))) return null;
  if(name.length > 100) return null;

  return {
    name,
    sets: isNaN(sets) ? 3 : sets,
    reps: reps || '8-12',
    rest: restTime,
    tempo,
    notes: isSuper ? '?? Superseria' : ''
  };
}


function processExcelFile(file){
  updateImportStep(2);
  document.getElementById('importContent').innerHTML = `
    <div class="ai-parsing">
      <div class="ai-spinner"></div>
      <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;">Czytam plik…</div>
      <div style="font-size:13px;color:var(--muted);">Wczytujê Excel i analizujê strukturê</div>
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
          <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;">Analizujê plan…</div>
          <div style="font-size:13px;color:var(--muted);">Czytam strukturê planu treningowego</div>
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
          showImportError(`Nie uda³o siê odczytaæ planu.<br><br>
            <small style="color:var(--dim);">Upewnij siê ¿e plik zawiera plan treningowy z kolumnami: æwiczenie, serie, powtórzenia.</small>`);
          return;
        }
      }

      if(!plan || !plan.days || plan.days.length === 0){
        showImportError('Nie znaleziono dni treningowych w pliku.<br><br><small style="color:var(--dim);">Spróbuj z plikiem który ma wyraŸny podzia³ na dni (np. "Dzieñ A", "Push", "Poniedzia³ek").</small>');
        return;
      }

      parsedPlan = plan;
      showImportPreview(plan);

    } catch(err) {
      showImportError('B³¹d odczytu pliku: ' + err.message);
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
        <div style="font-size:10px;font-weight:800;letter-spacing:.1em;color:var(--green);text-transform:uppercase;margin-bottom:4px;">? Plan rozpoznany</div>
        <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;">${esc(plan.planName)}</div>
        <div style="font-size:13px;color:var(--muted);margin-top:4px;">${plan.days.length} dni treningowych · ${totalEx} æwiczeñ</div>
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
        <button class="btn btn-ghost" onclick="showImportUpload();updateImportStep(1);" style="flex:1;">‹ Inny plik</button>
        <button class="btn btn-primary" onclick="importPlanToApp()" style="flex:2;">Importuj plan ›</button>
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
      <div style="font-size:47px;margin:24px 0 12px;">??</div>
      <div style="font-family:'Syne',sans-serif;font-size:26px;font-weight:800;margin-bottom:8px;">Plan zaimportowany!</div>
      <div style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:24px;">
        <strong style="color:var(--text);">${parsedPlan.planName}</strong><br>
        ${parsedPlan.days.length} dni · ${totalEx} æwiczeñ<br>
        gotowe do trenowania
      </div>

      <div style="background:var(--orange-dim);border:1px solid var(--orange-mid);border-radius:12px;padding:14px;text-align:left;margin-bottom:20px;">
        <div style="font-size:10px;font-weight:800;letter-spacing:.1em;color:var(--orange);text-transform:uppercase;margin-bottom:6px;">Jak u¿ywaæ?</div>
        <div style="font-size:13px;line-height:1.7;color:var(--text);">
          Naciœnij <strong>+ Nowy trening</strong> › wybierz dzieñ z planu trenera › zacznij æwiczyæ. Plan bêdzie dostêpny jako gotowy szablon.
        </div>
      </div>

      <button class="btn btn-primary" onclick="closePanel('importPanel');renderHome();">Wróæ do g³ównej ›</button>
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
        <div style="font-size:28px;margin-bottom:8px;">??</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:6px;">Nie uda³o siê odczytaæ planu</div>
        <div style="font-size:13px;color:var(--muted);line-height:1.6;">${msg}</div>
      </div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:14px;">
        <div style="font-size:10px;font-weight:800;letter-spacing:.1em;color:var(--muted);text-transform:uppercase;margin-bottom:8px;">? Formaty które dzia³aj¹</div>
        <div style="font-size:12px;color:var(--text);line-height:1.8;">
          • Kolumny: <strong>Æwiczenie | Serie | Powtórzenia</strong><br>
          • Format: <strong>Wyciskanie sztangi | 4 | 8-10</strong><br>
          • Lub: <strong>Bench press 3x10</strong><br>
          • Podzia³ na dni: <strong>Push Day, Dzieñ A, Poniedzia³ek</strong>
        </div>
      </div>
      <button class="btn btn-ghost" onclick="showImportUpload()">‹ Spróbuj z innym plikiem</button>
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
      <div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">?? Plany od trenera</div>
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
                <div style="font-size:10px;color:var(--muted);margin-top:2px;white-space:nowrap;">${day.exercises.length} æwiczeñ</div>
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
  // WA¯NE: zachowaj oryginaln¹ nazwê z planu — dopasuj do DB tylko dla uzyskania kategorii/miêœnia
  const exercises = day.exercises.map(ex=>{
    const found = EXERCISES_DB.find(e=>
      e.name.toLowerCase().includes(ex.name.toLowerCase().split(' ')[0]) ||
      ex.name.toLowerCase().includes(e.name.toLowerCase().split(' ')[0])
    );
    // Zawsze u¿ywaj oryginalnej nazwy z planu, nie z DB
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
const AI_PARSE_PROMPT = `Jesteœ parserem planów treningowych. Otrzymujesz tekst z pliku (Excel CSV lub PDF) od polskiego trenera personalnego.
Odpowiedz TYLKO czystym JSON bez markdown, backticks ani ¿adnego dodatkowego tekstu:
{"planName":"nazwa planu","days":[{"dayName":"nazwa dnia","exercises":[{"name":"æwiczenie","sets":3,"reps":"8-10","rest":"120s","notes":""}]}]}
Zasady:
- Szukaj dni treningowych: PUSH/PULL/FBW/ARMS/LEGS/PONIEDZIA£EK/WTOREK/ŒRODA/CZWARTEK/PI¥TEK/SOBOTA/NIEDZIELA/DZIEÑ A/B/C/D
- Ignoruj opisy, poradniki, wstêpy, informacje o diecie, regeneracji
- sets = liczba ca³kowita (np. 3, 4). Format "2S6-8P" = 2 serie + 1 back off = sets:3
- reps = zakres lub liczba (np. "8-10", "12", "10 na rêkê")
- Daty w formacie d-m to zakresy powtórzeñ (np. "8-6" = "6-8 powt.")
- Æwiczenia z A/B przy numerze (5A, 5B) to superserie — dodaj notes: "Superseria"
- Jeœli brak podzia³u na dni — stwórz jeden dzieñ "Trening A"
- KRYTYCZNE: Przepisuj nazwy æwiczeñ DOK£ADNIE jak w oryginale, bez ¿adnych zmian ani t³umaczeñ`;

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

    const DAY_KEYWORDS = ['PONIEDZIA£EK','WTOREK','ŒRODA','CZWARTEK','PI¥TEK','SOBOTA','NIEDZIELA',
      'FULL BODY','FBW','PUSH','PULL','ARMS','LEGS','KLATKA','PLECY','NOGI','DZIEÑ','DZIEN','DAY','TRENING A','TRENING B','TRENING C','TRENING D'];
    const SKIP_KEYWORDS = ['LP','NAZWA','ILOŒÆ','TEMPO','PRZERWA','CIÊ¯AR','RIR','OPIS','KLIKNIJ','DELOAD','METODA'];
    // Sections that signal end of exercise list — skip everything after
    const STOP_SECTION_KEYWORDS = ['ROZGRZEWKA','PORADNIK','PROGRESJA','METODA PROGRESJI','OPIS METODY','PONI¯EJ','PRZED ROZPOCZÊCIEM','ABY PLAN','REGENERACJA','DIETA'];
    // Sentences = clearly descriptive text, not exercise names
    const SENTENCE_WORDS = ['POWINIENEŒ','POWINNA','POZWOLI','MO¯ESZ','NALE¯Y','NALE¯Y','ZACZNIJ','WYKONAJ','PAMIÊTAJ','JEŒLI','NATOMIAST','PRZYK£AD','CZYLI','ORAZ','JEDNAK','RÓWNIE¯','TWOJE','TWÓJ','MUSISZ'];
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
      const nameIdx = strs.findIndex(s => s.includes('NAZWA') || s.includes('ÆWICZENIE') || s.includes('CWICZENIE') || s === 'EXERCISE');
      if(nameIdx >= 0){
        colName = nameIdx;
        firstHeaderRowIdx = i;
        colSets = strs.findIndex(s => s.includes('SERII') || s.includes('SERIE') || s.includes('SETS') || s.includes('ILOŒÆ S'));
        colReps = strs.findIndex(s => s.includes('POWTÓRZ') || s.includes('POWT') || s.includes('REPS') || s.includes('ILOŒÆ P'));
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

      // Parse sets — format "2S6-8P" = 2 serie + back off (back off liczymy jako normaln¹ seriê)
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
      const notes = isSuper ? '?? Superseria' : '';

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
    .replace(/\s*(PONIEDZIA£EK|WTOREK|ŒRODA|CZWARTEK|PI¥TEK|SOBOTA|NIEDZIELA)/i, m => ' ' + m.trim());
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
load();
renderHome();
initAI();
updateActiveWorkoutBanner();

// If workout was in progress (e.g. page refresh), resume
if(state.currentWorkout&&!state.currentWorkout.done){
  startWorkoutTimer();
}

