(function () {
  const level = window.HSK_LEVEL;
  if (!level || !Array.isArray(level.words)) {
    throw new Error("Load a level data file before study-deck.js.");
  }

  const words = level.words;
  const progressKey = `${level.id}-study-progress-v1`;
  const $ = (selector) => document.querySelector(selector);
  const wordGrid = $("#wordGrid");
  const searchInput = $("#searchInput");
  const categorySelect = $("#categorySelect");
  const listView = $("#listView");
  const flashView = $("#flashView");
  const listTab = $("#listTab");
  const flashTab = $("#flashTab");
  let learned = new Set(readProgress());
  let filteredWords = [...words];
  let flashIndex = 0;
  let flashRevealed = false;
  let voices = [];
  let currentAudio = null;
  let toastTimer;

  function readProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(progressKey) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveProgress() {
    localStorage.setItem(progressKey, JSON.stringify([...learned]));
    updateProgress();
  }

  function updateProgress() {
    const count = learned.size;
    $("#learnedCount").textContent = count;
    $("#progressBar").style.width = `${(count / words.length) * 100}%`;
    $("#progressDetail").textContent = count === 0
      ? "A good place to begin."
      : count === words.length
        ? "Deck complete — amazing."
        : `${words.length - count} words to go.`;
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

  function speak(text, id) {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    const audio = new Audio(`${level.audioPath}/${String(id).padStart(3, "0")}.wav`);
    let localFailed = false;
    const useBrowserFallback = () => {
      if (localFailed) return;
      localFailed = true;
      browserSpeak(text);
    };
    currentAudio = audio;
    audio.addEventListener("ended", () => { if (currentAudio === audio) currentAudio = null; });
    audio.addEventListener("error", useBrowserFallback, { once: true });
    audio.play().catch(useBrowserFallback);
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
  }

  function toggleLearned(id) {
    if (learned.has(id)) learned.delete(id);
    else learned.add(id);
    saveProgress();
    renderList();
    renderFlashcard();
  }

  function wordCard(word) {
    const isLearned = learned.has(word.id);
    return `<article class="word-card ${isLearned ? "learned" : ""}">
      <div>
        <div class="word-top"><span class="word-number">${String(word.id).padStart(3, "0")}</span><span class="category">${word.category}</span></div>
        <div class="hanzi" lang="zh-CN">${word.hanzi}</div>
        <div class="pinyin">${word.pinyin}</div>
        <div class="meaning">${word.meaning}</div>
      </div>
      <div class="card-actions">
        <button class="button small" type="button" data-speak="${word.id}">🔊 Hear</button>
        <button class="button small learn-button ${isLearned ? "is-learned" : ""}" type="button" data-learn="${word.id}">${isLearned ? "✓ Learned" : "Mark learned"}</button>
      </div>
    </article>`;
  }

  function renderList() {
    wordGrid.innerHTML = filteredWords.length
      ? filteredWords.map(wordCard).join("")
      : `<div class="empty"><strong>No words found</strong>Try a different search or category.</div>`;
  }

  function filterWords() {
    const query = searchInput.value.trim().toLowerCase();
    const category = categorySelect.value;
    filteredWords = words.filter((word) => {
      const matchesQuery = !query || `${word.hanzi} ${word.pinyin} ${word.meaning}`.toLowerCase().includes(query);
      return matchesQuery && (category === "all" || word.category === category);
    });
    flashIndex = Math.min(flashIndex, Math.max(filteredWords.length - 1, 0));
    flashRevealed = false;
    renderList();
    renderFlashcard();
  }

  function setView(view) {
    const isFlash = view === "flash";
    listView.classList.toggle("hidden", isFlash);
    flashView.classList.toggle("active", isFlash);
    listTab.classList.toggle("active", !isFlash);
    flashTab.classList.toggle("active", isFlash);
    listTab.setAttribute("aria-selected", String(!isFlash));
    flashTab.setAttribute("aria-selected", String(isFlash));
    if (isFlash) renderFlashcard();
  }

  function renderFlashcard() {
    const word = filteredWords[flashIndex];
    if (!word) {
      $("#flashHanzi").textContent = "—";
      $("#flashPinyin").textContent = "";
      $("#flashMeaning").textContent = "No matching words";
      $("#flashPosition").textContent = "0 / 0";
      return;
    }
    $("#flashPosition").textContent = `${flashIndex + 1} / ${filteredWords.length}`;
    $("#flashCategory").textContent = word.category;
    $("#flashHanzi").textContent = word.hanzi;
    $("#flashPinyin").textContent = flashRevealed ? word.pinyin : "•••";
    $("#flashMeaning").textContent = flashRevealed ? word.meaning : "";
    $("#flashHint").textContent = flashRevealed ? "Read it aloud, then listen and compare." : "Think of the pronunciation, then reveal the answer.";
    $("#revealButton").textContent = flashRevealed ? "Hide answer" : "Reveal answer";
    const learnButton = $("#flashLearnButton");
    learnButton.textContent = learned.has(word.id) ? "✓ Learned" : "Mark learned";
    learnButton.classList.toggle("is-learned", learned.has(word.id));
    $("#flashProgress").textContent = `Use ← → to move, Space to reveal, L to mark learned · ${learned.size} learned overall`;
  }

  function moveFlashcard(direction) {
    if (!filteredWords.length) return;
    flashIndex = (flashIndex + direction + filteredWords.length) % filteredWords.length;
    flashRevealed = false;
    renderFlashcard();
  }

  function populateCategories() {
    [...new Set(words.map((word) => word.category))].sort().forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.append(option);
    });
  }

  wordGrid.addEventListener("click", (event) => {
    const speakButton = event.target.closest("[data-speak]");
    const learnButton = event.target.closest("[data-learn]");
    if (speakButton) {
      const word = words.find((item) => item.id === Number(speakButton.dataset.speak));
      if (word) speak(word.hanzi, word.id);
    }
    if (learnButton) toggleLearned(Number(learnButton.dataset.learn));
  });
  searchInput.addEventListener("input", filterWords);
  categorySelect.addEventListener("change", filterWords);
  listTab.addEventListener("click", () => setView("list"));
  flashTab.addEventListener("click", () => setView("flash"));
  $("#shuffleButton").addEventListener("click", () => {
    filteredWords = [...filteredWords].sort(() => Math.random() - .5);
    flashIndex = 0;
    flashRevealed = false;
    renderList();
    renderFlashcard();
    showToast("Visible words shuffled");
  });
  $("#resetButton").addEventListener("click", () => {
    if (!learned.size || window.confirm("Reset all learning progress?")) {
      learned.clear();
      saveProgress();
      renderList();
      renderFlashcard();
      showToast("Progress reset");
    }
  });
  $("#revealButton").addEventListener("click", () => { flashRevealed = !flashRevealed; renderFlashcard(); });
  $("#previousButton").addEventListener("click", () => moveFlashcard(-1));
  $("#nextButton").addEventListener("click", () => moveFlashcard(1));
  $("#flashSpeakButton").addEventListener("click", () => { if (filteredWords[flashIndex]) speak(filteredWords[flashIndex].hanzi, filteredWords[flashIndex].id); });
  $("#flashLearnButton").addEventListener("click", () => { if (filteredWords[flashIndex]) toggleLearned(filteredWords[flashIndex].id); });
  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, select")) return;
    if (event.key === "ArrowLeft") moveFlashcard(-1);
    if (event.key === "ArrowRight") moveFlashcard(1);
    if (event.code === "Space" && flashView.classList.contains("active")) { event.preventDefault(); flashRevealed = !flashRevealed; renderFlashcard(); }
    if (event.key.toLowerCase() === "l" && flashView.classList.contains("active") && filteredWords[flashIndex]) toggleLearned(filteredWords[flashIndex].id);
  });

  if ("speechSynthesis" in window) {
    voices = window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", () => { voices = window.speechSynthesis.getVoices(); });
  }
  populateCategories();
  updateProgress();
  renderList();
  renderFlashcard();
})();
