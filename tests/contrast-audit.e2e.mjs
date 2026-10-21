// Contrast and focus-indicator audit of the rendered app, reporting the
// MINIMUM contrast of every measured element (plus 5th percentile and median).
//
// Covers the gaps left by docs/contrast-report.md (E3): every text run, icon
// and focus outline on Home, Topics, Progress, Study (help closed/open,
// no-notes fallback, longest help), Topic Complete and the reset dialog, in
// states without and with progress, at 375×812 and 1280×800, in default,
// hover and keyboard-focus states. Element/state combinations that E3 already
// measured on identical code are skipped (see E3_COVERED) and reused from E3.
//
// Method (same as E3):
// - Foreground: computed colour converted to sRGB by the browser's canvas,
//   multiplied by effective opacity. Gradient text: the gradient as painted.
// - Background: real pixels from viewport screenshots in which only glyph
//   fills, small icons and focus outlines are hidden (validated to change
//   nothing else). Default states are captured at several scroll positions
//   (fixed photo background, sticky nav); each element's pixels from all
//   positions where it is visible below the nav are pooled.
// - Gradient text: normal, background-only and gradient-painted captures;
//   only fully covered glyph pixels are paired with the background pixel at
//   the same position.
// - Hover: real mouse move over each control. Focus: real Tab key presses;
//   outline colour compared with the ring of pixels it occupies.
//
// Usage (dev server running):  node tests/contrast-audit.e2e.mjs
// Options: APP_URL, BROWSER_PATH, RESULTS_FILE (markdown), DATA_FILE (JSON),
//   FILTER_STATES (state labels separated by commas, or by semicolons when a
//   label itself contains a comma, e.g. "Topics (with progress)")
//   and FILTER_NAME (regular expression on the element name) to re-measure
//   selected elements only. For a single label that contains a comma, end it
//   with a semicolon ("Study 1/5, help closed;"). A run fails without writing
//   results if no or an unknown state is requested, or if nothing was measured.
//   CHECK_FILTERS_ONLY=1 validates the filters, prints the selected states
//   and exits without measuring.
// Needs Node 22+. No npm dependencies.

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
const RESULTS_FILE =
  process.env.RESULTS_FILE ?? 'docs/contrast-focus-audit-results.md'
const DATA_FILE = process.env.DATA_FILE ?? 'docs/contrast-focus-audit-data.json'
const STORAGE_KEY = 'korean-learning-app-progress'
const STATE_FILTER = process.env.FILTER_STATES
  ? process.env.FILTER_STATES.split(
      process.env.FILTER_STATES.includes(';') ? ';' : ',',
    )
      .map((x) => x.trim())
      .filter(Boolean)
  : null
const NAME_FILTER = process.env.FILTER_NAME
  ? new RegExp(process.env.FILTER_NAME)
  : null
const wanted = (name) => !NAME_FILTER || NAME_FILTER.test(name)
const VIEWPORTS = [
  { name: '375×812', width: 375, height: 812, mobile: true },
  { name: '1280×800', width: 1280, height: 800, mobile: false },
]
// Progress used for the "with progress" states: topic 1 completed and being
// repeated (at 2/5), topic 9 in progress (4/5), other topics not started.
const SEED = {
  studiedSentenceIds: [1, 2, 3, 4, 5]
    .map((n) => `topic-01-sentence-0${n}`)
    .concat([1, 2, 3, 4].map((n) => `topic-09-sentence-0${n}`)),
  currentCardByTopic: { 'topic-01': 1, 'topic-09': 3 },
  completionCountByTopic: { 'topic-01': 1 },
}
// Measured in E3 (docs/contrast-report.md) on code identical to this commit,
// in states WITHOUT progress. Matched by element name; skipped here only in
// the listed pages and conditions.
const E3_COVERED = [
  // [no-progress state, condition, kind, element name]
  ...['Home', 'Topics', 'Progress', 'Study 1/5, help closed'].map((st) => [
    st,
    'default',
    'text',
    /^Pieniä lauseita, suuria hetkiä$/,
  ]),
  ['Home', 'hover', 'text', /^Pieniä lauseita, suuria hetkiä$/],
  ['Home', 'focus', 'text', /^Pieniä lauseita, suuria hetkiä$/],
  ['Home', 'focus', 'focus', /^Koreaa lauseilla/],
  ['Home', 'default', 'text', /^10 aihetta · 50 lausetta$/],
  ['Home', 'default', 'text', /^valmiina$/],
  ['Home', 'default', 'gradient text', /^arkilauseilla$/],
  ['Home', 'default', 'text', /^안녕하세요!$/],
  ['Home', 'default', 'text', /^Opi hyödyllisiä/],
  ['Topics', 'default', 'text', /^선택하세요 · Valitse aihe$/],
  ...['default', 'hover', 'focus'].map((c) => [
    'Topics',
    c,
    'text',
    /^Aihe \d\d$/,
  ]),
  ['Topics', 'focus', 'focus', /Aihe \d\d/],
  [
    'Progress',
    'default',
    'text',
    /^(Kokonaisedistyminen|Suoritetut aiheet|Suoritukset yhteensä)$/,
  ],
  ['Progress', 'default', 'text', /^Aihe (01|10)$/],
  ['Study 1/5, help closed', 'default', 'text', /^·$/],
  ...['default', 'hover', 'focus'].map((c) => [
    'Study 1/5, help open (ŏ)',
    c,
    'icon',
    /^Sulje ääntämysohje$/,
  ]),
  ['Study 1/5, help open (ŏ)', 'focus', 'focus', /^Sulje ääntämysohje$/],
]
const e3Covers = (state, item, condition) =>
  !state.withProgress &&
  E3_COVERED.some(
    ([st, c, kind, re]) =>
      st === state.name &&
      c === condition &&
      kind === item.kind &&
      re.test(item.name),
  )

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------- browser

