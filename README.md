# Positive Emotion Practice — Phase 1 (mobile)

A daily positive-emotion practice: draw one emotion, hold it against the reframe
*"What does [emotion] make possible today?"*, optionally jot a reflection, and
watch your palette of noticed emotions grow. Runs on iPhone and Android in the
browser, and installs to the home screen.

This is the **Phase 1 beta build** with **Phase 2 scaffolding** already inside it
(explained at the bottom).

---

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | The app: structure and all the styling. |
| `app.js` | The practice logic (draw, reflection, palette). |
| `data-layer.js` | The single place all saving/loading happens. **Phase 2/3 swaps happen only here.** |
| `emotions-data.js` | The 297-word emotion list with definitions. **Edit here to curate words.** |
| `manifest.webmanifest` | Makes it installable to the home screen. |
| `icon-180.png`, `icon-192.png`, `icon-512.png` | App icons. |

All the files must stay **together in the same folder** — they reference each other.

---

## The one thing to know first

These files must be served by a **web server** (an address starting with
`http://` or `https://`). Opening `index.html` by double-clicking it
(an address starting with `file://`) will look broken — the browser blocks the
separate `.js` files from loading that way, and the home-screen install won't work.

That sounds technical, but the steps below make it a copy-paste job.

---

## Option A — See it on your computer in 2 minutes (quickest look)

You need this only to preview locally. If you just want it live on your phone,
skip to Option B.

1. Put this folder somewhere easy to find (e.g. your Desktop).
2. Open your computer's command line:
   - **Mac:** open the **Terminal** app.
   - **Windows:** open **PowerShell**.
3. Type `cd ` (with a space after it), then drag the folder into the window and
   press Enter. This moves the command line "into" the folder.
4. Start a tiny local server by pasting one of these and pressing Enter:
   - If you have Python: `python3 -m http.server 8000`
     (on Windows, if that errors, try `python -m http.server 8000`)
5. Open your browser and go to: **http://localhost:8000**
6. You'll see the app. To stop the server later, go back to the command line and
   press **Ctrl + C**.

---

## Option B — Put it on your phone (the real test) — recommended

To use it on an actual iPhone and Android, it needs to live at a real web address.
The easiest free way is **Netlify Drop** — no account, no command line.

1. Go to **https://app.netlify.com/drop** in a desktop browser.
2. Drag this **entire folder** onto the page.
3. Netlify gives you a link like `https://something-random.netlify.app`.
4. Open that link on your **iPhone** and on your **Android** phone.

That link is now shareable with beta testers, too.

*(Vercel, GitHub Pages, or any static host works the same way. Netlify Drop is
just the least-friction one for a first look.)*

### Install it to the home screen (so it feels like an app)

- **iPhone (Safari):** open the link → tap the **Share** icon → **Add to Home
  Screen**.
- **Android (Chrome):** open the link → tap the **⋮** menu → **Add to Home
  screen** / **Install app**.

Once installed, it opens full-screen with its own icon and no browser bar.

---

## How to use it (for you and for testers)

- **Draw today's emotion** — locks one emotion for the day. Come back later and
  it's still there (it greets you with "Welcome back").
- **Draw another** — for live use in a session or conversation; replaces today's
  word without pretending it's a new day.
- **Add a reflection** — optional note, saved on the device.
- **Copy** — copies the word and its question to paste elsewhere.
- **Your palette** — the distinct emotions you've drawn over time; your range,
  made visible.

### An honest note about saved data (worth telling testers)

Reflections and history are saved **on that one device, in that one browser**.
They are private — they never leave the phone. But that also means:

- Clearing the browser's data erases them.
- They don't move to a second device.
- On iPhone, the browser can eventually clear them if the app goes unused a long time.

That's expected for this beta. Removing that limitation — history that follows you
across devices — is exactly what a later phase (accounts + a server) is for. If
testers tell you they wish their history persisted, that's the signal it's worth building.

---

## To change the word list

Open `emotions-data.js`. It's a list of words and a set of definitions. Add,
remove, or edit words there — nothing else needs to change. Keep each word's
spelling identical between the `words` list and the `definitions` set.

---

## What "Phase 2 scaffolding" means (for whoever builds next)

The next phase adds an **image** paired with the word, shared out via the phone's
native Share sheet. That work is already prepared for, so it won't require a rewrite:

- **Every saved entry already has** a stable `id`, a `date`, a `createdAt`
  timestamp, the `word`, its `definition`, a `note`, and a reserved **`imageRef`**
  field (currently `null`). The image just fills in `imageRef`.
- **`data-layer.js` already has a `setTodayImage(ref)` function** waiting to be
  wired to an image input. It's not connected to any button yet — that's the
  Phase 2 job.
- **All saving/loading is funneled through `data-layer.js`.** When a later phase
  moves storage to a server (so history follows people across devices), only that
  one file changes — the rest of the app doesn't.

In short: the data shape and the storage seam are already in place. Phase 2 adds
an image input and a Share button; Phase 3 swaps the inside of `data-layer.js`.
