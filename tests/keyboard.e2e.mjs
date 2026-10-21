// Keyboard-only test of the demo route:
// Home → Topics → Study → Complete → Repeat → Progress → reset dialog.
//
// Every control is reached with Tab / Shift+Tab and activated with Enter or
// Space, sent as trusted browser key events through the DevTools protocol
// (Input.dispatchKeyEvent). No mouse events and no JavaScript click() calls.
// JavaScript is used only to READ state (focused element, its outline and
// position, localStorage). Page loads by URL are used only to open the app
// at the start of each run, like typing the address.
//
// Runs in headless Microsoft Edge (or Chrome) with a brand-new temporary
// profile that is deleted afterwards, so no one's own browser data is used.
//
// Usage (dev server running, e.g. `npm run dev`):
//   node tests/keyboard.e2e.mjs
// Options (environment variables):
//   APP_URL       app root, default http://localhost:5173/
//   BROWSER_PATH  Edge/Chrome executable, default: Edge on Windows
//   RESULTS_FILE  report path, default docs/keyboard-test-results.md
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
const RESULTS_FILE = process.env.RESULTS_FILE ?? 'docs/keyboard-test-results.md'
const PORT = 9400 + Math.floor(Math.random() * 400)
const STORAGE_KEY = 'korean-learning-app-progress'
const BASE_PATH = new URL(APP_URL).pathname
const VIEWPORTS = [
  { name: '1280×800', width: 1280, height: 800, mobile: false },
  { name: '375×812', width: 375, height: 812, mobile: true },
]

// ---------------------------------------------------------------- browser

const profile = mkdtempSync(join(tmpdir(), 'keyboard-e2e-'))
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
    if (await ev(expression).catch(() => false)) return true
    await sleep(100)
  }
  throw new Error(`Timed out waiting for ${what}`)
}

// --------------------------------------------------------------- keyboard

const KEYS = {
  Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 },
  Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' },
  Space: { key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: ' ' },
  Escape: { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 },
}
async function press(name, { shift = false } = {}) {
  const { text, ...k } = KEYS[name]
  const modifiers = shift ? 8 : 0
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    ...k,
    modifiers,
    ...(text ? { text, unmodifiedText: text } : {}),
  })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...k, modifiers })
  await sleep(250)
}

// The focused element as the test sees it: name, focus styling, visibility
const FOCUS = `(() => {
  const el = document.activeElement
  if (!el || el === document.body || el === document.documentElement) return { name: null }
  const s = getComputedStyle(el), r = el.getBoundingClientRect()
  const name = (el.getAttribute('aria-label') || el.textContent || '').replace(/\\s+/g, ' ').trim()
  const nav = document.querySelector('.sticky'), navBottom = nav && !nav.contains(el) ? nav.getBoundingClientRect().bottom : 0
  // Sample a 5×5 grid over the element: which points are on screen, below the sticky nav, and not covered
  let visiblePts = 0, total = 0
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    const x = r.left + (r.width * (i + 0.5)) / 5, y = r.top + (r.height * (j + 0.5)) / 5; total++
    if (x < 0 || y < navBottom || x > innerWidth || y > innerHeight) continue
    const top = document.elementFromPoint(x, y); if (top && (el === top || el.contains(top))) visiblePts++ }
  const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0
  return { name, tag: el.tagName.toLowerCase(), inDialog: !!el.closest('dialog[open]'), focusVisible: el.matches(':focus-visible'),
    indicator: outline ? 'outline ' + s.outlineWidth + ' ' + s.outlineStyle : (s.boxShadow !== 'none' ? 'box-shadow' : 'none'),
    visibleShare: +(visiblePts / total).toFixed(2), top: Math.round(r.top), left: Math.round(r.left), pageTop: Math.round(r.top + scrollY), pageLeft: Math.round(r.left + scrollX), navBottom: Math.round(navBottom) }
})()`
const focused = () => ev(FOCUS)
const path = () => ev('location.pathname')
const storage = () =>
  ev(
    `(() => { const v = localStorage.getItem('${STORAGE_KEY}'); return v === null ? null : JSON.parse(v) })()`,
  )
