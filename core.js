// Shared by the popup and the background worker: the routine, the schedule, and storage.

export const DEFAULT_CFG = { start: 14 * 60, end: 22 * 60 }; // minutes from midnight

// steps: [label, seconds] pairs for the built-in timer. No steps = count your own reps.
const POSTURE = [
  {
    name: 'Wall alignment reset',
    pose: 'wall',
    rx: 'Hold 60 seconds',
    cue: 'Heels a couple of inches from the wall. Hips, shoulder blades and the back of your head touch it. Chin level, ribs down.',
    steps: [['Hold', 60]],
  },
  {
    name: 'Chin tucks',
    pose: 'chin',
    rx: '2 × 10 · hold each 3s, last rep 10s',
    cue: 'Glide your chin straight back, like making a double chin. Eyes stay level, no nodding.',
  },
  {
    name: 'Wall angels',
    pose: 'angel',
    rx: '10 slow reps · 2s squeeze each',
    cue: 'Back on the wall, arms in a goalpost. Slide up and down keeping elbows and wrists on the wall. Squeeze at the bottom.',
  },
  {
    name: 'Prone cobra',
    pose: 'cobra',
    rx: '2 × 30 seconds',
    cue: 'Face down. Lift your chest a little, squeeze shoulder blades together, thumbs out, chin tucked, glutes on.',
    steps: [['Set 1', 30], ['Rest', 15], ['Set 2', 30]],
  },
  {
    name: 'Reverse plank',
    pose: 'plank',
    rx: '2 × 30 seconds · push set 2 to 45s if it feels good',
    cue: 'Hands under shoulders, hips up, one straight line from heels to shoulders. Chest open.',
    steps: [['Set 1', 30], ['Rest', 15], ['Set 2', 30]],
  },
  {
    name: 'Power pose',
    pose: 'power',
    rx: 'Hold 60 seconds',
    cue: 'Stand tall, feet wide, hands on hips, chest open. Slow breaths.',
    steps: [['Hold', 60]],
  },
];

const WALK = {
  name: 'Walk break',
  pose: 'walk',
  rx: '5 minutes away from the screen',
  cue: 'Refill your water, take the stairs, look at something far away. Already walked on a call? Count it.',
  steps: [['Walk', 300]],
  walk: true,
};

// A break every 30 minutes: posture move on the half hour, walk on the hour.
// Once the six moves are done, the two best desk-undoers (chin tucks, wall angels) repeat.
export function slots(cfg) {
  const out = [];
  for (let t = cfg.start + 30, i = 0, p = 0; t < cfg.end; t += 30, i++) {
    if (i % 2) out.push({ t, ex: WALK });
    else {
      out.push({ t, ex: POSTURE[p < 6 ? p : 1 + ((p - 6) % 2)] });
      p++;
    }
  }
  return out;
}

export const nowMin = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

// The break whose 30-minute window we are in. Older ones never pile up.
export const currentSlot = (list, now = nowMin()) =>
  list.findLast((s) => s.t <= now && now < s.t + 30) || null;

export const fmt = (t) =>
  new Date(2000, 0, 1, 0, t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// localStorage fallback only exists so popup.html can be opened outside the extension.
const area = globalThis.chrome?.storage?.local;
const today = () => new Date().toLocaleDateString('en-CA');
const readLocal = () => JSON.parse(localStorage.unslouch || '{}');

export async function load() {
  const raw = area ? await area.get(['cfg', 'day', 'done', 'ended', 'log', 'since']) : readLocal();
  const day = today();
  // First day of use: the calendar never marks days before it as missed.
  const since = raw.since || raw.log?.[0]?.day || day;
  if (!raw.since) await save({ since });
  const cfg = raw.cfg || DEFAULT_CFG;

  // A day that went by without "Day finished" closes itself as incomplete, keeping its score.
  let log = raw.log || [];
  if (raw.day && raw.day !== day && !log.some((e) => e.day === raw.day)) {
    log = [...log, { day: raw.day, ...score(cfg, raw.done || []), auto: true }].slice(-400);
    await save({ day, done: [], log });
  }
  return {
    cfg,
    day,
    done: raw.day === day ? raw.done || [] : [],
    ended: raw.ended === day, // "Day finished" was pressed today
    log, // one { day, done, total } per day; auto: true = closed itself, incomplete
    since,
  };
}

export async function save(patch) {
  if (area) return area.set(patch);
  localStorage.unslouch = JSON.stringify({ ...readLocal(), ...patch });
}

// The tally with today's score written in (replacing any earlier entry for today).
function logWithToday(s, done) {
  return [...s.log.filter((e) => e.day !== s.day), { day: s.day, ...score(s.cfg, done) }].slice(-400);
}

function score(cfg, done) {
  const list = slots(cfg);
  return { done: list.filter((x) => done.includes(x.t)).length, total: list.length };
}

export async function setDone(t, on = true) {
  const s = await load();
  const done = s.done.filter((x) => x !== t);
  if (on) done.push(t);
  await save({ day: s.day, done, ...(s.ended && { log: logWithToday(s, done) }) });
}

// Close out today: score it on the tally and stop the alerts until tomorrow.
export async function finishDay() {
  const s = await load();
  await save({ day: s.day, done: s.done, ended: s.day, log: logWithToday(s, s.done) });
}

// Start today over: clear the checkmarks and take today back off the tally.
export async function resetDay() {
  const s = await load();
  await save({ day: s.day, done: [], ended: null, log: s.log.filter((e) => e.day !== s.day) });
}
