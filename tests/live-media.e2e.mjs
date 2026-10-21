// Checks that every sentence image and audio file loads and decodes on the
// live GitHub Pages site, through the app's own Study pages.
//
// For each of the 50 sentences: open the topic's Study page, step to the
// sentence, read the image and audio URLs the app actually renders, check
// they belong to that sentence (src/data/sentences.ts), then
//   - image: HTTP status and type, browser decode (img.decode()), pixel size
//   - audio: HTTP status and type, Web Audio decode (decodeAudioData),
//     duration, sample rate and channels
//
// This proves loading and decoding only. It says nothing about whether the
// audio pronunciation is accurate or whether an image fits its sentence.
//
// Runs in headless Edge/Chrome with a fresh temporary profile (deleted
// afterwards), so no one's own browser data is used.
//
// Usage:  node tests/live-media.e2e.mjs
// Options: LIVE_URL (default https://essie20.github.io/korean-learning-app/),
//   BROWSER_PATH, RESULTS_FILE (default docs/live-media-check-results.md)
// Needs Node 22.18+ (imports the TypeScript data file directly). No npm dependencies.

import { execSync, spawn } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir, release, platform } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const LIVE_URL = (
  process.env.LIVE_URL ?? 'https://essie20.github.io/korean-learning-app/'
).replace(/\/?$/, '/')
const BROWSER_PATH =
  process.env.BROWSER_PATH ??
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const RESULTS_FILE =
  process.env.RESULTS_FILE ?? 'docs/live-media-check-results.md'
const { sentences } = await import(
  pathToFileURL(join(process.cwd(), 'src/data/sentences.ts')).href
)
const { topics } = await import(
  pathToFileURL(join(process.cwd(), 'src/data/topics.ts')).href
)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const profile = mkdtempSync(join(tmpdir(), 'live-media-'))
const PORT = 9400 + Math.floor(Math.random() * 400)
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

// Runs in the page: what the Study page shows, and whether its media load and decode
const INSPECT = `(async () => {
  const img = [...document.querySelectorAll('article img')].find(i => i.alt)
  const audio = document.querySelector('article audio')
  const korean = document.querySelector('article [lang=ko]')?.textContent.trim()
  const out = { korean, imageUrl: img?.currentSrc || img?.src, alt: img?.alt, audioUrl: audio?.src }
  try { const r = await fetch(out.imageUrl, { cache: 'no-store' }); const b = await r.arrayBuffer(); out.imageHttp = r.status; out.imageType = r.headers.get('content-type'); out.imageBytes = b.byteLength } catch (e) { out.imageError = String(e) }
  try { await img.decode(); out.imageDecoded = img.naturalWidth > 0 && img.naturalHeight > 0; out.imageSize = img.naturalWidth + '×' + img.naturalHeight } catch (e) { out.imageDecoded = false; out.imageError = String(e) }
  try { const r = await fetch(out.audioUrl, { cache: 'no-store' }); const b = await r.arrayBuffer(); out.audioHttp = r.status; out.audioType = r.headers.get('content-type'); out.audioBytes = b.byteLength
    const ctx = new OfflineAudioContext(1, 1, 44100); const buf = await ctx.decodeAudioData(b)
    out.audioDecoded = buf.duration > 0; out.audioDuration = +buf.duration.toFixed(2); out.audioRate = buf.sampleRate; out.audioChannels = buf.numberOfChannels } catch (e) { out.audioDecoded = false; out.audioError = String(e) }
  return out
})()`

const rows = []
let crash = null
try {
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  })
  for (const topic of [...topics].sort((a, b) => a.order - b.order)) {
    const list = sentences
      .filter((s) => s.topicId === topic.id)
      .sort((a, b) => a.order - b.order)
    await send('Page.navigate', {
      url: `${LIVE_URL}aiheet/${topic.id}/opiskelu`,
    })
    for (let i = 0; i < 80; i++) {
      if (
        await ev(`!!document.querySelector('article audio')`).catch(() => false)
      )
        break
      await sleep(150)
    }
    for (const [i, sentence] of list.entries()) {
      await sleep(300)
      const r = await ev(INSPECT)
      const expectImage = new URL(sentence.image, LIVE_URL).href
      const expectAudio = new URL(sentence.audio, LIVE_URL).href
      rows.push({
        id: sentence.id,
        rightSentence: r.korean === sentence.korean,
        imageUrlMatches: r.imageUrl === expectImage,
        audioUrlMatches: r.audioUrl === expectAudio,
        altMatches: r.alt === sentence.imageAlt,
        ...r,
      })
      if (i < list.length - 1) {
        await ev(
          `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Seuraava').click()`,
        )
        await sleep(300)
      }
    }
  }
} catch (e) {
  crash = e.message
}
const appAssets = await ev(
  `[...document.querySelectorAll('script[src],link[rel=stylesheet]')].map(e => (e.src || e.href).split('/').pop()).join(', ')`,
).catch(() => 'unknown')
ws.close()
browser.kill()
await sleep(500)
try {
  rmSync(profile, { recursive: true, force: true })
} catch {
  /* may still be locked briefly */
}

