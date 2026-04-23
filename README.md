# Seesaw Simulation

A small physics-based playground seesaw built with pure HTML, CSS and vanilla JavaScript. Click anywhere on the plank to drop a random-weight object (1–10 kg) — the seesaw computes the torque for each side and tilts accordingly.

**Live demo:** https://zehraertas47.github.io/seesaw-zehra-ertas/

---

## What it does

- Click on the plank → a colored object (1–10 kg) drops at the clicked position
- The position relative to the pivot becomes the object's distance
- Torque is recalculated for each side (`weight × distance`)
- The plank tilts proportionally, capped at ±30°
- Everything persists in `localStorage`, so a refresh does not wipe progress

---

## Thought process & design decisions

### Why CSS transforms instead of canvas?

The brief disallowed canvas. That ended up being a useful constraint — rotating the plank with `transform: rotate()` lets child elements (the dropped objects) inherit the rotation for free. I only track distance from the pivot; CSS does the rest.

### Objects live inside the plank

Every dropped object is appended inside the `.plank` element rather than next to it. When the plank rotates, objects rotate with it automatically. No per-frame math, no trigonometry.

### Tilt formula from the brief

```js
angle = Math.max(-30, Math.min(30, (rightTorque - leftTorque) / 10))
```

I kept the `/ 10` divisor as given — it makes the seesaw feel responsive: small imbalance → small tilt, large imbalance → caps at 30°.

### Smooth motion via CSS, not JS

Instead of animating the angle frame-by-frame in JavaScript, I change `transform` and let CSS handle the interpolation:

```css
transition: transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
```

The cubic-bezier gives a slight overshoot so the plank "springs" a little before settling. I tried a plain `ease-out` first but it felt too rigid.

### Render strategy: only append new objects

My first version cleared `.obj` children and re-rendered on every click, which re-ran the drop animation for every existing object — visually distracting. I now track rendered IDs via `dataset.id` and only append new ones.

### Sound without any library

The Web Audio API is native. I generate a short triangle-wave "plop" with an exponential frequency drop — heavier objects produce a lower tone (`420 - weight × 18` Hz). I use **lazy initialization** for `AudioContext` because Chrome blocks creation before a user gesture.

### Persistence

State is saved to `localStorage` after every click. On page load I try to restore it. If the JSON is corrupt for any reason, I simply wipe the key and start fresh — no crash.

---

## Trade-offs & limitations

- **Mobile touch isn't explicitly handled.** Click events fire on tap in modern mobile browsers, so it works, but a production version would add `touchstart` listeners for precise position.
- **Event log is session-only.** I persist the objects and angle, but not the log, on purpose — the log is feedback, not data.
- **No collision between objects.** Clicking close positions can visually overlap circles. Adding spacing would have complicated the otherwise neat torque math.
- **Objects don't "re-fall" when the plank is tilted.** They stay at the position where they were placed. This matches the brief but is not physically accurate.

---

## Technical approach (physics)

Each object stores: `{ id, side, dist, w, color }` where `dist` is a signed distance from the pivot (negative = left, positive = right).

On every click `rebalance()` runs and calls `calcAngle()`:

1. `sideTorque("left")` = sum of `weight × |dist|` for left-side objects
2. `sideTorque("right")` = same for right
3. `angle = clamp(-30, 30, (rightTorque - leftTorque) / 10)`

`applyTilt()` sets `plank.style.transform = rotate(<angle>deg)`. The CSS transition handles the motion. `updateUI()` updates the four info cards.

---

## Bonus features

- Weight label inside each dropped object (e.g. `5kg`)
- Distance scale markers on the plank (every 50 px from center)
- **Reset** button — clears all objects, angle, log and localStorage
- **Pause** button — freezes new clicks; button label toggles between `Pause` and `Resume`
- Event log of the last 20 drops
- Drop animation via CSS keyframes
- Sound effect via Web Audio API (pure, no libraries) — tone depends on weight
- Different color per object from a palette
- Responsive layout (4-column cards collapse to 2 on small screens; plank shrinks)

---

## AI usage

I used AI tools (Claude, ChatGPT) as helpers while building this, for:

- Debugging small JavaScript syntax errors
- Checking which `cubic-bezier` curve feels like a spring
- Reviewing the Web Audio API lifecycle (why lazy init is required)
- Sanity-checking the torque formula against the brief

The core code — click handling, position math, torque logic, render strategy — I wrote and refactored myself step by step. I can walk through every file line by line.

---

## Project structure

```
seesaw-zehra-ertas/
├── index.html       # skeleton: cards, stage, plank, pivot, ground, log, buttons
├── style.css        # sunset theme, seesaw visuals, responsive layout
├── script.js        # state, storage, click logic, physics, render, UI, audio
└── README.md        # you are here
```

---

## How to run locally

No build step, no dependencies. Just open `index.html` in a modern browser:

```bash
git clone https://github.com/ZEHRAertas47/seesaw-zehra-ertas.git
cd seesaw-zehra-ertas
# open index.html directly
```

Or serve it (useful for a clean cache during testing):

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

---

## Commit history

I committed each logical step separately — HTML skeleton, CSS base, seesaw visuals, cards/buttons/log, state + localStorage, click detection, physics, rendering, rotation, UI updates, controls + event log, sound effect, and this README. Each commit is small and self-contained so the progression is traceable.
