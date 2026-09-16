/*
  app.js — the practice logic.

  Screens: home (reveal), browse, favorites, instructions; plus a one-time intro.
  Talks to the word set (window.CFA_EMOTIONS) and the data layer (window.CFA_DATA).
  Never touches localStorage directly.

  Design intent: ease. Free reveal — every tap gives a new word. One partner at a
  time, changeable, stored as a name only. Favorites live on this phone.
*/
(function () {
  var EM = window.CFA_EMOTIONS;
  var DB = window.CFA_DATA;
  var storageOK = DB.isAvailable();

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    word: $("word"), definition: $("definition"), heart: $("heart"),
    reveal: $("reveal"), share: $("share"), status: $("status"), shareCopy: $("share-copy"),
    imageBtn: $("image-btn"), imageMenu: $("image-menu"),
    menu: $("menu"), menuOpen: $("menu-open"), menuClose: $("menu-close"), logoLink: $("logo-link"),
    browseList: $("browse-list"), favList: $("fav-list"),
    partnerInput: $("partner-input"), partnerSave: $("partner-save"),
    sheet: $("share-sheet"), shareTitle: $("share-title"),
    shareWithImage: $("share-with-image"), shareTextOnly: $("share-text-only"), shareCancel: $("share-cancel"),
    imageFile: $("image-file"),
    intro: $("intro"), introPartner: $("intro-partner"), introBegin: $("intro-begin")
  };

  var current = "Joyful";
  var SCREENS = ["home", "browse", "favorites", "instructions"];

  // ---- helpers ----------------------------------------------------------

  function defOf(word) {
    return EM.definitions[word] ||
      "A positive emotional quality to notice in yourself, in others, and in the world around you.";
  }
  function setStatus(msg) { el.status.textContent = msg || ""; }
  function sortedWords() { return EM.words.slice().sort(function (a, b) { return a.localeCompare(b); }); }

  function fitWord() {
    var maxWidth = el.word.parentElement.clientWidth - 40;
    var size = window.innerWidth < 400 ? 54 : 64;
    var min = 26;
    el.word.style.fontSize = size + "px";
    if (maxWidth <= 0) return;
    while (el.word.scrollWidth > maxWidth && size > min) {
      size -= 1;
      el.word.style.fontSize = size + "px";
    }
  }

  function heartSVG() {
    return '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.3 5 6.8 5c2 0 3.4 1.1 4.2 2.3C11.8 6.1 13.2 5 15.2 5c3.5 0 5.6 3.6 4.3 6.8C19.5 16.4 12 21 12 21z"/></svg>';
  }

  function refreshHeart() {
    var on = storageOK && DB.isFavorite(current);
    el.heart.className = "heart" + (on ? " on" : "");
    el.heart.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function refreshShareCopy() {
    var p = storageOK ? DB.getPartner() : "";
    el.share.textContent = p ? "Share with " + p : "Share";
    el.shareCopy.textContent = p
      ? "Send today's word and image to " + p + ". Collaboratively expand your range of positive emotion awareness and experience!"
      : "Share your daily emotion word and image with a friend. Collaboratively expand your range of positive emotion awareness and experience!";
  }

  // ---- render the current word -----------------------------------------

  function render(word, animate, source) {
    current = word;
    var apply = function () {
      el.word.textContent = word;
      el.definition.textContent = defOf(word);
      fitWord();
      el.word.className = "word";
      refreshHeart();
    };
    if (animate) {
      el.word.className = "word changing";
      setTimeout(apply, 150);
    } else {
      apply();
    }
    if (storageOK && source) DB.setCurrent(word, defOf(word), source);
  }

  function pickDifferent() {
    var list = EM.words;
    if (list.length < 2) return list[0];
    var next = current;
    while (next === current) next = list[Math.floor(Math.random() * list.length)];
    return next;
  }

  function reveal() {
    render(pickDifferent(), true, "reveal");
    setStatus("");
  }

  // ---- screens ----------------------------------------------------------

  function go(name) {
    if (SCREENS.indexOf(name) === -1) name = "home";
    SCREENS.forEach(function (s) { $("screen-" + s).hidden = (s !== name); });
    var btns = el.menu.querySelectorAll("[data-go]");
    for (var i = 0; i < btns.length; i++) btns[i].className = btns[i].getAttribute("data-go") === name ? "active" : "";
    closeMenu();
    closeImageMenu();
    if (name === "browse") buildList(el.browseList, sortedWords(), "browse");
    if (name === "favorites") buildList(el.favList, storageOK ? DB.getFavorites().slice().sort(function (a, b) { return a.localeCompare(b); }) : [], "favorite");
    if (name === "instructions") el.partnerInput.value = storageOK ? DB.getPartner() : "";
    if (name === "home") setTimeout(fitWord, 30);
    if (location.hash !== "#" + name) { try { history.replaceState(null, "", "#" + name); } catch (e) {} }
    window.scrollTo(0, 0);
  }

  function openMenu() { el.menu.hidden = false; }
  function closeMenu() { el.menu.hidden = true; }

  // ---- browse / favorites list ----------------------------------------

  function buildList(ul, words, source) {
    ul.innerHTML = "";
    if (!words.length) {
      var li0 = document.createElement("li");
      li0.className = "empty";
      li0.textContent = source === "favorite"
        ? "Nothing saved yet. Tap the heart on any emotion to keep it here."
        : "No words found.";
      ul.appendChild(li0);
      return;
    }
    words.forEach(function (w) {
      var li = document.createElement("li");
      var row = document.createElement("button");
      row.type = "button"; row.className = "row";
      row.innerHTML = "<span></span><span class=\"chev\">&#9656;</span>";
      row.firstChild.textContent = w;
      li.appendChild(row);

      var detail = document.createElement("div");
      detail.className = "detail"; detail.hidden = true;
      var p = document.createElement("p"); p.textContent = defOf(w);
      var actions = document.createElement("div"); actions.className = "btn-row";
      var choose = document.createElement("button");
      choose.type = "button"; choose.className = "btn btn-primary btn-small"; choose.textContent = "Choose This Emotion";
      var heart = document.createElement("button");
      heart.type = "button"; heart.className = "heart" + (storageOK && DB.isFavorite(w) ? " on" : "");
      heart.setAttribute("aria-label", "Save to My Emotions");
      heart.innerHTML = heartSVG();
      actions.appendChild(choose); actions.appendChild(heart);
      detail.appendChild(p); detail.appendChild(actions);
      li.appendChild(detail);
      ul.appendChild(li);

      row.addEventListener("click", function () {
        var open = !detail.hidden;
        // close siblings
        var openLis = ul.querySelectorAll("li.open");
        for (var i = 0; i < openLis.length; i++) { openLis[i].className = ""; openLis[i].querySelector(".detail").hidden = true; }
        if (!open) { li.className = "open"; detail.hidden = false; }
      });
      choose.addEventListener("click", function () {
        render(w, false, source);
        go("home");
        setStatus("");
      });
      heart.addEventListener("click", function () {
        if (!storageOK) return;
        var on = DB.toggleFavorite(w);
        heart.className = "heart" + (on ? " on" : "");
        if (w === current) refreshHeart();
        if (source === "favorite" && !on) { li.remove(); if (!ul.children.length) buildList(ul, [], "favorite"); }
      });
    });
  }

  // ---- favorite on the main card --------------------------------------

  el.heart.addEventListener("click", function () {
    if (!storageOK) { setStatus("Storage is off in this browser — can't save."); return; }
    var on = DB.toggleFavorite(current);
    refreshHeart();
    setStatus(on ? "Saved to My Emotions." : "Removed from My Emotions.");
  });

  // ---- Find Image dropdown --------------------------------------------

  var IMAGE_SOURCES = {
    google:   function (w) { return "https://www.google.com/search?udm=2&q=" + encodeURIComponent(w); },
    unsplash: function (w) { return "https://unsplash.com/s/photos/" + encodeURIComponent(w.toLowerCase()); },
    pexels:   function (w) { return "https://www.pexels.com/search/" + encodeURIComponent(w.toLowerCase()) + "/"; }
  };
  function refreshImageLinks() {
    var links = el.imageMenu.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      var build = IMAGE_SOURCES[links[i].getAttribute("data-source")];
      if (build) links[i].href = build(current);
    }
  }
  function openImageMenu() { refreshImageLinks(); el.imageMenu.hidden = false; el.imageBtn.setAttribute("aria-expanded", "true"); }
  function closeImageMenu() { el.imageMenu.hidden = true; el.imageBtn.setAttribute("aria-expanded", "false"); }
  el.imageBtn.addEventListener("click", function (e) { e.stopPropagation(); el.imageMenu.hidden ? openImageMenu() : closeImageMenu(); });
  el.imageMenu.addEventListener("click", function () { closeImageMenu(); });
  document.addEventListener("click", function (e) {
    if (el.imageMenu.hidden) return;
    if (el.imageMenu.contains(e.target) || el.imageBtn.contains(e.target)) return;
    closeImageMenu();
  });

  // ---- Share ------------------------------------------------------------

  function appLink() {
    try { return location.origin + location.pathname; } catch (e) { return ""; }
  }
  function shareText() {
    return "My emotion today is " + current + " — " + defOf(current) +
      "\n\nSent from my daily positive-emotion practice. No reply needed — or send one back.\n" + appLink();
  }
  function canWebShare() { return !!(navigator.share); }
  function canShareFiles(files) {
    try { return !!(navigator.canShare && navigator.canShare({ files: files })); } catch (e) { return false; }
  }

  function doShare(files) {
    var data = { text: shareText() };
    if (files && files.length) data.files = files;
    if (canWebShare()) {
      navigator.share(data).then(
        function () { setStatus("Shared."); },
        function (err) {
          if (err && err.name === "AbortError") { setStatus(""); return; }
          if (files && files.length) { doShare(null); return; } // retry text-only
          fallbackCopy();
        }
      );
    } else {
      fallbackCopy();
    }
  }
  function fallbackCopy() {
    var text = shareText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { setStatus("Copied — paste it into a message."); },
        function () { setStatus("Sharing isn't available in this browser."); }
      );
    } else {
      setStatus("Sharing isn't available in this browser.");
    }
  }

  function openSheet() {
    el.shareTitle.textContent = "Share " + current;
    el.sheet.hidden = false;
  }
  function closeSheet() { el.sheet.hidden = true; }

  el.share.addEventListener("click", function () {
    if (!canWebShare()) { fallbackCopy(); return; }
    openSheet();
  });
  el.shareCancel.addEventListener("click", closeSheet);
  el.sheet.addEventListener("click", function (e) { if (e.target === el.sheet) closeSheet(); });
  el.shareTextOnly.addEventListener("click", function () { closeSheet(); doShare(null); });
  el.shareWithImage.addEventListener("click", function () { el.imageFile.value = ""; el.imageFile.click(); });
  el.imageFile.addEventListener("change", function () {
    var f = el.imageFile.files && el.imageFile.files[0];
    closeSheet();
    if (!f) return;
    var files = [f];
    if (canShareFiles(files)) {
      doShare(files);
    } else {
      setStatus("This phone can't attach the image here — sharing the word; add the image from Photos.");
      doShare(null);
    }
  });

  // ---- partner ----------------------------------------------------------

  el.partnerSave.addEventListener("click", function () {
    if (!storageOK) return;
    DB.setPartner(el.partnerInput.value);
    refreshShareCopy();
    el.partnerSave.textContent = "Saved";
    setTimeout(function () { el.partnerSave.textContent = "Save"; }, 1200);
  });

  // ---- intro (first open) ----------------------------------------------

  el.introBegin.addEventListener("click", function () {
    if (storageOK) {
      if (el.introPartner.value.trim()) DB.setPartner(el.introPartner.value);
      DB.markIntroSeen();
    }
    el.intro.hidden = true;
    refreshShareCopy();
    setTimeout(fitWord, 30);
  });

  // ---- navigation wiring -----------------------------------------------

  el.menuOpen.addEventListener("click", openMenu);
  el.menuClose.addEventListener("click", closeMenu);
  el.menu.addEventListener("click", function (e) {
    if (e.target === el.menu) closeMenu();
    var b = e.target.closest ? e.target.closest("[data-go]") : null;
    if (b) go(b.getAttribute("data-go"));
  });
  el.logoLink.addEventListener("click", function (e) { e.preventDefault(); go("home"); });
  el.reveal.addEventListener("click", reveal);
  window.addEventListener("resize", fitWord);
  window.addEventListener("hashchange", function () { go((location.hash || "#home").slice(1)); });

  // ---- initial state ----------------------------------------------------

  function init() {
    var saved = storageOK ? DB.getCurrent() : null;
    if (saved && EM.definitions[saved.word]) render(saved.word, false, null);
    else render(current, false, null);
    refreshShareCopy();
    go((location.hash || "#home").slice(1));
    if (storageOK && !DB.hasSeenIntro()) el.intro.hidden = false;
    setTimeout(fitWord, 120);
  }
  init();
})();
