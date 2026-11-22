// Copyright (c) 2026 Ali Razavi. All rights reserved. Owned and controlled solely by Ali Razavi: no licence check, no remote control, no backdoor. Terms: see the LICENSE file.
import { slots, load, save, setDone, finishDay, resetDay, currentSlot, nowMin, fmt } from './core.js';
import { pose } from './poses.js';
import { fact } from './facts.js';
import { calendar, streak } from './calendar.js';

const $ = (id) => document.getElementById(id);
let sel = null; // slot the user tapped on the trail (minutes), or null to follow the clock
let timer = null; // running exercise timer
let popped = false; // animate the newest leaf on the next draw
let poseKey = null; // pose currently drawn, so redraws don't restart its animation
let view = 'main'; // or 'cal'
let calYear = new Date().getFullYear();
let nav = {}; // times of the breaks the card's ‹ › arrows lead to
let lastDue = null; // break that was due on the last draw
let lastDone = null; // slot just checked off, so the next card can say what it did for you

async function render() {
  const st = await load();
  const list = slots(st.cfg);
  const now = nowMin();
  const cur = currentSlot(list, now);
  const isDone = (s) => st.done.includes(s.t);
  const doneSlots = list.filter(isDone);
  const due = cur && !st.ended && !isDone(cur);
  // Overdue: its half hour has passed and it still isn't checked off.
  const late = (s) => !st.ended && !isDone(s) && now >= s.t + 30;

  // A break that has just come due takes over the card, wherever you had browsed to.
  if (due && cur.t !== lastDue) sel = null;
  lastDue = due ? cur.t : null;
  const shown = list.find((s) => s.t === sel) || (due ? cur : null);

  // The arrows step through the day from whatever is on the card, or from the clock if nothing is.
  const upcoming = list.findIndex((s) => s.t > now);
  const i = shown ? list.indexOf(shown) : (upcoming < 0 ? list.length : upcoming) - 0.5;
  nav = { prev: list[Math.ceil(i) - 1]?.t, next: list[Math.floor(i) + 1]?.t };

  $('count').textContent = `${doneSlots.length} of ${list.length} today`;

  $('main').classList.toggle('off', view !== 'main');
  $('cal').classList.toggle('off', view !== 'cal');
  $('viewbtn').textContent = view === 'cal' ? '← Today' : 'Calendar';
  if (view === 'cal') {
    $('cal').innerHTML = calendar(calYear, st)
      + `<p class="why">${fact('all', st.day + calYear)}</p>`;
  }
  $('plant').innerHTML = plant(doneSlots, list.length, due ? 'due' : !st.ended && (cur || doneSlots.length) ? 'happy' : 'sleep');
  popped = false;

  // A break on screen shows the dummy doing it; otherwise the plant shows the day so far.
  $('plant').classList.toggle('off', !!shown);
  $('pose').classList.toggle('off', !shown);
  if (!shown) poseKey = null;
  else if (poseKey !== shown.ex.pose) $('pose').innerHTML = pose((poseKey = shown.ex.pose));

  $('trail').replaceChildren(
    ...list.map((s) => {
      const b = document.createElement('button');
      b.className = [
        s.ex.walk && 'walk',
        isDone(s) && 'done',
        s === cur ? !isDone(s) && 'now' : s.t < now && (late(s) ? 'late' : 'past'),
        s === shown && 'sel',
      ].filter(Boolean).join(' ');
      b.title = `${fmt(s.t)} · ${s.ex.name}${late(s) ? ' · overdue' : ''}`;
      b.setAttribute('aria-label', b.title + (isDone(s) ? ' (done)' : ''));
      b.onclick = () => { sel = sel === s.t ? null : s.t; render(); };
      return b;
    })
  );

  if (shown) drawBreak(shown, shown === cur, isDone(shown), st.day, late(shown));
  else if (st.ended) {
    const run = streak(st);
    $('card').innerHTML = `${head(`Day finished · ${run} day${run === 1 ? '' : 's'} in a row`)}
      <h2>${doneSlots.length} of ${list.length} breaks</h2>
      <p class="cue" style="margin-top:6px">Checked off on the calendar. See you tomorrow.</p>
      <p class="why">${fact('all', st.day + 'end')}</p>`;
  } else {
    const did = list.find((s) => s.t === lastDone && isDone(s));
    drawRest(list, cur, now, doneSlots.length === list.length, list.find((s) => s.t > now && !isDone(s)), did, st.day, list.filter(late).length);
  }

  $('finish').disabled = st.ended;
  $('finish').textContent = st.ended ? 'Day finished ✓' : 'Day finished';
  $('tally').innerHTML = tally(st.log.filter((e) => !e.auto));

  if (document.activeElement !== $('start') && document.activeElement !== $('end')) {
    $('start').value = hhmm(st.cfg.start);
    $('end').value = hhmm(st.cfg.end);
  }
}

