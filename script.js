/* ==========================================================================
   The Great Indian Tiffin Box · Experience Publication
   --------------------------------------------------------------------------
   Structure of this file
     0. Config          – every number / label you might want to tweak
     1. Utilities
     2. Stage           – scale + letterbox the 1920×1080 illustration space
     3. Loader          – preload every illustration + the opening video
     4. Mask            – pixel-accurate hit testing (pre-baked in hitmasks.js)
     5. HUD             – hint text, tooltip
     6. State           – the user's choices (kept for future dish filtering)
     7. Transitions     – depth transitions + the swappable hand-cover function
     8. Scene manager
     9. Scenes          – intro · options · kitchen · title · school
    10. PDF popup
    11. Boot / replay
   All coordinates are in "stage units" = pixels of a 1920×1080 canvas.
   ========================================================================== */
(() => {
'use strict';

/* ───────────────────────────── 0. CONFIG ───────────────────────────────── */
const STAGE_W = 1920, STAGE_H = 1080;
const PDF_URL = 'Lemon_Rice.pdf';

/* Opening animation: plays automatically on load, settles on the boy asking Mom for food,
   shows the boy's dialogue and then the mother's dialogue sequentially, and auto-transitions to Scene 2. */
const INTRO = {
  startAt: 0,               // start playing automatically from the beginning
  settleAt: 4.35,           // timestamp (seconds) when the camera settles on mother & boy
  dialogueFadeMs: 300,      // fade-in and fade-out duration (ms) for each dialogue box
  boyDialogueMs: 3000,      // reading duration (ms) for the boy's line
  momDialogueMs: 3000,      // reading duration (ms) for the mother's line
};

/* Mom's arm rig – pivots measured on the 1920×1080 illustration (native "still 3" pose).
   S = shoulder joint, E = elbow joint, W = wrist joint, G = where the held bowl sits in the hand. */
const ARM = {
  S: { x: 1450, y: 450 },
  E: { x: 1020, y: 915 },
  W: { x: 435,  y: 600 },
  G: { x: 239.25, y: 451.75 },
  MIN_REACH: 250,          // hand can't come closer to the shoulder than this
  HAND_FOLLOW: 0.8,        // how much the hand turns with the forearm
  POUR_TILT_DEG: -40,      // tilt of the hand while pouring (negative = bowl rim dips to the left)
  FOLLOW_SPEED: 22,        // pointer smoothing (higher = snappier)
};

/* The pan opening (where the ingredients appear + where a bowl may be poured) */
const PAN = { cx: 935, cy: 312, rx: 210, ry: 84,          // floor of the pan
              dropRx: 300, dropRy: 205 };                  // generous "pour here" zone

/* The six bowls  ·  c = bowl centre, w = bowl width, badge = badge position (stage units)
   Ordered cooking steps 1 → 6: Oil → Tempering & spices → Onion → Lemon juice → Rice → Cashews & peanuts. */
const BOWLS = [
  { id: 'oil',    step: 1, file: 'oil',             c: [586.25, 986],    w: 253.5, badge: [668, 934], title: 'Oil',
    items: [['Vegetable oil', '2 tbsp']] },
  { id: 'masala', step: 2, file: 'masala',          c: [184.75, 725.5],  w: 300.5, badge: [92,  660], title: 'Tempering & spices',
    items: [['Mustard seeds', '1 tbsp'], ['Cumin seeds', '½ tbsp'], ['Asafoetida (hing)', '1 pinch'],
            ['Chopped green chilies', '2'], ['Curry leaves', '8–10'], ['Turmeric', '½ tbsp']] },
  { id: 'onion',  step: 3, file: 'onion',           c: [453.5, 687.75],  w: 258,   badge: [544, 636], title: 'Onion',
    items: [['Sliced onion', '½']] },
  { id: 'lemon',  step: 4, file: 'lemon juice',     c: [515, 833.25],    w: 213,   badge: [592, 788], title: 'Lemon juice',
    items: [['Lemon juice', '2 tbsp']] },
  { id: 'rice',   step: 5, file: 'rice',            c: [239.25, 451.75], w: 461.5, badge: [96,  352], title: 'Rice',
    items: [['Cooked rice, with salt', '2 cups']] },
  { id: 'nuts',   step: 6, file: 'cashew and nuts', c: [261.25, 953.5],  w: 289.5, badge: [152, 896], title: 'Cashews & peanuts',
    items: [['Cashews', '8–10'], ['Peanuts', '2 tbsp']] },
];
BOWLS.forEach(b => { b.mask = 'kitchen/' + b.file; });

/* Students in Scene 5 (draw order is fixed in index.html).
   All student conversation lines, states, head-top coordinates (measured from highest visible hair/head pixel),
   and speech-bubble positions live in this single object.
   origin  = point the hover-scale grows from (feet),
   headTop = [centerX, topmostVisibleHairY] in 1920x1080 stage coordinates,
   box     = speech-bubble layout { left, top, width, tailSide, tailOffset } in 1920x1080 stage coordinates. */
const STUDENTS = {
  boy2:  {
    mask: 'school/boy 2',
    name: 'Anubhav',
    state: 'Bihar',
    dish: 'Laung Latika',
    line: "Hey everyone! I brought Laung Latika, a sweet pastry sealed with a clove. Amogh, what's in your tiffin today?",
    origin: [538, 829],
    headTop: [562, 216],
    box: { left: 105, top: 235, width: 325, tailSide: 'right', tailOffset: 44 },
  },
  main:  {
    mask: 'school/main boy',
    name: 'Amogh',
    state: 'Karnataka',
    dish: 'Lemon Rice',
    line: "Hi! My mom made Lemon Rice today, tangy and fresh. Want a bite? Tap me to see how it's made.",
    origin: [790, 942],
    headTop: [782, 264],
    box: { left: 530, top: 395, width: 350, tailSide: 'top', tailOffset: 245 },
    you: true,
  },
  boy3:  {
    mask: 'school/boy 3',
    name: 'Jash',
    state: 'Himachal Pradesh',
    dish: 'Siddu',
    line: "I've got Siddu, soft steamed bread from Himachal. It's best with a little ghee. Anyone want to trade?",
    origin: [900, 922],
    headTop: [938, 173],
    box: { left: 375, top: 18, width: 505, tailSide: 'right', tailOffset: 100 },
  },
  girl1: {
    mask: 'school/girl 1',
    name: 'Suhani',
    state: 'Uttar Pradesh',
    dish: 'Galouti Kabeb',
    line: "My tiffin has Galouti Kabeb, so soft it melts in your mouth. Jash, I'll swap you for some Siddu!",
    origin: [1048, 929],
    headTop: [1046, 249],
    box: { left: 1015, top: 38, width: 365, tailSide: 'bottom', tailOffset: 54 },
  },
  girl2: {
    mask: 'school/girl 2',
    name: 'Keya',
    state: 'Kashmir',
    dish: 'Nadru Yakhni',
    line: "I brought Nadru Yakhni, lotus stem in a creamy yogurt gravy. Come on, everyone, take a taste!",
    origin: [1240, 1031],
    headTop: [1220, 216],
    box: { left: 1295, top: 350, width: 350, tailSide: 'left', tailOffset: 48 },
  },
};
const STUDENT_HIT_ORDER = ['girl2', 'boy2', 'main', 'girl1', 'boy3'];   // front → back

/* Title scene (slow-motion handover) */
const TITLE = { duration: 6000, ease: 'cubic-bezier(0.65, 0, 0.35, 1)', momFrom: -380, boyFrom: 430 };

/* ───────────────────────────── 1. UTILITIES ────────────────────────────── */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const wrapAngle = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const rot = (v, a) => ({ x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) });
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const SVGNS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}, parent) { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }

/* ───────────────────────────── 2. STAGE ────────────────────────────────── */
const stageEl = $('#stage');
const Stage = {
  scale: 1,
  fit() {
    this.scale = Math.max(innerWidth / STAGE_W, innerHeight / STAGE_H);
    stageEl.style.setProperty('--s', this.scale);
  },
  /** client (viewport) pixels → stage units */
  toStage(cx, cy) {
    const r = stageEl.getBoundingClientRect();
    return { x: (cx - r.left) / this.scale, y: (cy - r.top) / this.scale };
  },
  /** stage units → client pixels */
  toClient(x, y) {
    const r = stageEl.getBoundingClientRect();
    return { x: r.left + x * this.scale, y: r.top + y * this.scale };
  },
};
addEventListener('resize', () => Stage.fit());
Stage.fit();

