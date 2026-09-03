(function () {
  const { newDeck, play, getRecognition, normalizeHanzi, showToast } = HSKTest;
  let deck = newDeck(20);
  let index = 0;
  let score = 0;
  let answered = false;
  let pinyinShown = false;
  let recognition = null;
  const Recognition = getRecognition();
  const $ = (selector) => document.querySelector(selector);

  function render() {
    const word = deck[index];
    $("#position").textContent = `${index + 1} / ${deck.length}`;
    $("#score").textContent = score;
    $("#meterFill").style.width = `${(index / deck.length) * 100}%`;
    $("#promptHanzi").textContent = word.hanzi;
    $("#promptMeaning").textContent = word.meaning;
    $("#answerBox").className = `answer-box ${pinyinShown ? "" : "hidden-answer"}`;
    $("#answerBox").innerHTML = pinyinShown ? `<div class="answer-pinyin">${word.pinyin}</div>` : "Pinyin is hidden. Say the Hanzi from memory.";
    $("#pinyinButton").textContent = pinyinShown ? "Hide pinyin" : "Show pinyin";
    $("#status").className = "microphone-status";
    $("#status").textContent = Recognition ? "Ready when you are." : "Speech recognition is unavailable in this browser.";
    $("#heard").textContent = "";
    $("#result").className = "result";
    $("#result").textContent = "";
    $("#startButton").disabled = !Recognition;
    $("#startButton").textContent = "🎙 Start microphone";
    answered = false;
  }

  function finishSpeech(transcript) {
    const word = deck[index];
    const heard = normalizeHanzi(transcript);
    const expected = normalizeHanzi(word.hanzi);
    $("#heard").innerHTML = `Recognition heard: <strong lang="zh-CN">${transcript || "(nothing recognizable)"}</strong>`;
    if (heard === expected) {
      if (!answered) score += 1;
      answered = true;
      $("#score").textContent = score;
      $("#status").className = "microphone-status correct";
      $("#status").textContent = "Correct pronunciation detected.";
      $("#result").className = "result correct";
      $("#result").textContent = "很好 — the recognized Hanzi matches.";
    } else {
      $("#status").className = "microphone-status incorrect";
      $("#status").textContent = "That did not match this word yet.";
      $("#result").className = "result incorrect";
      $("#result").textContent = `Expected: ${word.hanzi} · Try again, then compare with the reference audio.`;
    }
  }

  function startRecognition() {
    if (!Recognition) {
      showToast("Try Chrome or Edge for speech recognition.");
      return;
    }
    if (recognition) {
      try { recognition.abort(); } catch (error) { /* already stopped */ }
    }
    recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.onstart = () => {
      $("#status").className = "microphone-status listening";
      $("#status").textContent = "Listening… say the word now.";
      $("#startButton").disabled = true;
      $("#startButton").textContent = "Listening…";
    };
    recognition.onresult = (event) => {
      const alternatives = Array.from({ length: event.results[0].length }, (_, resultIndex) => event.results[0][resultIndex].transcript);
      const word = deck[index];
      const matching = alternatives.find((transcript) => normalizeHanzi(transcript) === normalizeHanzi(word.hanzi));
      finishSpeech(matching || alternatives[0] || "");
    };
    recognition.onerror = (event) => {
      $("#status").className = "microphone-status incorrect";
      $("#status").textContent = event.error === "not-allowed" ? "Microphone permission was denied." : `Recognition error: ${event.error}.`;
      $("#result").className = "result neutral";
      $("#result").textContent = "Check your microphone permission and try again.";
    };
    recognition.onend = () => {
      $("#startButton").disabled = !Recognition;
      if ($("#status").classList.contains("listening")) $("#status").textContent = "No speech detected. Try again.";
      $("#startButton").textContent = "🎙 Try again";
    };
    try { recognition.start(); } catch (error) { showToast("Could not start the microphone."); }
  }

  function next() {
    if (index === deck.length - 1) {
      $("#meterFill").style.width = "100%";
      showToast(`Round complete: ${score} / ${deck.length} correct`);
      return;
    }
    index += 1;
    pinyinShown = false;
    render();
  }

  function newTest() {
    deck = newDeck(20);
    index = 0;
    score = 0;
    pinyinShown = false;
    render();
    showToast("New speaking test ready");
  }

  $("#startButton").addEventListener("click", startRecognition);
  $("#hearButton").addEventListener("click", () => play(deck[index]));
  $("#pinyinButton").addEventListener("click", () => { pinyinShown = !pinyinShown; render(); });
  $("#nextButton").addEventListener("click", next);
  $("#newTestButton").addEventListener("click", newTest);
  render();
})();
