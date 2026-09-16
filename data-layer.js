/*
  data-layer.js — the ONE place the app reads and writes data.

  Every save and load in the app goes through these functions. Today they talk to
  the device's own storage (localStorage). When accounts and a server arrive
  (Phase 3, Supabase), only the bodies of these functions change.

  What is stored (all on this phone only):
    - reveal log: one record per revealed word {id, date, createdAt, word, definition, imageRef}
      (kept for the beta's behavioral logging; not shown in the UI)
    - favorites: the words the person chose to keep ("My Emotions")
    - partner: one name, optional, changeable
    - introSeen: whether the first-open screen has been shown

  Storage caveat: localStorage is reliable PER BROWSER. Clearing browser data or
  switching phones loses it, and iOS can evict it after long disuse.
*/

window.CFA_DATA = (function () {
  var LOG_KEY      = "cfa_emotion_entries_v1";
  var CURRENT_KEY  = "cfa_emotion_current_v1";
  var FAV_KEY      = "cfa_emotion_favorites_v1";
  var PARTNER_KEY  = "cfa_emotion_partner_v1";
  var INTRO_KEY    = "cfa_emotion_intro_seen_v1";

  function todayStamp() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function makeId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "e_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
  }

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  return {
    todayStamp: todayStamp,

    isAvailable: function () {
      try {
        localStorage.setItem("__cfa_test__", "1");
        localStorage.removeItem("__cfa_test__");
        return true;
      } catch (e) { return false; }
    },

    /* ---- current word (free reveal: every reveal replaces it) ---------- */

    getCurrent: function () {
      var c = readJSON(CURRENT_KEY, null);
      return c && c.word ? c : null;
    },

    setCurrent: function (word, definition, source) {
      writeJSON(CURRENT_KEY, { word: word, definition: definition, date: todayStamp() });
      var log = readJSON(LOG_KEY, []);
      if (!Array.isArray(log)) log = [];
      log.push({
        id: makeId(),
        date: todayStamp(),
        createdAt: new Date().toISOString(),
        word: word,
        definition: definition,
        source: source || "reveal",   // "reveal" | "browse" | "favorite"
        imageRef: null
      });
      if (log.length > 500) log = log.slice(-500);
      writeJSON(LOG_KEY, log);
    },

    /* Full reveal log, newest first (for future research export). */
    getHistory: function () {
      var log = readJSON(LOG_KEY, []);
      return Array.isArray(log) ? log.slice().reverse() : [];
    },

    /* ---- favorites ------------------------------------------------------ */

    getFavorites: function () {
      var f = readJSON(FAV_KEY, []);
      return Array.isArray(f) ? f : [];
    },

    isFavorite: function (word) {
      return this.getFavorites().indexOf(word) !== -1;
    },

    toggleFavorite: function (word) {
      var f = this.getFavorites();
      var i = f.indexOf(word);
      if (i === -1) f.push(word); else f.splice(i, 1);
      writeJSON(FAV_KEY, f);
      return i === -1; // true if it is now a favorite
    },

    /* ---- partner (one name, optional, changeable) ---------------------- */

    getPartner: function () {
      try { return localStorage.getItem(PARTNER_KEY) || ""; } catch (e) { return ""; }
    },

    setPartner: function (name) {
      try { localStorage.setItem(PARTNER_KEY, (name || "").trim()); return true; }
      catch (e) { return false; }
    },

    /* ---- first-open intro ---------------------------------------------- */

    hasSeenIntro: function () {
      try { return localStorage.getItem(INTRO_KEY) === "1"; } catch (e) { return true; }
    },

    markIntroSeen: function () {
      try { localStorage.setItem(INTRO_KEY, "1"); } catch (e) {}
    }
  };
})();