/* ───────────────────────────── 3. LOADER ───────────────────────────────── */
const Loader = {
  async run() {
    const imgs = $$('#stage img[src]').filter((im, i, arr) => arr.findIndex(x => x.src === im.src) === i);
    const videos = [$('#introVideo'), $('#titleVideo1'), $('#titleVideo2')].filter(Boolean);
    const total = imgs.length + videos.length;
    let done = 0;
    const tick = () => { done++; $('#loaderFill').style.width = Math.round(done / total * 100) + '%'; };
    await Promise.all([
      ...imgs.map(im => (im.complete && im.naturalWidth ? Promise.resolve() :
        new Promise(res => { im.addEventListener('load', res, { once: true }); im.addEventListener('error', res, { once: true }); }))
        .then(() => (im.decode ? im.decode().catch(() => {}) : 0)).then(tick)),
      ...videos.map(video => new Promise(res => {
        const ok = () => { tick(); res(); };
        if (video.readyState >= 3) return ok();
        video.addEventListener('canplaythrough', ok, { once: true });
        video.addEventListener('error', ok, { once: true });
        setTimeout(ok, 12000);            // never block forever on a slow video
        video.load();
      })),
      (document.fonts && document.fonts.load ? Promise.all([
        document.fonts.load('400 16px "Geograph"'),
        document.fonts.load('700 16px "Geograph"'),
        document.fonts.ready,
      ]).catch(() => {}) : Promise.resolve()),
    ]);
    $('#loaderNote').textContent = 'Lunch is served…';
    await sleep(350);
    $('#loader').classList.add('done');
  },
};

/* ───────────────────────────── 4. HIT MASKS ────────────────────────────── */
const Mask = {
  data: {},
  init() {
    const M = window.HIT_MASKS;
    if (!M) { console.warn('hitmasks.js missing – hover hit-testing disabled'); return; }
    this.w = M.w; this.h = M.h;
    for (const k in M.data) {
      const bin = atob(M.data[k]); const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      this.data[k] = arr;
    }
  },
  /** is stage point (x,y) on a non-transparent pixel of layer `key`? (1-cell tolerance) */
  test(key, x, y) {
    const d = this.data[key]; if (!d) return false;
    const cx = Math.floor(x / STAGE_W * this.w), cy = Math.floor(y / STAGE_H * this.h);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const px = cx + dx, py = cy + dy;
      if (px < 0 || py < 0 || px >= this.w || py >= this.h) continue;
      const i = py * this.w + px;
      if (d[i >> 3] & (0x80 >> (i & 7))) return true;
    }
    return false;
  },
};
Mask.init();

/* ───────────────────────────── 5. HUD ──────────────────────────────────── */
const Hint = {
  el: $('#hint'), timer: 0,
  set(text, delay = 0) {
    clearTimeout(this.timer);
    this.el.classList.remove('show');
    if (!text) return;
    this.timer = setTimeout(() => { this.el.textContent = text; this.el.classList.add('show'); }, delay + 220);
  },
  hide() { this.set(''); },
};
const Tooltip = {
  el: $('#tooltip'),
  show(html, cx, cy) {
    this.el.innerHTML = html; this.el.classList.add('show');
    const w = this.el.offsetWidth, h = this.el.offsetHeight;
    let x = cx + 26, y = cy + 22;
    if (x + w > innerWidth - 12) x = cx - w - 26;
    if (y + h > innerHeight - 12) y = cy - h - 22;
    this.el.style.left = Math.max(8, x) + 'px'; this.el.style.top = Math.max(8, y) + 'px';
  },
  hide() { this.el.classList.remove('show'); },
};

/* ───────────────────────────── 6. STATE ────────────────────────────────── */
/* The two choices are stored here so the recipe can later be filtered by them.
   For this prototype the dish is always Lemon Rice. */
const State = {
  diet: null,            // 'veg' | 'non-veg'
  mood: null,            // 'spicy' | 'sweet' | 'tangy' | 'crunchy'
  dish: 'lemon-rice',
  bowlsAdded: [],        // ids of bowls poured into the pan
  reset() { this.diet = null; this.mood = null; this.bowlsAdded = []; document.body.removeAttribute('data-diet'); document.body.removeAttribute('data-mood'); },
  set(k, v) { this[k] = v; document.body.dataset[k] = v; document.dispatchEvent(new CustomEvent('tiffin:state', { detail: { ...this } })); },
};

/* ───────────────────────────── 7. TRANSITIONS ──────────────────────────── */
const EASE_OUT = 'cubic-bezier(.2,.7,.2,1)';
const Transitions = {
  /** Layered depth move: the old scene rushes toward the camera (scales up, blurs, fades) while
      the next scene — waiting just behind it, blurred — comes into focus. */
  async dolly(from, to, { originFrom = '50% 50%', dur = 1100 } = {}) {
    from.style.transformOrigin = originFrom;
    from.style.zIndex = 2; to.style.zIndex = 1;
    to.classList.add('active');
    const a = from.animate(
      [{ transform: 'scale(1)', filter: 'blur(0px)', opacity: 1 }, { transform: 'scale(1.28)', filter: 'blur(16px)', opacity: 0 }],
      { duration: dur * .9, easing: 'cubic-bezier(.55,.05,.85,.45)', fill: 'forwards' });
    const b = to.animate(
      [{ transform: 'scale(.9)', filter: 'blur(18px)', opacity: 0 }, { transform: 'scale(1)', filter: 'blur(0px)', opacity: 1 }],
      { duration: dur, delay: dur * .12, easing: EASE_OUT, fill: 'both' });
    await Promise.all([a.finished, b.finished]);
    from.classList.remove('active');
    a.cancel(); b.cancel();
    from.style.zIndex = to.style.zIndex = ''; from.style.transformOrigin = '';
  },

  /** Scene 3 → Scene 4: the #ff113e "Your Lemon Rice is ready!" box smoothly grows from its centre
      to fill the entire screen (1.4 s ease-in-out) while its text fades out, matching titleVideo1's first frame. */
  async redWash(from, to) {
    const done = $('#kDone'), pill = $('#kDone span'), wash = $('#redWash');
    done.classList.add('expanding');
    const grow = pill.animate(
      [
        { transform: 'scale(1)', color: 'rgba(255, 255, 255, 1)', boxShadow: '0 14px 30px rgba(120, 10, 30, .35)' },
        { transform: 'scale(3.2)', color: 'rgba(255, 255, 255, 0)', offset: 0.28 },
        { transform: 'scale(28)', color: 'rgba(255, 255, 255, 0)', boxShadow: '0 0 0 rgba(0, 0, 0, 0)' },
      ],
      { duration: 1400, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }
    );
    await grow.finished;
    wash.classList.add('on'); wash.style.opacity = '1';
    to.classList.add('active'); from.classList.remove('active');
    grow.cancel();
    done.classList.remove('expanding');
    wash.classList.remove('on'); wash.style.opacity = '';
  },

  /** Scene 5A → Scene 5B: titleVideo2 is on the schoolroom background frame.
      Keep #scene-title visible behind #scene-school and smoothly stagger in the 5 students (left → right),
      then the book logo, then the scroll hint over ~1.35 s. */
  async revealStudents(from, to) {
    from.classList.add('bg-under');
    to.classList.add('active');
    await sleep(1380);
    from.classList.remove('active');
  },
};
/* which transition plays between which scenes */
const TRANSITION_FOR = {
  'intro>options':   (f, t) => Transitions.dolly(f, t),
  'options>dishes':  (f, t) => Transitions.dolly(f, t),
  'dishes>kitchen':  (f, t) => Transitions.dolly(f, t),
  'options>kitchen': (f, t) => Transitions.dolly(f, t),
  'kitchen>title':   (f, t) => Transitions.redWash(f, t),
  'title>school':    (f, t) => Transitions.revealStudents(f, t),
};

/* ───────────────────────────── 8. SCENE MANAGER ────────────────────────── */
const Scenes = {
  list: {}, current: null, busy: false,
  register(id, def) { def.id = id; def.el = $('#scene-' + id); this.list[id] = def; },
  /** play the transition from the current scene to `id` */
  async go(id) {
    const from = this.current, to = this.list[id];
    if (!to || this.busy) return;
    this.busy = true; Hint.hide(); Tooltip.hide();
    to.reset && to.reset();
    const run = TRANSITION_FOR[`${from.id}>${id}`] || ((f, t) => Transitions.dolly(f, t));
    if (!to.enterAfterTransition) to.enter && to.enter();
    await run(from.el, to.el);
    if (to.enterAfterTransition) to.enter && to.enter();
    from.exit && from.exit();
    this.current = to; this.busy = false;
    to.ready && to.ready();
  },
  /** jump with no transition (boot, replay, ?scene= debug links) */
  jump(id) {
    $$('.scene').forEach(s => s.classList.remove('active', 'bg-under'));
    const to = this.list[id];
    if (this.current && this.current.exit) this.current.exit();
    to.reset && to.reset(); to.el.classList.add('active');
    this.current = to; to.enter && to.enter(); to.ready && to.ready();
  },
  tap(e) { if (!this.busy && this.current && this.current.onTap) this.current.onTap(e); },
};
document.addEventListener('click', e => {
  if (e.target.closest('button, a, input, #pdfModal, #stateModal, #statesSection, #siteFooter')) return;
  Scenes.tap(e);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if ($('#stateModal') && !$('#stateModal').hidden) return StatesExplorer.closeModal();
    if (!$('#pdfModal').hidden) return PDF.close();
  }
  if ((e.key === ' ' || e.key === 'Enter') && !e.target.closest('button, a, input, #statesSection, #stateModal') && $('#pdfModal').hidden && (!$('#stateModal') || $('#stateModal').hidden)) {
    e.preventDefault();
    Scenes.tap(e);
  }
});

