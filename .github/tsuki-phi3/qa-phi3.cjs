const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', msg => { if (msg.type() === 'error' && !/firebase|gstatic|ERR_FAILED/i.test(msg.text())) errors.push(msg.text()); });
  await page.route(/googleapis|gstatic|firebaseio|firebaseapp/, route => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('tsuki-tutorial-complete-v1', 'true');
    localStorage.setItem('tsuki-whats-new-seen-v1', 'true');
  });
  await page.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.TsukiPersonalHealthIntelligence?.installed === true, null, { timeout: 10000 });

  const result = await page.evaluate(() => {
    const api = window.TsukiPersonalHealthIntelligence.test;
    const originalPeriods = JSON.stringify(data.periods || []);
    const originalMode = data.mode;
    const originalPreg = JSON.stringify(data.pregnancy || {});
    const today = todayKey();
    const plus = (n) => { const d = parseDate(today); d.setDate(d.getDate()+n); return dateKey(d); };
    const minus = (n) => plus(-n);

    data.personalHealth = {
      feedback: {},
      healthContexts: [
        { date: minus(20), context: 'Medication / treatment change', note: 'User entered' },
        { date: minus(8), context: 'High stress' }
      ],
      contraceptionHistory: [{ date: minus(30), method: 'Condoms', note: 'User entered method' }],
      fertilitySigns: [
        { date: minus(4), bbt: 36.30, cervicalMucus: 'dry', opk: 'negative' },
        { date: minus(3), bbt: 36.35, cervicalMucus: 'watery', opk: 'negative' },
        { date: minus(2), bbt: 36.60, cervicalMucus: 'slippery', opk: 'positive' },
        { date: minus(1), bbt: 36.65, cervicalMucus: 'egg-white', opk: 'positive' },
        { date: today, bbt: 36.64, cervicalMucus: 'slippery', opk: 'positive' }
      ],
      concerns: []
    };

    const fert = api.fertilitySignSummary();
    const contra = api.contraceptionSummary();
    const concern = api.somethingFeelsWrongAction();
    const timeline = api.personalTimeline();

    const eddBefore = data.pregnancy?.edd || data.pregnancy?.estimatedDueDate || null;
    data.mode = 'pregnancy';
    data.pregnancy = data.pregnancy || {};
    data.pregnancy.active = true;
    data.pregnancy.edd = eddBefore || plus(120);
    data.pregnancy.appointments = [{ date: plus(2), type: 'OB visit', provider: 'Care team', completed: false }];
    data.pregnancy.logs = data.pregnancy.logs || {};
    data.pregnancy.logs[minus(2)] = { sleep: 'Poor', energy: 'Low', nausea: 'Moderate' };
    data.pregnancy.logs[minus(1)] = { sleep: 'Poor', energy: 'Low', nausea: 'Moderate' };
    const preg = api.pregnancyWeeklyNavigator();
    const eddAfter = data.pregnancy.edd;

    data.mode = 'postpartum';
    data.postpartum = data.postpartum || {};
    data.postpartum.active = true;
    data.postpartum.recoveryLogs = {};
    for (let i = 8; i >= 0; i--) {
      data.postpartum.recoveryLogs[minus(i)] = { sleep: i < 4 ? 'poor' : 'okay', energy: i < 4 ? 'low' : 'okay', mood: 'okay', support: i < 3 ? 'need-more' : 'okay' };
    }
    data.postpartum.babyLogs = {};
    [5,4,3,2,1,0].forEach((i, idx) => { data.postpartum.babyLogs[minus(i)] = { wetDiapers: idx < 3 ? 7 : 4, feeding: idx < 4 ? 'good' : 'less', alertness: 'usual' }; });
    const recovery = api.postpartumRecoveryMilestones();
    const baby = api.babyBaseline();

    const periodsAfter = JSON.stringify(data.periods || []);
    const layout = { duplicates: [...document.querySelectorAll('[id]')].map(x=>x.id).filter((id,i,a)=>a.indexOf(id)!==i), width: document.documentElement.scrollWidth, viewport: innerWidth, zoom: document.querySelector('meta[name=viewport]')?.content || '' };

    data.mode = originalMode;
    return { fert, contra, concern, timelineCount: timeline.length, preg, recovery, baby, eddBefore: eddBefore || null, eddAfter, periodsSame: originalPeriods === periodsAfter, layout };
  });

  assert.ok(['higher-context','after-the-fact','uncertain'].includes(result.fert.level));
  assert.ok(/Condoms/i.test(result.contra.title));
  assert.ok(/Something feels wrong/i.test(result.concern.title));
  assert.ok(result.timelineCount >= 2);
  assert.ok(result.preg && result.preg.items.length >= 1);
  assert.ok(result.recovery && result.recovery.items.length >= 1);
  assert.ok(result.baby && ['changed','steady','learning'].includes(result.baby.level));
  assert.equal(result.periodsSame, true);
  assert.equal(result.layout.duplicates.length, 0);
  assert.ok(result.layout.width <= result.layout.viewport);
  assert.ok(/user-scalable=no/.test(result.layout.zoom));
  assert.equal(errors.length, 0, errors.join('\n'));

  const perf = await page.evaluate(() => {
    const api = window.TsukiPersonalHealthIntelligence.test;
    const start = performance.now();
    for (let i=0;i<100;i++) { api.personalTimeline(); api.fertilitySignSummary(); api.healthChangeAlert(); api.babyBaseline(); }
    return performance.now()-start;
  });
  assert.ok(perf < 250, `PHI3 performance ${perf}ms`);
  console.log(JSON.stringify({ ...result, perfMs: Math.round(perf*10)/10 }));
  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
