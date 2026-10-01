# Awwab

A calm, private companion for reading the Qur’an consistently: a reading tracker, a habits garden, hifz revision, and a daily journey through the 99 Names of Allah with notes (typed and voice).

**Completely free:** no paid APIs or services, no AI API calls, no accounts. Everything is stored on your device (IndexedDB). It is an installable, offline-first PWA, designed tablet-first (portrait and landscape, light and dark).

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # logic + backup round-trip tests
npm run build      # production build in dist/
npm run preview    # serve the production build (service worker active)
```

Requires Node 20+.

## Free deployment

**Vercel (free tier):** import the repo at vercel.com → framework “Vite” is detected. `vercel.json` is included. Nothing else to configure; the app uses hash routing so no rewrites are needed.

**GitHub Pages (free):** copy `docs/github-pages-workflow.yml` to `.github/workflows/deploy.yml` (GitHub's web editor works if your token lacks the `workflow` permission), push to `main`, then go to *Settings → Pages → Source: GitHub Actions*. It builds with `BASE_PATH=/<repo-name>/` and deploys. Pages is free for public repos.

**Install on your tablet:** open the deployed URL once, then use *Add to Home Screen* (Safari) or *Install app* (Chrome). After the first load it works fully offline.

## What’s inside

| Area | Notes |
|---|---|
| Reading | Position by surah:ayah and page (604-page Madani mushaf). “Continue reading” opens the Arabic of your page. Tap an ayah to mark where you stopped. One-tap check-in by pages or ayat. Daily goal starts at 1 page; after 7 consecutive days meeting it, the app *offers* to raise it (never automatic, snoozable). No shaming: after a gap you see “Welcome back”, and **returns** are counted beside the current streak. Progress: khatm progress, pages this week, calendar heatmap. |
| Garden | The Qur’an tree grows with total reading days and only rests on missed days. Plants for 5 salah, morning/evening adhkar, and sadaqah (optional note) grow with 30-day consistency and look a little thirsty after a couple of missed days, but never die. |
| Hifz | Mark surahs/ayah ranges as memorized with strength. Schedule: weak = 2 days, okay = 7, strong = 21; your rating after each revision resets it. Due revisions appear in the Garden’s “Today’s reading”. Mushaf map of all 114 surahs coloured by strength (dashed = partial). |
| Names | One Name per day in order, free browsing of all 99, verses with the Name highlighted, podcast links, notes and voice notes, cross-Name search, “reflected on” once read + listened + note written. |
| Backup | Settings → *Export everything* writes one JSON file (including voice notes). *Import* restores it on a new device. A gentle reminder appears after 30 days without a backup. |

### Definitions you may want to know
- A **reading day** is any day with pages or ayat logged. **Streak** = consecutive reading days (if you haven’t read yet today, yesterday’s streak still shows).
- A **gap** is 2+ missed days in a row. Reading after a gap counts as a **return**.
- “Goal met” = pages ≥ goal, or ayat ≥ 10 × goal (about ten ayat per page).
- **Khatm progress** counts distinct pages checked in during the current khatm. Reaching 604 offers to begin a new one.
- An ayah that runs onto the next page is shown on the page where it **begins** (the page data gives each ayah’s starting page).

## Data sources and accuracy

- **Qur’an text and pages:** downloaded, not typed. `scripts/fetch-quran.mjs` pulls the **Uthmani text** (`text_uthmani`) and each ayah’s Madani mushaf **page number** from the [Quran.com API v4](https://api.quran.com/api/v4) and writes `src/content/quran.json` and `surahs.json`. The script fails if it does not get 6,236 ayat and 604 pages. (Tanzil.net was the first choice but its certificate has expired at the time of writing.) Re-run with `npm run data`.
- **The 99 Names:** the list and ordering follow the widely published list based on the narration in *Jami‘ at-Tirmidhi* (hadith 3507; see also *Sahih al-Bukhari* 2736 and *Sahih Muslim* 2677 for the virtue of the 99). Scholars differ on the exact list; this is one common version. Arabic, transliteration and the short English meanings (plain paraphrases, not a copyrighted translation) are in `scripts/names-source.mjs`.
- **Verse references for each Name are computed, not remembered.** `scripts/build-names.mjs` searches the downloaded Qur’an text for the Name’s word (handling the definite/indefinite forms), favours verses where it sits beside “Allah”, picks up to 4, and records the word position so it can be highlighted. The app flags anything it could not confirm:
  - ⚑ *weak match*: the word was found but I could not tell it always refers to the Name;
  - ⚑ *no verse confirmed*: no matching word found (several Names are hadith-based or appear in the Qur’an only as verbs or in other forms; a few may also be missed by the simple matcher, e.g. forms that Uthmani spelling writes differently).
  Please check flagged Names yourself with a trusted source. Run `node scripts/build-names.mjs` to see the current list of flagged Names.
- **Qalam Institute:** no content is copied. The app only links to YouTube/Spotify searches for “Qalam Institute The Names [Name]”, and to episode links you paste.

## Adding episode links

1. Open a Name’s card → *Listen* section.
2. Tap *Find on Qalam · YouTube* (or *Spotify*), find the episode, and copy its link.
3. Paste it into *Paste an episode link* and tap *Save link*. Only YouTube and Spotify links are accepted.
4. The card now shows **Listen to episode**; tap *Mark episode as listened* when done. Links are saved locally and included in backups.

## Voice notes and transcription

- Recording uses the browser’s **MediaRecorder**; audio is stored in IndexedDB and played back in the app. Microphone permission is needed, and the page must be served over HTTPS (Vercel/GitHub Pages are) or localhost.
- **Live transcript while recording** uses the browser’s **Web Speech API** (Chrome/Edge/Safari). Depending on your browser, the speech recognition service may be provided by the browser vendor (for example Chrome sends audio to Google) — this is the browser’s behaviour, not the app’s. Choose the language in Settings. Transcripts are editable afterwards.
- If the Web Speech API isn’t available, or you want no live service involved, tap **Transcribe on this device** on a saved note. This runs **Whisper (`Xenova/whisper-tiny`) in your browser via transformers.js**: free and private. The model (~75 MB) is downloaded **only when you first choose it**, then cached for offline use. Whisper-tiny is modest in accuracy; you can edit the result.

## Project layout

```
scripts/        fetch-quran.mjs  build-names.mjs  names-source.mjs  make-icons.mjs
src/
  data/         store.ts (interface) · dexieStore.ts · backup.ts · index.ts
  logic/        streak · goal · hifz · garden · names · dates (+ tests)
  content/      quran.json surahs.json names.json (generated) · index.ts
  pages/        Garden Read Progress Hifz Names NameCard Notes Settings
  components/   Tree Plant Heatmap CheckIn VoiceRecorder NoteItem …
  lib/          hooks · reading · speech · whisper
```

## Adding cloud sync later

All persistence goes through the `Store` interface in `src/data/store.ts`; `src/data/index.ts` is the only place a concrete store is chosen. A cloud implementation only needs to implement that interface (`exportAll`/`importAll` already define a complete serialisable snapshot).

## Testing notes

`npm test` covers streak/returns, the goal-raise rule, the hifz schedule, garden growth, the Name-of-the-day rule, and a full backup export/import round trip including audio bytes. In the browser the following were exercised: reading and check-in, tree growth, heatmap, hifz, backup round trip, MediaRecorder capture and playback, the Whisper download-and-transcribe path, and loading the production build offline. Live Web Speech transcription depends on a real microphone and supported browser, so please try it on your tablet.
