/*
  app.js — the practice logic.

  Talks to the word set (window.CFA_EMOTIONS) and the data layer (window.CFA_DATA).
  It NEVER touches localStorage directly — every save/load goes through CFA_DATA,
  so the Phase 3 backend swap stays contained to data-layer.js.

  Design intent: ease. One emotion is locked for the day; "Draw another" is there
  for live use (a session, a conversation) without pretending each tap is a new day.
*/
(function () {
  var EM = window.CFA_EMOTIONS;
  var DB = window.CFA_DATA;

  var el = {
    word: document.getElementById("word"),
    definition: document.getElementById("definition"),
    prompt: document.getElementById("prompt"),
    draw: document.getElementById("draw"),
    another: document.getElementById("another"),
    copy: document.getElementById("copy"),
    status: document.getElementById("status"),
    dateLine: document.getElementById("date-line"),
    reflect: document.getElementById("reflect"),
    note: document.getElementById("note"),
    noteStatus: document.getElementById("note-status"),
    paletteWrap: document.getElementById("palette-wrap"),
    pCount: document.getElementById("p-count"),
    chips: document.getElementById("chips")
  };

  var current = "Joyful";
  var storageOK = DB.isAvailable();

  // ---- helpers ----------------------------------------------------------

  function defOf(word) {
    return EM.definitions[word] ||
      "A positive emotional quality to notice in yourself, in others, and in the world around you.";
  }

  function setStatus(msg) { el.status.textContent = msg; }

  function prettyDate() {
    try {
      return new Date().toLocaleDateString(undefined, {
        weekday: "long", month: "long", day: "numeric"
      });
    } catch (e) { return ""; }
  }

  // Shrink the word until it fits one line. Runs on set + resize.
  function fitWord() {
    var maxWidth = el.word.parentElement.clientWidth - 8;
    var size = window.innerWidth < 400 ? 52 : 64;
    var min = 26;
    el.word.style.fontSize = size + "px";
    // guard against layout not ready (width 0)
    if (maxWidth <= 0) return;
    while (el.word.scrollWidth > maxWidth && size > min) {
      size -= 1;
      el.word.style.fontSize = size + "px";
    }
  }

  function render(word, animate) {
    current = word;
    var apply = function () {
      el.word.textContent = word;
      el.definition.textContent = defOf(word);
      el.prompt.textContent = "What does " + word + " make possible today?";
      fitWord();
      el.word.className = "word";
    };
    if (animate) {
      el.word.className = "word changing";
      setTimeout(apply, 150);
    } else {
      apply();
    }
  }

  function pickDifferent() {
    var list = EM.words;
    if (list.length < 2) return list[0];
    var next = current;
    while (next === current) {
      next = list[Math.floor(Math.random() * list.length)];
    }
    return next;
  }

  // ---- the daily lock ---------------------------------------------------

  function drawToday() {
    var next = pickDifferent();
    render(next, true);
    if (storageOK) {
      DB.setToday(next, defOf(next));
      // a fresh day = fresh note field
      el.note.value = DB.getNote();
      refreshPalette();
    }
    setStatus("Today's emotion is set.");
  }

  function drawAnother() {
    var next = pickDifferent();
    render(next, true);
    if (storageOK) {
      DB.setToday(next, defOf(next)); // "another" replaces today's word
      refreshPalette();
    }
    setStatus("Drew another.");
  }

  // ---- reflection -------------------------------------------------------

  var noteTimer = null;
  function onNoteInput() {
    if (!storageOK) {
      el.noteStatus.textContent = "Storage is off in this browser — notes won't be saved.";
      return;
    }
    el.noteStatus.textContent = "Saving…";
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function () {
      var ok = DB.saveNote(el.note.value);
      el.noteStatus.textContent = ok ? "Saved to this device." : "Draw today's emotion first.";
    }, 500);
  }

  // ---- copy (plain word + prompt) --------------------------------------

  function copyOut() {
    var text = current + " — What does " + current + " make possible today?";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { setStatus("Copied."); },
        function () { setStatus(text); }
      );
    } else {
      setStatus(text);
    }
  }

  // ---- palette ----------------------------------------------------------

  function refreshPalette() {
    if (!storageOK) {
      el.pCount.textContent = "unavailable";
      return;
    }
    var pal = DB.getPalette();
    el.pCount.textContent = pal.length + (pal.length === 1 ? " emotion" : " emotions");
    el.chips.innerHTML = "";
    if (pal.length === 0) {
      var empty = document.createElement("span");
      empty.className = "chip empty";
      empty.textContent = "Your drawn emotions will gather here";
      el.chips.appendChild(empty);
      return;
    }
    for (var i = 0; i < pal.length; i++) {
      var c = document.createElement("span");
      c.className = "chip";
      c.textContent = pal[i];
      el.chips.appendChild(c);
    }
  }

  // ---- wiring (single clean tap path — no touchend double-fire) ---------

  el.draw.addEventListener("click", drawToday);
  el.another.addEventListener("click", drawAnother);
  el.copy.addEventListener("click", copyOut);
  el.note.addEventListener("input", onNoteInput);
  window.addEventListener("resize", fitWord);

  // ---- initial state ----------------------------------------------------

  function init() {
    el.dateLine.textContent = prettyDate();

    if (!storageOK) {
      el.noteStatus.textContent = "";
      el.pCount.textContent = "unavailable";
    }

    var today = storageOK ? DB.getToday() : null;
    if (today) {
      // already drew today — restore it, keep the lock
      render(today.word, false);
      el.note.value = DB.getNote();
      el.draw.textContent = "Redraw today's emotion";
      setStatus("Welcome back.");
    } else {
      // first open today — show a gentle starting word, not yet locked
      render(current, false);
      setStatus("Ready when you are.");
    }
    refreshPalette();

    // fit once more after fonts settle
    setTimeout(fitWord, 120);
  }

  init();
})();