const profile = mkdtempSync(join(tmpdir(), 'contrast-audit-'))
const PORT = 9400 + Math.floor(Math.random() * 400)
const browser = spawn(
  BROWSER_PATH,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    'about:blank',
  ],
  { stdio: 'ignore' },
)
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
async function call(fn, ...args) {
  const win = await send('Runtime.evaluate', { expression: 'window' })
  const r = await send('Runtime.callFunctionOn', {
    functionDeclaration: fn,
    objectId: win.result.result.objectId,
    arguments: args.map((value) => ({ value })),
    awaitPromise: true,
    returnByValue: true,
  })
  if (r.result?.exceptionDetails)
    throw new Error(r.result.exceptionDetails.exception?.description)
  return r.result?.result?.value
}
const shot = async () =>
  'data:image/png;base64,' +
  (await send('Page.captureScreenshot', { format: 'png' })).result.data
async function tab() {
  for (const type of ['keyDown', 'keyUp'])
    await send('Input.dispatchKeyEvent', {
      type,
      key: 'Tab',
      code: 'Tab',
      windowsVirtualKeyCode: 9,
    })
  await sleep(120)
}
async function mouseTo(x, y) {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y })
  await sleep(120)
}

// ------------------------------------------------------------ in-page code

const INSTALL = `(() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const g = cv.getContext('2d', { willReadFrequently: true })
  const toRGBA = (css) => { if (!css || css === 'transparent' || css === 'none') return [0, 0, 0, 0]; g.clearRect(0, 0, 1, 1); g.fillStyle = '#000'; g.fillStyle = css; g.fillRect(0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data
    const m = /\\/\\s*([\\d.]+%?)\\s*\\)$|rgba\\([^)]*,\\s*([\\d.]+)\\)$/.exec(css); let a = 1
    if (m) a = m[1] ? (m[1].endsWith('%') ? parseFloat(m[1]) / 100 : parseFloat(m[1])) : parseFloat(m[2])
    return [d[0], d[1], d[2], a] }
  const opacityOf = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o }
  const visible = (el) => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false } return true }
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
  const L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
  const ratio = (a, b) => { const x = Math.max(L(a), L(b)), y = Math.min(L(a), L(b)); return (x + 0.05) / (y + 0.05) }
  const hex = (c) => '#' + c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
  const decode = async (url) => { const img = new Image(); img.src = url; await img.decode(); const c = new OffscreenCanvas(img.width, img.height); const x = c.getContext('2d'); x.drawImage(img, 0, 0); return { W: img.width, H: img.height, D: x.getImageData(0, 0, img.width, img.height).data } }
  const ctlName = (el) => (el.getAttribute('aria-label') || el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 70)
  window.__ca = { toRGBA, opacityOf, visible, ratio, hex, decode, ctlName, acc: {} }
  if (!document.getElementById('__ca_nt')) { const st = document.createElement('style'); st.id = '__ca_nt'; st.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}'; document.head.append(st) }
})()`