const sh = (cmd) => {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return 'unknown'
  }
}
const deployed = sh(
  'gh run list --workflow deploy.yml --branch main --status success --limit 1 --json headSha,databaseId,createdAt --jq ".[0] | \\"\\(.headSha[0:7]) (run \\(.databaseId), \\(.createdAt))\\""',
)
const ok = (r) =>
  r.rightSentence &&
  r.imageUrlMatches &&
  r.audioUrlMatches &&
  r.imageHttp === 200 &&
  r.imageDecoded &&
  r.audioHttp === 200 &&
  r.audioDecoded
const failed = rows.filter((r) => !ok(r))
const esc = (v) => String(v ?? '').replace(/\|/g, '\\|')
const lines = [
  '# Live media check: results',
  '',
  'Generated by `node tests/live-media.e2e.mjs`. Automated check that every sentence image and audio file **loads and decodes** on the live site through the app. It does **not** check whether the audio pronunciation is accurate or whether an image is relevant to its sentence; those need a human review against the approved sources.',
  '',
  '## Environment',
  '',
  '| | |',
  '|---|---|',
  `| date | ${new Date().toISOString()} |`,
  `| live site | ${LIVE_URL} |`,
  `| live app assets | ${esc(appAssets)} |`,
  `| last successful deploy of main | ${esc(deployed)} |`,
  `| sentence data read from | src/data/sentences.ts at ${sh('git rev-parse --short HEAD')} (${sh('git rev-parse --abbrev-ref HEAD')}; data file unchanged from main: ${sh('git diff --quiet main -- src/data/sentences.ts && echo yes || echo no')}) |`,
  `| browser | ${browserVersion} (headless, fresh temporary profile, 1280×800) |`,
  `| node | ${process.version} |`,
  `| os | ${platform()} ${release()} |`,
  '',
  '## Summary',
  '',
  `${rows.length} of ${sentences.length} sentences checked: **${rows.length - failed.length} passed, ${failed.length} failed**${crash ? `. Run stopped early: ${crash}` : ''}.`,
  '',
  `- Images: ${rows.filter((r) => r.imageHttp === 200).length} HTTP 200, ${rows.filter((r) => r.imageDecoded).length} decoded; total ${(rows.reduce((a, r) => a + (r.imageBytes ?? 0), 0) / 1e6).toFixed(2)} MB.`,
  `- Audio: ${rows.filter((r) => r.audioHttp === 200).length} HTTP 200, ${rows.filter((r) => r.audioDecoded).length} decoded; durations ${Math.min(...rows.map((r) => r.audioDuration ?? Infinity))}–${Math.max(...rows.map((r) => r.audioDuration ?? 0))} s; total ${(rows.reduce((a, r) => a + (r.audioBytes ?? 0), 0) / 1e6).toFixed(2)} MB.`,
  `- The page showed the expected sentence for ${rows.filter((r) => r.rightSentence).length}/${rows.length}; rendered image URL matched the data for ${rows.filter((r) => r.imageUrlMatches).length}/${rows.length}, audio URL for ${rows.filter((r) => r.audioUrlMatches).length}/${rows.length}, alt text for ${rows.filter((r) => r.altMatches).length}/${rows.length}.`,
  '',
  'A sentence passes when the Study page shows that sentence, its rendered image and audio URLs are the ones in the data, both return HTTP 200, the image decodes to a non-zero size and the audio decodes to a non-zero duration.',
  '',
  '## Results',
  '',
  '| Sentence | Image | HTTP | Type | Decoded size | Audio | HTTP | Type | Decoded | Result |',
  '|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map(
    (r) =>
      `| ${r.id} | ${esc(r.imageUrl?.replace(LIVE_URL, ''))} | ${r.imageHttp ?? 'error'} | ${esc(r.imageType)} | ${r.imageDecoded ? r.imageSize : '**no** ' + esc(r.imageError)} | ${esc(r.audioUrl?.replace(LIVE_URL, ''))} | ${r.audioHttp ?? 'error'} | ${esc(r.audioType)} | ${r.audioDecoded ? `${r.audioDuration} s, ${r.audioRate} Hz, ${r.audioChannels} ch` : '**no** ' + esc(r.audioError)} | ${ok(r) ? 'pass' : '**FAIL**'} |`,
  ),
  '',
  '## Scope and limitations',
  '',
  '- Loading and decoding only: audio pronunciation accuracy, audio–sentence correspondence by ear, and image relevance were not assessed.',
  '- One browser engine (Chromium/Edge, headless) at one viewport. Audio was decoded with the Web Audio API, not played through speakers.',
  '- Files were fetched with `cache: no-store`; GitHub Pages CDN behaviour at other times or locations was not tested.',
  '- Steps between sentences used a JavaScript click on "Seuraava" (this check is about media, not input).',
  '',
]
writeFileSync(RESULTS_FILE, lines.join('\n'))
console.log(
  `${rows.length - failed.length}/${rows.length} sentences passed${crash ? ` (stopped early: ${crash})` : ''}. Report: ${RESULTS_FILE}`,
)
for (const r of failed)
  console.log(
    `FAIL ${r.id}: sentence ${r.rightSentence} img ${r.imageHttp}/${r.imageDecoded} ${r.imageUrlMatches} audio ${r.audioHttp}/${r.audioDecoded} ${r.audioUrlMatches} ${r.imageError ?? ''} ${r.audioError ?? ''}`,
  )
process.exitCode = failed.length || crash ? 1 : 0
