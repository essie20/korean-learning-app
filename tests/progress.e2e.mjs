// End-to-end tests for the progress rules in PROJECT_SPEC.md.
//
// Runs the real app in a headless Microsoft Edge (or Chrome) started with a
// brand-new temporary profile, so it never reads or changes the progress
// saved in anyone's own browser. The profile is deleted afterwards.
//
// Usage (dev server running, e.g. `npm run dev`):
//   node tests/progress.e2e.mjs
// Options (environment variables):
//   APP_URL       app root, default http://localhost:5173/
//   BROWSER_PATH  Edge/Chrome executable, default: Edge on Windows
//   RESULTS_FILE  report path, default docs/progress-test-results.md
//
// Needs Node 22+ (built-in fetch and WebSocket). No npm dependencies.

import { execSync, spawn } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir, release, platform } from 'node:os'
import { join } from 'node:path'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5173/').replace(
  /\/?$/,
  '/',
)
const BROWSER_PATH =
  process.env.BROWSER_PATH ??
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const RESULTS_FILE = process.env.RESULTS_FILE ?? 'docs/progress-test-results.md'
const PORT = 9400 + Math.floor(Math.random() * 400)
const STORAGE_KEY = 'korean-learning-app-progress'

// ---------------------------------------------------------------- browser

const profile = mkdtempSync(join(tmpdir(), 'progress-e2e-'))
const browser = spawn(
  BROWSER_PATH,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ],
  { stdio: 'ignore' },
)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let targets
for (let i = 0; i < 60 && !targets; i++) {
  try {
    targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()
  } catch {
    await sleep(250)
  }
}
if (!targets) throw new Error(`Browser did not start: ${BROWSER_PATH}`)
const browserVersion = (
  await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
).Browser
const ws = new WebSocket(
  targets.find((t) => t.type === 'page').webSocketDebuggerUrl,
)
await new Promise((r) => ws.addEventListener('open', r))
let msgId = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m)
    pending.delete(m.id)
  }
})
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++msgId
    pending.set(i, r)
    ws.send(JSON.stringify({ id: i, method, params }))
  })
async function ev(expression) {
  const r = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (r.result?.exceptionDetails)
    throw new Error(
      `${expression.slice(0, 80)}: ${r.result.exceptionDetails.exception?.description}`,
    )
  return r.result?.result?.value
}
async function waitFor(expression, what, timeout = 5000) {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    if (await ev(expression).catch(() => false)) return
    await sleep(100)
  }
  throw new Error(`Timed out waiting for ${what}`)
}

// ------------------------------------------------------------- app helpers

const path = () => ev('location.pathname')
async function go(route) {
  await send('Page.navigate', { url: APP_URL + route })
  await waitFor(
    `document.readyState === 'complete' && !!document.querySelector('main')?.children.length`,
    `page ${route}`,
  )
  await sleep(300)
}
async function reload() {
  await send('Page.reload', { ignoreCache: true })
  await sleep(300)
  await waitFor(
    `document.readyState === 'complete' && !!document.querySelector('main')?.children.length`,
    'reload',
  )
  await sleep(300)
}
// Click a button or link by its visible text (or aria-label), as a user would
async function click(text, scope = 'document') {
  const ok = await ev(
    `(() => { const el = [...${scope}.querySelectorAll('button,a')].find(e => (e.getAttribute('aria-label') || e.textContent).trim() === ${JSON.stringify(text)}); if (!el) return false; el.click(); return true })()`,
  )
  if (!ok) throw new Error(`No button or link "${text}" on ${await path()}`)
  await sleep(350)
}
async function pressEscape() {
  for (const type of ['keyDown', 'keyUp'])
    await send('Input.dispatchKeyEvent', {
      type,
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
    })
  await sleep(300)
}
const storage = () =>
  ev(
    `(() => { const v = localStorage.getItem('${STORAGE_KEY}'); return v === null ? null : JSON.parse(v) })()`,
  )
const studyPosition = () =>
  ev(
    `[...document.querySelectorAll('p')].map(p => p.textContent.trim()).find(t => /^\\d+ \\/ \\d+$/.test(t)) ?? null`,
  )

