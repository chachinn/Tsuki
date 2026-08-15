/* ============================================================
   TSUKI 🌙 — VERSION 1.0 PRE-RELEASE
   SMART REMINDERS 2.0
   Local-first, quiet, safety-aware reminder planning.
   ============================================================ */
(() => {
  "use strict";

  const SETTINGS_KEY = "tsuki-smart-reminders-v2";
  const LEVELS = new Set(["minimal", "helpful", "proactive"]);
  const q = (s, r=document) => r.querySelector(s);
  const todayKeyLocal = () => typeof todayKey === "function" ? todayKey() : new Date().toISOString().slice(0,10);
  const safeArray = x => Array.isArray(x) ? x : [];
  const esc = x => typeof escapeHTML === "function" ? escapeHTML(x) : String(x ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function loadSettings() {
    const fallback={level:"helpful",notifications:false,lastNotified:{}};
    try {
      const saved=JSON.parse(localStorage.getItem(SETTINGS_KEY)||"null")||{};
      const level=LEVELS.has(saved.level)?saved.level:"helpful";
      return {...fallback,...saved,level,lastNotified:saved.lastNotified&&typeof saved.lastNotified==="object"?saved.lastNotified:{}};
    } catch(_) { return fallback; }
  }
  function saveSettings(next) { try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(next));}catch(_){} }
  function dateOnly(value) {
    if(!value) return null;
    const d=new Date(/T/.test(value)?value:`${value}T12:00:00`);
    return Number.isNaN(d.getTime())?null:d;
  }
  function daysUntil(value) {
    const d=dateOnly(value); if(!d) return null;
    const now=dateOnly(todayKeyLocal()); return Math.round((d-now)/86400000);
  }
  function routineChecked(id) {
    return safeArray(data?.womensCare?.routineChecks).some(x=>x?.routineId===id&&x?.date===todayKeyLocal()&&x?.status==="done");
  }
  function routineDue(r) {
    if(!r||r.active===false) return false;
    const scope=r.scope||"both"; const mode=data?.mode||"cycle";
    if(!["both",mode].includes(scope)) return false;
    const days=safeArray(r.days); if(days.length&& !days.includes(new Date().getDay())) return false;
    return !routineChecked(r.id);
  }
  function urgentSafety() {
    if(data?.mode==="pregnancy") {
      try {
        const direct=window.TsukiCareHealthIntelligence?.safety?.();
        if(direct?.level==="urgent") return {urgent:true,title:"Safety comes first",text:"A pregnancy warning sign was recorded. Follow Tsuki's urgent-care guidance and contact your maternity care team or seek urgent medical care as directed."};
      } catch(_) {}
      try {
        const first=window.TsukiMaternalIntelligence?.test?.pregnancyCareForecast?.()?.[0];
        if(first?.level==="urgent") return {urgent:true,title:first.title,text:first.text};
      } catch(_) {}
    }
    if(data?.mode==="postpartum") {
      try {
        const api=window.TsukiPostpartumFeedingIntelligence;
        const maternal=api?.maternalSafety?.();
        const baby=api?.babySafety?.();
        if(maternal?.level==="urgent") return {urgent:true,title:"Safety comes first",text:"An urgent postpartum warning sign was recorded. Seek medical care now rather than waiting for Tsuki to monitor the pattern."};
        if(baby?.level==="urgent") return {urgent:true,title:"Safety comes first",text:"A baby danger sign was recorded. Contact the baby's healthcare professional or seek urgent care as directed."};
      } catch(_) {}
      try {
        const first=window.TsukiMaternalIntelligence?.test?.postpartumLoadForecast?.()?.[0];
        if(first?.level==="urgent") return {urgent:true,title:first.title,text:first.text};
      } catch(_) {}
    }
    return {urgent:false};
  }
  function addUnique(list,item) { if(item?.id&&!list.some(x=>x.id===item.id)) list.push(item); }
  function manualPregnancyItems(list) {
    if(data?.mode!=="pregnancy") return;
    safeArray(data?.pregnancy?.reminders).forEach(r=>{
      if(r?.done) return; const n=daysUntil(r.date); if(n==null||n<0||n>2)return;
      addUnique(list,{id:`preg-manual:${r.id||r.date}:${r.date}`,icon:"🔔",title:n===0?"Pregnancy reminder today":n===1?"Pregnancy reminder tomorrow":"Pregnancy reminder soon",text:r.text||"A reminder you saved is coming up.",source:"manual-pregnancy",priority:1});
    });
  }
  function appointmentItems(list, horizon=1) {
    const sources=[];
    safeArray(data?.womensCare?.appointments).forEach(x=>sources.push({...x,_source:"Care Hub"}));
    if(data?.mode==="pregnancy") safeArray(data?.pregnancy?.appointments).forEach(x=>sources.push({...x,_source:"Pregnancy"}));
    if(data?.mode==="postpartum") safeArray(data?.postpartum?.appointments).forEach(x=>sources.push({...x,_source:"Postpartum"}));
    sources.forEach(x=>{
      if(x?.completed) return; const n=daysUntil(x.date); if(n==null||n<0||n>horizon)return;
      const name=x.type||x.title||x.name||"Appointment";
      addUnique(list,{id:`appt:${x.id||name}:${x.date}`,icon:"🩺",title:n===0?`${name} today`:`${name} tomorrow`,text:x.provider?`${x.provider} · ${x.date}`:`Saved for ${x.date}.`,source:"appointment",priority:1});
    });
  }
  function routineItems(list) {
    safeArray(data?.womensCare?.routines).filter(routineDue).slice(0,3).forEach(r=>addUnique(list,{id:`routine:${r.id}:${todayKeyLocal()}`,icon:"💊",title:`${r.name||r.title||"Care routine"} is still open`,text:"This follows the routine you entered; Tsuki is not changing medication or supplement instructions.",source:"routine",priority:2}));
  }
  function testItems(list,horizon=2) {
    if(data?.mode!=="pregnancy") return;
    safeArray(data?.pregnancy?.tests).forEach(t=>{
      if(["Completed","Done"].includes(t?.status))return; const n=daysUntil(t.date); if(n==null||n<0||n>horizon)return;
      addUnique(list,{id:`test:${t.id||t.name}:${t.date}`,icon:"🧪",title:`${t.name||"Test / scan"} ${n===0?"today":n===1?"tomorrow":"soon"}`,text:"Follow the preparation instructions from your maternity provider.",source:"test",priority:2});
    });
  }
  function periodPrepItem(list) {
    if(data?.mode!=="cycle") return;
    try {
      const confidence=typeof predictionConfidence==="function"?predictionConfidence():null;
      if(!confidence||confidence.level==="Low")return;
      const next=typeof nextEstimatedPeriodDate==="function"?nextEstimatedPeriodDate():null;
      const n=next?daysUntil(typeof dateKey==="function"?dateKey(next):next):null;
      if(n==null||n<0||n>2)return;
      addUnique(list,{id:`period-prep:${todayKeyLocal()}`,icon:"🌸",title:"Your estimated period window is approaching",text:"This is an estimate from your cycle history, not a guarantee. You may want your usual period supplies nearby.",source:"period-estimate",priority:3});
    } catch(_) {}
  }
  function proactiveMaternalItems(list) {
    try {
      const items=data?.mode==="pregnancy"?window.TsukiMaternalIntelligence?.test?.pregnancyCareForecast?.():data?.mode==="postpartum"?window.TsukiMaternalIntelligence?.test?.postpartumLoadForecast?.():[];
      safeArray(items).filter(x=>x.level!=="urgent").slice(0,2).forEach((x,i)=>addUnique(list,{id:`maternal:${data.mode}:${todayKeyLocal()}:${i}:${x.title}`,icon:x.icon||"🌙",title:x.title,text:x.text,source:"maternal-intelligence",priority:3}));
    } catch(_) {}
  }
  function buildPlan(level=loadSettings().level) {
    const safety=urgentSafety();
    if(safety.urgent) return {urgent:true,items:[{id:`urgent:${data?.mode}:${todayKeyLocal()}`,icon:"⚠️",title:safety.title||"Safety comes first",text:safety.text||"Please follow Tsuki's urgent-care guidance.",source:"urgent",priority:0}]};
    const list=[];
    manualPregnancyItems(list); appointmentItems(list,level==="minimal"?1:2);
    if(level!=="minimal") { routineItems(list); testItems(list,2); periodPrepItem(list); }
    if(level==="proactive") proactiveMaternalItems(list);
    return {urgent:false,items:list.sort((a,b)=>a.priority-b.priority).slice(0,level==="minimal"?3:level==="helpful"?5:6)};
  }

  function renderToday() {
    const screen=q('[data-screen="today"]'); if(!screen)return;
    let card=q('#smartReminderTodayCard'); if(!card){card=document.createElement('article');card.id='smartReminderTodayCard';card.className='smart-reminder-card period-signal-private';const anchor=screen.querySelector('.page-title')||screen.firstElementChild;anchor?.insertAdjacentElement('afterend',card);}
    const plan=buildPlan();
    if(!plan.items.length){card.classList.add('hidden');return;} card.classList.remove('hidden');
    card.innerHTML=`<div class="sr-head"><div><p class="eyebrow">SMART REMINDERS</p><h3>${plan.urgent?'Safety comes first':'What is worth remembering'}</h3></div><span>${plan.urgent?'⚠️':'🔔'}</span></div>${plan.items.map(x=>`<div class="sr-item ${plan.urgent?'urgent':''}"><span>${esc(x.icon)}</span><div><strong>${esc(x.title)}</strong><p>${esc(x.text)}</p></div></div>`).join('')}${plan.urgent?'<small class="sr-note">Notifications are not emergency services. Use the urgent-care guidance shown in Tsuki and seek care as directed.</small>':''}`;
  }
  function renderSettings() {
    const screen=q('[data-screen="me"]'); if(!screen)return;
    let card=q('#smartReminderSettingsCard'); if(!card){card=document.createElement('article');card.id='smartReminderSettingsCard';card.className='smart-reminder-settings period-signal-private';const rr=q('#releaseReadinessCard',screen)||q('#diagnosticsCard',screen);if(rr)rr.insertAdjacentElement('afterend',card);else screen.appendChild(card);}
    const s=loadSettings(); const permission='Notification' in window?Notification.permission:'unsupported';
    card.innerHTML=`<p class="eyebrow">SMART REMINDERS 2.0</p><h3>Helpful, not noisy</h3><p class="muted small-text">Tsuki checks reminders when the app opens or resumes. iPhone PWAs cannot be promised to wake exactly on schedule in the background.</p><label class="sr-label">Reminder style<select id="smartReminderLevel"><option value="minimal" ${s.level==='minimal'?'selected':''}>Minimal</option><option value="helpful" ${s.level==='helpful'?'selected':''}>Helpful</option><option value="proactive" ${s.level==='proactive'?'selected':''}>Proactive</option></select></label><label class="sr-toggle"><span><strong>Device notifications</strong><small>${permission==='granted'?'Permission granted':permission==='denied'?'Blocked in browser settings':'Optional'}</small></span><input id="smartReminderNotifications" type="checkbox" ${s.notifications?'checked':''}></label><p class="sr-note">Minimal: saved/near-term items. Helpful: adds routines, tests and confident period preparation. Proactive: adds non-urgent personalized care prompts. Urgent Pregnancy/Postpartum/baby safety always suppresses ordinary reminders.</p>`;
    q('#smartReminderLevel',card)?.addEventListener('change',e=>{const n=loadSettings();n.level=e.target.value;saveSettings(n);renderAll();});
    q('#smartReminderNotifications',card)?.addEventListener('change',async e=>{const n=loadSettings();if(e.target.checked){if(!('Notification'in window)){e.target.checked=false;return;}if(Notification.permission!=='granted'){const p=await Notification.requestPermission();if(p!=='granted'){e.target.checked=false;n.notifications=false;saveSettings(n);renderSettings();return;}}n.notifications=true;}else n.notifications=false;saveSettings(n);renderAll();});
  }

  async function maybeNotify() {
    const s=loadSettings(); if(!s.notifications||!("Notification" in window)||Notification.permission!=="granted")return;
    const plan=buildPlan(s.level); if(plan.urgent)return; // never rely on delayed notifications for emergency guidance
    const now=Date.now(); const keep={};
    for(const item of plan.items) {
      if(item.source==='manual-pregnancy') continue; // existing Pregnancy reminder system owns these notifications
      const last=Number(s.lastNotified[item.id]||0); if(last&&now-last<20*60*60*1000){keep[item.id]=last;continue;}
      const discreet=Boolean(data?.settings?.discreet);
      try { const reg=await navigator.serviceWorker?.ready; await reg?.showNotification?.('Tsuki 🌙',{body:discreet?'You have a Tsuki reminder to check.':item.title,icon:'./icons/icon-192.png'}); s.lastNotified[item.id]=now; keep[item.id]=now; } catch(_) {}
      break; // at most one contextual notification per check
    }
    s.lastNotified={...Object.fromEntries(Object.entries(s.lastNotified).filter(([,v])=>now-Number(v)<7*86400000)),...keep}; saveSettings(s);
  }
  function renderAll(){ensureStyles();renderToday();renderSettings();}
  function ensureStyles(){if(q('#smartReminderStyles'))return;const st=document.createElement('style');st.id='smartReminderStyles';st.textContent=`.smart-reminder-card,.smart-reminder-settings{margin:14px 0;padding:16px;border-radius:22px;background:var(--card,#fff)}.sr-head,.sr-toggle{display:flex;align-items:center;justify-content:space-between;gap:12px}.sr-item{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-top:1px solid rgba(120,90,120,.1)}.sr-item>span{font-size:20px}.sr-item p{margin:3px 0 0;font-size:.84rem;line-height:1.4;opacity:.78}.sr-item.urgent{font-weight:600}.sr-label{display:grid;gap:6px;margin:12px 0}.sr-label select{min-height:44px;padding:0 10px;border:1px solid var(--line);border-radius:12px;background:var(--card,#fff)}.sr-toggle{margin:12px 0}.sr-toggle span{display:grid;gap:2px}.sr-toggle input{width:22px;height:22px}.sr-note{display:block;font-size:.76rem;line-height:1.4;opacity:.72}`;document.head.appendChild(st);}

  function install(){if(window.TsukiSmartReminders?.installed)return;if(typeof data==='undefined')return setTimeout(install,100);window.TsukiSmartReminders={installed:true,version:'1.0.0-pre-smart-reminders-2',buildPlan,render:renderAll,maybeNotify,test:{buildPlan,urgentSafety,routineDue,daysUntil}};renderAll();setTimeout(maybeNotify,1400);window.addEventListener('pageshow',()=>{renderAll();maybeNotify()});window.addEventListener('focus',()=>{renderAll();maybeNotify()});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){renderAll();maybeNotify()}});}
  window.TsukiSmartReminders={installed:false,install}; install();
})();