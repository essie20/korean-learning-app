// Browser zoom and reflow tests for Home, Topics, Study (help closed/open),
// Topic Complete, Progress and the reset dialog.
//
// Three separate configurations:
//   zoom-200   real browser zoom 200 % in a 1280×800 window
//   zoom-400   real browser zoom 400 % in the same window (≈ 320 CSS px wide)
//   vp-320     a 320 CSS px wide viewport at 100 % zoom (no zoom)
//
// Browser zoom is the browser's own page-zoom setting (Settings > Appearance >
// Page zoom), stored as the profile preference partition.default_zoom_level
// in a fresh temporary profile before the browser starts. It is NOT CSS zoom,
// device-scale-factor emulation or pinch zoom; each run records
// devicePixelRatio, the layout viewport and visualViewport.scale to show this.
//
// Checks per page/state: horizontal scrolling, clipped text, overlapping
// controls, and controls that cannot be scrolled to and hit.
//
// Usage (dev server running, e.g. `npm run dev`):
//   node tests/zoom-reflow.e2e.mjs
// Options (environment variables):
//   APP_URL       app root, default http://localhost:5173/
//   BROWSER_PATH  Edge/Chrome executable, default: Edge on Windows
//   RESULTS_FILE  report path, default docs/zoom-reflow-test-results.md
//   SHOTS_DIR     optional folder for one screenshot per page/state
//
// Needs Node 22+ (built-in fetch and WebSocket). No npm dependencies.

import { execSync, spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir, release, platform } from 'node:os'
import { join } from 'node:path'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5173/').replace(
  /\/?$/,
  '/',
)
const BROWSER_PATH =
  process.env.BROWSER_PATH ??
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const RESULTS_FILE =
  process.env.RESULTS_FILE ?? 'docs/zoom-reflow-test-results.md'