// Collect measurable items inside a root (document body, a dialog, or one control)
const COLLECT = `function (rootSel) {
  const { toRGBA, opacityOf, visible, ctlName } = window.__ca
  const modal = document.querySelector('dialog[open]')
  const root = rootSel ? document.querySelector(rootSel) : (modal || document.body)
  document.querySelectorAll('[data-ca]').forEach(e => { e.removeAttribute('data-ca'); e.removeAttribute('data-ca-icon'); e.removeAttribute('data-ca-grad') })
  const items = []; let n = 0
  const groups = new Map(); const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let t; (t = tw.nextNode());) { if (!t.textContent.trim()) continue; const p = t.parentElement; if (!p || ['SCRIPT', 'STYLE', 'TITLE'].includes(p.tagName)) continue; if (!groups.has(p)) groups.set(p, []); groups.get(p).push(t) }
  for (const [el, nodes] of groups) {
    if (!visible(el)) continue
    const s = getComputedStyle(el), size = parseFloat(s.fontSize), weight = parseInt(s.fontWeight)
    const ctl = el.closest('button,a')
    const base = { name: nodes.map(t => t.textContent).join(' ').replace(/\\s+/g, ' ').trim().slice(0, 70), size, weight, large: size >= 24 || (size >= 18.66 && weight >= 700), opacity: opacityOf(el),
      disabled: !!el.closest('button:disabled'), decorative: !!el.closest('[aria-hidden=true]'), control: ctl ? ctlName(ctl) : null, inHelp: !!el.closest('[role=region][aria-label="Ääntämysohje"]') }
    const id = 'ca' + (n++); el.setAttribute('data-ca', id)
    const fg = toRGBA(s.color)
    if (fg[3] === 0 && s.backgroundClip === 'text') { el.setAttribute('data-ca-grad', ''); items.push({ ...base, id, kind: 'gradient text', css: s.backgroundImage.slice(0, 120), stops: (s.backgroundImage.match(/(oklch|oklab|rgba?|hsla?|color)([^)]*)/g) || []).map(toRGBA) }) }
    else items.push({ ...base, id, kind: 'text', fg, css: s.color })
  }
  for (const svg of root.querySelectorAll('svg')) {
    if (!visible(svg)) continue
    const r = svg.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || r.width > 64 || r.height > 64) continue
    const sh = [...svg.querySelectorAll('path,circle,rect,line,polyline,polygon,ellipse')].map(e => getComputedStyle(e)).map(cs => cs.stroke !== 'none' && !cs.stroke.startsWith('url') ? cs.stroke : cs.fill).find(c => c && c !== 'none' && !c.startsWith('url'))
    if (!sh) continue
    const ctl = svg.closest('button,a'); const ctlText = ctl ? [...ctl.childNodes].filter(c => !(c.nodeType === 1 && c.tagName.toLowerCase() === 'svg')).map(c => c.textContent).join('').trim() : ''
    const id = 'ca' + (n++); svg.setAttribute('data-ca', id); svg.setAttribute('data-ca-icon', '')
    items.push({ id, kind: 'icon', name: ctl ? ctlName(ctl) : '(icon ' + Math.round(r.width) + 'px)', control: ctl ? ctlName(ctl) : null, iconOnly: !!ctl && !ctlText, decorative: !ctl, disabled: !!svg.closest('button:disabled'), fg: toRGBA(sh), css: sh, opacity: opacityOf(svg), inHelp: !!svg.closest('[role=region][aria-label="Ääntämysohje"]') || /ääntämysohje/i.test(ctl ? ctlName(ctl) : '') })
  }
  return items
}`

// Boxes of an item in viewport coordinates
const BOXES = `function (id) {
  const el = document.querySelector('[data-ca="' + id + '"]'); if (!el) return []
  if (el.hasAttribute('data-ca-icon')) { const r = el.getBoundingClientRect(); return [{ x: r.left, y: r.top, w: r.width, h: r.height }] }
  const out = []; for (const t of el.childNodes) if (t.nodeType === 3 && t.textContent.trim()) { const rg = document.createRange(); rg.selectNodeContents(t); for (const r of rg.getClientRects()) if (r.width > 0.5) out.push({ x: r.left, y: r.top, w: r.width, h: r.height }) }
  return out }`

const HIDE = `*,*::before,*::after{-webkit-text-fill-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important;caret-color:transparent!important}
  svg[data-ca-icon]{visibility:hidden!important} [data-ca-grad]{background-image:none!important} :focus-visible{outline-color:transparent!important}`
const PAINT = `[data-ca-grad]{-webkit-background-clip:border-box!important;background-clip:border-box!important}`
const style = (id, css) =>
  ev(
    `(() => { let s = document.getElementById('${id}'); if (!s) { s = document.createElement('style'); s.id = '${id}'; document.head.append(s) } s.textContent = ${JSON.stringify(css)} })()`,
  )
const unstyle = (id) => ev(`document.getElementById('${id}')?.remove()`)

