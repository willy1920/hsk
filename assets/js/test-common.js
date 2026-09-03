(function () {
  const level = window.HSK_LEVEL;
  if (!level || !Array.isArray(level.words)) {
    throw new Error("Load a level data file before test-common.js.");
  }
  const words = level.words;
  let currentAudio = null;
  let voices = [];

  function shuffle(items) {
    return [...items].sort(() => Math.random() - .5);
  }

  function newDeck(size = 20) {
    return shuffle(words).slice(0, Math.min(size, words.length));
  }

  function browserSpeak(text) {
    if (!("speechSynthesis" in window)) {
      showToast("Speech is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = .78;
    const preferred = voices.find((voice) => /^zh(-|_|$)/i.test(voice.lang) && /China|Chinese|Mandarin|中文|普通话/i.test(`${voice.name} ${voice.lang}`));
    utterance.voice = preferred || voices.find((voice) => /^zh(-|_|$)/i.test(voice.lang)) || null;
    window.speechSynthesis.speak(utterance);
  }

  function play(word) {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    const audio = new Audio(`${level.audioPath}/${String(word.id).padStart(3, "0")}.wav`);
    let localFailed = false;
    const fallback = () => {
      if (localFailed) return;
      localFailed = true;
      browserSpeak(word.hanzi);
    };
    currentAudio = audio;
    audio.addEventListener("ended", () => { if (currentAudio === audio) currentAudio = null; });
    audio.addEventListener("error", fallback, { once: true });
    const promise = audio.play();
    if (promise) promise.catch(fallback);
  }

  function normalizeHanzi(value) {
    return String(value || "").replace(/[^\u3400-\u9fff]/g, "");
  }

  const toneMarks = {
    a: ["ā", "á", "ǎ", "à"],
    e: ["ē", "é", "ě", "è"],
    i: ["ī", "í", "ǐ", "ì"],
    o: ["ō", "ó", "ǒ", "ò"],
    u: ["ū", "ú", "ǔ", "ù"],
    ü: ["ǖ", "ǘ", "ǚ", "ǜ"]
  };

  function markSyllable(syllable, tone) {
    if (tone === "5") return syllable.replace(/v/g, "ü");
    const chars = [...syllable.replace(/v/g, "ü")];
    let vowelIndex = chars.findIndex((char) => char === "a" || char === "e");
    if (vowelIndex < 0 && chars.join("").includes("ou")) vowelIndex = chars.indexOf("o");
    if (vowelIndex < 0) {
      for (let index = chars.length - 1; index >= 0; index -= 1) {
        if ("iouü".includes(chars[index])) { vowelIndex = index; break; }
      }
    }
    if (vowelIndex < 0) return chars.join("");
    chars[vowelIndex] = toneMarks[chars[vowelIndex]][Number(tone) - 1];
    return chars.join("");
  }

  function convertNumberedPinyin(value) {
    return value.replace(/([a-züv]+)([1-5])/gi, (_, syllable, tone) => markSyllable(syllable.toLowerCase(), tone));
  }

  function normalizePinyin(value) {
    return convertNumberedPinyin(String(value || "").trim().toLowerCase())
      .normalize("NFC")
      .replace(/[’'`\s-]/g, "")
      .replace(/v/g, "ü");
  }

  function showToast(message) {
    const toast = document.querySelector("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
  }

  if ("speechSynthesis" in window) {
    voices = window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", () => { voices = window.speechSynthesis.getVoices(); });
  }

  window.HSKTest = {
    level,
    words,
    shuffle,
    newDeck,
    play,
    normalizeHanzi,
    normalizePinyin,
    showToast,
    getRecognition: () => window.SpeechRecognition || window.webkitSpeechRecognition || null
  };
})();
