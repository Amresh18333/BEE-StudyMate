const { chromium } = require('playwright');
const UID = '65f000000000000000000001';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript((id) => localStorage.setItem('studymate_user_id', id), UID);
  const calls = []; let memoryDown = false; let historyCleared = false;
  const mem = { learner: { key: 'slow', name: 'Slow & informative', description: 'You take your time.', tips: ['Read fully.'], pace: 'slow', trait: 'Night owl', evidence: [], confidence: 0.4, basedOnActivities: 8, weakTopics: [{ name: 'Stack', attempts: 2, avg: 40 }], strongTopics: [{ name: 'Queue', attempts: 2, avg: 100 }], activeDays: 3, avgQuizScore: 60, avgSessionMinutes: 30 }, topSearches: [], history: [{ kind: 'quiz', text: 'Stack - 20%', at: new Date().toISOString() }, { kind: 'search', text: 'Queue', at: new Date().toISOString() }], recentScores: [20, 20, 100, 100] };
  await p.route('http://127.0.0.1:8000/**', async (r) => {
    const req = r.request(), u = req.url(), m = req.method(); calls.push({ m, u, body: req.postData() });
    const send = (body, status = 200) => r.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }, body: JSON.stringify(body) });
    if (m === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (/\/users\/[0-9a-f]+$/.test(u)) return send({ id: UID, name: 'Kumar', email: 'k@x.com' });
    if (u.includes('/recommendations/')) return send({ overallScore: 0, summary: '', priority: 'x', recommendations: [], generatedByAI: false });
    if (u.includes('/subjects')) return send([{ id: 's1', name: 'DSA', description: 'd', userId: 'u' }]);
    if (u.includes('/study-sessions')) return send([]);
    if (u.includes('/search?')) return send({ subjects: [], topics: [{ id: 't1', subjectId: 's1', name: 'Stack', description: 'LIFO', needsPractice: true }], suggestions: ['stack basics'], personalized: true });
    if (u.includes('/memory/')) {
      if (memoryDown) return send({ detail: 'x' }, 500);
      if (m === 'DELETE') { historyCleared = true; return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (m === 'POST') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
      if (u.includes('/history')) return send(historyCleared ? [] : [...mem.history, { kind: 'chat', text: 'What is a stack?', at: new Date().toISOString() }]);
      return send(mem);
    }
    if (u.endsWith('/ai/chat/document')) return send({ response: 'A stack is LIFO.', documentId: 'doc1', documentName: 'notes.txt', usedSections: ['Document'], sectionsNotUsed: 2 });
    if (u.endsWith('/ai/chat')) return send({ response: 'Queue is FIFO.', documentId: 'doc1', documentName: 'notes.txt', usedSections: ['Document'], sectionsNotUsed: 0 });
    return send([]);
  });
  const base = 'http://127.0.0.1:4173';

  // 1. Dashboard
  await p.goto(base + '/dashboard'); await p.waitForSelector('.learner-card', { timeout: 5000 });
  const t = (await p.innerText('.learner-card')).toLowerCase();
  ok(t.includes('slow & informative') && t.includes('night owl') && t.includes('needs practice') && t.includes('stack') && t.includes('queue'), 'dashboard shows learner type, trait, weak and strong topics');
  ok(t.includes('stack - 20%') && t.includes('recent history'), 'dashboard shows recent history');
  const g = await p.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect(); const rec = r('.dashboard-recommendations'), grid = r('.dashboard-grid'); const cards = [...document.querySelectorAll('.dashboard-grid > .card')].map(e => e.getBoundingClientRect()); return { gap: grid.top - rec.bottom, h: cards.map(c => Math.round(c.height)), sw: document.documentElement.scrollWidth, vw: innerWidth }; });
  ok(g.gap >= 16 && g.h[0] === g.h[1] && g.sw <= g.vw, `dashboard cards: gap ${g.gap}px above, equal heights ${g.h}, no horizontal scroll`);

  // 2. History page
  await p.goto(base + '/history'); await p.waitForSelector('.history-list');
  ok((await p.locator('.history-list li').count()) === 3, 'history page lists 3 entries');
  await p.click('text=Quizzes'); await p.waitForTimeout(300);
  ok(calls.some(c => c.u.includes('/history') && c.u.includes('kind=quiz')), 'history tab filters by kind on the server');
  p.once('dialog', d => d.accept()); await p.click('text=Clear history'); await p.waitForTimeout(500);
  ok(calls.some(c => c.m === 'DELETE' && c.u.endsWith('/history')) && (await p.locator('.history-list li').count()) === 0, 'clear history deletes and empties the list');

  // 3. Chat with document (AskAI)
  await p.goto(base + '/ask-ai'); await p.waitForSelector('.chat-input');
  await p.setInputFiles('input[type=file]', '/tmp/claude-0/-home-claude/5cc72275-7f3d-520b-bc8e-87f933e09d8f/scratchpad/bad.exe');
  ok((await p.innerText('.doc-attach-error')).includes('Supported files'), 'unsupported file type is refused in the UI');
  await p.setInputFiles('input[type=file]', '/tmp/claude-0/-home-claude/5cc72275-7f3d-520b-bc8e-87f933e09d8f/scratchpad/notes.txt');
  ok((await p.innerText('.doc-chip')).includes('notes.txt'), 'attached file chip is shown');
  await p.fill('.chat-input', 'What is a stack?'); await p.click('button:has-text("Send")'); await p.waitForSelector('.doc-sources');
  const up = calls.find(c => c.u.endsWith('/ai/chat/document'));
  ok(up && up.body.includes('notes.txt') && up.body.includes('What is a stack?') && up.body.includes(UID), 'first question uploads the file with the prompt and user id (multipart)');
  const src = await p.innerText('.doc-sources'); ok(src.includes('notes.txt') && src.includes('2 other parts'), 'reply shows which document/sections were used and how many were not');
  await p.fill('.chat-input', 'And a queue?'); await p.click('button:has-text("Send")'); await p.waitForTimeout(600);
  const fu = calls.filter(c => c.u.endsWith('/ai/chat')).pop();
  ok(fu && JSON.parse(fu.body).documentId === 'doc1' && JSON.parse(fu.body).userId === UID, 'follow-up reuses the document id (no second upload)');
  ok(calls.filter(c => c.u.endsWith('/ai/chat/document')).length === 1, 'file uploaded only once');
  await p.click('.doc-chip-remove'); await p.fill('.chat-input', 'plain'); await p.click('button:has-text("Send")'); await p.waitForTimeout(500);
  const pl = JSON.parse(calls.filter(c => c.u.endsWith('/ai/chat')).pop().body); ok(!pl.documentId && pl.userId === UID, 'after removing the file, chat is plain again (still sends user id)');

  // 4. Navbar search: debounce + save on click
  await p.goto(base + '/dashboard'); await p.waitForSelector('.navbar-search-results, input'); calls.length = 0;
  const box = p.locator('input[placeholder*="Search"]').first(); await box.click();
  await p.keyboard.type('stack', { delay: 40 }); await p.waitForSelector('.search-result-item'); 
  ok(calls.filter(c => c.u.includes('/search?')).length === 1, 'typing "stack" quickly sends ONE search request (debounced), not five');
  ok((await p.innerText('.navbar-search-results')).includes('Needs practice') && (await p.innerText('.navbar-search-results')).includes('stack basics'), 'search shows "Needs practice" tag and "You searched before" suggestion');
  await p.click('.search-result-item:has-text("Needs practice")'); await p.waitForTimeout(500);
  const sv = calls.find(c => c.m === 'POST' && c.u.includes('/memory/') && c.u.endsWith('/search'));
  ok(sv && JSON.parse(sv.body).query === 'stack' && JSON.parse(sv.body).kind === 'topic', 'clicking a result saves that search to memory');

  // 5. memory service down -> dashboard still fine
  memoryDown = true; await p.goto(base + '/dashboard'); await p.waitForSelector('.dashboard-page'); await p.waitForTimeout(800);
  ok((await p.locator('.learner-card').count()) === 0 && (await p.locator('.dashboard-grid').count()) === 1, 'if memory fails, the dashboard renders normally without the learner card');
  // 6. sidebar link
  ok((await p.locator('a[href="/history"]').count()) >= 1, 'sidebar has a History link');
  ok(errors.length === 0, 'no uncaught page errors ' + errors.join('|'));
  await b.close(); console.log(fails ? `\n${fails} FAILED` : '\nALL FRONTEND CHECKS PASSED'); process.exit(fails ? 1 : 0);
})();