// Pool per-pixel ratios for items from one set of captures. clip = visible band [top, bottom].
const ACCUMULATE = `async function (items, bgUrl, normalUrl, paintUrl, clipTop, clipBottom, extraFg) {
  const { decode, ratio, hex, acc } = window.__ca
  const B = await decode(bgUrl), A = normalUrl ? await decode(normalUrl) : null, C = paintUrl ? await decode(paintUrl) : null
  const px = (I, x, y) => { const o = (y * I.W + x) * 4; return [I.D[o], I.D[o + 1], I.D[o + 2]] }
  for (const it of items) {
    const a = (acc[it.key] ??= { r: [], min: 99 })
    const fgNow = extraFg?.[it.id] ?? it.fg
    for (const r of it.boxes) {
      const y0 = Math.max(Math.floor(r.y), clipTop, 0), y1 = Math.min(Math.ceil(r.y + r.h), clipBottom, B.H), x0 = Math.max(Math.floor(r.x), 0), x1 = Math.min(Math.ceil(r.x + r.w), B.W)
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const b = px(B, x, y); let f
        if (it.kind === 'gradient text') { const c = px(C, x, y), n = px(A, x, y)
          if (Math.abs(c[0] - b[0]) + Math.abs(c[1] - b[1]) + Math.abs(c[2] - b[2]) <= 12) continue
          if (it.stops?.length >= 2) { const [p0, p1] = it.stops; const d = [0, 1, 2].map(k => p1[k] - p0[k]); const len2 = d.reduce((q, v) => q + v * v, 0) || 1; const t = Math.max(0, Math.min(1, [0, 1, 2].reduce((q, k) => q + (c[k] - p0[k]) * d[k], 0) / len2)); const dist = Math.hypot(...[0, 1, 2].map(k => c[k] - (p0[k] + t * d[k]))); if (dist > 40) continue }
          if (Math.abs(n[0] - c[0]) + Math.abs(n[1] - c[1]) + Math.abs(n[2] - c[2]) > 12) continue
          f = c }
        else { const al = fgNow[3] * (it.opacity ?? 1); f = [0, 1, 2].map(k => fgNow[k] * al + b[k] * (1 - al)) }
        const v = ratio(f, b); a.r.push(v); if (v < a.min) { a.min = v; a.minFg = hex(f); a.minBg = hex(b) }
      }
    }
  }
  return true }`
const SUMMARIZE = `function (key) { const a = window.__ca.acc[key]; delete window.__ca.acc[key]; if (!a || !a.r.length) return null
  const r = a.r.sort((p, q) => p - q); return { n: r.length, min: +r[0].toFixed(2), p5: +r[Math.floor(r.length * 0.05)].toFixed(2), median: +r[Math.floor(r.length / 2)].toFixed(2), minFg: a.minFg, minBg: a.minBg } }`

// --------------------------------------------------------------- measuring

const records = []
const skipped = []
function threshold(it) {
  if (it.kind === 'focus') return 3
  if (it.kind === 'icon') return 3
  return it.large ? 3 : 4.5
}
function requirement(it) {
  if (it.disabled) return 'exempt (disabled control)'
  if (it.kind === 'focus') return 'required (1.4.11 focus indicator)'
  if (it.kind === 'icon')
    return it.iconOnly
      ? 'required (1.4.11, icon-only control)'
      : it.decorative
        ? 'not required (decorative)'
        : 'not required (control has a text label)'
  if (it.decorative) return 'required? (text inside aria-hidden decoration)'
  return 'required (1.4.3 text)'
}

async function captureSet(items, clipTop, clipBottom, extraFg) {
  const hasGrad = items.some((i) => i.kind === 'gradient text')
  const normal = hasGrad ? await shot() : null
  await style('__ca_hide', HIDE)
  await sleep(60)
  const bg = await shot()
  await unstyle('__ca_hide')
  let paint = null
  if (hasGrad) {
    await style('__ca_paint', PAINT)
    await sleep(60)
    paint = await shot()
    await unstyle('__ca_paint')
  }
  await call(
    ACCUMULATE,
    items,
    bg,
    normal,
    paint,
    clipTop,
    clipBottom,
    extraFg ?? null,
  )
}

