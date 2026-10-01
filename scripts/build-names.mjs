// Builds src/content/names.json. Verse references are derived from the
// bundled Uthmani text (src/content/quran.json), never typed by hand:
//  - a verse is a candidate when one of its words matches the Name's
//    consonant skeleton (definite or indefinite, with optional و/ف/ب prefix)
//  - candidates are scored higher when the verse mentions "Allah" and the
//    matched word sits right next to it (e.g. "إن الله غفور رحيم").
//  - a Name gets `check: true` when no verse scores as a confident match, and
//    `check: 'none'` when the word never appears (typically hadith-only Names).
import { readFileSync, writeFileSync } from 'node:fs'
import { NAMES } from './names-source.mjs'
const quran = JSON.parse(readFileSync('src/content/quran.json', 'utf8'))
const norm = (s) =>
  s.replace(/[ً-ٰٟۖ-ۭـ]/g, '')
   .replace(/[اٱأإآءؤئ]/g, '').replace(/[ىي]/g, 'ي').replace(/ة/g, 'ه')
const stemOf = (ar) => norm(ar).replace(/^ل/, '')
const words = quran.map((q) => ({ key: `${q[0]}:${q[1]}`, toks: q[4].split(' ') }))
const isAllah = (t) => /^[وفب]?لله$/.test(norm(t)) || norm(t) === 'الله'
const out = NAMES.map(([ar, tr, meaning, stemOverride], i) => {
  const stem = stemOverride ? norm(stemOverride) : stemOf(ar)
  const cands = []
  for (const w of words) {
    const hits = []
    w.toks.forEach((t, idx) => {
      const n = norm(t).replace(/^[وفب]/, (m, off, s) => (s.length > stem.length + 1 ? '' : m))
      const short = stem === 'علي' // collides with the preposition على
      const vs = [stem, stem.replace(/ي$/, '')].filter((v) => v.length >= 2)
      if (short) { if (n === 'ل' + stem) hits.push(idx); return }
      if (vs.some((v) => n === v || n === 'ل' + v)) hits.push(idx)
    })
    if (!hits.length) continue
    const allahIdx = w.toks.map((t, k) => (isAllah(t) ? k : -1)).filter((k) => k >= 0)
    let score = allahIdx.length ? 1 : 0
    if (hits.some((h) => allahIdx.some((a) => Math.abs(a - h) <= 3))) score += 2
    if (hits.some((h) => /^[وفب]?ل/.test(norm(w.toks[h])) && norm(w.toks[h]).startsWith('ل' + stem))) score += 1
    const definite = hits.some((h) => norm(w.toks[h]).replace(/^[وفب]/, '').startsWith('ل' + stem.replace(/ي$/, '')))
    if (!definite && score < 3) continue
    cands.push({ key: w.key, hl: hits, score, definite })
  }
  const best = cands.filter((c) => c.score >= 3 || (c.score >= 1 && c.definite))
  const pool = best.length ? best : cands.slice().sort((a, b) => b.score - a.score)
  // spread up to 4 verses across the pool, keep mushaf order
  const pick = []
  const n = Math.min(4, pool.length)
  for (let k = 0; k < n; k++) pick.push(pool[Math.floor((k * pool.length) / n)])
  const check = !cands.length ? 'none' : best.length ? false : true
  return {
    id: i + 1, ar, tr, meaning,
    verses: pick.sort((a, b) => (a.key > b.key ? 1 : -1)).map((p) => ({ key: p.key, hl: p.hl })),
    check,
  }
})
if (out.length !== 99) throw new Error('expected 99 names, got ' + out.length)
writeFileSync('src/content/names.json', JSON.stringify(out))
const none = out.filter((n) => n.check === 'none').map((n) => n.tr)
const weak = out.filter((n) => n.check === true).map((n) => n.tr)
console.log(`99 names. confident: ${out.filter((n) => !n.check).length}`)
console.log('no occurrence found (hadith-only or different form):', none.join(', '))
console.log('weak match, flagged:', weak.join(', '))
