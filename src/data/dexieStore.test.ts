import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { DexieStore } from './dexieStore'

describe('DexieStore', () => {
  it('logs reading, computes goalMet, and round-trips a full backup incl. audio', async () => {
    const a = new DexieStore('t1')
    await a.addReading('2026-03-01', { pages: 1 })
    await a.addReading('2026-03-01', { ayat: 3 })
    await a.markPageRead(5)
    await a.setHabit('2026-03-01', 'fajr', true)
    const hid = await a.addHifz({ surah: 67, fromAyah: 1, toAyah: 30, strength: 'weak', addedAt: '2026-03-01', nextDue: '2026-03-03' })
    await a.reviewHifz(hid, 'strong', '2026-03-03')
    const audioId = await a.putAudio({ blob: new Blob([new Uint8Array([1, 2, 3, 250])], { type: 'audio/webm' }), mime: 'audio/webm', durationMs: 1234 })
    await a.addNote({ nameId: 1, text: 'hello', audioId, transcript: 'hi there' })
    await a.updateNameProgress(1, { listened: true, episodeUrl: 'https://youtu.be/x' })

    const file = JSON.parse(JSON.stringify(await a.exportAll()))
    const b = new DexieStore('t2')
    await b.importAll(file)
    expect((await b.getReadingLogs())[0]).toMatchObject({ pages: 1, ayat: 3, goalMet: true })
    expect((await b.getHifz())[0]).toMatchObject({ strength: 'strong', nextDue: '2026-03-24' })
    expect(await b.getPagesRead()).toEqual([5])
    const n = (await b.getNotes())[0]
    expect(n.transcript).toBe('hi there')
    const au = await b.getAudio(n.audioId!)
    expect(au!.mime).toBe('audio/webm')
    const buf = new Uint8Array(await new Response(au!.blob).arrayBuffer())
    expect([...buf]).toEqual([1, 2, 3, 250])
    expect((await b.getNameProgress())[0].episodeUrl).toBe('https://youtu.be/x')
  })
})