/* ───────────────────────────── 9. SCENES ───────────────────────────────── */

/* ===== SCENE 1 · INTRO (pre-made animation, auto-plays + sequential dialogues) ===== */
const Intro = (() => {
  const video = $('#introVideo'), boySpeech = $('#boySpeech'), momSpeech = $('#momSpeech');
  let mode = 'idle', watch = 0, timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  const settle = () => {
    if (mode !== 'playing') return;
    mode = 'dialogue';
    video.pause();
    Hint.hide();
    // 1. Boy's line appears first
    boySpeech.classList.add('show');
    // 2. After boyDialogueMs, fade boy's line out
    later(() => {
      boySpeech.classList.remove('show');
      // 3. After fade-out completes, mother's line fades in
      later(() => {
        momSpeech.classList.add('show');
        // 4. After momDialogueMs, fade mother's line out and transition automatically to Scene 2
        later(() => {
          momSpeech.classList.remove('show');
          later(() => {
            mode = 'done';
            Scenes.go('options');
          }, INTRO.dialogueFadeMs);
        }, INTRO.momDialogueMs);
      }, INTRO.dialogueFadeMs + 100);
    }, INTRO.boyDialogueMs);
  };

  function beginPlayback() {
    if (mode !== 'waiting') return;
    mode = 'playing';
    Hint.hide();
    try { video.currentTime = INTRO.startAt; } catch (_) {}
    video.play().catch(() => {});
    clearInterval(watch);
    watch = setInterval(() => {
      if (video.currentTime >= INTRO.settleAt || video.ended) {
        clearInterval(watch);
        settle();
      }
    }, 60);
  }

  return {
    reset() {
      mode = 'waiting';
      clearInterval(watch);
      clearTimers();
      boySpeech.classList.remove('show');
      momSpeech.classList.remove('show');
      video.pause();
      try { video.currentTime = INTRO.startAt; } catch (_) {}
    },
    enter() {
      Hint.hide();
    },
    ready() {
      // If jumped via ?scene=intro where blackFade is already 0, start immediately
      if (blackFade.style.opacity === '0') beginPlayback();
    },
    startAuto() {
      beginPlayback();
    },
    exit() {
      video.pause();
      clearInterval(watch);
      clearTimers();
      boySpeech.classList.remove('show');
      momSpeech.classList.remove('show');
    },
  };
})();

/* ===== SCENE 2 · OPTIONS (Veg / Non-veg → Now with…) ===== */
const Options = (() => {
  const wrap = $('#optHandWrap'), pDiet = $('#panelDiet'), pMood = $('#panelMood');
  let step = 'idle', anim = null, timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  function choose(group, btn) {
    $$('.tag-btn', group).forEach(b => b.classList.remove('chosen'));
    btn.classList.add('chosen');
  }
  $$('[data-diet]').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation(); if (step !== 'diet') return; step = 'busy';
    State.set('diet', btn.dataset.diet); choose(pDiet, btn);
    Hint.hide();
    later(() => { pDiet.classList.remove('show'); }, 420);
    later(() => { pMood.classList.add('show'); step = 'mood'; Hint.set('Pick a mood — tap a button on Mom\u2019s palm'); }, 900);
  }));
  $$('[data-mood]').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation(); if (step !== 'mood') return; step = 'busy';
    State.set('mood', btn.dataset.mood); choose(pMood, btn);
    Hint.hide();
    later(() => { pMood.classList.remove('show'); }, 450);
    later(() => Scenes.go('dishes'), 850);
  }));
  return {
    reset() {
      timers.forEach(clearTimeout); timers = []; step = 'idle';
      pDiet.classList.remove('show'); pMood.classList.remove('show');
      $$('.tag-btn', $('#palm')).forEach(b => b.classList.remove('chosen'));
      if (anim) anim.cancel();
      wrap.style.opacity = 0;
    },
    enter() {
      // Mom's hand comes forward, palm up
      anim = wrap.animate(
        [{ transform: 'translate(-420px, 300px) rotate(-14deg)', opacity: 0 }, { transform: 'translate(0,0) rotate(0)', opacity: 1 }],
        { duration: 1300, delay: 500, easing: EASE_OUT, fill: 'both' });
      later(() => { pDiet.classList.add('show'); step = 'diet'; Hint.set('Veg or Non-veg? Tap a button on Mom\u2019s palm'); }, 1700);
    },
    exit() { timers.forEach(clearTimeout); },
  };
})();

/* ===== SCENE 3 · DISHES (loading animation → 4 dish choice cards) ===== */
const Dishes = (() => {
  const loadEl = $('#dishesLoading'), choiceEl = $('#dishesChoice'), confirmEl = $('#dishesConfirm');
  const fillEl = $('#dishesProgressFill'), mainCard = $('#cardLemonRice');
  const cards = $$('.dish-card', choiceEl);
  const statePills = $$('.state-pill', loadEl);
  const LOAD_MS = 3700;
  const STAGGER_MS = 150;
  const CONFIRM_MS = 2000;
  let step = 'idle', timers = [], pillTimer = 0, progRaf = 0, startT = 0;

  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearAll = () => {
    timers.forEach(clearTimeout); timers = [];
    clearInterval(pillTimer);
    cancelAnimationFrame(progRaf);
  };

  function tickProgress(now) {
    if (step !== 'loading') return;
    const pct = clamp((now - startT) / LOAD_MS * 100, 0, 100);
    fillEl.style.width = pct.toFixed(1) + '%';
    if (pct < 100) progRaf = requestAnimationFrame(tickProgress);
  }

  function showChoices() {
    step = 'choosing';
    clearInterval(pillTimer);
    cancelAnimationFrame(progRaf);
    fillEl.style.width = '100%';
    loadEl.classList.remove('show');
    later(() => {
      loadEl.hidden = true;
      choiceEl.hidden = false;
      void choiceEl.offsetWidth;
      choiceEl.classList.add('show');
      cards.forEach((c, idx) => {
        later(() => c.classList.add('in'), idx * STAGGER_MS);
      });
    }, 380);
  }

  mainCard.addEventListener('click', e => {
    e.stopPropagation();
    if (step !== 'choosing') return;
    step = 'chosen';
    State.set('dish', 'lemon-rice');
    Hint.hide();

    // Measure mainCard's current un-translated layout position in stage coordinates (1920x1080)
    // and compute exact dx, dy so the card glides smoothly to the centre of the screen.
    const cx = mainCard.offsetLeft + mainCard.offsetWidth / 2;
    const cy = mainCard.offsetTop + mainCard.offsetHeight / 2;
    const dx = (STAGE_W / 2) - cx;
    const dy = (STAGE_H / 2 - 42) - cy;   // slightly above vertical midpoint so the confirm pill sits cleanly below
    mainCard.style.setProperty('--center-dx', `${dx.toFixed(1)}px`);
    mainCard.style.setProperty('--center-dy', `${dy.toFixed(1)}px`);

    choiceEl.classList.add('chosen');
    // Show "Great choice! Now it's time to cook!" as the card settles in the centre (~0.55s)
    later(() => {
      confirmEl.classList.add('show');
    }, 520);
    later(() => {
      Scenes.go('kitchen');
    }, 520 + CONFIRM_MS);
  });

  return {
    reset() {
      clearAll();
      step = 'idle';
      fillEl.style.width = '0%';
      loadEl.hidden = false;
      loadEl.classList.remove('show');
      choiceEl.hidden = true;
      choiceEl.classList.remove('show', 'chosen');
      confirmEl.classList.remove('show');
      mainCard.style.removeProperty('--center-dx');
      mainCard.style.removeProperty('--center-dy');
      cards.forEach(c => c.classList.remove('in'));
      statePills.forEach((p, i) => p.classList.toggle('active', i === 0));
    },
    enter() {
      Hint.hide();
      step = 'loading';
      loadEl.hidden = false;
      void loadEl.offsetWidth;
      loadEl.classList.add('show');
      startT = performance.now();
      progRaf = requestAnimationFrame(tickProgress);
      let idx = 0;
      pillTimer = setInterval(() => {
        idx = (idx + 1) % statePills.length;
        statePills.forEach((p, i) => p.classList.toggle('active', i === idx));
      }, 850);
      later(showChoices, LOAD_MS);
    },
    exit() {
      clearAll();
    },
    _debug: { get step() { return step; }, showChoices },
  };
})();

