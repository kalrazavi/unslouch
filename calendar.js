// Year calendar. A day you pressed "Day finished" gets a green check; a past day you
// didn't (it closed itself as incomplete, or was never opened) gets a cross.
// Days before you started using Unslouch, and future days, stay blank.

const key = (d) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD, local time
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Finished days in a row, counting back from today (or yesterday if today is still open).
export function streak(st) {
  const fin = new Set(st.log.filter((e) => !e.auto).map((e) => e.day));
  const d = new Date();
  if (!fin.has(key(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (fin.has(key(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function calendar(year, st) {
  const fin = new Map(st.log.map((e) => [e.day, e]));
  const today = st.day;
  let ok = 0, miss = 0;

  const months = MONTHS.map((name, m) => {
    const pad = '<i></i>'.repeat(new Date(year, m, 1).getDay());
    const count = new Date(year, m + 1, 0).getDate();
    let cells = '';
    for (let d = 1; d <= count; d++) {
      const date = new Date(year, m, d);
      const k = key(date);
      const label = date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      const e = fin.get(k);
      const now = k === today ? ' now' : '';
      if (e && !e.auto) { ok++; cells += `<i class="ok${now}" title="${label} · finished ${e.done}/${e.total}">✓</i>`; }
      else if (k >= st.since && k < today) { miss++; cells += `<i class="miss" title="${label} · incomplete${e ? ` ${e.done}/${e.total}` : ''}">×</i>`; }
      else cells += `<i class="day${now}" title="${label}${now ? ' · today' : ''}"></i>`;
    }
    return `<div class="month"><b>${name}</b><div class="grid"><u>S</u><u>M</u><u>T</u><u>W</u><u>T</u><u>F</u><u>S</u>${pad}${cells}</div></div>`;
  }).join('');

  const run = streak(st);
  return `
    <div class="yearnav">
      <button data-y="${year - 1}" ${year <= +st.since.slice(0, 4) ? 'disabled' : ''} aria-label="Previous year">‹</button>
      <strong>${year}</strong>
      <button data-y="${year + 1}" aria-label="Next year">›</button>
    </div>
    <div class="months">${months}</div>
    <p class="stats"><span class="g">✓ ${ok} finished</span><span class="r">× ${miss} incomplete</span><span>${run} day${run === 1 ? '' : 's'} in a row</span></p>`;
}