async function measureDefault(state, vp) {
  const items = await call(COLLECT, null)
  const keep = items.filter((it) => {
    if (!wanted(it.name)) return false
    if (e3Covers(state, it, 'default')) {
      skipped.push({
        state: state.name,
        vp: vp.name,
        condition: 'default',
        name: it.name,
        kind: it.kind,
      })
      return false
    }
    return true
  })
  const modal = await ev(`!!document.querySelector('dialog[open]')`)
  const geo = await ev(
    `({ docH: document.documentElement.scrollHeight, vh: innerHeight, navBottom: (() => { const s = document.querySelector('.sticky'); return s ? Math.ceil(s.getBoundingClientRect().height) : 0 })() })`,
  )
  const ys = modal
    ? [0]
    : [
        ...new Set([
          ...Array.from(
            {
              length:
                Math.ceil(
                  Math.max(0, geo.docH - geo.vh) / Math.floor(geo.vh / 3),
                ) + 1,
            },
            (_, k) =>
              Math.min(
                k * Math.floor(geo.vh / 3),
                Math.max(0, geo.docH - geo.vh),
              ),
          ),
        ]),
      ]
  for (const it of keep) it.key = `${state.name}|${vp.name}|default|${it.id}`
  for (const y of ys) {
    await ev(`window.scrollTo(0, ${y})`)
    await sleep(150)
    const sy = await ev('scrollY')
    const inNav = await ev(
      `[...document.querySelectorAll('[data-ca]')].filter(e => e.closest('.sticky')).map(e => e.getAttribute('data-ca'))`,
    )
    const batch = []
    for (const it of keep) {
      const isNav = inNav.includes(it.id)
      if (isNav && sy !== 0) continue
      batch.push({
        ...it,
        boxes: await call(BOXES, it.id),
        clipTop: isNav || modal ? 0 : geo.navBottom,
      })
    }
    // two passes: nav items (no clip) and content items (clipped below the nav)
    await captureSet(
      batch.filter((b) => b.clipTop === 0),
      0,
      geo.vh,
    )
    const content = batch.filter((b) => b.clipTop !== 0)
    if (content.length) await captureSet(content, geo.navBottom, geo.vh)
  }
  await ev('window.scrollTo(0, 0)')
  for (const it of keep)
    records.push({
      state: state.name,
      withProgress: state.withProgress,
      vp: vp.name,
      condition: 'default',
      ...strip(it),
      need: threshold(it),
      requirement: requirement(it),
      ...(await call(SUMMARIZE, it.key)),
    })
}
const strip = ({ id, key, boxes, fg, opacity, ...rest }) => ({
  ...rest,
  fg: fg
    ? '#' +
      fg
        .slice(0, 3)
        .map((v) => v.toString(16).padStart(2, '0'))
        .join('') +
      (fg[3] < 1 ? ` @${fg[3]}` : '')
    : null,
})

// Controls in scope, with a stable selector
async function controls() {
  return ev(`(() => { const modal = document.querySelector('dialog[open]'); const scope = modal || document
    return [...scope.querySelectorAll('a[href], button')].filter(c => window.__ca.visible(c) && !c.disabled && c.getBoundingClientRect().width > 0).map((c, i) => { c.setAttribute('data-ca-ctl', String(i)); return { idx: i, name: window.__ca.ctlName(c) } }) })()`)
}
async function placeBelowNav(sel) {
  return ev(`(() => { const c = document.querySelector('${sel}'); const nav = document.querySelector('.sticky'); const modal = document.querySelector('dialog[open]')
    c.scrollIntoView({ block: 'center' }); const nb = nav && !nav.contains(c) && !modal ? nav.getBoundingClientRect().bottom : 0
    const r = c.getBoundingClientRect(); if (r.top < nb + 8) window.scrollBy(0, r.top - nb - 8)
    const q = c.getBoundingClientRect(); return { x: q.left + q.width / 2, y: Math.max(q.top, nb) + Math.min(q.height, innerHeight - Math.max(q.top, nb)) / 2, nb, vh: innerHeight } })()`)
}

async function measureHover(state, vp) {
  for (const c of await controls()) {
    const sel = `[data-ca-ctl="${c.idx}"]`
    const pos = await placeBelowNav(sel)
    await mouseTo(pos.x, pos.y)
    const items = (await call(COLLECT, sel)).filter((it) => {
      if (!wanted(it.name)) return false
      if (e3Covers(state, it, 'hover')) {
        skipped.push({
          state: state.name,
          vp: vp.name,
          condition: 'hover',
          name: it.name,
          kind: it.kind,
        })
        return false
      }
      return true
    })
    if (!items.length) continue
    for (const it of items) {
      it.key = `${state.name}|${vp.name}|hover|${c.idx}|${it.id}`
      it.boxes = await call(BOXES, it.id)
    }
    await captureSet(items, pos.nb, pos.vh)
    for (const it of items)
      records.push({
        state: state.name,
        withProgress: state.withProgress,
        vp: vp.name,
        condition: 'hover',
        ...strip(it),
        need: threshold(it),
        requirement: requirement(it),
        ...(await call(SUMMARIZE, it.key)),
      })
    await mouseTo(2, 2)
    await ev(`document.querySelectorAll('[data-ca-ctl]').length`)
  }
}

