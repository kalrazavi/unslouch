// Copyright (c) 2026 Ali Razavi. All rights reserved. Owned and controlled solely by Ali Razavi: no licence check, no remote control, no backdoor. Terms: see the LICENSE file.
import { slots, load, setDone, currentSlot, nowMin } from './core.js';
import { fact } from './facts.js';

const NOTE = 'break';

// One alarm at a time, set for the next break (or the end of the shift, to tidy up).
async function schedule() {
  const { cfg } = await load();
  const times = [...slots(cfg).map((s) => s.t), cfg.end];
  const now = nowMin();
  const when = new Date();
  const next = times.find((t) => t > now);
  if (next === undefined) when.setDate(when.getDate() + 1);
  when.setHours(0, next ?? times[0], 0, 0);
  chrome.alarms.create('slot', { when: when.getTime() });
}

// Make the badge and notification match reality. `notify` pops a fresh alert.
async function sync(notify) {
  const st = await load();
  const cur = currentSlot(slots(st.cfg));
  const due = cur && !st.ended && !st.done.includes(cur.t);
  chrome.action.setBadgeBackgroundColor({ color: '#e07a4f' });
  chrome.action.setBadgeText({ text: due ? '!' : '' });
  // Hovering the toolbar icon shows a different reason to keep going each half hour.
  chrome.action.setTitle({ title: `Unslouch\n${fact('all', st.day + Math.floor(nowMin() / 30))}` });
  if (!due) {
    chrome.alarms.clear('snooze');
    chrome.notifications.clear(NOTE);
  } else if (notify) {
    await chrome.notifications.clear(NOTE);
    chrome.notifications.create(NOTE, {
      type: 'basic',
      iconUrl: 'icon128.png',
      title: cur.ex.name,
      message: `${cur.ex.rx}\n${fact(cur.ex.pose, st.day + cur.t + 'alert')}`,
      buttons: [{ title: '✓ Done' }, { title: 'Snooze 5 min' }],
      requireInteraction: true,
      silent: true,
      priority: 2,
    });
  }
}

chrome.alarms.onAlarm.addListener(async (a) => {
  await sync(true);
  if (a.name === 'slot') await schedule();
});

chrome.notifications.onClicked.addListener(async () => {
  chrome.notifications.clear(NOTE);
  try {
    await chrome.action.openPopup();
  } catch {
    chrome.windows.create({ url: 'popup.html', type: 'popup', width: 372, height: 640 });
  }
});

chrome.notifications.onButtonClicked.addListener(async (_id, button) => {
  chrome.notifications.clear(NOTE);
  if (button === 1) return chrome.alarms.create('snooze', { delayInMinutes: 5 });
  const { cfg } = await load();
  const cur = currentSlot(slots(cfg));
  if (cur) await setDone(cur.t);
});

// The popup writes straight to storage; react to it here.
chrome.storage.onChanged.addListener((changes) => {
  if (changes.cfg) schedule();
  sync(false);
});

chrome.runtime.onInstalled.addListener(() => (schedule(), sync(true)));
chrome.runtime.onStartup.addListener(() => (schedule(), sync(true)));