/* ===== SCENE 4 · KITCHEN (interactive cooking) ===== */
const Pan = (() => {                     // progressive pan contents (drawn procedurally – no pan-content artwork was supplied)
  const root = $('#panContents'); let groups = {}, tint, bubbles;
  function build() {
    root.innerHTML = '';
    const defs = svg('defs', {}, root);
    const og = svg('radialGradient', { id: 'oilGrad', cx: '50%', cy: '45%', r: '60%' }, defs);
    svg('stop', { offset: '0', 'stop-color': '#f7cf5a', 'stop-opacity': '.92' }, og);
    svg('stop', { offset: '.7', 'stop-color': '#e2a02a', 'stop-opacity': '.8' }, og);
    svg('stop', { offset: '1', 'stop-color': '#c9781c', 'stop-opacity': '.55' }, og);
    const clip = svg('clipPath', { id: 'panClip' }, defs);
    svg('ellipse', { cx: PAN.cx, cy: PAN.cy, rx: PAN.rx - 6, ry: PAN.ry - 4 }, clip);
    const rough = svg('filter', { id: 'rough', x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
    svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '.045', numOctaves: '2', seed: '4', result: 'n' }, rough);
    svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '5' }, rough);
    const soft = svg('filter', { id: 'soft', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
    svg('feGaussianBlur', { stdDeviation: '9' }, soft);

    const base = svg('g', { 'clip-path': 'url(#panClip)' }, root);
    const c = svg('g', { transform: `translate(${PAN.cx} ${PAN.cy})` }, base);
    const R = rng(7);
    const inEll = (rx, ry) => { const r = Math.sqrt(R()), a = R() * 6.2832; return [Math.cos(a) * rx * r, Math.sin(a) * ry * r]; };
    const mk = id => (groups[id] = svg('g', { class: 'ing', 'data-id': id }, c));

    // oil (base layer + sizzle bubbles)
    let g = mk('oil');
    svg('ellipse', { cx: 0, cy: 6, rx: PAN.rx - 14, ry: PAN.ry - 10, fill: 'url(#oilGrad)' }, g);
    svg('path', { d: 'M-120 -4 Q-60 -26 10 -18', stroke: '#fff', 'stroke-opacity': '.5', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, g);
    svg('path', { d: 'M40 30 Q90 22 128 4', stroke: '#fff', 'stroke-opacity': '.35', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, g);
    bubbles = svg('g', { class: 'bubbles' }, c);
    for (let i = 0; i < 16; i++) { const [x, y] = inEll(150, 56);
      svg('circle', { cx: x, cy: y, r: 3 + R() * 4, fill: 'none', stroke: '#fff7d6', 'stroke-width': 1.8, style: `animation-delay:${(R() * 1.6).toFixed(2)}s` }, bubbles); }

    // rice mound (+ turmeric/lemon tint)
    g = mk('rice');
    svg('ellipse', { cx: 0, cy: 4, rx: 150, ry: 54, fill: '#f3e9d4', filter: 'url(#rough)' }, g);
    const cols = ['#fffaf0', '#f4e9d2', '#eadfc4', '#ffffff'];
    for (let i = 0; i < 330; i++) { const [x, y] = inEll(146, 50);
      svg('ellipse', { cx: x, cy: y - 2, rx: 6.5 + R() * 2.5, ry: 2.4 + R(), fill: cols[(R() * 4) | 0], transform: `rotate(${(R() * 180) | 0} ${x} ${y})`, 'fill-opacity': .95 }, g); }
    tint = svg('ellipse', { cx: 0, cy: 4, rx: 150, ry: 54, fill: '#f0b300', style: 'mix-blend-mode:multiply;opacity:0;transition:opacity 1s ease' }, g);

    // onion slices
    g = mk('onion');
    for (let i = 0; i < 18; i++) { const [x, y] = inEll(132, 44), a = (R() * 360) | 0;
      svg('path', { d: 'M-16 0 Q0 -14 16 0', stroke: i % 2 ? '#ecc7da' : '#f4dde8', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round', transform: `translate(${x} ${y}) rotate(${a})` }, g); }

    // cashews + peanuts
    g = mk('nuts');
    for (let i = 0; i < 9; i++) { const [x, y] = inEll(128, 42), a = (R() * 360) | 0;
      svg('path', { d: 'M-12 -2 C-10 -12 8 -14 13 -4 C15 3 8 9 2 6 C6 3 3 -1 -4 3 C-9 5 -13 3 -12 -2Z', fill: '#efd7a2', stroke: '#b88f4a', 'stroke-width': 1.3, transform: `translate(${x} ${y}) rotate(${a})` }, g); }
    for (let i = 0; i < 13; i++) { const [x, y] = inEll(132, 44);
      svg('ellipse', { cx: x, cy: y, rx: 8, ry: 5.2, fill: '#cf9c5c', stroke: '#8e5d2b', 'stroke-width': 1.2, transform: `rotate(${(R() * 180) | 0} ${x} ${y})` }, g); }

    // masala: turmeric wash, mustard, cumin, curry leaves, green chillies
    g = mk('masala');
    svg('ellipse', { cx: 0, cy: 4, rx: 168, ry: 60, fill: '#e7a90c', 'fill-opacity': .3, filter: 'url(#soft)' }, g);
    for (let i = 0; i < 34; i++) { const [x, y] = inEll(150, 52); svg('circle', { cx: x, cy: y, r: 2.4 + R() * 1.4, fill: '#241a14' }, g); }
    for (let i = 0; i < 24; i++) { const [x, y] = inEll(148, 50); svg('ellipse', { cx: x, cy: y, rx: 4.6, ry: 1.7, fill: '#8d6a38', transform: `rotate(${(R() * 180) | 0} ${x} ${y})` }, g); }
    for (let i = 0; i < 10; i++) { const [x, y] = inEll(130, 44), a = (R() * 360) | 0;
      const lf = svg('g', { transform: `translate(${x} ${y}) rotate(${a})` }, g);
      svg('path', { d: 'M0 0 Q13 -9 28 0 Q13 9 0 0Z', fill: '#2f7d3c', stroke: '#1f5a2a', 'stroke-width': 1.3 }, lf);
      svg('path', { d: 'M2 0 L26 0', stroke: '#8fd079', 'stroke-width': 1.2 }, lf); }
    for (let i = 0; i < 7; i++) { const [x, y] = inEll(124, 40);
      svg('circle', { cx: x, cy: y, r: 6.4, fill: '#b5d868', stroke: '#4f8a2a', 'stroke-width': 2.2 }, g);
      svg('circle', { cx: x, cy: y, r: 2.4, fill: '#eef6c4' }, g); }

    // lemon: bright wash, juice drops, wedge
    g = mk('lemon');
    svg('ellipse', { cx: 0, cy: 4, rx: 150, ry: 54, fill: '#f7ee7a', 'fill-opacity': .26, filter: 'url(#soft)' }, g);
    for (let i = 0; i < 12; i++) { const [x, y] = inEll(120, 40);
      svg('ellipse', { cx: x, cy: y, rx: 4, ry: 6, fill: '#fffbd0', 'fill-opacity': .75 }, g); }
    const wd = svg('g', { transform: 'translate(150 36) rotate(-14)' }, g);
    svg('path', { d: 'M-36 0 A36 36 0 0 1 36 0 Z', fill: '#f4d63c', stroke: '#c9a418', 'stroke-width': 3 }, wd);
    svg('path', { d: 'M-28 -2 A28 28 0 0 1 28 -2 Z', fill: '#fff3a0' }, wd);
    for (const a of [-60, -30, 0, 30, 60]) svg('line', { x1: 0, y1: -1, x2: Math.sin(a * Math.PI / 180) * 26, y2: -Math.cos(a * Math.PI / 180) * 26, stroke: '#f0cf34', 'stroke-width': 2 }, wd);
  }
  function update() {
    const has = id => State.bowlsAdded.includes(id);
    tint.style.opacity = Math.min(.82, (has('masala') ? .55 : 0) + (has('lemon') ? .25 : 0) + (has('oil') ? .05 : 0));
    bubbles.style.opacity = has('oil') ? 1 : 0;
  }
  build();
  return {
    add(id) { groups[id].classList.add('in'); update(); },
    reset() { Object.values(groups).forEach(g => g.classList.remove('in')); update(); },
    point() { const r = Math.sqrt(Math.random()), a = Math.random() * 6.2832; return { x: PAN.cx + Math.cos(a) * 130 * r, y: PAN.cy + 6 + Math.sin(a) * 42 * r }; },
  };
})();

const Fx = (() => {                      // little ingredient particles falling from the bowl into the pan
  const cv = $('#fxCanvas'), ctx = cv.getContext('2d'); let ps = [];
  const PAL = {
    rice: ['#fffaf0', '#f1e6cf'], oil: ['#f3c24a', '#e5a226'], masala: ['#241a14', '#8d6a38', '#2f7d3c', '#b5d868', '#e7a90c'],
    onion: ['#f4dde8', '#ecc7da'], nuts: ['#efd7a2', '#cf9c5c'], lemon: ['#f7ee7a', '#fffbd0'],
  };
  let running = false;
  function loop(t) {
    ctx.clearRect(0, 0, STAGE_W, STAGE_H);
    ps = ps.filter(p => { p.t += 1 / 60 / p.dur; return p.t < 1; });
    for (const p of ps) {
      if (p.t < 0) continue;
      const k = p.t, x = p.x0 + (p.x1 - p.x0) * k, y = p.y0 + (p.y1 - p.y0) * k * k + Math.sin(k * Math.PI) * -p.arc;
      ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot + k * 5); ctx.globalAlpha = k > .9 ? (1 - k) * 10 : 1;
      ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(0, 0, p.s * p.sq, p.s, 0, 0, 6.2832); ctx.fill(); ctx.restore();
    }
    if (ps.length) requestAnimationFrame(loop); else { running = false; ctx.clearRect(0, 0, STAGE_W, STAGE_H); }
  }
  return {
    pour(id, from) {
      const pal = PAL[id];
      for (let i = 0; i < 34; i++) {
        const tgt = Pan.point();
        ps.push({ x0: from.x + (Math.random() - .5) * 40, y0: from.y + (Math.random() - .5) * 18, x1: tgt.x, y1: tgt.y,
          arc: 30 + Math.random() * 40, t: -Math.random() * .55, dur: .5 + Math.random() * .25, rot: Math.random() * 6,
          s: id === 'oil' || id === 'lemon' ? 4 + Math.random() * 3 : 3 + Math.random() * 3.5, sq: id === 'rice' || id === 'masala' ? 1.9 : 1.15,
          col: pal[(Math.random() * pal.length) | 0] });
      }
      if (!running) { running = true; requestAnimationFrame(loop); }
    },
    clear() { ps = []; },
  };
})();

const Kitchen = (() => {
  const el = $('#scene-kitchen'), counter = $('#kCounter'), dropHint = $('#dropHint'), cursor = $('#kCursor');
  const aShoulder = $('#armShoulder'), aForearm = $('#armForearm'), aHand = $('#armHand'), heldImg = $('#heldBowl');
  const doneBanner = $('#kDone'), steam = $('#kSteam'), checks = $('#bowlChecks'), skipBtn = $('#kSkipBtn');
  const bowlEls = {}; $$('.bowl', el).forEach(b => bowlEls[b.dataset.bowl] = b);
  BOWLS.forEach(b => { b.el = bowlEls[b.id]; b.done = false; });
  const S = ARM.S, E0 = ARM.E, W0 = ARM.W, G0 = ARM.G;
  const L1 = dist(S, E0), L2 = dist(E0, W0);
  const th1n = Math.atan2(E0.y - S.y, E0.x - S.x), th2n = Math.atan2(W0.y - E0.y, W0.x - E0.x);
  const phin = Math.atan2(W0.y - S.y, W0.x - S.x);
  const SIGMA = Math.sign(wrapAngle(th1n - phin)) || -1;          // keeps the elbow bending the same way as in the still
  const gOff = { x: G0.x - W0.x, y: G0.y - W0.y };

  // pivots: every arm PNG rotates about its own joint
  aShoulder.style.transformOrigin = `${S.x}px ${S.y}px`;
  aForearm.style.transformOrigin  = `${E0.x}px ${E0.y}px`;
  aHand.style.transformOrigin     = `${W0.x}px ${W0.y}px`;

  let active = false, raf = 0, last = 0;
  let pointer = { x: G0.x, y: G0.y }, smooth = { x: G0.x, y: G0.y }, hasPointer = false;
  let tilt = 0, tiltTarget = 0, lockC = null, G = { ...G0 }, rotNow = 0;
  let held = null, hovered = null, busy = false, complete = false, completeAt = 0, pourToken = 0;

  /* ---- two-bone inverse kinematics ---- */
  function ik(Wt) {
    const v = { x: Wt.x - S.x, y: Wt.y - S.y };
    const d = clamp(Math.hypot(v.x, v.y), ARM.MIN_REACH, L1 + L2 - 1);          // clamp the reach – never stretches or detaches
    const phi = Math.atan2(v.y, v.x);
    const cosA = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1);
    const th1 = phi + SIGMA * Math.acos(cosA);
    const Ej = { x: S.x + L1 * Math.cos(th1), y: S.y + L1 * Math.sin(th1) };
    const Wc = { x: S.x + d * Math.cos(phi), y: S.y + d * Math.sin(phi) };
    const th2 = Math.atan2(Wc.y - Ej.y, Wc.x - Ej.x);
    return { r1: wrapAngle(th1 - th1n), r2: wrapAngle(th2 - th2n), E: Ej, W: Wc };
  }
  /* solve so that the held-bowl point G sits exactly on the cursor C */
  function solve(C, tl) {
    let Wt = { x: C.x - gOff.x, y: C.y - gOff.y }, out, r3 = 0;
    for (let i = 0; i < 6; i++) {
      out = ik(Wt); r3 = out.r2 * ARM.HAND_FOLLOW + tl;
      const o = rot(gOff, r3); Wt = { x: C.x - o.x, y: C.y - o.y };
    }
    out = ik(Wt); r3 = out.r2 * ARM.HAND_FOLLOW + tl;
    const o = rot(gOff, r3);
    return { ...out, r3, G: { x: out.W.x + o.x, y: out.W.y + o.y } };
  }
  function apply(o) {
    aShoulder.style.transform = `rotate(${o.r1}rad)`;
    aForearm.style.transform  = `translate(${o.E.x - E0.x}px, ${o.E.y - E0.y}px) rotate(${o.r2}rad)`;
    aHand.style.transform     = `translate(${o.W.x - W0.x}px, ${o.W.y - W0.y}px) rotate(${o.r3}rad)`;
    G = o.G; rotNow = o.r3;
  }
  function handMatrix() {                       // same maths as the CSS above, for FLIP-style bowl hand-off
    const t = aHand.style.transform.match(/translate\(([-\d.e]+)px, ([-\d.e]+)px\) rotate\(([-\d.e]+)rad\)/);
    const [tx, ty, r] = t ? [+t[1], +t[2], +t[3]] : [0, 0, 0];
    return new DOMMatrix().translateSelf(tx, ty).translateSelf(W0.x, W0.y).rotateSelf(r * 180 / Math.PI).translateSelf(-W0.x, -W0.y);
  }
  const heldScale = b => clamp(400 / b.w, 1, 1.7);
  const overPan = p => ((p.x - PAN.cx) / PAN.dropRx) ** 2 + ((p.y - PAN.cy) / PAN.dropRy) ** 2 <= 1;

  /* ---- frame loop ---- */
  function frame(now) {
    if (!active) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const tgt = lockC || pointer, k = 1 - Math.exp(-dt * ARM.FOLLOW_SPEED);
    smooth.x += (tgt.x - smooth.x) * k; smooth.y += (tgt.y - smooth.y) * k;
    tilt += (tiltTarget - tilt) * (1 - Math.exp(-dt * 9));
    apply(solve(smooth, tilt));
    if (held) dropHint.classList.toggle('hot', overPan(G));
    raf = requestAnimationFrame(frame);
  }

  /* ---- bowls (ordered 1 → 6) ---- */
  const nextBowl = () => BOWLS[State.bowlsAdded.length] || null;
  function updateBadges() {
    const nxt = nextBowl();
    BOWLS.forEach(b => {
      const chk = $(`.chk[data-for="${b.id}"]`);
      const isNext = !b.done && nxt && nxt.id === b.id;
      b.el.classList.toggle('next-bowl', !!isNext);
      if (!chk) return;
      chk.classList.toggle('on', !!b.done);
      chk.classList.toggle('next', !!isNext);
      chk.textContent = b.done ? '✓' : b.step;
    });
  }
  function bowlAt(p) {
    let best = null, bd = 1e9;
    for (const b of BOWLS) if (Mask.test(b.mask, p.x, p.y)) { const d = Math.hypot(p.x - b.c[0], p.y - b.c[1]); if (d < bd) { bd = d; best = b; } }
    return best;
  }
  function tipFor(b, cx, cy) {
    Tooltip.show(`<div class="tt-title">Step ${b.step} · ${b.title}</div><ul>${b.items.map(i => `<li><span>${i[0]}</span><b>${i[1]}</b></li>`).join('')}</ul>${b.done ? '<div class="tt-done">✓ already in the pan</div>' : ''}`, cx, cy);
  }
  function setHover(b, e) {
    if (hovered && hovered !== b) hovered.el.classList.remove('hover');
    hovered = b;
    const nxt = nextBowl();
    cursor.classList.toggle('over', !!b && !b.done && nxt && nxt.id === b.id);
    if (b) { if (!b.done) b.el.classList.add('hover'); tipFor(b, e.clientX, e.clientY); } else Tooltip.hide();
  }
  function hintIdle() {
    if (complete) return Hint.set('Tap anywhere to continue');
    const nxt = nextBowl();
    Hint.set(nxt ? `Step ${nxt.step} of 6: pick up the ${nxt.title.toLowerCase()} bowl and pour it into the pan` : 'Hover a bowl to read it');
  }
  function rejectOutOfOrder(b) {
    const nxt = nextBowl();
    const chk = $(`.chk[data-for="${b.id}"]`);
    b.el.classList.remove('wrong'); if (chk) chk.classList.remove('wrong');
    void b.el.offsetWidth;
    b.el.classList.add('wrong'); if (chk) chk.classList.add('wrong');
    setTimeout(() => { b.el.classList.remove('wrong'); if (chk) chk.classList.remove('wrong'); }, 500);
    if (nxt) Hint.set(`Add step ${nxt.step} (${nxt.title}) first`);
  }

  function pickUp(b, mode, e) {
    held = { b, mode, downAt: performance.now(), downPos: { ...pointer } };
    setHover(null, e); Tooltip.hide(); cursor.classList.add('holding');
    b.el.classList.remove('next-bowl');
    // FLIP: the bowl leaves the counter and settles into the hand
    const F = handMatrix(), c = { x: b.c[0], y: b.c[1] }, s = heldScale(b);
    heldImg.src = b.el.src; heldImg.hidden = false;
    heldImg.style.transformOrigin = `${c.x}px ${c.y}px`;
    heldImg.style.transition = 'none';
    heldImg.style.transform = new DOMMatrix().translateSelf(-c.x, -c.y).multiplySelf(F.inverse()).translateSelf(c.x, c.y).toString();
    void heldImg.offsetWidth;
    heldImg.style.transition = 'transform .32s cubic-bezier(.2,.8,.2,1)';
    heldImg.style.transform = `translate(${G0.x - c.x}px, ${G0.y - c.y}px) scale(${s})`;
    b.el.classList.remove('hover'); b.el.classList.add('held');
    counter.classList.add('blurred'); dropHint.classList.add('on');
    Hint.set(mode === 'drag' ? 'Carry it over the pan, then let go to pour' : 'Click over the pan to pour · click elsewhere to put it back');
  }
  function release() { heldImg.hidden = true; heldImg.style.transition = 'none'; counter.classList.remove('blurred'); dropHint.classList.remove('on', 'hot'); cursor.classList.remove('holding'); }
  function dropToCounter(b, markDone) {
    const s = heldScale(b);
    b.el.style.transition = 'none';
    b.el.style.transform = `translate(${G.x - b.c[0]}px, ${G.y - b.c[1]}px) scale(${s})`;
    b.el.classList.remove('held'); if (markDone) b.el.classList.add('done');
    void b.el.offsetWidth;
    b.el.style.transition = ''; b.el.classList.add('returning'); b.el.style.transform = '';
    setTimeout(() => b.el.classList.remove('returning'), 600);
  }
  function putBack() {
    const b = held.b; held = null; release(); dropToCounter(b, false); updateBadges(); hintIdle();
  }
  async function pour() {
    const myToken = ++pourToken;
    const { b } = held; held = null; busy = true; lockC = { ...G };
    Hint.hide(); dropHint.classList.remove('on', 'hot'); Tooltip.hide();
    tiltTarget = ARM.POUR_TILT_DEG * Math.PI / 180;
    await sleep(420);
    if (myToken !== pourToken) return;
    const w = b.w * heldScale(b);
    const rim = rot({ x: -w * .4, y: -w * .02 }, rotNow);
    Fx.pour(b.id, { x: G.x + rim.x, y: G.y + rim.y });          // ingredient particles
    await sleep(380);
    if (myToken !== pourToken) return;
    if (!State.bowlsAdded.includes(b.id)) State.bowlsAdded.push(b.id);
    b.done = true; Pan.add(b.id);                                // pan visibly changes
    steam.classList.add('on'); updateProgress();
    await sleep(850);
    if (myToken !== pourToken) return;
    tiltTarget = 0; await sleep(380);
    if (myToken !== pourToken) return;
    release(); dropToCounter(b, true); lockC = null;             // empty bowl goes back on the counter
    updateBadges();
    busy = false;
    if (State.bowlsAdded.length === BOWLS.length) finish(); else hintIdle();
  }
  function finish() {
    complete = true; completeAt = performance.now();
    if (skipBtn) skipBtn.hidden = true;
    doneBanner.classList.add('show');
    steam.classList.add('strong');
    Hint.set('Tap anywhere to continue', 900);
  }
  function skip() {
    if (complete) return;
    pourToken++;
    held = null;
    busy = false;
    tiltTarget = 0;
    tilt = 0;
    lockC = { ...G0 };
    pointer = { ...G0 };
    smooth = { ...G0 };
    apply(solve(G0, 0));
    setHover(null, { clientX: 0, clientY: 0 });
    Tooltip.hide();
    Fx.clear();
    release();
    State.bowlsAdded = BOWLS.map(b => b.id);
    BOWLS.forEach(b => {
      b.done = true;
      b.el.classList.remove('hover', 'held', 'returning', 'wrong', 'next-bowl');
      b.el.classList.add('done');
      b.el.style.transform = '';
      b.el.style.transition = '';
      Pan.add(b.id);
    });
    steam.classList.add('on');
    updateBadges();
    updateProgress();
    finish();
  }
  if (skipBtn) {
    skipBtn.addEventListener('pointerdown', e => e.stopPropagation());
    skipBtn.addEventListener('click', e => {
      e.stopPropagation();
      skip();
    });
  }
  function updateProgress() {
    const n = State.bowlsAdded.length;
    $('#rcCount').textContent = n;
    $$('#rcDots i').forEach((d, i) => d.classList.toggle('on', i < n));
  }

  /* ---- pointer input ---- */
  const upd = e => { pointer = { ...Stage.toStage(e.clientX, e.clientY) }; pointer.x = clamp(pointer.x, 0, STAGE_W); pointer.y = clamp(pointer.y, 0, STAGE_H); hasPointer = true; };
  el.addEventListener('pointermove', e => {
    if (!active) return; upd(e);
    cursor.classList.add('on'); cursor.style.left = pointer.x + 'px'; cursor.style.top = pointer.y + 'px';
    if (!held && !busy) setHover(complete ? null : bowlAt(pointer), e); else if (hovered) setHover(null, e);
  });
  el.addEventListener('pointerleave', () => { cursor.classList.remove('on'); if (!held) setHover(null, { clientX: 0, clientY: 0 }); });
  el.addEventListener('pointerdown', e => {
    if (e.target.closest('#kSkipBtn')) return;
    if (!active || busy || complete) return; upd(e);
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
    if (!held) {
      const b = bowlAt(pointer);
      if (b && !b.done) {
        const nxt = nextBowl();
        if (nxt && b.id === nxt.id) pickUp(b, 'drag', e);
        else rejectOutOfOrder(b);
      }
    }
    else if (held.mode === 'carry') { if (overPan(G)) pour(); else putBack(); }
  });
  el.addEventListener('pointerup', e => {
    if (!active || busy || !held || held.mode !== 'drag') return;
    const quick = performance.now() - held.downAt < 280 && dist(pointer, held.downPos) < 14;
    if (overPan(G)) pour();
    else if (quick) { held.mode = 'carry'; Hint.set('Click over the pan to pour · click elsewhere to put it back'); }   // a simple click = carry
    else putBack();
  });
  el.addEventListener('pointercancel', () => { if (held && !busy) putBack(); });

  return {
    reset() {
      active = false; cancelAnimationFrame(raf);
      pourToken++;
      held = null; hovered = null; busy = false; complete = false; lockC = null; tilt = tiltTarget = 0;
      pointer = { ...G0 }; smooth = { ...G0 }; hasPointer = false;
      State.bowlsAdded = [];
      BOWLS.forEach(b => { b.done = false; b.el.classList.remove('hover', 'held', 'done', 'returning', 'wrong', 'next-bowl'); b.el.style.transform = ''; b.el.style.transition = ''; });
      updateBadges();
      Pan.reset(); Fx.clear(); release(); steam.classList.remove('on', 'strong'); doneBanner.classList.remove('show', 'expanding');
      if (skipBtn) skipBtn.hidden = false;
      cursor.classList.remove('on', 'over'); updateProgress(); apply(solve(G0, 0));
    },
    enter() {
      active = true; updateBadges(); last = performance.now(); raf = requestAnimationFrame(frame);
    },
    ready() { hintIdle(); },
    exit() { active = false; cancelAnimationFrame(raf); Tooltip.hide(); },
    onTap() {
      if (complete && performance.now() - completeAt > 900 && !busy) Scenes.go('title');
    },
    skip,
    // exposed for QA
    _debug: { get G() { return G; }, solve, apply, get held() { return held; }, get busy() { return busy; }, skip },
  };
})();
// build static kitchen bits: progress dots, numbered step badges (1-6), steam puffs
(() => {
  $('#rcDots').innerHTML = BOWLS.map(() => '<i></i>').join('');
  $('#bowlChecks').innerHTML = BOWLS.map(b => `<div class="chk" data-for="${b.id}" style="left:${b.badge[0]}px;top:${b.badge[1]}px">${b.step}</div>`).join('');
  $('#kSteam').innerHTML = [-90, 0, 90].map((dx, i) => `<div class="steam" style="left:${PAN.cx + dx}px;top:${PAN.cy - 30}px;animation-delay:${-i * 1.2}s"></div>`).join('');
})();

/* ===== SCENE 4 · TITLE (two sequential videos) ===== */
const Title = (() => {
  const el = $('#scene-title'), v1 = $('#titleVideo1'), v2 = $('#titleVideo2');
  let mode = 'idle', watch2 = 0;   // 'idle' | 'v1_playing' | 'v1_frozen' | 'v2_playing' | 'v2_frozen'

  v1.addEventListener('ended', () => {
    if (mode !== 'v1_playing') return;
    v1.pause();
    mode = 'v1_frozen';
    Hint.set("He's running late for school! Click the screen to hand him his tiffin box.");
  });

  // The classroom background in titleVideo2 settles at ~2.9 s (out of 5.04 s).
  // Reveal the 5 students immediately once the classroom settles (t >= 3.05 s) so there is no dead wait.
  const finishV2 = () => {
    if (mode !== 'v2_playing') return;
    clearInterval(watch2);
    v2.pause();
    mode = 'v2_frozen';
    Scenes.go('school');
  };
  v2.addEventListener('ended', finishV2);

  return {
    enterAfterTransition: true,   // start titleVideo1 immediately after the #ff113e wash completes
    reset() {
      mode = 'idle'; clearInterval(watch2);
      el.classList.remove('bg-under');
      v1.pause(); try { v1.currentTime = 0; } catch (_) {}
      v2.pause(); v2.classList.remove('on'); try { v2.currentTime = 0; } catch (_) {}
    },
    enter() {
      mode = 'v1_playing';
      v1.currentTime = 0;
      v1.play().catch(() => {});
      // warm up v2 on frame 0 so the swap on tap has zero decode flash
      try { v2.currentTime = 0; } catch (_) {}
    },
    onTap() {
      // Ignore taps while v1 or v2 is playing; only respond when v1 is frozen
      if (mode !== 'v1_frozen') return;
      mode = 'v2_playing';
      Hint.hide();
      v2.classList.add('on');
      v2.play().catch(() => {});
      clearInterval(watch2);
      watch2 = setInterval(() => {
        if (v2.currentTime >= 2.75 || v2.ended) finishV2();
      }, 40);
    },
    // Put v2 on its frozen last frame so Scene 5 has its classroom background even via ?scene=school
    freezeAtEndForSchool() {
      el.classList.add('bg-under');
      v1.pause();
      v2.pause();
      v2.classList.add('on');
      const seekEnd = () => {
        if (v2.duration && isFinite(v2.duration)) {
          try { v2.currentTime = Math.max(0, v2.duration - 0.04); } catch (_) {}
        }
      };
      if (v2.readyState >= 1) seekEnd();
      else v2.addEventListener('loadedmetadata', seekEnd, { once: true });
    },
    exit() {},
    _debug: { get mode() { return mode; }, v1, v2 },
  };
})();

/* ===== SCENE 5 · SCHOOL (final) ===== */
const School = (() => {
  const el = $('#scene-school');
  const hoverCard = $('#studentHoverCard'), shcName = $('#shcName'), shcState = $('#shcState'), shcLine = $('#shcLine'), shcTail = $('#shcTail');
  const scrollHint = $('#scrollDownHint');
  const imgs = {}; $$('.student', el).forEach(s => imgs[s.dataset.student] = s);
  let enterTimer = 0;

  Object.entries(STUDENTS).forEach(([k, d]) => {
    const wrap = imgs[k];
    if (!wrap) return;
    wrap.style.transformOrigin = `${d.origin[0]}px ${d.origin[1]}px`;
    if (d.you) wrap.classList.add('is-main');
    const lbl = $('.student-head-label', wrap);
    if (lbl && d.headTop) {
      lbl.textContent = d.name;
      lbl.style.left = d.headTop[0] + 'px';
      // Place the bottom edge of the pill 12px above the highest visible hair/head pixel
      lbl.style.top = (d.headTop[1] - 12) + 'px';
    }
  });

  if (scrollHint) {
    scrollHint.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const sec = $('#statesSection');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    });
  }

  let hover = null, isReady = false;
  function setHover(k) {
    if (hover === k) return;
    if (hover) imgs[hover].classList.remove('hover');
    hover = k;
    el.classList.toggle('pointing', k === 'main');
    if (!k) {
      hoverCard.classList.remove('show');
      return;
    }
    const d = STUDENTS[k];
    imgs[k].classList.add('hover');
    shcName.textContent = d.name;
    shcState.textContent = d.state;
    shcLine.textContent = d.line;

    const { left, top, width, tailSide, tailOffset } = d.box;
    hoverCard.style.left = left + 'px';
    hoverCard.style.top = top + 'px';
    hoverCard.style.width = width + 'px';
    hoverCard.dataset.tail = tailSide;
    hoverCard.classList.toggle('is-main', !!d.you);
    shcTail.style.left = '';
    shcTail.style.top = '';
    if (tailSide === 'top' || tailSide === 'bottom') {
      shcTail.style.left = tailOffset + 'px';
    } else {
      shcTail.style.top = tailOffset + 'px';
    }
    hoverCard.classList.add('show');
  }
  el.addEventListener('pointermove', e => {
    if (!isReady || !el.classList.contains('active')) return;
    const p = Stage.toStage(e.clientX, e.clientY);
    setHover(STUDENT_HIT_ORDER.find(k => Mask.test(STUDENTS[k].mask, p.x, p.y)) || null);
  });
  el.addEventListener('pointerdown', e => {
    if (!isReady || !el.classList.contains('active')) return;
    const p = Stage.toStage(e.clientX, e.clientY);
    setHover(STUDENT_HIT_ORDER.find(k => Mask.test(STUDENTS[k].mask, p.x, p.y)) || null);
  });
  el.addEventListener('pointerleave', () => setHover(null));
  window.addEventListener('blur', () => setHover(null));
  document.addEventListener('mouseleave', () => setHover(null));
  return {
    reset() {
      clearTimeout(enterTimer);
      isReady = false;
      el.classList.remove('entering', 'ready');
      setHover(null);
      $('#replayBtn').hidden = true;
      document.body.classList.remove('school-unlocked');
      window.scrollTo({ top: 0, behavior: 'auto' });
    },
    enter() {
      // Ensure Scene 5A's frozen last frame of titleVideo2 sits behind Scene 5B
      if (!$('#scene-title').classList.contains('bg-under')) Title.freezeAtEndForSchool();
      // Trigger staggered entrance on the next animation frame so initial opacity:0 is painted first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.classList.add('entering');
        });
      });
    },
    ready() {
      const unlock = () => {
        if (!el.classList.contains('active')) return;
        isReady = true;
        el.classList.add('ready');
        $('#replayBtn').hidden = false;
        document.body.classList.add('school-unlocked');
        Hint.set('Hover over a friend · tap Amogh to open your Lemon Rice recipe');
      };
      // If reached via Scenes.go('school'), revealStudents already waited 1380ms;
      // if jumped directly via ?scene=school, wait 1380ms for the staggered entrance to finish.
      if (el.classList.contains('entering')) {
        clearTimeout(enterTimer);
        enterTimer = setTimeout(unlock, 100);
      } else {
        clearTimeout(enterTimer);
        enterTimer = setTimeout(unlock, 1380);
      }
    },
    exit() {
      clearTimeout(enterTimer);
      isReady = false;
      el.classList.remove('entering', 'ready');
      setHover(null);
      $('#replayBtn').hidden = true;
      $('#scene-title').classList.remove('bg-under');
      document.body.classList.remove('school-unlocked');
      window.scrollTo({ top: 0, behavior: 'auto' });
    },
    onTap(e) {
      if (!isReady) return;
      if (e && typeof e.clientX === 'number') {
        const p = Stage.toStage(e.clientX, e.clientY);
        const k = STUDENT_HIT_ORDER.find(st => Mask.test(STUDENTS[st].mask, p.x, p.y)) || null;
        if (k) setHover(k);
      }
      if (hover === 'main') PDF.open();
    },
    _debug: { get isReady() { return isReady; }, get hover() { return hover; }, setHover },
  };
})();

