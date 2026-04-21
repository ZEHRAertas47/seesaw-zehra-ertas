// seesaw simulation

const PLANK_W   = 400;
const MAX_ANGLE = 30;
const KEY = "seesaw_state_v1";

// renk paleti - her yeni obje bundan birini alir
const COLORS = [
  '#ff6f1f', '#ffb347', '#d93a2a', '#ffd166',
  '#ef476f', '#9b5de5', '#00bbf9', '#06d6a0'
];

// state
let objs   = [];
let angle  = 0;
let paused = false;
let nextW  = 1;

// uid - her obje icin tekil id
let _uid = 1;
const nextId = () => _uid++;

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollNext() {
  nextW = rand(1, 10);
}

// --- storage ---

function saveState() {
  const data = { objs, angle, paused, nextW, _uid };
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("save failed", e);
  }
}

function loadState() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return false;

  try {
    const d = JSON.parse(raw);
    if (Array.isArray(d.objs)) objs = d.objs;
    if (typeof d.angle  === "number")  angle  = d.angle;
    if (typeof d.paused === "boolean") paused = d.paused;
    if (typeof d.nextW  === "number")  nextW  = d.nextW;
    if (typeof d._uid   === "number")  _uid   = d._uid;
    return true;
  } catch (err) {
    // eski / bozuk veri - temizle
    localStorage.removeItem(KEY);
    objs = [];
    return false;
  }
}

// state yuklendi
const had = loadState();
if (!nextW) rollNext();

console.log("state yuklendi ->", objs.length, "objs, angle:", angle, had ? "(restored)" : "(fresh)");



















