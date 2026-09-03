(function () {
  const { newDeck, play, normalizePinyin, normalizeHanzi, showToast } = HSKTest;
  let deck = newDeck(20);
  let index = 0;
  let score = 0;
  let answered = false;
  let revealed = false;
  const $ = (selector) => document.querySelector(selector);

  function render() {
    const word = deck[index];
    $("#position").textContent = `${index + 1} / ${deck.length}`;
    $("#score").textContent = score;
    $("#meterFill").style.width = `${(index / deck.length) * 100}%`;
    $("#pinyinInput").value = "";
    $("#hanziInput").value = "";
    $("#result").className = "result";
    $("#result").textContent = "";
    $("#answerBox").className = "answer-box hidden-answer";
    $("#answerBox").textContent = "The answer will appear after you check.";
    $("#checkButton").disabled = false;
    $("#revealButton").textContent = "Reveal";
    answered = false;
    revealed = false;
  }

  function showAnswer() {
    const word = deck[index];
    revealed = !revealed;
    $("#answerBox").className = `answer-box ${revealed ? "" : "hidden-answer"}`;
    $("#answerBox").innerHTML = revealed
      ? `<div class="answer-hanzi" lang="zh-CN">${word.hanzi}</div><div class="answer-pinyin">${word.pinyin}</div><div class="answer-meaning">${word.meaning}</div>`
      : "The answer will appear after you check.";
    $("#revealButton").textContent = revealed ? "Hide" : "Reveal";
  }

  function checkAnswer() {
    if (answered) return;
    const word = deck[index];
    const pinyinCorrect = normalizePinyin($("#pinyinInput").value) === normalizePinyin(word.pinyin);
    const hanziCorrect = normalizeHanzi($("#hanziInput").value) === normalizeHanzi(word.hanzi);
    if (!normalizePinyin($("#pinyinInput").value) || !normalizeHanzi($("#hanziInput").value)) {
      $("#result").className = "result neutral";
      $("#result").textContent = "Write both answers first, or use Reveal to check.";
      return;
    }
    const pinyinMessage = pinyinCorrect ? "pinyin ✓" : `pinyin: ${word.pinyin}`;
    const hanziMessage = hanziCorrect ? "Hanzi ✓" : `Hanzi: ${word.hanzi}`;
    $("#answerBox").className = "answer-box";
    $("#answerBox").innerHTML = `<div class="answer-hanzi" lang="zh-CN">${word.hanzi}</div><div class="answer-pinyin">${word.pinyin}</div>`;
    revealed = true;
    $("#revealButton").textContent = "Hide";
    if (pinyinCorrect && hanziCorrect) {
      answered = true;
      score += 1;
      $("#score").textContent = score;
      $("#result").className = "result correct";
      $("#result").textContent = "Both correct — excellent listening.";
      $("#checkButton").disabled = true;
    } else {
      $("#result").className = "result incorrect";
      $("#result").textContent = `Keep practicing · ${pinyinMessage} · ${hanziMessage}`;
    }
  }

  function next() {
    if (index === deck.length - 1) {
      $("#meterFill").style.width = "100%";
      showToast(`Round complete: ${score} / ${deck.length} correct`);
      return;
    }
    index += 1;
    render();
  }

  function newTest() {
    deck = newDeck(20);
    index = 0;
    score = 0;
    render();
    showToast("New listening test ready");
  }

  $("#hearButton").addEventListener("click", () => play(deck[index]));
  $("#checkButton").addEventListener("click", checkAnswer);
  $("#revealButton").addEventListener("click", showAnswer);
  $("#nextButton").addEventListener("click", next);
  $("#newTestButton").addEventListener("click", newTest);
  $("#hanziInput").addEventListener("keydown", (event) => { if (event.key === "Enter") checkAnswer(); });
  render();
})();