Scenes.register('intro', Intro);
Scenes.register('options', Options);
Scenes.register('dishes', Dishes);
Scenes.register('kitchen', Kitchen);
Scenes.register('title', Title);
Scenes.register('school', School);

/* ───────────────────────────── 10. PDF POPUP ───────────────────────────── */
const PDF = (() => {
  const modal = $('#pdfModal'), frame = $('#pdfFrame');
  let loaded = false;
  return {
    open() {
      if (!loaded) { frame.src = PDF_URL + '#toolbar=0&navpanes=0&view=FitH'; loaded = true; }
      modal.hidden = false; requestAnimationFrame(() => modal.classList.add('show'));
      Hint.hide(); Tooltip.hide();
    },
    close() {
      modal.classList.remove('show'); setTimeout(() => { modal.hidden = true; }, 350);
      Hint.set('Hover over a friend · tap your own character to open your Lemon Rice recipe', 400);
    },
    print() {
      try { frame.contentWindow.focus(); frame.contentWindow.print(); }              // works when the PDF is same-origin (served over http)
      catch (_) { window.open(PDF_URL, '_blank'); }                                    // file:// fallback: opens the PDF viewer, then Ctrl+P
    },
  };
})();
$('#pdfClose').addEventListener('click', () => PDF.close());
$('#pdfPrint').addEventListener('click', () => PDF.print());
$('#pdfModal').addEventListener('click', e => { if (e.target.id === 'pdfModal') PDF.close(); });

