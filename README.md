# Vibes 254 🎮

**The Kenyan heads-up party game.**  
Hold it. Tilt it. Name it.

Built by **DRACO DYNASTY** — Nairobi, Kenya.

---

## What Is This?

Vibes 254 is a local multiplayer party game for 2+ players.  
One player holds their phone to their forehead. Their team shouts clues.  
Tilt back = **CORRECT** ✅ | Tilt forward = **PASS** ❌

No app store. No install. Just open the link and play.

---

## Play It

🔗 **[Play Vibes 254](https://YOUR-USERNAME.github.io/vibes-254/)**

> Replace `YOUR-USERNAME` with your GitHub username after deploying.

---

## Card Packs

| Pack | Cards | Categories |
|---|---|---|
| 🇰🇪 Kenya Pack | 34 cards | Musicians, Athletes, Media & TV, Culture & Landmarks |
| 🌍 Global Pack | 10 cards | Global Pop Culture |

---

## How To Play

1. Open the link on a phone
2. Rotate to **landscape**
3. Select your settings (time, cards, pack)
4. Enter team names → **START GAME**
5. Allow gyroscope access
6. Hold phone to forehead, calibrate, go!

### Controls
| Action | How |
|---|---|
| ✅ Correct | Tilt head **back** (phone tip goes up) |
| ❌ Pass | Tilt head **forward** (phone tip goes down) |

---

## Tech Stack

- Vanilla JavaScript (ES Modules)
- Three.js — not used yet, coming in v2
- CSS3 — AMOLED black + neon green design system
- GitHub Pages — free hosting, zero build step

**No frameworks. No dependencies. No install.**

---

## Project Structure

```
vibes-254/
├── index.html              ← App entry point
├── mock-decks.json         ← All card data
├── css/
│   └── main.css            ← Full design system
├── js/
│   ├── engine/
│   │   ├── GyroSensor.js       ← Gyroscope + iOS permission + calibration
│   │   ├── MatchStateMachine.js ← Game loop, timer, scoring
│   │   └── AssetLoader.js      ← Card data + Fisher-Yates shuffle
│   └── components/
│       ├── SetupScreen.js      ← Pre-game lobby
│       ├── CardDisplay.js      ← Active gameplay UI
│       └── ScoreBoard.js       ← Round results + game over
└── assets/
    └── images/             ← Drop real card photos here
```

---

## Adding Real Photos

Current version uses placeholder images from picsum.photos.  
To add real photos:

1. Add image files to `assets/images/` (JPG or WebP, 400×300px recommended)
2. Update `mock-decks.json` — change the `"image"` field for each card:
   ```json
   "image": "./assets/images/khaligraph-jones.jpg"
   ```
3. Commit and push — GitHub Pages updates automatically.

Full update guide is documented in `js/engine/AssetLoader.js`.

---

## Deploy to GitHub Pages

1. Fork or clone this repo
2. Go to **Settings → Pages**
3. Source: **Deploy from branch → main → / (root)**
4. Save — your game is live in ~60 seconds

---

## Roadmap

- [ ] Add real celebrity photos
- [ ] Expand Kenya Pack (50+ cards)
- [ ] Sound effects on correct/pass
- [ ] Custom deck builder
- [ ] PWA / offline support
- [ ] Leaderboard (persistent scores)

---

## License

MIT — see [LICENSE](LICENSE)

---

## Built By

**DRACO DYNASTY**  
Technology · Media · Fashion  
Nairobi, Kenya  
*Daring Reality, Creating Opportunities*