const studyPosition = () =>
  ev(
    `[...document.querySelectorAll('p')].map(p => p.textContent.trim()).find(t => /^\\d+ \\/ \\d+$/.test(t)) ?? null`,
  )
const dialogOpen = () => ev(`!!document.querySelector('dialog[open]')`)

// --------------------------------------------------------------- recording

const results = []
const focusLog = []
let current = null
let viewport = null
function test(id, title, steps) {
  current = { id: `${id} @${viewport.name}`, title, steps, checks: [] }
  results.push(current)
}
function check(what, expected, actual, pass) {
  current.checks.push({
    what,
    expected,
    actual,
    pass: pass ?? JSON.stringify(actual) === JSON.stringify(expected),
  })
}
// Focus quality at every stop: visible indicator, :focus-visible, not obscured
function recordStop(where, f) {
  const ok =
    f.name !== null &&
    f.focusVisible &&
    f.indicator !== 'none' &&
    f.visibleShare > 0
  focusLog.push({ viewport: viewport.name, where, ...f, ok })
  return ok
}

// Press Tab (or Shift+Tab) until the focused element's name matches; every
// stop on the way is recorded and checked for visible, unobscured focus.
async function tabTo(where, matcher, { shift = false, max = 30 } = {}) {
  const stops = []
  for (let i = 0; i < max; i++) {
    await press('Tab', { shift })
    const f = await focused()
    stops.push(f)
    recordStop(where, f)
    if (f.name && matcher(f.name)) return { found: f, stops }
  }
  return { found: null, stops }
}
// Tab through the whole page once, from the top
async function tabSequence(where, max = 30) {
  const stops = []
  for (let i = 0; i < max; i++) {
    await press('Tab')
    const f = await focused()
    if (
      !f.name ||
      stops.some(
        (s) =>
          s.name === f.name &&
          s.pageTop === f.pageTop &&
          s.pageLeft === f.pageLeft,
      )
    )
      break
    stops.push(f)
    recordStop(where, f)
  }
  return stops
}
const startsWithAll = (actual, expected) =>
  actual.length === expected.length &&
  expected.every((e, i) => actual[i]?.startsWith(e))
// Reading order: each stop is below the previous one, or on the same row and to its right
function readingOrder(stops) {
  // Page coordinates, so scrolling while tabbing does not matter. A stop is
  // out of order only if it goes backwards: further up the page without
  // moving to a column on the right, or to the left on the same row.
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1],
      b = stops[i]
    const sameRow = Math.abs(a.pageTop - b.pageTop) <= 8
    const upAndNotRight = b.pageTop < a.pageTop - 8 && b.pageLeft <= a.pageLeft
    const leftOnSameRow = sameRow && b.pageLeft < a.pageLeft
    if (upAndNotRight || leftOnSameRow) return `${a.name} → ${b.name}`
  }
  return 'in order'
}
const NAV = ['Koreaa lauseilla', 'Etusivu', 'Aiheet', 'Edistyminen']
const CARDS = Array.from(
  { length: 10 },
  (_, i) => `Aihe ${String(i + 1).padStart(2, '0')}`,
)

// ------------------------------------------------------------------ route

async function openFresh(route) {
  await send('Page.navigate', { url: APP_URL + route })
  await waitFor(
    `document.readyState === 'complete' && !!document.querySelector('main')?.children.length`,
    `page ${route}`,
  )
  await sleep(400)
}