// Top row of every card: what it is, with arrows to the break before and after.
function head(label) {
  const arrow = (t, sign, name) =>
    `<button data-go="${t ?? ''}" ${t == null ? 'disabled' : ''} aria-label="${name} break">${sign}</button>`;
  return `<div class="nav">${arrow(nav.prev, '‹', 'Previous')}<p class="when">${label}</p>${arrow(nav.next, '›', 'Next')}</div>`;
}

function drawBreak(s, isNow, done, day, late) {
  const { ex } = s;
  const secs = ex.steps?.reduce((n, [, x]) => n + x, 0);
  $('card').innerHTML = `
    ${head(fmt(s.t) + (isNow ? ' · <b>now</b>' : late ? ' · <b>overdue</b>' : ''))}
    ${late ? '<div class="stamp">Overdue</div>' : ''}
    <h2>${ex.name}</h2>
    <p class="rx">${ex.rx}</p>
    <p class="cue">${ex.cue}${ex.walk ? '' : ' Take a few steps before you sit back down.'}</p>
    <p class="why"><b>Why</b>${fact(ex.pose, day + s.t)}</p>
    <div class="row">
      ${done ? '<button id="done" class="undo">Done ✓ · undo</button>' : `
        ${secs ? `<button id="timer">▶ ${clock(secs)} timer</button>` : ''}
        <button id="done" class="primary">✓ Done</button>`}
    </div>`;
  $('done').onclick = () => finish(s.t, !done);
  if ($('timer')) $('timer').onclick = () => (timer ? stopTimer(true) : startTimer(s));
}

function drawRest(list, cur, now, allDone, next, did, day, lateCount) {
  let when, title, body;
  if (cur) {
    when = 'Nice one';
    title = next ? 'Back to work' : allDone ? 'Full bloom today 🌸' : 'That was the last one';
    body = next ? `Next up: ${next.ex.name} at ${fmt(next.t)}, in ${next.t - now} min.` : 'See you tomorrow.';
  } else {
    when = 'Off the clock';
    title = allDone && list.length ? 'Full bloom today 🌸' : 'Nothing due';
    body = !list.length ? 'Your shift is too short for any breaks.'
      : next ? `First break: ${next.ex.name} at ${fmt(next.t)}.`
      : `Back tomorrow at ${fmt(list[0].t)}.`;
  }
  // Right after a check-off, say what that move just did; otherwise a line about the whole routine.
  const why = did
    ? `<b>What ${did.ex.name.toLowerCase()} just did</b>${fact(did.ex.pose, day + did.t + 'after')}`
    : `<b>Worth knowing</b>${fact('all', day + Math.floor(now / 30))}`;
  if (lateCount) body += ` <b class="lateNote">${lateCount} overdue, tap ‹ to catch up.</b>`;
  $('card').innerHTML = `${head(when)}<h2>${title}</h2><p class="cue" style="margin-top:6px">${body}</p>
    <p class="why">${why}</p>`;
}

async function finish(t, on = true) {
  stopTimer();
  popped = on;
  lastDone = on ? t : null;
  sel = on ? null : t;
  await setDone(t, on);
  render();
}

// ---- timer ----

function startTimer(s) {
  const steps = s.ex.steps;
  let i = 0;
  let end = Date.now() + steps[0][1] * 1000;
  const tick = () => {
    let left = Math.ceil((end - Date.now()) / 1000);
    if (left <= 0) {
      if (++i >= steps.length) return finish(s.t);
      end = Date.now() + steps[i][1] * 1000;
      left = steps[i][1];
    }
    const b = $('timer');
    if (b) b.textContent = `${steps[i][0]} · ${clock(left)} ✕`;
  };
  timer = setInterval(tick, 200);
  tick();
}

function stopTimer(redraw) {
  clearInterval(timer);
  timer = null;
  if (redraw) render();
}

const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const hhmm = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;

// ---- plant ----
// Starts as a droopy sprout. Every finished break adds a leaf and straightens it up;
// finish them all and it flowers.

const LEAF = 'M0 0C5-9 17-9 21 0C17 6 5 6 0 0Z';

