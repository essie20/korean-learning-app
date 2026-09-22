// GitHub Pages has no built-in SPA fallback: a direct or refreshed request to
// a nested route (e.g. /aiheet) is served as a 404 by GitHub's static host.
// GitHub Pages does serve a repo's 404.html for any unmatched path, so a copy
// of the built index.html at that path lets the SPA shell load and React
// Router then render the correct route on the client.
import { copyFileSync, existsSync } from 'node:fs'

const src = 'dist/index.html'
const dest = 'dist/404.html'

if (!existsSync(src)) {
  throw new Error(`${src} not found — run the build before this script`)
}
copyFileSync(src, dest)
console.log(`copied ${src} -> ${dest}`)