async function measureFocus(state, vp) {
  await ev(
    `(() => { document.activeElement?.blur(); window.scrollTo(0, 0); const m = document.querySelector('dialog[open]'); const s = document.createElement('span'); s.tabIndex = -1; s.id = '__ca_start'; (m || document.body).prepend(s); s.focus() })()`,
  )
  const seen = new Set()
  for (let i = 0; i < 45; i++) {
    await tab()
    const f =
      await ev(`(() => { const el = document.activeElement; if (!el || el === document.body || el.id === '__ca_start') return null
      if (el.hasAttribute('data-ca-f')) return { repeat: true }; const n = document.querySelectorAll('[data-ca-f]').length; el.setAttribute('data-ca-f', String(n))
      const s = getComputedStyle(el), r = el.getBoundingClientRect(), w = parseFloat(s.outlineWidth) || 0, o = parseFloat(s.outlineOffset) || 0
      return { idx: n, name: window.__ca.ctlName(el), fv: el.matches(':focus-visible'), outline: s.outlineStyle !== 'none' && w > 0, fg: window.__ca.toRGBA(s.outlineColor), css: s.outlineColor + ' ' + s.outlineStyle + ' ' + w + 'px',
        ring: [{ x: r.left - o - w, y: r.top - o - w, w: r.width + 2 * (o + w), h: w }, { x: r.left - o - w, y: r.bottom + o, w: r.width + 2 * (o + w), h: w }, { x: r.left - o - w, y: r.top - o, w, h: r.height + 2 * o }, { x: r.right + o, y: r.top - o, w, h: r.height + 2 * o }] } })()`)
    if (!f || f.repeat) break
    if (seen.has(f.idx)) break
    seen.add(f.idx)
    const sel = `[data-ca-f="${f.idx}"]`
    const outlineItem = {
      id: 'ring',
      key: `${state.name}|${vp.name}|focus|${f.idx}|ring`,
      kind: 'focus',
      name: f.name,
      fg: f.fg,
      css: f.css,
      opacity: 1,
      boxes: f.ring,
    }
    if (!f.outline || !f.fv) {
      records.push({
        state: state.name,
        withProgress: state.withProgress,
        vp: vp.name,
        condition: 'focus',
        kind: 'focus',
        name: f.name,
        need: 3,
        requirement: 'required (1.4.11 focus indicator)',
        css: f.css,
        n: 0,
        min: 0,
        p5: 0,
        median: 0,
        note: 'no outline drawn or :focus-visible not matched',
      })
      continue
    }
    const inner = (await call(COLLECT, sel)).filter((it) => {
      if (!wanted(it.name)) return false
      if (e3Covers(state, it, 'focus')) {
        skipped.push({
          state: state.name,
          vp: vp.name,
          condition: 'focus',
          name: it.name,
          kind: it.kind,
        })
        return false
      }
      return true
    })
    for (const it of inner) {
      it.key = `${state.name}|${vp.name}|focus|${f.idx}|${it.id}`
      it.boxes = await call(BOXES, it.id)
    }
    const items = !wanted(outlineItem.name)
      ? inner
      : e3Covers(state, outlineItem, 'focus')
        ? (skipped.push({
            state: state.name,
            vp: vp.name,
            condition: 'focus',
            name: f.name,
            kind: 'focus',
          }),
          inner)
        : [outlineItem, ...inner]
    if (!items.length) continue
    await captureSet(items, 0, vp.height)
    for (const it of items)
      records.push({
        state: state.name,
        withProgress: state.withProgress,
        vp: vp.name,
        condition: 'focus',
        ...strip(it),
        need: threshold(it),
        requirement: requirement(it),
        ...(await call(SUMMARIZE, it.key)),
      })
  }
  await ev(
    `document.getElementById('__ca_start')?.remove(); document.querySelectorAll('[data-ca-f]').forEach(e => e.removeAttribute('data-ca-f')); document.activeElement?.blur(); window.scrollTo(0, 0)`,
  )
}

// ------------------------------------------------------------------ states

async function go(route) {
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
  await ev(INSTALL)
}
const clickJs = (expr) =>
  ev(`(${expr}).click()`)
    .then(() => sleep(400))
    .then(() => ev(INSTALL))
const STATES = [
  { name: 'Home', withProgress: false, open: () => go('') },
  { name: 'Topics', withProgress: false, open: () => go('aiheet') },
  { name: 'Progress', withProgress: false, open: () => go('edistyminen') },
  {
    name: 'Study 1/5, help closed',
    withProgress: false,
    open: () => go('aiheet/topic-01/opiskelu'),
  },
  {
    name: 'Study 1/5, help open (ŏ)',
    withProgress: false,
    open: async () => {
      await go('aiheet/topic-01/opiskelu')
      await clickJs(`document.querySelector('[aria-controls]')`)
    },
  },
  {
    name: 'Study 4/5, help open (no notes)',
    withProgress: false,
    open: async () => {
      await go('aiheet/topic-01/opiskelu')
      for (let i = 0; i < 3; i++)
        await clickJs(
          `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Seuraava')`,
        )
      await clickJs(`document.querySelector('[aria-controls]')`)
    },
  },
  {
    name: 'Reset dialog',
    withProgress: false,
    open: async () => {
      await go('edistyminen')
      await clickJs(
        `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Nollaa edistyminen')`,
      )
    },
  },
  { name: 'Home', withProgress: true, open: () => go('') },
  { name: 'Topics', withProgress: true, open: () => go('aiheet') },
  { name: 'Progress', withProgress: true, open: () => go('edistyminen') },
  {
    name: 'Study 9/4, help open (longest)',
    withProgress: true,
    open: async () => {
      await go('aiheet/topic-09/opiskelu')
      await clickJs(`document.querySelector('[aria-controls]')`)
    },
  },
  {
    name: 'Topic Complete',
    withProgress: true,
    open: () => go('aiheet/topic-01/valmis'),
  },
]

