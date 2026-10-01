/**
 * Optional, free, on-device transcription with Whisper through transformers.js.
 * Nothing is downloaded until the user explicitly chooses it; the model is then
 * cached by the browser so it keeps working offline.
 */
let pipe: Promise<(audio: Float32Array, opts?: object) => Promise<{ text: string } | { text: string }[]>> | null = null

export const WHISPER_MODEL = 'Xenova/whisper-tiny'
export const WHISPER_SIZE_HINT = '~75 MB'

export async function transcribeWithWhisper(blob: Blob, onStatus: (s: string) => void): Promise<string> {
  onStatus('Preparing…')
  if (!pipe) {
    pipe = import('@huggingface/transformers').then(async ({ pipeline }) => {
      onStatus(`Downloading the model once (${WHISPER_SIZE_HINT})…`)
      return (await pipeline('automatic-speech-recognition', WHISPER_MODEL, {
        progress_callback: (p: { status?: string; progress?: number }) => {
          if (p.status === 'progress' && p.progress != null) onStatus(`Downloading the model… ${Math.round(p.progress)}%`)
        },
      })) as never
    })
    pipe.catch(() => { pipe = null })
  }
  const run = await pipe
  onStatus('Transcribing on this device…')
  const ctx = new AudioContext({ sampleRate: 16000 })
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer())
    const out = await run(buf.getChannelData(0), { chunk_length_s: 30, task: 'transcribe' })
    return (Array.isArray(out) ? out.map((o) => o.text).join(' ') : out.text).trim()
  } finally { void ctx.close() }
}
