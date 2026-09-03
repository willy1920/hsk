(function () {
  const { newDeck, play, showToast } = HSKTest;
  let deck = newDeck(20);
  let index = 0;
  let score = 0;
  let revealed = false;
  const $ = (selector) => document.querySelector(selector);

  function render() {
    const word = deck[index];
    $("#position").textContent = `${index + 1} / ${deck.length}`;
    $("#score").textContent = score;
    $("#meterFill").style.width = `${(index / deck.length) * 100}%`;
    $("#promptPinyin").textContent = word.pinyin;
    $("#promptMeaning").textContent = word.meaning;
    $("#answerBox").className = `answer-box ${revealed ? "" : "hidden-answer"}`;
    $("#answerBox").innerHTML = revealed
      ? `<div class="answer-hanzi" lang="zh-CN">${word.hanzi}</div><div class="answer-pinyin">${word.pinyin}</div>`
      : "Write your answer first, then reveal it.";
    $("#revealButton").textContent = revealed ? "Hide answer" : "Show answer";
  }

  function next(markCorrect = false) {
    if (markCorrect) score += 1;
    if (index === deck.length - 1) {
      $("#position").textContent = `${deck.length} / ${deck.length}`;
      $("#score").textContent = score;
      $("#meterFill").style.width = "100%";
      showToast(`Round complete: ${score} / ${deck.length} correct`);
      revealed = true;
      render();
      return;
    }
    index += 1;
    revealed = false;
    render();
  }

  function newTest() {
    deck = newDeck(20);
    index = 0;
    score = 0;
    revealed = false;
    render();
    showToast("New writing test ready");
  }

  $("#hearButton").addEventListener("click", () => play(deck[index]));
  $("#revealButton").addEventListener("click", () => { revealed = !revealed; render(); });
  $("#gotItButton").addEventListener("click", () => next(true));
  $("#missedButton").addEventListener("click", () => next(false));
  $("#newTestButton").addEventListener("click", newTest);
  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, textarea")) return;
    if (event.code === "Space") { event.preventDefault(); revealed = !revealed; render(); }
    if (event.key === "ArrowRight") next(false);
  });
  render();
})();