const stateLabel = (state) =>
  `${state.name}${state.withProgress ? ' (with progress)' : ''}`
const KNOWN_STATES = STATES.map(stateLabel)
async function stopBrowser() {
  ws.close()
  browser.kill()
  await sleep(500)
  try {
    rmSync(profile, { recursive: true, force: true })
  } catch {
    /* may still be locked briefly */
  }
}
// Guard: every requested state must be one of the known states. A typo or a
// label split at its own comma would otherwise be skipped silently.
const unknownStates = STATE_FILTER
  ? STATE_FILTER.filter((label) => !KNOWN_STATES.includes(label))
  : []
if (STATE_FILTER && STATE_FILTER.length === 0) {
  console.error(
    'FILTER_STATES is set but names no state. Nothing was measured and no results were written.',
  )
  await stopBrowser()
  process.exit(2)
}
if (unknownStates.length) {
  console.error(
    `FILTER_STATES contains unknown state(s): ${unknownStates.map((x) => JSON.stringify(x)).join(', ')}\n` +
      'Separate labels with commas, or with semicolons when a label contains a comma.\n' +
      `Known states: ${KNOWN_STATES.map((x) => JSON.stringify(x)).join(', ')}\n` +
      'Nothing was measured and no results were written.',
  )
  await stopBrowser()
  process.exit(2)
}
if (process.env.CHECK_FILTERS_ONLY) {
  console.log(
    `Filters valid. States selected: ${(STATE_FILTER ?? KNOWN_STATES).map((x) => JSON.stringify(x)).join(', ')}; elements: ${NAME_FILTER ?? 'all'}`,
  )
  await stopBrowser()
  process.exit(0)
}

let crash = null
try {
  await send('Emulation.setFocusEmulationEnabled', { enabled: true })
  for (const vp of VIEWPORTS) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile,
    })
    for (const state of STATES) {
      if (STATE_FILTER && !STATE_FILTER.includes(stateLabel(state))) continue
      await go('')
      await ev(
        state.withProgress
          ? `localStorage.setItem('${STORAGE_KEY}', ${JSON.stringify(JSON.stringify(SEED))})`
          : 'localStorage.clear()',
      )
      await state.open()
      const label = `${state.name}${state.withProgress ? ' (with progress)' : ''}`
      await mouseTo(2, 2)
      await measureDefault({ ...state, name: label }, vp)
      await measureHover({ ...state, name: label }, vp)
      // fresh page and fresh data for the Tab pass
      await go('')
      await ev(
        state.withProgress
          ? `localStorage.setItem('${STORAGE_KEY}', ${JSON.stringify(JSON.stringify(SEED))})`
          : 'localStorage.clear()',
      )
      await state.open()
      await measureFocus({ ...state, name: label }, vp)
      process.stdout.write(`.`)
    }
  }
} catch (e) {
  crash = e.message
}
await stopBrowser()

// Guard: a run that measured nothing must not look like a pass
if (!crash && !records.some((r) => r.n)) {
  console.error(
    `The run produced zero measurements (states: ${STATE_FILTER ? STATE_FILTER.join('; ') : 'all'}; elements: ${NAME_FILTER ?? 'all'}).\n` +
      'Check FILTER_NAME and FILTER_STATES. No results were written.',
  )
  process.exit(1)
}

// ------------------------------------------------------------------ report

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
  browser: `${browserVersion} (headless, fresh temporary profile, transitions disabled while measuring)`,
  viewports: VIEWPORTS.map((v) => v.name).join(', '),
  filters:
    STATE_FILTER || NAME_FILTER
      ? `states: ${STATE_FILTER ? STATE_FILTER.join('; ') : 'all'}; elements: ${NAME_FILTER ?? 'all'}`
      : 'none (full audit)',
  node: process.version,
  os: `${platform()} ${release()}`,
}
const measured = records.filter((r) => r.n)
const required = measured.filter((r) => r.requirement.startsWith('required ('))
const fails = required.filter((r) => r.min < r.need)
const noIndicator = records.filter((r) => r.note)
writeFileSync(
  DATA_FILE,
  JSON.stringify({ env, records, skippedBecauseCoveredByE3: skipped }, null, 1),
)