// What the user sees on each page
async function readHome() {
  await go('')
  return ev(`(() => { const t = [...document.querySelectorAll('p,span,a')].map(e => e.textContent.trim())
    return { button: t.find(x => /^(Aloita opiskelu|Jatka opiskelua)/.test(x))?.replace(/\\s*→$/, ''), percent: t.find(x => /^\\d+%$/.test(x)), sentences: t.find(x => /^\\d+ \\/ 50 lausetta$/.test(x)) } })()`)
}
async function readCards(route) {
  await go(route)
  return ev(`Object.fromEntries([...document.querySelectorAll('li a[href*="/opiskelu"]')].map(a => {
    const ps = [...a.querySelectorAll('p')].map(p => p.textContent.trim())
    return [a.querySelector('h3').textContent.trim(), { status: [...a.querySelectorAll('span')].map(s => s.textContent.trim()).find(x => ['Aloita', 'Jatka', 'Suoritettu'].includes(x)),
      progress: ps.find(x => / lausetta · /.test(x)), completion: ps.find(x => x.startsWith('Suoritettu ')) ?? null }]
  }))`)
}
async function readProgressPage() {
  await go('edistyminen')
  return ev(`(() => { const ps = [...document.querySelectorAll('p')]; const after = (label) => ps.find(p => p.textContent.trim() === label)?.nextElementSibling?.textContent.trim()
    return { percent: [...document.querySelectorAll('div')].map(d => d.textContent.trim()).find(x => /^\\d+%$/.test(x)), overall: after('Kokonaisedistyminen'), completedTopics: after('Suoritetut aiheet'), totalCompletions: after('Suoritukset yhteensä') } })()`)
}
async function openStudy(topicId) {
  await go(`aiheet/${topicId}/opiskelu`)
  await waitFor(
    `[...document.querySelectorAll('p')].some(p => /^\\d+ \\/ \\d+$/.test(p.textContent.trim()))`,
    'study position',
  )
}
const cardsAll = (status, progress) =>
  Object.fromEntries(
    [
      'Tervehdykset',
      'Esittäytyminen',
      'Kahvilassa',
      'Ravintolassa',
      'Ostoksilla',
      'Tien kysyminen',
      'Julkinen liikenne',
      'Arjessa',
      'Aika ja tapaamiset',
      'Apu ja ymmärtäminen',
    ].map((t) => [t, { status, progress, completion: null }]),
  )
const emptyStorage = {
  studiedSentenceIds: [],
  currentCardByTopic: {},
  completionCountByTopic: {},
}

// --------------------------------------------------------------- recording

const results = []
let current = null
function test(id, rule, steps) {
  current = { id, rule, steps, checks: [] }
  results.push(current)
}
function check(what, expected, actual) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected)
  current.checks.push({ what, expected, actual, pass })
}
const ids = (topic, ...n) => n.map((k) => `${topic}-sentence-0${k}`)

// ------------------------------------------------------------------ tests

