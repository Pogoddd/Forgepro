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

function getPrevExerciseSetsByName(exName){
  const target = cleanText(exName).toLowerCase();
  if(!target) return [];
  const history = state.workouts.filter(w=>w.done);
  for(let i=history.length-1;i>=0;i--){
    const ex = history[i].exercises.find(e=>cleanText(e.name).toLowerCase()===target);
    if(ex && ex.sets.length>0 && !ex.skipped){
      return ex.sets;
    }
  }
  return [];
}

function getExerciseHistorySets(ex){
  const byId = getPrevExerciseSets(ex.id);
  if(byId.length) return byId;
  return getPrevExerciseSetsByName(ex.name);
}

function getPlannedRepsFallback(ex){
  const plannedReps = cleanText(ex.plannedReps || '');
  const repsMatch = plannedReps.match(/^(\d+)/);
  return repsMatch ? repsMatch[1] : '';
}

function getDraftValues(ex, rowIdx){
  const prevSets = getExerciseHistorySets(ex);
  const prevRow = prevSets[rowIdx] || prevSets[prevSets.length-1];
  const lastLogged = ex.sets[ex.sets.length-1];
  return {
    kg: lastLogged?.kg ?? prevRow?.kg ?? '',
    reps: lastLogged?.reps ?? prevRow?.reps ?? getPlannedRepsFallback(ex)
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

function getLogRowState(ex, rowIdx, prevSets){
  const loggedSet = ex.sets[rowIdx];
  const prevSet = prevSets[rowIdx] || prevSets[prevSets.length-1];
  const draft = getDraftValues(ex, rowIdx);
  const repsFallback = getPlannedRepsFallback(ex);
  return {
    loggedSet,
    prevSet,
    draft,
    repsFallback,
    hasHistory: Boolean(prevSet),
    isLogged: Boolean(loggedSet)
  };
}

function renderLogRow(ex, exIdx, rowIdx, prevSets){
  const row = getLogRowState(ex, rowIdx, prevSets);
  const rowStateClass = row.isLogged
    ? 'is-logged'
    : row.hasHistory
      ? 'has-history'
      : 'is-empty-history';

  return `
    <div class="log-grid-row ${rowStateClass}">
      <div class="log-set-badge">${rowIdx+1}</div>
      <div class="log-prev ${row.hasHistory?'':'empty'}">${row.hasHistory?`${row.prevSet.kg} kg x ${row.prevSet.reps}`:'Brak historii'}</div>
      <input
        id="log-kg-${exIdx}-${rowIdx}"
        class="log-mini-inp"
        type="number"
        step="2.5"
        min="0"
        inputmode="decimal"
        placeholder="kg"
        value="${row.isLogged ? row.loggedSet.kg : row.draft.kg}"
        ${row.isLogged ? 'disabled' : ''}
      >
      <input
        id="log-reps-${exIdx}-${rowIdx}"
        class="log-mini-inp"
        type="number"
        min="1"
        inputmode="numeric"
        placeholder="${row.repsFallback || 'powt.'}"
        value="${row.isLogged ? row.loggedSet.reps : row.draft.reps}"
        ${row.isLogged ? 'disabled' : ''}
      >
      ${row.isLogged
        ? `<button onclick="removeLoggedSet(${exIdx},${rowIdx})" title="Usun serie" class="log-check done">&#10003;</button>`
        : `<button onclick="logInlineSet(${exIdx},${rowIdx})" title="Zapisz serie" class="log-check save">&#10003;</button>`
      }
    </div>`;
}

function renderLogCard(ex, exIdx){
  const prevSets = getExerciseHistorySets(ex);
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
            <div class="log-card-plan">${ex.plannedSets||3} serii &middot; ${esc(ex.plannedReps||'8-12')} powt.${ex.rest?` &middot; ${esc(ex.rest)} przerwy`:''}</div>
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
        ${Array.from({length:totalRows}, (_, rowIdx) => renderLogRow(ex, exIdx, rowIdx, prevSets)).join('')}
        <div class="log-row-actions">
          <button class="log-add-btn" onclick="addInlineSetRow(${exIdx})">Dodaj serie</button>
          ${ex.sets.length ? `<button class="log-copy-btn" onclick="copyLastLoggedSet(${exIdx})">Powtorz</button>` : ''}
        </div>
      </div>
    </div>`;
}

function renderLogTab(){
  const wkt = state.currentWorkout;
  if(!wkt) return;

  const counts = countWorkoutSets();

  document.getElementById('logExerciseCards').innerHTML = wkt.exercises
    .map((ex, exIdx) => renderLogCard(ex, exIdx))
    .join('');
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
          <span style="font-weight:700;font-size:14px;">${s.kg} kg &times; ${s.reps}</span>
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
  const kgRaw = document.getElementById(`log-kg-${exIdx}-${rowIdx}`)?.value;
  const repsRaw = document.getElementById(`log-reps-${exIdx}-${rowIdx}`)?.value;
  const kg = parseFloat(kgRaw);
  const reps = parseInt(repsRaw, 10);
  if(!Number.isFinite(reps) || reps <= 0){
    showNotice('Podaj liczbę powtórzeń dla tej serii.');
    return;
  }
  if(!Number.isFinite(kg) || kg < 0){
    showNotice('Podaj ciężar dla tej serii.');
    return;
  }
  state.currentExIdx = exIdx;
  logExerciseSet(ex, kg, reps);

  const plannedSets = ex.plannedSets || 3;
  const isLastEx = state.currentExIdx >= wkt.exercises.length - 1;
  if(ex.sets.length >= plannedSets && !isLastEx){
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

  const restOv = document.getElementById('restOv');
  restOv.classList.add('on');
  clearInterval(restInterval);

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
    if(el) el.textContent=r;
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
    wkt.exercises.forEach(ex=>{
      if(ex.sets.length === 0) ex.skipped = true;
    });
    const wktForHistory = {
      ...wkt,
      exercises: wkt.exercises.map(ex => ({
        ...ex,
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
  const nextEl = document.getElementById('restNextEx');
  if(nextEl) nextEl.textContent = nextExName ? 'Następne: '+nextExName : '';
  clearInterval(restInterval);
  updateRestUI();
  acquireWakeLock();
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
