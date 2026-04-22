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


// --- DOM refs ---
const plank = document.getElementById('plank');
const stage = document.getElementById('stage');

plank.addEventListener("click", onPlankClick);

function onPlankClick(e) {
  if (paused) return;

  // plank icindeki x
  const r = plank.getBoundingClientRect();
  let cx = e.clientX - r.left;
  const mid = r.width / 2;

  // merkeze gore mesafe (- sol, + sag)
  let dist = cx - mid;

  // obje yaricapi kadar kenardan ice cek
  const pad = 22;
  if (dist < -mid + pad) dist = -mid + pad;
  if (dist >  mid - pad) dist =  mid - pad;

  const side  = dist < 0 ? "left" : "right";
  const w     = nextW;
  const color = COLORS[objs.length % COLORS.length];

  const o = {
    id: nextId(),
    side: side,
    dist: Math.round(dist),
    w,
    color
  };

  objs.push(o);

  // sonraki agirlik
  rollNext();
  saveState();
  rebalance();
  render();
  applyTilt();
  updateUI();
  logDrop(o);

  console.log("drop", w + "kg ->", side, "at", o.dist + "px");
}



// --- physics ---

function sideTorque(which) {
  // which: "left" | "right"
  let sum = 0;
  for (let i = 0; i < objs.length; i++) {
    const o = objs[i];
    if (o.side !== which) continue;
    // t = agirlik * merkeze uzaklik (pozitif)
    const d = o.dist < 0 ? -o.dist : o.dist;
    sum += o.w * d;
  }
  return sum;
}

function sideWeight(which) {
  let total = 0;
  for (const o of objs) {
    if (o.side === which) total += o.w;
  }
  return total;
}

function calcAngle() {
  const lT = sideTorque("left");
  const rT = sideTorque("right");
  // PDF formulu - max 30 derece
  const a = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, (rT - lT) / 10));
  return a;
}

// tiklama sonrasi cagirilacak - fizigi yeniden hesapla
function rebalance() {
  angle = calcAngle();
  saveState();
}


// --- render ---

function render() {
  // silinenleri temizle
  const alive = new Set(objs.map(o => o.id));
  plank.querySelectorAll(".obj").forEach(el => {
    if (!alive.has(Number(el.dataset.id))) el.remove();
  });

  // zaten cizilenleri not al
  const drawn = new Set();
  plank.querySelectorAll(".obj").forEach(el => drawn.add(Number(el.dataset.id)));

  // yeni olanlari ekle
  for (const o of objs) {
    if (drawn.has(o.id)) continue;

    const el = document.createElement("div");
    el.className = "obj";
    el.style.left = (PLANK_W / 2 + o.dist) + "px";
    el.style.background = o.color;
    el.textContent = o.w + "kg";
    el.dataset.id = o.id;

    plank.appendChild(el);
  }
}

// sayfa acildiginda kaydedilmisleri ciz
render();

// --- rotation ---

function applyTilt() {
  plank.style.transform = `rotate(${angle}deg)`;
}

// sayfa acilista kayitli aciyi uygula
applyTilt();

// --- UI updates ---

// dom cache - her frame querySelector cagirmaktansa bir kere al
const ui = {
  left:  document.getElementById("leftW"),
  right: document.getElementById("rightW"),
  next:  document.getElementById("nextW"),
  angle: document.getElementById("angleView"),
};

function updateUI() {
  const lw = sideWeight("left");
  const rw = sideWeight("right");

  // toFixed(1) - kg degeri her zaman ondalikli gorunsun ("5.0 kg" gibi)
  ui.left.textContent  = lw.toFixed(1) + " kg";
  ui.right.textContent = rw.toFixed(1) + " kg";
  ui.next.textContent  = nextW + " kg";
  ui.angle.textContent = angle.toFixed(1) + "°";
}

// ilk yuklemede kayitli degerleri yazalim
updateUI();

// --- controls + log ---

const resetBtn = document.getElementById("resetBtn");
const pauseBtn = document.getElementById("pauseBtn");
const logList  = document.getElementById("logList");

resetBtn.addEventListener("click", resetAll);
pauseBtn.addEventListener("click", togglePause);

function resetAll() {
  // full state wipe
  objs   = [];
  angle  = 0;
  paused = false;
  _uid   = 1;

  rollNext();
  localStorage.removeItem(KEY);

  // DOM temizligi
  plank.querySelectorAll(".obj").forEach(el => el.remove());
  logList.innerHTML = "";
  pauseBtn.textContent = "Pause";

  applyTilt();
  updateUI();
}

function togglePause() {
  paused = !paused;
  // yazi degistir ki kullanici durumu anlasin
  pauseBtn.textContent = paused ? "Resume" : "Pause";
  saveState();
}

function logDrop(o) {
  const d = o.dist < 0 ? -o.dist : o.dist;
  const txt = `${o.w}kg dropped on ${o.side} side at ${d}px from center`;

  const li = document.createElement("li");
  li.textContent = txt;
  // en yeni olay ustte gorunsun
  logList.prepend(li);

  // log cok uzarsa DOM sisiyor - son 20 ile sinirla
  while (logList.children.length > 20) {
    logList.lastElementChild.remove();
  }
}

// acilista pause durumu restore edilmisse butonun yazisini duzelt
if (paused) pauseBtn.textContent = "Resume";

