const SHOTS_DIR = process.env.SHOTS_DIR ?? null
const STORAGE_KEY = 'korean-learning-app-progress'
// The window is 24 px wider/taller than the content area in headless Edge,
// so this gives a 1280×800 layout viewport at 100 % zoom.
const WINDOW = { width: 1304, height: 824 }
const CONFIGS = [
  { id: 'zoom-200', label: 'Browser zoom 200 % (1280×800 window)', zoom: 200 },
  { id: 'zoom-400', label: 'Browser zoom 400 % (1280×800 window)', zoom: 400 },
  {
    id: 'vp-320',
    label: '320 CSS px viewport, 100 % zoom',
    zoom: 100,
    viewport: { width: 320, height: 640 },
  },
]
// Test data written to the fresh profile so every page has content to show:
// topic 1 completed once, topic 9 in progress at sentence 4 (the longest
// pronunciation help on main: ŭ, dj, tš, w).
const SEED = {
  studiedSentenceIds: [1, 2, 3, 4, 5]
    .map((n) => `topic-01-sentence-0${n}`)
    .concat([1, 2, 3, 4].map((n) => `topic-09-sentence-0${n}`)),
  currentCardByTopic: { 'topic-09': 3 },
  completionCountByTopic: { 'topic-01': 1 },
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ------------------------------------------------------------- per config

async function withBrowser(cfg, fn) {
  const profile = mkdtempSync(join(tmpdir(), 'zoom-reflow-e2e-'))
  if (cfg.zoom !== 100) {
    mkdirSync(join(profile, 'Default'), { recursive: true })
    writeFileSync(
      join(profile, 'Default', 'Preferences'),
      JSON.stringify({
        partition: {
          default_zoom_level: { x: Math.log(cfg.zoom / 100) / Math.log(1.2) },
        },
      }),
    )
  }
  const port = 9400 + Math.floor(Math.random() * 400)
  const browser = spawn(
    BROWSER_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      `--window-size=${WINDOW.width},${WINDOW.height}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  )
  let targets
  for (let i = 0; i < 60 && !targets; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
    } catch {
      await sleep(250)
    }
  }
  if (!targets) throw new Error(`Browser did not start: ${BROWSER_PATH}`)
  const version = (
    await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()
  ).Browser
  const ws = new WebSocket(
    targets.find((t) => t.type === 'page').webSocketDebuggerUrl,
  )
  await new Promise((r) => ws.addEventListener('open', r))
  let id = 0
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
      const i = ++id
      pending.set(i, r)
      ws.send(JSON.stringify({ id: i, method, params }))
    })
  const ev = async (expression) => {
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
  try {
    return await fn({ send, ev, version })
  } finally {
    ws.close()
    browser.kill()
    await sleep(500)
    try {
      rmSync(profile, { recursive: true, force: true })
    } catch {
      /* profile may still be locked briefly */
    }
  }
}

// ------------------------------------------------------------- page checks

// Runs in the page. Returns problems found in the current state.
const INSPECT = `(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms))
  const doc = document.documentElement
  const vw = doc.clientWidth, vh = doc.clientHeight
  const modal = document.querySelector('dialog[open]')
  const scope = modal || document.body
  const visible = (el) => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false } const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
  const name = (el) => (el.getAttribute('aria-label') || el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 60)
  const out = { horizontalScroll: Math.max(doc.scrollWidth, document.body.scrollWidth) - vw, clippedText: [], overlaps: [], unreachable: [], controls: 0 }

  // Clipped text: any line of text outside the viewport horizontally, or outside an ancestor that hides overflow
  const tw = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT)
  const seen = new Set()
  for (let n; (n = tw.nextNode());) {
    const p = n.parentElement
    if (!n.textContent.trim() || !p || !visible(p) || seen.has(p)) continue
    const rg = document.createRange(); rg.selectNodeContents(n)
    for (const r of rg.getClientRects()) {
      if (r.width < 1) continue
      let reason = null
      if (r.left < -1 || r.right > vw + 1) reason = 'outside the viewport horizontally'
      for (let a = p; a && a !== doc && !reason; a = a.parentElement) {
        if (a.tagName === 'DIALOG' && a.open && a !== p) { const s = getComputedStyle(a); const b = a.getBoundingClientRect(); if ((s.overflowY === 'hidden' || s.overflowY === 'clip') && (r.top < b.top - 1 || r.bottom > b.bottom + 1)) reason = 'cut off by the dialog'; break }
        const s = getComputedStyle(a)
        const hides = (v) => v === 'hidden' || v === 'clip'
        if (!hides(s.overflowX) && !hides(s.overflowY)) continue
        const b = a.getBoundingClientRect()
        if ((hides(s.overflowX) && (r.left < b.left - 1 || r.right > b.right + 1)) || (hides(s.overflowY) && (r.top < b.top - 1 || r.bottom > b.bottom + 1))) reason = 'cut off by ' + a.tagName.toLowerCase() + (a.className && typeof a.className === 'string' ? '.' + a.className.split(' ').slice(0, 3).join('.') : '')
      }
      if (reason) { out.clippedText.push(name(p) + ' — ' + reason); seen.add(p); break }
    }
  }

  // Controls in scope (the open dialog makes the rest of the page inert)
  const controls = [...scope.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])')].filter(c => visible(c) && !c.disabled)
  out.controls = controls.length
  const nav = document.querySelector('.sticky')
  out.navShareOfViewportHeight = nav && !modal ? +(nav.getBoundingClientRect().height / vh).toFixed(2) : null
  // Overlapping controls (neither contains the other; sticky nav vs content excluded)
  for (let i = 0; i < controls.length; i++) for (let j = i + 1; j < controls.length; j++) {
    const a = controls[i], b = controls[j]
    if (a.contains(b) || b.contains(a)) continue
    if (nav && nav.contains(a) !== nav.contains(b)) continue
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect()
    const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top)
    if (w > 2 && h > 2) out.overlaps.push(name(a) + ' ↔ ' + name(b) + ' (' + Math.round(w) + '×' + Math.round(h) + ' px)')
  }
  // Reachable: scroll each control into view; its centre must be on screen and hit the control itself
  for (const c of controls) {
    const navBottom = nav && !nav.contains(c) && !modal ? nav.getBoundingClientRect().bottom : 0
    c.scrollIntoView({ block: 'center', inline: 'nearest' }); await sleep(30)
    if (navBottom) { window.scrollBy(0, c.getBoundingClientRect().top - navBottom - 4); await sleep(30) }
    const r0 = c.getBoundingClientRect(), x = r0.left + r0.width / 2
    // centre of the part that fits between the nav and the bottom of the viewport
    const y = (Math.max(r0.top, navBottom) + Math.min(r0.bottom, vh)) / 2, r = r0
    let why = null
    if (r.left < -1 || r.right > vw + 1) why = 'extends outside the viewport horizontally'
    else if (y < navBottom || y > vh) why = 'centre cannot be scrolled into view (y=' + Math.round(y) + ')'
    else { const hit = document.elementFromPoint(x, y); if (!hit || !(c === hit || c.contains(hit))) why = 'covered by ' + (hit ? hit.tagName.toLowerCase() + ' "' + name(hit).slice(0, 30) + '"' : 'nothing') }
    if (why) out.unreachable.push(name(c) + ' — ' + why)
  }
  window.scrollTo(0, 0)
  return out
})()`

const ENV = `({ devicePixelRatio, innerWidth, innerHeight, clientWidth: document.documentElement.clientWidth, clientHeight: document.documentElement.clientHeight, visualViewportScale: visualViewport.scale, rootFontSize: getComputedStyle(document.documentElement).fontSize })`

// ------------------------------------------------------------------ run

const results = []
const environments = {}
let browserVersion = 'unknown'
let crash = null

for (const cfg of CONFIGS) {
  try {
    await withBrowser(cfg, async ({ send, ev, version }) => {
      browserVersion = version
      if (cfg.viewport)
        await send('Emulation.setDeviceMetricsOverride', {
          width: cfg.viewport.width,
          height: cfg.viewport.height,
          deviceScaleFactor: 1,
          mobile: false,
        })
      const go = async (route) => {
        await send('Page.navigate', { url: APP_URL + route })
        for (let i = 0; i < 50; i++) {
          if (
            await ev(
              `document.readyState === 'complete' && !!document.querySelector('main')?.children.length`,
            ).catch(() => false)
          )
            break
          await sleep(100)
        }
        await sleep(500)
      }
      const shot = async (state) => {
        if (!SHOTS_DIR) return
        mkdirSync(SHOTS_DIR, { recursive: true })
        const s = await send('Page.captureScreenshot', { format: 'png' })
        writeFileSync(
          join(
            SHOTS_DIR,
            `${cfg.id}-${state.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`,
          ),
          Buffer.from(s.result.data, 'base64'),
        )
      }
      await go('')
      await ev(
        `localStorage.setItem('${STORAGE_KEY}', ${JSON.stringify(JSON.stringify(SEED))})`,
      )
      environments[cfg.id] = { label: cfg.label, ...(await ev(ENV)) }

      const states = [
        ['Home', async () => go('')],
        ['Topics', async () => go('aiheet')],
        [
          'Study, help closed (topic 9, 4/5)',
          async () => go('aiheet/topic-09/opiskelu'),
        ],
        [
          'Study, help open (topic 9, 4/5)',
          async () => {
            await go('aiheet/topic-09/opiskelu')
            await ev(`document.querySelector('[aria-controls]').click()`)
            await sleep(400)
          },
        ],
        ['Topic Complete (topic 1)', async () => go('aiheet/topic-01/valmis')],
        ['Progress', async () => go('edistyminen')],
        [
          'Reset dialog open',
          async () => {
            await go('edistyminen')
            await ev(
              `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Nollaa edistyminen').click()`,
            )
            await sleep(400)
          },
        ],
      ]
      for (const [state, open] of states) {
        await open()
        const setupOk = state.startsWith('Study, help open')
          ? await ev(
              `!!document.querySelector('[role=region][aria-label="Ääntämysohje"]')`,
            )
          : state === 'Reset dialog open'
            ? await ev(`!!document.querySelector('dialog[open]')`)
            : true
        await shot(state)
        const r = await ev(INSPECT)
        results.push({ config: cfg.id, state, setupOk, ...r })
      }
      const stored = await ev(`localStorage.getItem('${STORAGE_KEY}')`)
      environments[cfg.id].seedUnchanged = stored === JSON.stringify(SEED)
    })
  } catch (e) {
    crash = `${cfg.id}: ${e.message}`
    break
  }
}

