(function () {
  const { newDeck, normalizePinyin, showToast } = HSKTest;
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
    $("#promptMeaning").textContent = word.meaning;
    $("#promptCategory").textContent = word.category;
    $("#pinyinInput").value = "";
    $("#result").className = "result";
    $("#result").textContent = "";
    $("#answerBox").className = "answer-box hidden-answer";
    $("#answerBox").textContent = "Hanzi will appear after a correct answer.";
    $("#checkButton").disabled = false;
    $("#revealButton").textContent = "Reveal";
    answered = false;
    revealed = false;
  }

  function revealAnswer() {
    const word = deck[index];
    revealed = !revealed;
    $("#answerBox").className = `answer-box ${revealed ? "" : "hidden-answer"}`;
    $("#answerBox").innerHTML = revealed
      ? `<div class="answer-hanzi" lang="zh-CN">${word.hanzi}</div><div class="answer-pinyin">${word.pinyin}</div>`
      : "Hanzi will appear after a correct answer.";
    $("#revealButton").textContent = revealed ? "Hide" : "Reveal";
  }

  function checkAnswer() {
    if (answered) return;
    const word = deck[index];
    const answer = normalizePinyin($("#pinyinInput").value);
    if (!answer) {
      $("#result").className = "result neutral";
      $("#result").textContent = "Type an answer first.";
      return;
    }
    if (answer === normalizePinyin(word.pinyin)) {
      answered = true;
      score += 1;
      $("#score").textContent = score;
      $("#result").className = "result correct";
      $("#result").textContent = "Correct — here is the Hanzi.";
      $("#answerBox").className = "answer-box";
      $("#answerBox").innerHTML = `<div class="answer-hanzi" lang="zh-CN">${word.hanzi}</div><div class="answer-pinyin">${word.pinyin}</div>`;
      $("#checkButton").disabled = true;
    } else {
      $("#result").className = "result incorrect";
      $("#result").textContent = "Not quite — check the syllables and tones, then try again.";
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
    showToast("New pinyin test ready");
  }

  $("#checkButton").addEventListener("click", checkAnswer);
  $("#revealButton").addEventListener("click", revealAnswer);
  $("#nextButton").addEventListener("click", next);
  $("#newTestButton").addEventListener("click", newTest);
  $("#pinyinInput").addEventListener("keydown", (event) => { if (event.key === "Enter") checkAnswer(); });
  render();
})();
