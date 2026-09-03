# HSK Study Room

A small, phone-friendly Mandarin vocabulary practice site for HSK levels 1–6. It is plain HTML, CSS, and JavaScript, so it can be hosted directly with GitHub Pages or any static file host.

HSK 1 is currently available with:

- 150 vocabulary words with tone-marked pinyin and English meanings
- local Mandarin audio clips with browser speech fallback
- list view, search, category filters, flashcards, and saved progress
- listening, on-screen stroke-order writing, paper Hanzi writing, pinyin typing, and speaking practice

## Run locally

Use a local web server so audio and browser APIs work as they do on a hosted site:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` on your computer or phone on the same network.

## Publish with GitHub Pages

1. Create a GitHub repository and push this folder.
2. Open **Settings → Pages**.
3. Select **Deploy from a branch**, choose the default branch, and choose `/ (root)`.
4. Open the generated Pages URL on your phone.

No build command or package installation is required.

## Project layout

```text
.
├── index.html                  # HSK 1–6 level hub
├── assets/
│   ├── css/                    # Shared deck, test, and writing styles
│   ├── data/                   # One data file per level
│   │   └── strokes/hsk-1/      # Local stroke-order JSON for HSK 1
│   ├── js/                     # Shared behavior, tests, and writing library
│   ├── audio/hsk-1/            # HSK 1 numbered WAV files
│   └── pdfs/                   # Reference vocabulary PDFs
└── levels/
    ├── hsk-1/                  # Available level pages
    └── hsk-2/ … hsk-6/          # Reserved for future levels
```

## Adding another level

Copy the HSK 1 page set into a new `levels/hsk-N/` folder, add `assets/data/hsk-N.js`, and give that data file the same `window.HSK_LEVEL` shape as HSK 1. Add its audio under `assets/audio/hsk-N/`, update the links in the root `index.html`, and reuse the shared scripts.

The on-screen writing page uses local Hanzi Writer data. Add a `strokeDataPath` and one JSON stroke file per unique character when preparing a new level.

Learning progress is stored in `localStorage` with a separate key for each HSK level, so adding levels will not overwrite existing progress.