// group by element + condition + kind for a readable table: lowest min across states/widths
const groups = new Map()
for (const r of measured) {
  const k = `${r.kind}|${r.condition}|${r.name}|${r.requirement}`
  const g = groups.get(k) ?? {
    ...r,
    states: new Set(),
    vps: new Set(),
    min: 99,
    p5: 99,
    median: 99,
    count: 0,
    worstAt: '',
  }
  g.states.add(r.state)
  g.vps.add(r.vp)
  g.count++
  if (r.min < g.min) {
    g.min = r.min
    g.minFg = r.minFg
    g.minBg = r.minBg
    g.worstAt = `${r.state} @${r.vp}`
  }
  g.p5 = Math.min(g.p5, r.p5)
  g.median = Math.min(g.median, r.median)
  groups.set(k, g)
}
const esc = (v) => String(v ?? '').replace(/\|/g, '\\|')
const rows = [...groups.values()].sort(
  (a, b) =>
    (a.requirement.startsWith('required (') ? 0 : 1) -
      (b.requirement.startsWith('required (') ? 0 : 1) ||
    a.min - a.need - (b.min - b.need),
)
const lines = [
  '# Contrast and focus audit (gap coverage): results',
  '',
  'Generated by `node tests/contrast-audit.e2e.mjs`. Automated measurement of rendered colours; not participant testing and not a claim of WCAG conformance.',
  '',
  '## Environment',
  '',
  '| | |',
  '|---|---|',
  ...Object.entries(env).map(([k, v]) => `| ${k} | ${esc(v)} |`),
  '',
  '## Coverage',
  '',
  `- States (each at ${VIEWPORTS.map((v) => v.name).join(' and ')}): ${[...new Set(records.map((r) => r.state))].join('; ')}.`,
  '- Conditions: default (pooled over several scroll positions), hover (real mouse over every enabled control), focus (every stop reached with the Tab key).',
  `- ${records.length} measurements (${measured.length} with pixels), grouped below into ${groups.size} element/condition rows. Raw data: \`${DATA_FILE}\`.`,
  `- Reused from E3 (docs/contrast-report.md, code identical to this commit): ${skipped.length} element/state combinations were skipped here because E3 already measured them in states without progress; they are listed in the JSON file.`,
  '',
  '## Summary',
  '',
  `Required measurements: ${required.length}. **Below threshold by minimum: ${fails.length}.** Focus stops without a drawn outline: ${noIndicator.length}.${crash ? ` Run stopped early: ${crash}` : ''}`,
  '',
  'Thresholds: text 4.5:1, large text 3:1 (1.4.3); focus indicators and icon-only controls 3:1 (1.4.11). Disabled controls are exempt; icons next to a text label and decorative graphics are reported but not required. "min" is the lowest single pixel; 95 % of pixels are at or above "p5".',
  '',
  '## Results by element (lowest values across states and widths)',
  '',
  '| Kind | Condition | Element | Requirement | Needed | Colour | min / p5 / median | Lowest at | Lowest pair (fg on bg) | Result |',
  '|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map(
    (g) =>
      `| ${g.kind} | ${g.condition} | ${esc(g.name)} | ${esc(g.requirement)} | ${g.need}:1 | ${esc(g.kind === 'gradient text' ? 'gradient' : (g.fg ?? g.css))} | ${g.min} / ${g.p5} / ${g.median} | ${esc(g.worstAt)} | ${g.minFg} on ${g.minBg} | ${!g.requirement.startsWith('required (') ? 'n/a' : g.min >= g.need ? 'pass' : '**FAIL**'} |`,
  ),
  '',
  '## Scope and limitations',
  '',
  '- One browser engine (Chromium/Edge, headless) at two viewport sizes. Other browsers, widths, zoom levels, Windows high-contrast / forced-colours mode and dark mode were not measured.',
  '- Text boxes include the space between and around glyphs (conservative). Gradient text uses fully covered glyph pixels only.',
  '- The app background is a fixed photo: default states were sampled at several scroll positions (one third of the viewport apart), not every position. Hover and focus were sampled at one scroll position each.',
  '- Hover and focus colours are final values (transitions disabled while measuring).',
  '- Progress bars and rings are not measured: the same information is always given as text next to them, so 1.4.11 does not require them to have 3:1 contrast.',
  '- Button boundaries are not measured: every control is identified by its text or (for ✕) its icon.',
  '- The audio button in its playing state (pause icon) was not measured; the icon colour is the same as in the stopped state.',
  '- Combinations already measured in E3 were not re-measured; E3 did not record the browser version.',
  '',
]
writeFileSync(RESULTS_FILE, lines.join('\n'))
console.log(
  `\n${records.length} measurements; required ${required.length}; below threshold ${fails.length}; no indicator ${noIndicator.length}; skipped (E3) ${skipped.length}${crash ? `; CRASH ${crash}` : ''}`,
)
for (const f of fails)
  console.log(
    `FAIL ${f.state} @${f.vp} ${f.condition} ${f.kind} "${f.name}": min ${f.min} (p5 ${f.p5}) need ${f.need} — ${f.minFg} on ${f.minBg}`,
  )
process.exitCode = fails.length || crash || noIndicator.length ? 1 : 0
