(function () {
  const { newDeck, showToast } = HSKTest;
  const level = HSK_LEVEL;
  const $ = (selector) => document.querySelector(selector);
  const masteryKey = `${level.id}-writing-mastery-v1`;
  let mastered = new Set(readMastery());
  let deck = newDeck(20);
  let wordIndex = 0;
  let characterIndex = 0;
  let mode = "practice";
  let writer = null;
  let dataReady = false;
  let quizActive = false;
  let characterComplete = false;

  function readMastery() {
    try {
      const saved = JSON.parse(localStorage.getItem(masteryKey) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveMastery() {
    localStorage.setItem(masteryKey, JSON.stringify([...mastered]));
    $("#score").textContent = mastered.size;
  }

  function currentWord() {
    return deck[wordIndex];
  }

  function currentCharacter() {
    return [...currentWord().hanzi][characterIndex];
  }

  function setStatus(message, state = "") {
    $("#status").className = `writing-status ${state}`;
    $("#status").textContent = message;
  }

  function updateModeControls() {
    const testMode = mode === "test";
    $("#practiceModeButton").classList.toggle("active", !testMode);
    $("#testModeButton").classList.toggle("active", testMode);
    $("#practiceModeButton").setAttribute("aria-selected", String(!testMode));
    $("#testModeButton").setAttribute("aria-selected", String(testMode));
    $("#orderButton").textContent = testMode ? "Reveal stroke order" : "Show stroke order";
    $("#writingHelp").textContent = testMode
      ? "Write the Hanzi from memory. The answer stays hidden until you reveal it."
      : "Use one stroke at a time. The grid helps with proportion.";
    $("#promptHanzi").style.visibility = testMode ? "hidden" : "visible";
  }

  function updatePrompt() {
    const word = currentWord();
    const character = currentCharacter();
    $("#wordPosition").textContent = `${wordIndex + 1} / ${deck.length}`;
    $("#meterFill").style.width = `${(wordIndex / deck.length) * 100}%`;
    $("#promptHanzi").textContent = character;
    $("#promptPinyin").textContent = word.pinyin;
    $("#promptMeaning").textContent = `${word.meaning} · character ${characterIndex + 1} of ${[...word.hanzi].length}`;
    $("#score").textContent = mastered.size;
  }

  function loadCharacter() {
    if (writer) {
      try { writer.cancelQuiz(); } catch (error) { /* already stopped */ }
    }
    quizActive = false;
    characterComplete = false;
    dataReady = false;
    updatePrompt();
    $("#strokeCount").textContent = "Loading stroke data…";
    $("#orderButton").disabled = true;
    $("#nextButton").disabled = true;
    setStatus(`Loading ${currentCharacter()}…`);
    $("#writer").replaceChildren();

    writer = HanziWriter.create("writer", currentCharacter(), {
      width: 320,
      height: 320,
      padding: 20,
      showCharacter: false,
      showOutline: mode === "practice",
      strokeColor: "#1b6b58",
      outlineColor: "#d9d5ca",
      drawingColor: "#1e2927",
      drawingWidth: 5,
      highlightColor: "#d8735e",
      showHintAfterMisses: mode === "practice" ? 2 : false,
      highlightOnComplete: true,
      charDataLoader: (character, onComplete) => {
        fetch(`${level.strokeDataPath}/${encodeURIComponent(character)}.json`)
          .then((response) => {
            if (!response.ok) throw new Error(`Could not load ${character}`);
            return response.json();
          })
          .then(onComplete)
          .catch(() => setStatus("Stroke data could not load. Check your connection and refresh.", "error"));
      },
      onLoadCharDataSuccess: (charData) => {
        dataReady = true;
        $("#strokeCount").textContent = `Stroke 1 of ${charData.strokes.length}`;
        $("#orderButton").disabled = false;
        startQuiz();
      },
      onLoadCharDataError: () => setStatus("Stroke data could not load. Refresh and try again.", "error")
    });
  }

  function startQuiz() {
    if (!writer || !dataReady || quizActive) return;
    quizActive = true;
    characterComplete = false;
    $("#orderButton").disabled = true;
    $("#nextButton").disabled = true;
    setStatus(mode === "test" ? "Test started — write the first stroke." : "Write the first stroke.");
    writer.quiz({
      showHintAfterMisses: mode === "practice" ? 2 : false,
      highlightOnComplete: true,
      onCorrectStroke: (strokeData) => {
        $("#strokeCount").textContent = strokeData.strokesRemaining
          ? `Stroke ${strokeData.strokeNum + 2} of ${strokeData.strokeNum + strokeData.strokesRemaining + 1}`
          : "Last stroke — keep going";
        setStatus(`Good stroke ${strokeData.strokeNum + 1}.` , "success");
      },
      onMistake: (strokeData) => {
        setStatus(mode === "practice"
          ? `Try stroke ${strokeData.strokeNum + 1} again. A hint appears after two misses.`
          : `Not quite. Try stroke ${strokeData.strokeNum + 1} again.`, "error");
      },
      onComplete: (summaryData) => {
        quizActive = false;
        characterComplete = true;
        mastered.add(summaryData.character);
        saveMastery();
        $("#meterFill").style.width = wordIndex === deck.length - 1 && characterIndex === [...currentWord().hanzi].length - 1 ? "100%" : `${(wordIndex / deck.length) * 100}%`;
        $("#orderButton").disabled = false;
        $("#nextButton").disabled = false;
        $("#nextButton").textContent = characterIndex === [...currentWord().hanzi].length - 1 ? "Next word →" : "Next character →";
        setStatus(`Excellent — ${summaryData.character} is complete. ${summaryData.totalMistakes} mistake${summaryData.totalMistakes === 1 ? "" : "s"}.`, "success");
      }
    });
  }

  function showOrder() {
    if (!writer || !dataReady || quizActive) return;
    setStatus(mode === "test" ? "Answer revealed. Try it again when ready." : "Watch the stroke order, then try it yourself.");
    writer.animateCharacter();
  }

  function clearCharacter() {
    loadCharacter();
  }

  function nextCharacter() {
    if (!characterComplete) return;
    const chars = [...currentWord().hanzi];
    if (characterIndex < chars.length - 1) {
      characterIndex += 1;
    } else if (wordIndex < deck.length - 1) {
      wordIndex += 1;
      characterIndex = 0;
    } else {
      $("#meterFill").style.width = "100%";
      showToast(`Round complete · ${mastered.size} characters mastered on this device`);
      return;
    }
    loadCharacter();
  }

  function newRound() {
    deck = newDeck(20);
    wordIndex = 0;
    characterIndex = 0;
    loadCharacter();
    showToast("New writing round ready");
  }

  function setMode(nextMode) {
    if (mode === nextMode) return;
    mode = nextMode;
    updateModeControls();
    loadCharacter();
  }

  $("#practiceModeButton").addEventListener("click", () => setMode("practice"));
  $("#testModeButton").addEventListener("click", () => setMode("test"));
  $("#orderButton").addEventListener("click", showOrder);
  $("#clearButton").addEventListener("click", clearCharacter);
  $("#nextButton").addEventListener("click", nextCharacter);
  $("#newTestButton").addEventListener("click", newRound);
  updateModeControls();
  loadCharacter();
})();
