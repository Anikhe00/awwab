/* eslint-disable @typescript-eslint/no-explicit-any */
const Ctor = (): any => (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
export const speechSupported = () => typeof window !== 'undefined' && !!Ctor()

export interface LiveTranscriber { stop: () => string }

/** Live transcription via the browser's Web Speech API. Runs while recording. */
export function startLiveTranscription(lang: string, onUpdate: (finalText: string, interim: string) => void): LiveTranscriber | null {
  const C = Ctor()
  if (!C) return null
  const rec = new C()
  rec.continuous = true
  rec.interimResults = true
  rec.lang = lang
  let finalText = ''
  let active = true
  rec.onresult = (e: any) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i]
      if (r.isFinal) finalText += (finalText ? ' ' : '') + r[0].transcript.trim()
      else interim += r[0].transcript
    }
    onUpdate(finalText, interim)
  }
  // browsers end the session after silence; restart while still recording
  rec.onend = () => { if (active) try { rec.start() } catch { /* already started */ } }
  rec.onerror = () => { /* keep recording audio even if transcription fails */ }
  try { rec.start() } catch { return null }
  return { stop: () => { active = false; try { rec.stop() } catch { /* noop */ } return finalText } }
}