function plant(doneSlots, total, mood) {
  const n = doneSlots.length;
  const f = total ? n / total : 0;
  const h = 16 + 74 * f;
  const p0 = [100, 126], p1 = [100, 126 - h * 0.55], p2 = [100 + 24 * (1 - f), 126 - h];
  const at = (u) => [0, 1].map((k) => (1 - u) ** 2 * p0[k] + 2 * (1 - u) * u * p1[k] + u * u * p2[k]);
  const r = (v) => v.toFixed(1);

  const leaves = doneSlots.map((s, k) => {
    const [x, y] = at((k + 0.7) / (n + 0.4));
    const side = k % 2 ? 1 : -1;
    const cls = `leaf${s.ex.walk ? ' lt' : ''}${popped && k === n - 1 ? ' pop' : ''}`;
    return `<g transform="translate(${r(x)} ${r(y)}) scale(${side} 1) rotate(-28)"><path class="${cls}" d="${LEAF}"/></g>`;
  }).join('');

  const [tx, ty] = p2;
  const tip = f === 1
    ? [0, 72, 144, 216, 288].map((a) =>
        `<circle class="petal" r="6" cx="${r(tx + 8 * Math.sin(a * Math.PI / 180))}" cy="${r(ty - 8 * Math.cos(a * Math.PI / 180))}"/>`
      ).join('') + `<circle class="pollen" r="5" cx="${r(tx)}" cy="${r(ty)}"/>`
    : [-1, 1].map((sd) =>
        `<g transform="translate(${r(tx)} ${r(ty)}) scale(${sd * 0.55} 0.55) rotate(-50)"><path class="leaf lt" d="${LEAF}"/></g>`
      ).join('');

  const face = {
    happy: '<g class="eyes"><circle class="face" cx="91" cy="144" r="2.3"/><circle class="face" cx="109" cy="144" r="2.3"/></g><path class="face-line" d="M95 150q5 5 10 0"/>',
    due: '<g class="eyes"><circle class="face" cx="91" cy="144" r="3"/><circle class="face" cx="109" cy="144" r="3"/></g><circle class="face" cx="100" cy="152" r="2.4"/>',
    sleep: '<path class="face-line" d="M88 144q3 3 6 0M106 144q3 3 6 0"/><path class="face-line" d="M97 151h6"/><text class="zz" x="134" y="118">z</text><text class="zz" x="142" y="108" font-size="8">z</text>',
  }[mood];

  return `
    <ellipse class="shadow" cx="100" cy="166" rx="38" ry="4"/>
    <g class="sway">
      <path class="stem" d="M${p0} Q${p1.map(r)} ${p2.map(r)}"/>
      ${leaves}${tip}
    </g>
    <path class="pot" d="M72 128h56l-7 33a5 5 0 0 1-5 4H84a5 5 0 0 1-5-4z"/>
    <rect class="rim" x="68" y="122" width="64" height="11" rx="4"/>
    <circle class="blush" cx="84" cy="150" r="3.2"/><circle class="blush" cx="116" cy="150" r="3.2"/>
    ${face}`;
}

$('card').addEventListener('click', (e) => {
  const b = e.target.closest('[data-go]');
  if (!b || b.disabled) return;
  stopTimer();
  sel = +b.dataset.go;
  render();
});

// ---- calendar view ----

$('viewbtn').onclick = () => {
  view = view === 'cal' ? 'main' : 'cal';
  calYear = new Date().getFullYear();
  render();
};
$('cal').onclick = (e) => {
  const y = e.target.closest('[data-y]');
  if (y && !y.disabled) { calYear = +y.dataset.y; render(); }
};

// ---- day finished / reset / tally ----

$('finish').onclick = async () => {
  stopTimer();
  sel = null;
  await finishDay();
  render();
};

let armed; // reset needs a second tap within 3 seconds
$('reset').onclick = async () => {
  if (!armed) {
    $('reset').textContent = 'Tap again to reset';
    armed = setTimeout(() => { armed = null; $('reset').textContent = 'Reset'; }, 3000);
    return;
  }
  clearTimeout(armed);
  armed = null;
  $('reset').textContent = 'Reset';
  stopTimer();
  sel = null;
  await resetDay();
  render();
};

// One stroke per finished day, every fifth struck through. Green = every break done.
function tally(log) {
  if (!log.length) return '<span>No days finished yet</span>';
  const show = log.slice(-50);
  const marks = show.map((d, i) => {
    const g = Math.floor(i / 5) * 27 + 3, k = i % 5;
    const path = k < 4 ? `M${g + k * 5} 2v14` : `M${g - 3} 14L${g + 18} 4`;
    return `<path${d.done === d.total ? ' class="full"' : ''} d="${path}"><title>${d.day} · ${d.done}/${d.total}</title></path>`;
  }).join('');
  const w = Math.ceil(show.length / 5) * 27;
  const last = log.at(-1);
  return `<svg width="${w}" height="18" viewBox="0 0 ${w} 18">${marks}</svg>
    <span>${log.length} day${log.length > 1 ? 's' : ''} · last ${last.done}/${last.total}</span>`;
}

// ---- shift hours ----

for (const id of ['start', 'end']) {
  $(id).onchange = async () => {
    const mins = (v) => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
    const cfg = { start: mins($('start').value), end: mins($('end').value) };
    if (!(cfg.end - cfg.start >= 60)) {
      $('err').textContent = 'End needs to be at least an hour after start (same day).';
      return;
    }
    $('err').textContent = '';
    await save({ cfg });
    render();
  };
}

globalThis.chrome?.storage?.onChanged.addListener(() => { if (!timer) render(); });
setInterval(() => { if (!timer) render(); }, 20000);
render();