async function run() {
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  })

  test(
    'T01',
    'Fresh state shows no progress',
    'Open the app in a new browser profile.',
  )
  await go('')
  check(
    'Stored data on first load (empty structure)',
    emptyStorage,
    await storage(),
  )
  check(
    'Home',
    { button: 'Aloita opiskelu', percent: '0%', sentences: '0 / 50 lausetta' },
    await readHome(),
  )
  check(
    'Topics cards',
    cardsAll('Aloita', '0 / 5 lausetta · 0%'),
    await readCards('aiheet'),
  )
  check(
    'Progress page',
    {
      percent: '0%',
      overall: '0 / 50 lausetta',
      completedTopics: '0 / 10',
      totalCompletions: '0',
    },
    await readProgressPage(),
  )

  test(
    'T02',
    'A sentence is marked studied when it is displayed',
    'Open Tervehdykset (topic 1).',
  )
  await openStudy('topic-01')
  check('Study position', '1 / 5', await studyPosition())
  check(
    'Stored data',
    {
      studiedSentenceIds: ids('topic-01', 1),
      currentCardByTopic: { 'topic-01': 0 },
      completionCountByTopic: {},
    },
    await storage(),
  )

  test(
    'T03',
    'Overall and topic progress count unique sentences only',
    'In topic 1: Seuraava, Edellinen, Seuraava, Seuraava, Edellinen (views 2, 1, 2, 3, 2).',
  )
  for (const b of [
    'Seuraava',
    'Edellinen',
    'Seuraava',
    'Seuraava',
    'Edellinen',
  ])
    await click(b)
  check('Study position', '2 / 5', await studyPosition())
  check(
    'Studied ids (no duplicates)',
    ids('topic-01', 1, 2, 3),
    (await storage()).studiedSentenceIds,
  )
  check(
    'Topic 1 card',
    { status: 'Jatka', progress: '3 / 5 lausetta · 60%', completion: null },
    (await readCards('aiheet'))['Tervehdykset'],
  )
  check(
    'Home',
    { button: 'Jatka opiskelua', percent: '6%', sentences: '3 / 50 lausetta' },
    await readHome(),
  )

  test(
    'T04',
    'Per-topic and overall percentages across topics',
    'Open Esittäytyminen (topic 2), Seuraava twice (sentences 1-3).',
  )
  await openStudy('topic-02')
  await click('Seuraava')
  await click('Seuraava')
  const cards4 = await readCards('aiheet')
  check(
    'Topic 1 card',
    { status: 'Jatka', progress: '3 / 5 lausetta · 60%', completion: null },
    cards4['Tervehdykset'],
  )
  check(
    'Topic 2 card',
    { status: 'Jatka', progress: '3 / 5 lausetta · 60%', completion: null },
    cards4['Esittäytyminen'],
  )
  check(
    'Untouched topic card (Kahvilassa)',
    { status: 'Aloita', progress: '0 / 5 lausetta · 0%', completion: null },
    cards4['Kahvilassa'],
  )
  check(
    'Progress page',
    {
      percent: '12%',
      overall: '6 / 50 lausetta',
      completedTopics: '0 / 10',
      totalCompletions: '0',
    },
    await readProgressPage(),
  )

  test(
    'T05',
    'Viewing all 5 sentences without Valmis does not complete the topic',
    'Open topic 1 (resumes at saved sentence 2), Seuraava to sentence 5, leave without pressing Valmis.',
  )
  await openStudy('topic-01')
  check('Resumes at saved position', '2 / 5', await studyPosition())
  for (let i = 0; i < 3; i++) await click('Seuraava')
  check('Study position', '5 / 5', await studyPosition())
  check(
    'Valmis button shown on last sentence',
    true,
    await ev(
      `[...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Valmis')`,
    ),
  )
  check(
    'Topic 1 card',
    { status: 'Jatka', progress: '5 / 5 lausetta · 100%', completion: null },
    (await readCards('aiheet'))['Tervehdykset'],
  )
  check(
    'Progress page',
    {
      percent: '16%',
      overall: '8 / 50 lausetta',
      completedTopics: '0 / 10',
      totalCompletions: '0',
    },
    await readProgressPage(),
  )
  check(
    'Stored completion counts',
    {},
    (await storage()).completionCountByTopic,
  )

  test(
    'T06',
    'The completion page cannot be reached without Valmis',
    'Open /aiheet/topic-01/valmis directly.',
  )
  await go('aiheet/topic-01/valmis')
  check(
    'Redirected to',
    `${new URL(APP_URL).pathname}aiheet/topic-01/opiskelu`,
    await path(),
  )
  check(
    'Stored completion counts',
    {},
    (await storage()).completionCountByTopic,
  )

  test(
    'T07',
    'Valmis completes the topic and counts one completion',
    'Open topic 1 (resumes at 5/5) and press Valmis.',
  )
  await openStudy('topic-01')
  check('Resumes at saved position', '5 / 5', await studyPosition())
  await click('Valmis')
  check(
    'Navigated to',
    `${new URL(APP_URL).pathname}aiheet/topic-01/valmis`,
    await path(),
  )
  check(
    'Completion page summary',
    true,
    await ev(`document.body.textContent.includes('5 / 5 lausetta opiskeltu')`),
  )
  const s7 = await storage()
  check('Stored completion count', { 'topic-01': 1 }, s7.completionCountByTopic)
  check(
    'Saved position cleared for topic 1',
    false,
    'topic-01' in s7.currentCardByTopic,
  )
  check(
    'Topic 1 card',
    {
      status: 'Suoritettu',
      progress: '5 / 5 lausetta · 100%',
      completion: 'Suoritettu 1 kerran',
    },
    (await readCards('aiheet'))['Tervehdykset'],
  )
  check(
    'Progress page',
    {
      percent: '16%',
      overall: '8 / 50 lausetta',
      completedTopics: '1 / 10',
      totalCompletions: '1',
    },
    await readProgressPage(),
  )

  test(
    'T08',
    'Repeating a completed topic keeps coverage and tracks repetition separately',
    'From the completion page press "Kertaa tämä aihe", then Seuraava once.',
  )
  await go('aiheet/topic-01/valmis')
  await click('Kertaa tämä aihe')
  await waitFor(`location.pathname.endsWith('/opiskelu')`, 'study after Kertaa')
  check('Repetition starts at', '1 / 5', await studyPosition())
  await click('Seuraava')
  check('Study position', '2 / 5', await studyPosition())
  check(
    'Topic 1 card',
    {
      status: 'Suoritettu',
      progress: '5 / 5 lausetta · 100%',
      completion: 'Suoritettu 1 kerran · Kertaus käynnissä: 2 / 5',
    },
    (await readCards('aiheet'))['Tervehdykset'],
  )
  check(
    'Progress page (coverage unchanged, no extra completion yet)',
    {
      percent: '16%',
      overall: '8 / 50 lausetta',
      completedTopics: '1 / 10',
      totalCompletions: '1',
    },
    await readProgressPage(),
  )

  test(
    'T09',
    'Progress persists after reload',
    'Record Home, Topics, Progress and stored data; reload each page (F5); compare. Then reopen topics 1 and 2.',
  )
  const before = {
    storage: await storage(),
    home: await readHome(),
    cards: await readCards('aiheet'),
    progress: await readProgressPage(),
  }
  await go('')
  await reload()
  const homeAfter = await ev(
    `(() => { const t = [...document.querySelectorAll('p,span,a')].map(e => e.textContent.trim()); return { button: t.find(x => /^(Aloita opiskelu|Jatka opiskelua)/.test(x))?.replace(/\\s*→$/, ''), percent: t.find(x => /^\\d+%$/.test(x)), sentences: t.find(x => /^\\d+ \\/ 50 lausetta$/.test(x)) } })()`,
  )
  check('Home after reload', before.home, homeAfter)
  await go('aiheet')
  await reload()
  check(
    'Topics after reload',
    before.cards,
    await ev(
      `Object.fromEntries([...document.querySelectorAll('li a[href*="/opiskelu"]')].map(a => { const ps = [...a.querySelectorAll('p')].map(p => p.textContent.trim()); return [a.querySelector('h3').textContent.trim(), { status: [...a.querySelectorAll('span')].map(s => s.textContent.trim()).find(x => ['Aloita', 'Jatka', 'Suoritettu'].includes(x)), progress: ps.find(x => / lausetta · /.test(x)), completion: ps.find(x => x.startsWith('Suoritettu ')) ?? null }] }))`,
    ),
  )
  await go('edistyminen')
  await reload()
  check(
    'Progress page after reload',
    before.progress,
    await ev(
      `(() => { const ps = [...document.querySelectorAll('p')]; const after = (label) => ps.find(p => p.textContent.trim() === label)?.nextElementSibling?.textContent.trim(); return { percent: [...document.querySelectorAll('div')].map(d => d.textContent.trim()).find(x => /^\\d+%$/.test(x)), overall: after('Kokonaisedistyminen'), completedTopics: after('Suoritetut aiheet'), totalCompletions: after('Suoritukset yhteensä') } })()`,
    ),
  )
  check('Stored data after reload', before.storage, await storage())
  await openStudy('topic-02')
  check('Topic 2 resumes at saved sentence', '3 / 5', await studyPosition())
  await openStudy('topic-01')
  check(
    'Topic 1 repetition resumes at saved sentence',
    '2 / 5',
    await studyPosition(),
  )

  test(
    'T10',
    'Each Valmis adds one completion',
    'Continue the topic 1 repetition to sentence 5 and press Valmis.',
  )
  for (let i = 0; i < 3; i++) await click('Seuraava')
  await click('Valmis')
  check(
    'Stored completion count',
    { 'topic-01': 2 },
    (await storage()).completionCountByTopic,
  )
  check(
    'Topic 1 card',
    {
      status: 'Suoritettu',
      progress: '5 / 5 lausetta · 100%',
      completion: 'Suoritettu 2 kertaa',
    },
    (await readCards('aiheet'))['Tervehdykset'],
  )
  check(
    'Progress page (coverage unchanged)',
    {
      percent: '16%',
      overall: '8 / 50 lausetta',
      completedTopics: '1 / 10',
      totalCompletions: '2',
    },
    await readProgressPage(),
  )

  test(
    'T11',
    'Reset: cancel with Peruuta keeps all progress',
    'On Progress press "Nollaa edistyminen", then "Peruuta".',
  )
  const keep = await storage()
  await go('edistyminen')
  await click('Nollaa edistyminen')
  check(
    'Confirmation dialog open',
    true,
    await ev(`!!document.querySelector('dialog[open]')`),
  )
  check('Data unchanged while dialog open', keep, await storage())
  await click('Peruuta', `document.querySelector('dialog[open]')`)
  check(
    'Dialog closed',
    false,
    await ev(`!!document.querySelector('dialog[open]')`),
  )
  check('Stored data unchanged', keep, await storage())
  check(
    'Progress page unchanged',
    {
      percent: '16%',
      overall: '8 / 50 lausetta',
      completedTopics: '1 / 10',
      totalCompletions: '2',
    },
    await readProgressPage(),
  )

  test(
    'T12',
    'Reset: cancel with Escape keeps all progress',
    'On Progress press "Nollaa edistyminen", then the Escape key.',
  )
  await go('edistyminen')
  await click('Nollaa edistyminen')
  check(
    'Confirmation dialog open',
    true,
    await ev(`!!document.querySelector('dialog[open]')`),
  )
  await pressEscape()
  check(
    'Dialog closed',
    false,
    await ev(`!!document.querySelector('dialog[open]')`),
  )
  check('Stored data unchanged', keep, await storage())

  test(
    'T13',
    'Reset: confirm clears all progress',
    'On Progress press "Nollaa edistyminen", then "Nollaa edistyminen" in the dialog.',
  )
  await go('edistyminen')
  await click('Nollaa edistyminen')
  await click('Nollaa edistyminen', `document.querySelector('dialog[open]')`)
  check(
    'Dialog closed',
    false,
    await ev(`!!document.querySelector('dialog[open]')`),
  )
  check('Stored data', emptyStorage, await storage())
  check(
    'Progress page',
    {
      percent: '0%',
      overall: '0 / 50 lausetta',
      completedTopics: '0 / 10',
      totalCompletions: '0',
    },
    await ev(
      `(() => { const ps = [...document.querySelectorAll('p')]; const after = (label) => ps.find(p => p.textContent.trim() === label)?.nextElementSibling?.textContent.trim(); return { percent: [...document.querySelectorAll('div')].map(d => d.textContent.trim()).find(x => /^\\d+%$/.test(x)), overall: after('Kokonaisedistyminen'), completedTopics: after('Suoritetut aiheet'), totalCompletions: after('Suoritukset yhteensä') } })()`,
    ),
  )
  check(
    'Topics cards',
    cardsAll('Aloita', '0 / 5 lausetta · 0%'),
    await readCards('aiheet'),
  )
  check(
    'Home',
    { button: 'Aloita opiskelu', percent: '0%', sentences: '0 / 50 lausetta' },
    await readHome(),
  )

  test('T14', 'Reset persists after reload', 'Reload the Progress page.')
  await go('edistyminen')
  await reload()
  check('Stored data after reload', emptyStorage, await storage())
  check(
    'Progress page after reload',
    {
      percent: '0%',
      overall: '0 / 50 lausetta',
      completedTopics: '0 / 10',
      totalCompletions: '0',
    },
    await readProgressPage(),
  )
}

