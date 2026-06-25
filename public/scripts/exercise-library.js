(function(){
  function text(value){
    return String(value ?? '').trim();
  }

  function normalize(value){
    return text(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, ' and ')
      .replace(/[()]/g, ' ')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const SET_TYPE_KEYS = new Set([
    'normal',
    'warmup',
    'backoff',
    'cluster',
    'drop',
    'restpause',
    'myoreps',
    'failure',
    'negative',
    'partial',
    'pause'
  ]);

  function normalizeSetType(value){
    const raw = normalize(value);
    if(!raw) return 'normal';
    if(['warmup','warm up','rozgrzewka','rozgrzewkowa'].includes(raw)) return 'warmup';
    if(['backoff','back off','back off set','down set'].includes(raw)) return 'backoff';
    if(['cluster','cluster set','klaster'].includes(raw)) return 'cluster';
    if(['drop','dropset','drop set','redukcja','redukcje'].includes(raw)) return 'drop';
    if(['restpause','rest pause','rest pauza'].includes(raw)) return 'restpause';
    if(['myoreps','myo reps','myo rep'].includes(raw)) return 'myoreps';
    if(['failure','do upadku','upadek','to failure'].includes(raw)) return 'failure';
    if(['negative','negatyw','negatywy','negatywna'].includes(raw)) return 'negative';
    if(['partial','partials','powtorzenia czesciowe','czesciowe'].includes(raw)) return 'partial';
    if(['pause','pause reps','pauza','pauzowane'].includes(raw)) return 'pause';
    return SET_TYPE_KEYS.has(raw) ? raw : 'normal';
  }

  function detectSetTypeFromText(value){
    const raw = normalize(value);
    if(!raw) return 'normal';
    if(raw.includes('back off') || raw.includes('backoff')) return 'backoff';
    if(raw.includes('cluster') || raw.includes('klaster')) return 'cluster';
    if(raw.includes('drop set') || raw.includes('dropset') || raw.includes('redukc')) return 'drop';
    if(raw.includes('rest pause')) return 'restpause';
    if(raw.includes('myo')) return 'myoreps';
    if(raw.includes('do upadku') || raw.includes('failure')) return 'failure';
    if(raw.includes('negatyw') || raw.includes('negative')) return 'negative';
    if(raw.includes('czesciow') || raw.includes('partial')) return 'partial';
    if(raw.includes('pauz') || raw.includes('pause')) return 'pause';
    if(raw.includes('rozgrzew')) return 'warmup';
    return 'normal';
  }

  const BASE_CATALOG = [
    {id:'bp', name:'Wyciskanie sztangi', cat:'Klatka', muscle:'Klatka piersiowa', aliases:['bench press','wyciskanie sztangi na lawce', 'wyciskanie sztangi na lawce poziomej','wyciskanie lezac','flat bench','barbell bench press']},
    {id:'incbp', name:'Wyciskanie skos gorny', cat:'Klatka', muscle:'Gorna klatka', aliases:['incline bench press','wyciskanie skos dodatni','wyciskanie sztangi skos dodatni','wyciskanie hantli skos dodatni','incline dumbbell press']},
    {id:'dbp', name:'Wyciskanie hantli', cat:'Klatka', muscle:'Klatka piersiowa', aliases:['dumbbell bench press','db bench press','wyciskanie hantli na lawce','wyciskanie hantli na lawce poziomej']},
    {id:'fly', name:'Rozpietki', cat:'Klatka', muscle:'Klatka piersiowa', aliases:['rozpietki hantlami','machine fly','pec deck','butterfly','cable fly','cable crossover','rozpietki na skosie dodatnim 30 stopni']},
    {id:'dip', name:'Dipy', cat:'Klatka', muscle:'Klatka / Triceps', aliases:['pompki na poreczach','dips','ring dips']},
    {id:'cbp', name:'Wyciskanie na wyciagu', cat:'Klatka', muscle:'Klatka piersiowa', aliases:['cable press','chest press cable','wyciskanie na bramie']},
    {id:'dl', name:'Martwy ciag', cat:'Plecy', muscle:'Plecy / Tylna tasma', aliases:['deadlift','martwy klasyczny','conventional deadlift']},
    {id:'rdl', name:'Rumunski martwy ciag', cat:'Nogi', muscle:'Dwuglowe / Posladki', aliases:['romanian deadlift','rdl','rumunski martwy ciag ze sztanga','martwy rumunski','rumunski martwy ciąg ze sztangą']},
    {id:'row', name:'Wioslowanie sztanga', cat:'Plecy', muscle:'Plecy', aliases:['barbell row','bent over row','wioslowanie sztanga w opadzie']},
    {id:'carow', name:'Wioslowanie na wyciagu', cat:'Plecy', muscle:'Plecy', aliases:['cable row','seated cable row','low row','smith machine chest supported row','chest supported row','seal row']},
    {id:'latpd', name:'Sciaganie drazka', cat:'Plecy', muscle:'Plecy', aliases:['lat pulldown','sciaganie drazka wyciagu gornego','sciaganie drazka wyciagu gornego podchwytem','pull down']},
    {id:'pu', name:'Podciaganie', cat:'Plecy', muscle:'Plecy / Biceps', aliases:['pull up','pullup','chin up','chinup']},
    {id:'sq', name:'Przysiad', cat:'Nogi', muscle:'Czworoglowe / Posladki', aliases:['squat','back squat','przysiad ze sztanga','barbell squat']},
    {id:'fsq', name:'Front squat', cat:'Nogi', muscle:'Czworoglowe', aliases:['front squat','przysiad przedni']},
    {id:'leg', name:'Leg press', cat:'Nogi', muscle:'Nogi', aliases:['suwnica','wypychanie na suwnicy','leg press 45']},
    {id:'lunge', name:'Wykroki', cat:'Nogi', muscle:'Posladki / Czworoglowe', aliases:['lunges','walking lunge','bulgarian split squat','bss','split squat']},
    {id:'legcurl', name:'Uginanie nog', cat:'Nogi', muscle:'Dwuglowe', aliases:['leg curl','lying leg curl','seated leg curl']},
    {id:'legext', name:'Prostowanie nog', cat:'Nogi', muscle:'Czworoglowe', aliases:['leg extension','prostowanie nog na maszynie']},
    {id:'calf', name:'Wspiecia na palce', cat:'Nogi', muscle:'Lydki', aliases:['calf raises','standing calf raise','seated calf raise']},
    {id:'ohp', name:'Wyciskanie nad glowe', cat:'Barki', muscle:'Barki', aliases:['ohp','overhead press','military press','wyciskanie stojac']},
    {id:'dbs', name:'Wyciskanie hantli barki', cat:'Barki', muscle:'Barki', aliases:['dumbbell shoulder press','seated dumbbell press','arnold press']},
    {id:'lrl', name:'Unoszenie bokiem', cat:'Barki', muscle:'Barki boczne', aliases:['lateral raise','lateral raises','odwodzenie boczne']},
    {id:'rrl', name:'Wznosy w opadzie', cat:'Barki', muscle:'Tylny akton', aliases:['rear delt fly','reverse pec deck','rear delt row']},
    {id:'bbc', name:'Uginanie sztangi', cat:'Biceps', muscle:'Biceps', aliases:['barbell curl','ez curl','biceps curl sztanga']},
    {id:'hbc', name:'Uginanie hantli', cat:'Biceps', muscle:'Biceps', aliases:['dumbbell curl','incline dumbbell curl','alternating curl']},
    {id:'hm', name:'Hammer curl', cat:'Biceps', muscle:'Biceps / Ramienny', aliases:['hammer curl','hammercurl']},
    {id:'cbbc', name:'Uginanie na wyciagu', cat:'Biceps', muscle:'Biceps', aliases:['cable curl','bayesian curl','uginanie wyciag']},
    {id:'skullc', name:'Skull crushers', cat:'Triceps', muscle:'Triceps', aliases:['francuskie wyciskanie','lying tricep extension','ez skull crusher']},
    {id:'tpd', name:'Prostowanie na wyciagu', cat:'Triceps', muscle:'Triceps', aliases:['tricep pushdown','rope pushdown','prostowanie wyciag']},
    {id:'tdip', name:'Dipy triceps', cat:'Triceps', muscle:'Triceps', aliases:['bench dips','triceps dips']},
    {id:'ot', name:'Wyciskanie nad glowa triceps', cat:'Triceps', muscle:'Triceps', aliases:['overhead tricep extension','triceps extension overhead']},
    {id:'plank', name:'Plank', cat:'Core', muscle:'Core', aliases:['deska']},
    {id:'ab', name:'Brzuszki', cat:'Core', muscle:'Brzuch', aliases:['crunches','crunch','sit up','situp']},
    {id:'leg_raise', name:'Unoszenie nog', cat:'Core', muscle:'Dolny brzuch', aliases:['leg raise','hanging leg raise','unoszenie nog w zwisie']}
  ];

  const catalog = [];
  const aliasIndex = new Map();

  function addToIndex(entry, alias){
    const key = normalize(alias);
    if(!key) return;
    aliasIndex.set(key, entry);
  }

  function registerExercise(entry){
    const item = {
      ...entry,
      aliases: Array.isArray(entry.aliases) ? [...entry.aliases] : []
    };
    catalog.push(item);
    addToIndex(item, item.name);
    item.aliases.forEach(alias => addToIndex(item, alias));
    return item;
  }

  BASE_CATALOG.forEach(registerExercise);

  function scoreMatch(parts, candidate){
    const candidateParts = normalize(candidate).split(' ').filter(Boolean);
    if(!candidateParts.length) return 0;
    let score = 0;
    parts.forEach(part => {
      if(candidateParts.includes(part)) score += 2;
      else if(candidateParts.some(token => token.startsWith(part) || part.startsWith(token))) score += 1;
    });
    return score;
  }

  function resolveExerciseMeta(value){
    if(!value || typeof value !== 'string') return null;
    const normalized = normalize(value);
    if(!normalized) return null;
    if(aliasIndex.has(normalized)) return aliasIndex.get(normalized);

    const parts = normalized.split(' ').filter(Boolean);
    let best = null;
    let bestScore = 0;
    catalog.forEach(entry => {
      const localScore = Math.max(
        scoreMatch(parts, entry.name),
        ...entry.aliases.map(alias => scoreMatch(parts, alias))
      );
      if(localScore > bestScore){
        best = entry;
        bestScore = localScore;
      }
    });
    return bestScore >= 3 ? best : null;
  }

  function getExerciseKey(value){
    const rawName = typeof value === 'string' ? value : value?.name || value?.displayName || value?.canonicalName || '';
    const found = resolveExerciseMeta(rawName);
    if(found) return found.id;
    if(value && typeof value === 'object' && value.exerciseKey) return value.exerciseKey;
    const fallback = normalize(rawName);
    return fallback ? `custom:${fallback}` : 'custom:unknown';
  }

  function getExerciseLabel(value){
    if(value && typeof value === 'object'){
      return text(value.canonicalName || value.name || value.displayName || 'Cwiczenie');
    }
    const found = resolveExerciseMeta(value);
    return found ? found.name : text(value || 'Cwiczenie');
  }

  function sanitizeSet(set){
    const kg = Number(set?.kg);
    const reps = Number(set?.reps);
    const rpe = set?.rpe === '' || set?.rpe === null || set?.rpe === undefined ? null : Number(set?.rpe);
    return {
      kg: Number.isFinite(kg) && kg >= 0 ? kg : 0,
      reps: Number.isFinite(reps) && reps > 0 ? reps : 0,
      type: normalizeSetType(set?.type),
      repsPattern: text(set?.repsPattern || ''),
      ...(Number.isFinite(rpe) && rpe > 0 ? {rpe} : {}),
      ...(set?.time ? {time: set.time} : {})
    };
  }

  function detectSetPlan(exercise){
    if(Array.isArray(exercise?.setPlan) && exercise.setPlan.length){
      return exercise.setPlan.map((set, idx) => ({
        idx,
        type: normalizeSetType(set?.type),
        reps: text(set?.reps || exercise?.plannedReps || '8-12')
      }));
    }

    const plannedSets = Number.isFinite(Number(exercise?.plannedSets))
      ? Number(exercise.plannedSets)
      : (Number.isFinite(Number(exercise?.sets)) ? Number(exercise.sets) : 3);
    const reps = text(exercise?.plannedReps || exercise?.reps || '8-12');
    const notes = text(exercise?.notes || '').toLowerCase();
    const repsText = reps.toLowerCase();
    const detectedType = detectSetTypeFromText(`${notes} ${repsText}`);
    const plan = [];
    for(let i = 0; i < Math.max(1, plannedSets); i++){
      const isLastIntensitySet = detectedType !== 'normal' && detectedType !== 'warmup' && i === Math.max(1, plannedSets) - 1;
      plan.push({
        idx: i,
        type: isLastIntensitySet ? detectedType : 'normal',
        reps
      });
    }
    return plan;
  }

  function enrichExercise(exercise, options={}){
    const rawName = text(exercise?.name);
    const meta = resolveExerciseMeta(rawName);
    const customKey = rawName ? `custom:${normalize(rawName)}` : `custom:${Date.now()}`;
    const exerciseKey = meta ? meta.id : (exercise?.exerciseKey || customKey);
    const canonicalName = meta ? meta.name : (exercise?.canonicalName || rawName || 'Wlasne cwiczenie');
    const displayName = options.preserveName && rawName ? rawName : (rawName || canonicalName);
    const plannedSetsValue = Number.isFinite(Number(exercise?.plannedSets))
      ? Number(exercise.plannedSets)
      : (Number.isFinite(Number(exercise?.sets)) ? Number(exercise.sets) : exercise?.plannedSets);
    return {
      ...exercise,
      id: exercise?.id || exerciseKey,
      exerciseKey,
      canonicalName,
      name: displayName,
      cat: meta?.cat || exercise?.cat || 'Custom',
      muscle: meta?.muscle || exercise?.muscle || 'Wlasne',
      sets: Array.isArray(exercise?.sets) ? exercise.sets.map(sanitizeSet).filter(set => set.reps > 0) : [],
      plannedSets: plannedSetsValue,
      plannedReps: text(exercise?.plannedReps || exercise?.reps || ''),
      setPlan: detectSetPlan({
        ...exercise,
        plannedSets: plannedSetsValue,
        plannedReps: text(exercise?.plannedReps || exercise?.reps || '')
      }),
      notes: text(exercise?.notes || ''),
      rest: text(exercise?.rest || '')
    };
  }

  function normalizeWorkout(workout){
    if(!workout || typeof workout !== 'object') return null;
    return {
      ...workout,
      exercises: Array.isArray(workout.exercises) ? workout.exercises.map(ex => enrichExercise(ex, {preserveName:true})) : []
    };
  }

  function normalizeImportedPlan(plan){
    if(!plan || typeof plan !== 'object') return null;
    return {
      ...plan,
      days: Array.isArray(plan.days) ? plan.days.map(day => ({
        ...day,
        dayName: text(day?.dayName || 'Trening'),
        exercises: Array.isArray(day?.exercises) ? day.exercises.map(ex => enrichExercise(ex, {preserveName:true})) : []
      })) : []
    };
  }

  function normalizeAppData(appState){
    if(!appState || typeof appState !== 'object') return appState;
    return {
      ...appState,
      workouts: Array.isArray(appState.workouts) ? appState.workouts.map(normalizeWorkout).filter(Boolean) : [],
      currentWorkout: normalizeWorkout(appState.currentWorkout),
      savedTemplates: Array.isArray(appState.savedTemplates) ? appState.savedTemplates.map(template => ({
        ...template,
        exercises: Array.isArray(template.exercises) ? template.exercises.map(ex => enrichExercise(ex, {preserveName:false})) : []
      })) : [],
      importedPlans: Array.isArray(appState.importedPlans) ? appState.importedPlans.map(normalizeImportedPlan).filter(Boolean) : []
    };
  }

  function registerCustomExercise(name){
    const cleanName = text(name);
    if(!cleanName) return null;
    const existing = resolveExerciseMeta(cleanName);
    if(existing) return existing;
    const entry = {
      id: `custom:${normalize(cleanName)}`,
      name: cleanName,
      cat: 'Custom',
      muscle: 'Wlasne',
      aliases: []
    };
    return registerExercise(entry);
  }

  window.ExerciseLibrary = {
    normalize,
    resolveExerciseMeta,
    getExerciseKey,
    getExerciseLabel,
    getCatalog: () => catalog,
    normalizeSetType,
    detectSetTypeFromText,
    enrichExercise,
    normalizeWorkout,
    normalizeImportedPlan,
    normalizeAppData,
    registerCustomExercise
  };
})();