/* ───────────────────── 10B. STATES & UNION TERRITORIES EXPLORER ─────────── */
const StatesExplorer = (() => {
  const statesList = window.INDIAN_STATES || [];
  const utList = window.UNION_TERRITORIES || [];
  const recipesData = window.STATE_RECIPES || {};

  const gridStates = $('#gridStates'), gridUTs = $('#gridUTs');
  const groupStates = $('#groupStates'), groupUTs = $('#groupUTs');
  const searchInput = $('#stateSearchInput'), searchClear = $('#stateSearchClear');
  const emptyMsg = $('#statesEmptyMsg');
  const modal = $('#stateModal'), modalTitle = $('#stateModalTitle');
  const modalSub = $('#stateModalSub'), modalBody = $('#stateModalBody'), modalClose = $('#stateModalClose');

  let stateBtns = [], utBtns = [];

  function createItem(name) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'state-item';
    btn.setAttribute('role', 'listitem');
    btn.dataset.state = name;
    btn.innerHTML = `<span class="state-name">${name}</span><i class="state-arrow">&rarr;</i>`;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openModal(name);
    });
    return btn;
  }

  function initGrids() {
    if (!gridStates || !gridUTs) return;
    gridStates.innerHTML = '';
    gridUTs.innerHTML = '';
    stateBtns = statesList.map(name => {
      const b = createItem(name);
      gridStates.appendChild(b);
      return b;
    });
    utBtns = utList.map(name => {
      const b = createItem(name);
      gridUTs.appendChild(b);
      return b;
    });
  }

  function filter(rawQuery) {
    const q = (rawQuery || '').trim().toLowerCase();
    if (searchClear) searchClear.hidden = q.length === 0;
    const isFiltering = q.length > 0;
    gridStates.classList.toggle('is-filtering', isFiltering);
    gridUTs.classList.toggle('is-filtering', isFiltering);

    let sMatches = 0, uMatches = 0;
    stateBtns.forEach(btn => {
      const match = !q || btn.dataset.state.toLowerCase().includes(q);
      btn.hidden = !match;
      if (match) sMatches++;
    });
    utBtns.forEach(btn => {
      const match = !q || btn.dataset.state.toLowerCase().includes(q);
      btn.hidden = !match;
      if (match) uMatches++;
    });

    groupStates.hidden = sMatches === 0;
    groupUTs.hidden = uMatches === 0;
    emptyMsg.hidden = (sMatches + uMatches) > 0;
  }

  function openModal(stateName) {
    if (!modal) return;
    modalTitle.textContent = stateName;
    const data = recipesData[stateName];

    if (data && Array.isArray(data.dishes) && data.dishes.length > 0) {
      modalSub.textContent = data.subtitle || `Traditional recipes from ${stateName} — tap a dish below to view its recipe.`;
      modalBody.innerHTML = data.dishes.map((dish, idx) => `
        <div class="dish-acc-item" data-dish-idx="${idx}">
          <button type="button" class="dish-acc-trigger" aria-expanded="false">
            <span class="dish-acc-name">${dish.name}</span>
            <i class="dish-acc-arrow" aria-hidden="true">&#9662;</i>
          </button>
          <div class="dish-acc-panel">
            <div class="dish-acc-inner">
              <div class="dish-recipe-content">
                <p class="dish-recipe-desc">${dish.description}</p>
                <div class="dish-meta-bar">
                  <span class="dish-meta-item">👥 Servings: ${dish.servings}</span>
                  <span class="dish-meta-item">⏱ Prep Time: ${dish.prepTime}</span>
                  <span class="dish-meta-item">🍲 Cook Time: ${dish.cookTime}</span>
                </div>
                <div class="dish-columns">
                  <div class="dish-col-box">
                    <h4 class="dish-col-title">Ingredients</h4>
                    <ul class="dish-ing-list">
                      ${dish.ingredients.map(([qty, item]) => `
                        <li><span class="dish-ing-qty">${qty}</span> <span>${item}</span></li>
                      `).join('')}
                    </ul>
                  </div>
                  <div class="dish-col-box">
                    <h4 class="dish-col-title">Step-by-Step Preparation</h4>
                    <ol class="dish-step-list">
                      ${dish.steps.map(s => `<li>${s}</li>`).join('')}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `).join('');

      // Accordion interaction: only one dish open at a time, closed by default
      const accItems = $$('.dish-acc-item', modalBody);
      accItems.forEach(item => {
        const trig = $('.dish-acc-trigger', item);
        trig.addEventListener('click', e => {
          e.stopPropagation();
          const isOpen = item.classList.contains('open');
          accItems.forEach(other => {
            other.classList.remove('open');
            const ot = $('.dish-acc-trigger', other);
            if (ot) ot.setAttribute('aria-expanded', 'false');
          });
          if (!isOpen) {
            item.classList.add('open');
            trig.setAttribute('aria-expanded', 'true');
          }
        });
      });
    } else {
      modalSub.textContent = '';
      modalBody.innerHTML = `
        <div class="state-coming-soon">
          <div class="state-coming-soon-title">Recipes coming soon</div>
          <div class="state-coming-soon-note">We are curating authentic home-style tiffin recipes from ${stateName}.</div>
        </div>
      `;
    }

    modal.hidden = false;
    modalBody.scrollTop = 0;
    requestAnimationFrame(() => modal.classList.add('show'));
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.classList.remove('show');
    setTimeout(() => { modal.hidden = true; }, 320);
  }

  function reset() {
    closeModal();
    if (searchInput) searchInput.value = '';
    filter('');
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => filter(searchInput.value));
  }
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      filter('');
      searchInput.focus();
    });
  }
  if (modalClose) {
    modalClose.addEventListener('click', () => closeModal());
  }
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal();
    });
  }

  initGrids();
  return { openModal, closeModal, filter, reset };
})();