// ----------------------------------------------------------------- report

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
const esc = (v) => String(v).replace(/\|/g, '\\|')
const pass = (r) =>
  r.setupOk &&
  r.horizontalScroll <= 1 &&
  !r.clippedText.length &&
  !r.overlaps.length &&
  !r.unreachable.length
const failed = results.filter((r) => !pass(r))
const lines = [
  '# Browser zoom and reflow test: results',
  '',
  'Generated by `node tests/zoom-reflow.e2e.mjs`. Automated browser test; not participant testing.',
  '',
  '## Environment',
  '',
  '| | |',
  '|---|---|',
  `| date | ${new Date().toISOString()} |`,
  `| commit | ${git('rev-parse HEAD')} |`,
  `| branch | ${git('rev-parse --abbrev-ref HEAD')} |`,
  `| appSourceChanges | ${dirty === '' ? 'none (src, public, index.html, package.json, vite.config.ts clean)' : esc(dirty.replace(/\n/g, '; '))} |`,
  `| appUrl | ${APP_URL} |`,
  `| browser | ${browserVersion} (headless, fresh temporary profile per configuration) |`,
  `| node | ${process.version} |`,
  `| os | ${platform()} ${release()} |`,
  `| test data | localStorage seeded in the fresh profile: topic 1 completed once, topic 9 at sentence 4 (9 sentences studied) |`,
  '',
  '### Configurations as measured in the browser',
  '',
  'Real browser zoom shows as `devicePixelRatio` = zoom factor and a layout viewport reduced by the same factor, with `visualViewport.scale` 1 (not pinch zoom) and the root font size unchanged at 16px (not CSS zoom).',
  '',
  '| Configuration | devicePixelRatio | Layout viewport (CSS px, excl. scrollbar) | visualViewport.scale | Root font size | Seed data unchanged after run |',
  '|---|---|---|---|---|---|',
  ...Object.values(environments).map(
    (e) =>
      `| ${e.label} | ${e.devicePixelRatio} | ${e.clientWidth}×${e.clientHeight} | ${e.visualViewportScale} | ${e.rootFontSize} | ${e.seedUnchanged} |`,
  ),
  '',
  '## Summary',
  '',
  `${results.length} page states checked: **${results.length - failed.length} passed, ${failed.length} failed**${crash ? `. Run stopped early: ${crash}` : ''}.`,
  '',
  'A state passes when: no horizontal scrolling (page wider than the viewport by more than 1 px), no clipped text, no overlapping controls (a sticky-nav control over scrolled content is not counted), and every control can be scrolled to just below the sticky nav with the visible part of it on screen and not covered. The share of the viewport height taken by the sticky nav is recorded as an observation, not a pass/fail criterion.',
  '',
  '## Results',
  '',
  '| Configuration | Page / state | Horizontal overflow (px) | Clipped text | Overlapping controls | Unreachable controls | Controls checked | Sticky nav height / viewport height | Result |',
  '|---|---|---|---|---|---|---|---|---|',
  ...results.map(
    (r) =>
      `| ${r.config} | ${esc(r.state)}${r.setupOk ? '' : ' (setup failed)'} | ${r.horizontalScroll} | ${r.clippedText.length ? esc(r.clippedText.join('; ')) : 'none'} | ${r.overlaps.length ? esc(r.overlaps.join('; ')) : 'none'} | ${r.unreachable.length ? esc(r.unreachable.join('; ')) : 'none'} | ${r.controls} | ${r.navShareOfViewportHeight === null ? 'n/a (dialog)' : Math.round(r.navShareOfViewportHeight * 100) + ' %'} | ${pass(r) ? 'pass' : '**FAIL**'} |`,
  ),
  '',
  '## Scope and limitations',
  '',
  "- One browser engine (Chromium/Edge, headless). Browser zoom is set through the profile's default page-zoom preference before start-up, which is the same setting as the zoom control in the browser UI; other browsers implement zoom separately.",
  '- **Text-only resizing (font size only, layout unchanged) was not tested.** Browser zoom scales the whole page.',
  '- The 320 CSS px configuration is a viewport test at 100 % zoom and is reported separately from 400 % browser zoom. At 400 % in a 1280×800 window the layout viewport is about 320×200 CSS px, so very little fits vertically; only horizontal reflow and reachability are judged, not how much fits on screen.',
  '- "Clipped text" means a line of text lies outside the viewport horizontally or outside an ancestor that hides overflow. Text cut inside a single line box (e.g. by `text-overflow`) or visually overlapping other text is not detected.',
  '- "Unreachable" means the control cannot be scrolled so that its centre is on screen and receives a pointer hit. Keyboard reachability is covered by tests/keyboard.e2e.mjs at 100 % zoom only.',
  '- The pronunciation help and reset dialog were opened with a JavaScript click (this test is about layout, not input).',
  '- Visual quality (spacing, readability of the layout at zoom) is not judged automatically.',
  '',
]
writeFileSync(RESULTS_FILE, lines.join('\n'))
console.log(
  `${results.length - failed.length}/${results.length} states passed${crash ? ` (stopped early: ${crash})` : ''}. Report: ${RESULTS_FILE}`,
)
for (const r of failed)
  console.log(
    `FAIL ${r.config} ${r.state}: hscroll ${r.horizontalScroll}, clipped ${r.clippedText.length}, overlaps ${r.overlaps.length}, unreachable ${r.unreachable.length}, setup ${r.setupOk}`,
  )
process.exitCode = failed.length || crash ? 1 : 0