async function run() {
  await send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  })
  await send('Emulation.setFocusEmulationEnabled', { enabled: true })
  await openFresh('')
  await ev(`localStorage.clear()`)
  await openFresh('')

  test(
    'K01',
    'Home: Tab order and activation with Enter',
    'Load Home, Tab through it, then Tab to "Aloita opiskelu" and press Enter.',
  )
  const home = await tabSequence('Home')
  check(
    'Tab order',
    [...NAV, 'Aloita opiskelu', 'Katso edistyminen'],
    home.map((s) => s.name),
    startsWithAll(
      home.map((s) => s.name),
      [...NAV, 'Aloita opiskelu', 'Katso edistyminen'],
    ),
  )
  check('Order follows reading order', 'in order', readingOrder(home))
  await openFresh('')
  const cta = await tabTo('Home', (n) => n.startsWith('Aloita opiskelu'))
  check('Reached "Aloita opiskelu" with Tab', true, !!cta.found)
  await press('Enter')
  check('Enter on the link opens Topics', `${BASE_PATH}aiheet`, await path())

  test(
    'K02',
    'Topics: Tab order, backwards order and activation',
    'Tab through Topics, Shift+Tab back through the cards, then Tab to the first card and press Enter.',
  )
  const first = await press('Tab').then(focused)
  recordStop('Topics (first Tab after route change)', first)
  check(
    'First Tab after navigating lands on a control of the new page',
    true,
    first.name !== null,
  )
  await openFresh('aiheet')
  const topics = await tabSequence('Topics')
  check(
    'Tab order',
    [...NAV, ...CARDS],
    topics.map((s) => s.name),
    topics.length === 14 &&
      NAV.every((n, i) => topics[i].name.startsWith(n)) &&
      CARDS.every((c, i) => topics[i + 4].name.includes(c)),
  )
  check(
    'Order follows reading order (grid row by row)',
    'in order',
    readingOrder(topics),
  )
  const back = []
  for (let i = 0; i < 10; i++) {
    await press('Tab', { shift: true })
    const f = await focused()
    back.push(f)
    recordStop('Topics (Shift+Tab)', f)
  }
  check(
    'Shift+Tab visits the cards in reverse (Aihe 10 → Aihe 01)',
    [...CARDS].reverse(),
    back.map((s) => s.name),
    back.length === 10 &&
      back.every((s, i) => (s.name ?? '').includes(CARDS[9 - i])),
  )
  check(
    'Every Shift+Tab stop is visible below the sticky nav',
    true,
    back.every((s) => s.visibleShare > 0),
    back.every((s) => s.visibleShare > 0),
  )
  await openFresh('aiheet')
  await tabTo('Topics', (n) => n.includes('Aihe 01'))
  await press('Enter')
  check(
    'Enter on the card opens Study',
    `${BASE_PATH}aiheet/topic-01/opiskelu`,
    await path(),
  )

  test(
    'K03',
    'Study: Tab order, help, audio, Seuraava with Enter and Space',
    'Tab through Study; open the pronunciation help with Enter, close with Escape; play/pause audio with Space; Seuraava with Enter and Space to sentence 5.',
  )
  await openFresh('aiheet/topic-01/opiskelu')
  const study = await tabSequence('Study 1/5')
  check(
    'Tab order (Edellinen is disabled on sentence 1 and skipped)',
    [...NAV, 'Näytä ääntämysohje', 'Kuuntele ääntämys', 'Seuraava'],
    study.map((s) => s.name),
    startsWithAll(
      study.map((s) => s.name),
      [...NAV, 'Näytä ääntämysohje', 'Kuuntele ääntämys', 'Seuraava'],
    ),
  )
  check('Order follows reading order', 'in order', readingOrder(study))
  await openFresh('aiheet/topic-01/opiskelu')
  await tabTo('Study', (n) => n.startsWith('Näytä ääntämysohje'))
  await press('Enter')
  let f = await focused()
  recordStop('Study help open', f)
  check(
    'Enter opens the help; focus moves to its close button',
    'Sulje ääntämysohje',
    f.name,
  )
  await press('Escape')
  f = await focused()
  check(
    'Escape closes the help; focus returns to its button',
    { open: false, focus: 'Näytä ääntämysohje tälle lauseelle' },
    {
      open: await ev(
        `!!document.querySelector('[role=region][aria-label="Ääntämysohje"]')`,
      ),
      focus: f.name,
    },
  )
  await tabTo('Study', (n) => n === 'Kuuntele ääntämys')
  await press('Space')
  await sleep(800)
  const playing = await ev(
    `(() => { const a = document.querySelector('audio'); return { paused: a.paused, pressed: [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Kuuntele ääntämys').getAttribute('aria-pressed') } })()`,
  )
  check(
    'Space on the audio button plays',
    { paused: false, pressed: 'true' },
    playing,
  )
  await press('Space')
  check(
    'Space again pauses',
    true,
    await ev(`document.querySelector('audio').paused`),
  )
  await tabTo('Study', (n) => n === 'Seuraava')
  await press('Enter')
  check('Enter on Seuraava', '2 / 5', await studyPosition())
  f = await focused()
  check('Focus stays on Seuraava', 'Seuraava', f.name)
  await press('Space')
  check('Space on Seuraava', '3 / 5', await studyPosition())
  await press('Enter')
  await press('Space')
  check('Sentence 5 reached', '5 / 5', await studyPosition())
  f = await focused()
  recordStop('Study 5/5', f)
  check('Focus is on Valmis after the last Seuraava', 'Valmis', f.name)

  test(
    'K04',
    'Complete: Valmis with Enter, Tab order on the completion page',
    'Press Enter on Valmis, then Tab through the completion page.',
  )
  await press('Enter')
  check(
    'Enter on Valmis opens the completion page',
    `${BASE_PATH}aiheet/topic-01/valmis`,
    await path(),
  )
  f = await press('Tab').then(focused)
  recordStop('Complete (first Tab after route change)', f)
  check(
    'First Tab after navigating lands on a control of the new page',
    true,
    f.name !== null,
  )
  await openFresh('aiheet/topic-01/valmis')
  const complete = await tabSequence('Complete')
  check(
    'Tab order',
    [...NAV, 'Kertaa tämä aihe', 'Valitse toinen aihe', 'Etusivulle'],
    complete.map((s) => s.name),
    startsWithAll(
      complete.map((s) => s.name),
      [...NAV, 'Kertaa tämä aihe', 'Valitse toinen aihe', 'Etusivulle'],
    ),
  )
  check('Order follows reading order', 'in order', readingOrder(complete))

  test(
    'K05',
    'Repeat: "Kertaa tämä aihe" with Enter',
    'Tab to "Kertaa tämä aihe", press Enter, then Space on Seuraava once.',
  )
  await openFresh('aiheet/topic-01/valmis')
  await tabTo('Complete', (n) => n === 'Kertaa tämä aihe')
  await press('Enter')
  check(
    'Enter opens Study for a repetition',
    `${BASE_PATH}aiheet/topic-01/opiskelu`,
    await path(),
  )
  check('Repetition starts at', '1 / 5', await studyPosition())
  await tabTo('Study (repeat)', (n) => n === 'Seuraava')
  await press('Space')
  check('Space on Seuraava', '2 / 5', await studyPosition())

  test(
    'K06',
    'Progress: reach the page and the reset button by keyboard',
    'Shift+Tab back to the nav link "Edistyminen", press Enter, then Tab through Progress to "Nollaa edistyminen".',
  )
  const toNav = await tabTo(
    'Study (Shift+Tab to nav)',
    (n) => n === 'Edistyminen',
    { shift: true },
  )
  check('Reached "Edistyminen" with Shift+Tab', true, !!toNav.found)
  await press('Enter')
  check('Enter opens Progress', `${BASE_PATH}edistyminen`, await path())
  await openFresh('edistyminen')
  const progress = await tabSequence('Progress', 30)
  check(
    'Tab order',
    [...NAV, ...CARDS, 'Nollaa edistyminen'],
    progress.map((s) => s.name),
    progress.length === 15 &&
      NAV.every((n, i) => progress[i].name.startsWith(n)) &&
      CARDS.every((c, i) => progress[i + 4].name.includes(c)) &&
      progress[14].name === 'Nollaa edistyminen',
  )
  check('Order follows reading order', 'in order', readingOrder(progress))
  const pBack = []
  for (let i = 0; i < 11; i++) {
    await press('Tab', { shift: true })
    const s = await focused()
    pBack.push(s)
    recordStop('Progress (Shift+Tab)', s)
  }
  check(
    'Every Shift+Tab stop is visible below the sticky nav',
    true,
    pBack.every((s) => s.visibleShare > 0),
    pBack.every((s) => s.visibleShare > 0),
  )
  const before = await storage()

  test(
    'K07',
    'Reset dialog: open, focus containment, Escape, focus return',
    'Tab to "Nollaa edistyminen", press Enter; Tab 6 times inside the dialog; press Escape.',
  )
  await openFresh('edistyminen')
  await tabTo('Progress', (n) => n === 'Nollaa edistyminen')
  await press('Enter')
  check('Enter opens the dialog', true, await dialogOpen())
  f = await focused()
  recordStop('Dialog', f)
  check(
    'Focus moves into the dialog (first button)',
    { name: 'Peruuta', inDialog: true },
    { name: f.name, inDialog: f.inDialog },
  )
  const inside = []
  for (let i = 0; i < 6; i++) {
    await press('Tab')
    const s = await focused()
    inside.push(s)
    if (s.name) recordStop('Dialog (Tab)', s)
  }
  const outside = inside.filter((s) => s.name !== null && !s.inDialog)
  check(
    'Tab never reaches page content behind the dialog',
    [],
    outside.map((s) => s.name),
  )
  check(
    'Tab cycles through the dialog buttons',
    true,
    inside.some((s) => s.name === 'Nollaa edistyminen' && s.inDialog) &&
      inside.some((s) => s.name === 'Peruuta'),
  )
  current.note = `Focus sequence inside the dialog: ${inside.map((s) => s.name ?? '(browser UI / nothing in page)').join(' → ')}`
  await press('Escape')
  check('Escape closes the dialog', false, await dialogOpen())
  f = await focused()
  check(
    'Focus returns to "Nollaa edistyminen" on the page',
    { name: 'Nollaa edistyminen', inDialog: false },
    { name: f.name, inDialog: f.inDialog },
  )
  check('Escape kept all progress', before, await storage())

  test(
    'K08',
    'Reset dialog: Peruuta with Enter, then confirm with Space',
    'Open with Space; press Enter on Peruuta. Open with Enter; Tab to the confirm button; press Space.',
  )
  await press('Space')
  check('Space opens the dialog', true, await dialogOpen())
  f = await focused()
  check('Focus on Peruuta', 'Peruuta', f.name)
  await press('Enter')
  check('Enter on Peruuta closes the dialog', false, await dialogOpen())
  f = await focused()
  check(
    'Focus returns to "Nollaa edistyminen"',
    { name: 'Nollaa edistyminen', inDialog: false },
    { name: f.name, inDialog: f.inDialog },
  )
  check('Peruuta kept all progress', before, await storage())
  await press('Enter')
  await tabTo('Dialog', (n) => n === 'Nollaa edistyminen', { max: 3 })
  f = await focused()
  check(
    'Tab reaches the confirm button inside the dialog',
    { name: 'Nollaa edistyminen', inDialog: true },
    { name: f.name, inDialog: f.inDialog },
  )
  await press('Space')
  check(
    'Space on the confirm button closes the dialog',
    false,
    await dialogOpen(),
  )
  check(
    'Progress cleared',
    {
      studiedSentenceIds: [],
      currentCardByTopic: {},
      completionCountByTopic: {},
    },
    await storage(),
  )
  f = await focused()
  current.note = `Focus after confirming: ${f.name ?? '(nothing focused)'}`
  check(
    'Focus is on a control of the page after confirming',
    true,
    f.name !== null && !f.inDialog,
  )

  test(
    'K09',
    'Focus visibility at every stop',
    'All focus stops recorded above in this viewport.',
  )
  const mine = focusLog.filter((s) => s.viewport === viewport.name)
  const bad = mine.filter((s) => !s.ok)
  check(
    `All ${mine.length} focus stops: focus-visible, outline shown, at least partly visible and not under the sticky nav`,
    [],
    bad.map(
      (s) =>
        `${s.where}: ${s.name} (visible ${s.visibleShare}, ${s.indicator}, focus-visible ${s.focusVisible})`,
    ),
  )
  const partly = mine.filter((s) => s.ok && s.visibleShare < 1)
  current.note = partly.length
    ? `Partly visible (some of the element off screen or under the nav): ${partly.map((s) => `${s.where}: ${s.name} ${Math.round(s.visibleShare * 100)} %`).join('; ')}`
    : 'Every focus stop was fully visible.'
}

