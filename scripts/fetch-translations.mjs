// Downloads an English translation for every verse referenced by the 99 Names.
// Translation: Marmaduke Pickthall, "The Meaning of the Glorious Koran" (1930),
// which is in the public domain. Source: Quran.com API v4, resource id 19.
// Run after build-names.mjs:  node scripts/fetch-translations.mjs
import { readFileSync, writeFileSync } from 'node:fs'
const API = 'https://api.quran.com/api/v4'
const names = JSON.parse(readFileSync('src/content/names.json', 'utf8'))
const keys = [...new Set(names.flatMap((n) => n.verses.map((v) => v.key)))].sort(
  (a, b) => { const [s1, a1] = a.split(':').map(Number), [s2, a2] = b.split(':').map(Number); return s1 - s2 || a1 - a2 },
)
const clean = (t) => t.replace(/<sup[^>]*>.*?<\/sup>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const out = {}
for (const k of keys) {
  let ok = false
  for (let i = 0; i < 4 && !ok; i++) {
    try {
      const r = await fetch(`${API}/verses/by_key/${k}?translations=19`)
      if (!r.ok) throw new Error(r.status)
      const t = (await r.json()).verse.translations?.[0]
      if (!t || t.resource_id !== 19) throw new Error('no translation')
      out[k] = clean(t.text); ok = true
    } catch { await new Promise((r) => setTimeout(r, 800 * (i + 1))) }
  }
  if (!ok) throw new Error('failed ' + k)
  process.stdout.write(`\r${Object.keys(out).length}/${keys.length}`)
}
writeFileSync('src/content/translations.json', JSON.stringify(out))
console.log(`\nok: ${keys.length} verses translated (Pickthall, public domain)`)
