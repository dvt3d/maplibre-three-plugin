import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const PAGES_DIR = path.join(ROOT, 'examples')
const IMPORTMAP_JSON = path.join(ROOT, 'examples', 'importmap.json')

const IMPORTMAP_RE =
  /<script\b[^>]*\btype\s*=\s*(['"])importmap\1[^>]*>[\s\S]*?<\/script>/i

async function walk(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(full)))
    else out.push(full)
  }
  return out
}

function makeImportmapTag(obj) {
  return `<script type="importmap">\n${JSON.stringify(obj, null, 2)}\n</script>`
}

function upsertImportmap(html, importmapTag) {
  if (IMPORTMAP_RE.test(html)) {
    return html.replace(IMPORTMAP_RE, importmapTag)
  }
  const headClose = /<\/head\s*>/i
  if (headClose.test(html)) {
    return html.replace(headClose, `${importmapTag}\n</head>`)
  }
  return `${importmapTag}\n${html}`
}

async function main() {
  const importmapObj = JSON.parse(await fs.readFile(IMPORTMAP_JSON, 'utf8'))
  const importmapTag = makeImportmapTag(importmapObj)
  const files = (await walk(PAGES_DIR)).filter((f) => f.endsWith('.html'))
  for (const file of files) {
    if (path.basename(file).toLowerCase() === 'index.html') {
      console.log(`[skip] ${path.relative(ROOT, file)}`)
      continue
    }
    const oldHtml = await fs.readFile(file, 'utf8')
    const newHtml = upsertImportmap(oldHtml, importmapTag)
    if (newHtml !== oldHtml) {
      await fs.writeFile(file, newHtml, 'utf8')
      console.log(`[updated] ${path.relative(ROOT, file)}`)
    } else {
      console.log(`[unchanged] ${path.relative(ROOT, file)}`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