/* ───────────────────────────── 11. BOOT / REPLAY ───────────────────────── */
const blackFade = $('#blackFade');
async function reveal(ms = 2800) {
  const a = blackFade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
  await a.finished; blackFade.style.opacity = 0; a.cancel();
}
async function start() {
  State.reset();
  StatesExplorer.reset();
  window.scrollTo({ top: 0, behavior: 'auto' });
  Scenes.jump('intro');
  Intro.startAuto();                  // video starts playing automatically on load
  await reveal(1400);                 // black screen smoothly fades away as the opening video plays
}
async function replay() {
  Hint.hide(); PDF.close(); StatesExplorer.reset();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  blackFade.style.opacity = 1;
  const a = blackFade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, fill: 'forwards' });
  await a.finished; a.cancel();
  document.body.classList.remove('school-unlocked');
  window.scrollTo({ top: 0, behavior: 'auto' });
  Object.values(Scenes.list).forEach(s => s.reset && s.reset());
  await start();
}
$('#replayBtn').addEventListener('click', replay);

(async function boot() {
  await Loader.run();
  const q = new URLSearchParams(location.search);
  if (q.get('ref')) {                   // QA: overlay the reference still (2-5) to check for layout drift
    const r = $('#refOverlay'); r.src = `assets/references/still%20${q.get('ref')}.png`;
    Object.assign(r.style, { position: 'absolute', inset: 0, width: '1920px', height: '1080px', opacity: .5, zIndex: 99, pointerEvents: 'none' });
  }
  if (q.get('scene') && Scenes.list[q.get('scene')]) {      // QA: ?scene=options|kitchen|title|school
    State.reset();
    if (q.get('diet')) State.set('diet', q.get('diet'));
    if (q.get('mood')) State.set('mood', q.get('mood'));
    blackFade.style.opacity = 0; Scenes.jump(q.get('scene'));
    return;
  }
  start();
})();

window.__tiffin = { Scenes, State, Kitchen, Pan, PDF, StatesExplorer, ARM, BOWLS, PAN, STUDENTS };
})();