// ------------------------------------------------------------------ report

let crash = null
try {
  await run()
} catch (e) {
  crash = e
}
ws.close()
browser.kill()
await sleep(500)
try {
  rmSync(profile, { recursive: true, force: true })
} catch {
  /* profile may still be locked briefly */
}

const git = (cmd) => {
  try {
    return execSync(`git ${cmd}`, { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}
const dirty = git(
  'status --porcelain -- src public index.html package.json vite.config.ts',
)
const env = {
  date: new Date().toISOString(),
  commit: git('rev-parse HEAD'),
  branch: git('rev-parse --abbrev-ref HEAD'),
  appSourceChanges:
    dirty === ''
      ? 'none (src, public, index.html, package.json, vite.config.ts clean)'
      : dirty.replace(/\n/g, '; '),
  appUrl: APP_URL,
  browser: browserVersion,
  viewport: '1280×800, headless, fresh temporary profile',
  node: process.version,
  os: `${platform()} ${release()}`,
}
const checks = results.flatMap((t) => t.checks)
const failed = checks.filter((c) => !c.pass)
const fmt = (v) => '`' + JSON.stringify(v).replace(/\|/g, '\\|') + '`'
const lines = [
  '# Progress rule tests: results',
  '',
  'Generated by `node tests/progress.e2e.mjs`. Automated browser test of the',
  'progress rules in PROJECT_SPEC.md; not participant testing.',
  '',
  '## Environment',
  '',
  '| | |',
  '|---|---|',
  ...Object.entries(env).map(
    ([k, v]) => `| ${k} | ${String(v).replace(/\|/g, '\\|')} |`,
  ),
  '',
  '## Summary',
  '',
  `${results.length} tests, ${checks.length} checks: **${checks.length - failed.length} passed, ${failed.length} failed**${crash ? `, run stopped early: ${crash.message}` : ''}.`,
  '',
  '## Results',
  '',
]
for (const t of results) {
  const ok = t.checks.every((c) => c.pass) && t.checks.length > 0
  lines.push(
    `### ${t.id} ${t.rule}: ${ok ? 'PASS' : 'FAIL'}`,
    '',
    `Steps: ${t.steps}`,
    '',
    '| Check | Expected | Actual | Result |',
    '|---|---|---|---|',
  )
  for (const c of t.checks)
    lines.push(
      `| ${c.what} | ${fmt(c.expected)} | ${fmt(c.actual)} | ${c.pass ? 'pass' : '**FAIL**'} |`,
    )
  lines.push('')
}
lines.push(
  '## Scope and limitations',
  '',
  '- One browser engine (Chromium/Edge, headless) at 1280×800; the progress rules do not depend on screen size.',
  '- Clicks use DOM `click()` on the visible buttons and links; Escape uses a real key event. Mouse/touch input and assistive technology were not used.',
  '- Percentages are whole numbers by design (x/50 and x/5 never need rounding), so rounding is not exercised.',
  '- Values were read from the visible page text and from localStorage. Visual appearance was not checked.',
  '- Corrupted or manually edited localStorage data was not tested.',
  '',
)
writeFileSync(RESULTS_FILE, lines.join('\n'))
console.log(
  `${checks.length - failed.length}/${checks.length} checks passed${crash ? ` (stopped early: ${crash.message})` : ''}. Report: ${RESULTS_FILE}`,
)
for (const f of failed)
  console.log(
    `FAIL ${f.what}: expected ${JSON.stringify(f.expected)}, actual ${JSON.stringify(f.actual)}`,
  )
process.exitCode = failed.length || crash ? 1 : 0
