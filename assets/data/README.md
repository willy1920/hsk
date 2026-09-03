# Level data

Each level data file defines one global `window.HSK_LEVEL` object. Keep the same fields when adding HSK 2–6:

```js
window.HSK_LEVEL = {
  id: "hsk-2",
  label: "HSK 2",
  description: "Next-step vocabulary",
  words: [{ id, hanzi, pinyin, meaning, category }],
  audioPath: "../../assets/audio/hsk-2",
  pdfPath: "../../assets/pdfs/hsk-2-vocabulary-list.pdf"
};
```

Audio filenames are three-digit word IDs: `001.wav`, `002.wav`, and so on.
