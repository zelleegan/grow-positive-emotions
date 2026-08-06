/*
  data-layer.js — the ONE place the app reads and writes data.

  Why this file exists (Phase 2 / Phase 3 scaffolding):
  Every save and load in the whole app goes through these functions. Today they
  talk to the device's own storage (localStorage). When you later add accounts and
  a server (Supabase, Phase 3), you rewrite ONLY the bodies of these functions to
  call the server instead — and nothing else in the app has to change.

  Two load-bearing decisions are baked in here from day one:
    1. Every saved entry is a structured record with a stable `id`, a `date`,
       a `createdAt` timestamp, the `word`, its `definition`, an optional `note`,
       and a reserved `imageRef` (null for now — Phase 2 fills it in).
    2. All access is funneled through this module, so the storage backend is a
       swap, not a rewrite.

  Storage caveat (be honest with testers): localStorage is reliable PER BROWSER.
  Clearing browser data, switching phones, or switching browsers loses history,
  and iOS Safari can evict it over time. That limitation is exactly what Phase 3
  (accounts + server) exists to remove.
*/

window.CFA_DATA = (function () {
  var STORAGE_KEY = "cfa_emotion_entries_v1"; // bump the suffix if the shape changes
  var TODAY_KEY = "cfa_emotion_today_v1";     // remembers today's drawn word

  // ---- internal helpers -------------------------------------------------

  function todayStamp() {
    // Local calendar day, e.g. "2026-08-06". Used to lock one emotion per day.
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function makeId() {
    // Stable unique id per entry. Prefer crypto.randomUUID where available.
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "e_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
  }

  function readAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeAll(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      return true;
    } catch (e) {
      return false; // storage full or blocked (e.g. private mode)
    }
  }

  // ---- public API (this is the contract the rest of the app depends on) --

  return {
    todayStamp: todayStamp,

    /* Is storage usable at all? (private mode / disabled can block it.) */
    isAvailable: function () {
      try {
        var k = "__cfa_test__";
        localStorage.setItem(k, "1");
        localStorage.removeItem(k);
        return true;
      } catch (e) {
        return false;
      }
    },

    /* The word locked for today, or null if none drawn yet today. */
    getToday: function () {
      try {
        var raw = localStorage.getItem(TODAY_KEY);
        if (!raw) return null;
        var t = JSON.parse(raw);
        return t && t.date === todayStamp() ? t : null;
      } catch (e) {
        return null;
      }
    },

    /* Lock a word as today's emotion. Creates or updates today's entry. */
    setToday: function (word, definition) {
      var stamp = todayStamp();
      try {
        localStorage.setItem(TODAY_KEY, JSON.stringify({
          date: stamp, word: word, definition: definition
        }));
      } catch (e) {}

      // Ensure a saved entry exists for today (so history/palette see it).
      var entries = readAll();
      var existing = null;
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].date === stamp) { existing = entries[i]; break; }
      }
      if (existing) {
        existing.word = word;
        existing.definition = definition;
      } else {
        entries.push({
          id: makeId(),
          date: stamp,
          createdAt: new Date().toISOString(),
          word: word,
          definition: definition,
          note: "",
          imageRef: null   // Phase 2 reserves this; stays null until images ship
        });
      }
      writeAll(entries);
      return this.getToday();
    },

    /* Save (or clear) today's reflection note. */
    saveNote: function (note) {
      var stamp = todayStamp();
      var entries = readAll();
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].date === stamp) {
          entries[i].note = note;
          return writeAll(entries);
        }
      }
      return false; // no entry for today yet (draw first)
    },

    /* Today's note, or "" if none. */
    getNote: function () {
      var stamp = todayStamp();
      var entries = readAll();
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].date === stamp) return entries[i].note || "";
      }
      return "";
    },

    /*
      Phase 2 hook — attach an image reference to today's entry.
      Not wired to any UI yet. When Phase 2 ships, the image input calls this.
      `ref` can be a data URL (transient/local) or, in Phase 3, a server URL.
    */
    setTodayImage: function (ref) {
      var stamp = todayStamp();
      var entries = readAll();
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].date === stamp) {
          entries[i].imageRef = ref;
          return writeAll(entries);
        }
      }
      return false;
    },

    /* All entries, newest first — powers history and palette. */
    getHistory: function () {
      var entries = readAll();
      return entries.slice().sort(function (a, b) {
        return (b.date < a.date) ? -1 : (b.date > a.date) ? 1 : 0;
      });
    },

    /* Distinct words ever drawn, for the palette view. */
    getPalette: function () {
      var seen = {};
      var out = [];
      var entries = this.getHistory();
      for (var i = 0; i < entries.length; i++) {
        var w = entries[i].word;
        if (w && !seen[w]) { seen[w] = true; out.push(w); }
      }
      return out;
    },

    /* Count of distinct emotions noticed — the "range" number. */
    paletteCount: function () {
      return this.getPalette().length;
    }
  };
})();