// ------------------------------------------------------------------ report

let crash = null
for (const v of VIEWPORTS) {
  viewport = v
  try {
    await run()
  } catch (e) {
    crash = `${v.name}: ${e.message}`
    break
  }
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
  viewports:
    VIEWPORTS.map((v) => v.name).join(', ') +
    ' (headless, focus emulation on, fresh temporary profile)',
  input:
    'DevTools Input.dispatchKeyEvent (Tab, Shift+Tab, Enter, Space, Escape) only',
  node: process.version,
  os: `${platform()} ${release()}`,
}
const checks = results.flatMap((t) => t.checks)
const failed = checks.filter((c) => !c.pass)
const esc = (v) => String(v).replace(/\|/g, '\\|')
const fmt = (v) => '`' + esc(JSON.stringify(v)) + '`'
const lines = [
  '# Keyboard-only demo route test: results',
  '',
  'Generated by `node tests/keyboard.e2e.mjs`. Automated keyboard test; not',
  'participant testing and not a screen-reader test.',
  '',
  '## Environment',
  '',
  '| | |',
  '|---|---|',
  ...Object.entries(env).map(([k, v]) => `| ${k} | ${esc(v)} |`),
  '',
  '## Summary',
  '',
  `${results.length} tests, ${checks.length} checks: **${checks.length - failed.length} passed, ${failed.length} failed**${crash ? `. Run stopped early: ${crash}` : ''}.`,
  '',
  '## Results',
  '',
]
for (const t of results) {
  const ok = t.checks.length > 0 && t.checks.every((c) => c.pass)
  lines.push(
    `### ${t.id} ${t.title}: ${ok ? 'PASS' : 'FAIL'}`,
    '',
    `Keys: ${t.steps}`,
    '',
  )
  if (t.note) lines.push(`Note: ${esc(t.note)}`, '')
  lines.push('| Check | Expected | Actual | Result |', '|---|---|---|---|')
  for (const c of t.checks)
    lines.push(
      `| ${esc(c.what)} | ${fmt(c.expected)} | ${fmt(c.actual)} | ${c.pass ? 'pass' : '**FAIL**'} |`,
    )
  lines.push('')
}
lines.push(
  '## Focus stops',
  '',
  'Every stop reached by Tab or Shift+Tab. "Visible" is the share of a 5×5 grid of points on the element that are on screen, below the sticky nav and not covered by another element.',
  '',
  '| Viewport | Where | Focused | Indicator | :focus-visible | Visible | OK |',
  '|---|---|---|---|---|---|---|',
  ...focusLog.map(
    (s) =>
      `| ${s.viewport} | ${esc(s.where)} | ${esc(s.name ?? '(none)')} | ${esc(s.indicator ?? '')} | ${s.focusVisible ?? ''} | ${s.visibleShare ?? ''} | ${s.ok ? 'yes' : '**no**'} |`,
  ),
  '',
  '## Scope and limitations',
  '',
  '- Headless Chromium (Edge) only; key events come from the DevTools protocol, which the browser treats as real (trusted) keyboard input. Other browsers, real hardware keyboards and operating-system focus behaviour were not tested.',
  '- Page loads by URL are used only to start each part of the route from a known page; within each part, all navigation and activation use the keyboard.',
  '- "Visible focus" checks that an outline is drawn, `:focus-visible` matches and part of the element is on screen and uncovered. Outline contrast is measured separately (docs/contrast-report.md); outline size/area (WCAG 2.4.13, AAA) is not assessed.',
  '- Tab stops after the last control on a page or in the dialog leave the page (browser UI); headless Edge has no browser UI, so those stops show as "(none)".',
  '- No screen reader was used; announcements, names and roles are not verified here.',
  '',
)
writeFileSync(RESULTS_FILE, lines.join('\n'))
console.log(
  `${checks.length - failed.length}/${checks.length} checks passed${crash ? ` (stopped early: ${crash})` : ''}. Report: ${RESULTS_FILE}`,
)
for (const fl of failed)
  console.log(
    `FAIL ${fl.what}: expected ${JSON.stringify(fl.expected)}, actual ${JSON.stringify(fl.actual)}`,
  )
process.exitCode = failed.length || crash ? 1 : 0
