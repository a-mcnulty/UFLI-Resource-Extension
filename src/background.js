// Keeps the lesson timer running while the side panel is closed.
//
// The panel only ever writes state; this worker owns the alarm and the
// auto-advance, so a step still ends (and the next one still starts) with the
// drawer shut. Every storage write re-syncs the alarm, which is also what wakes
// this worker back up after it has been evicted.

import { catchUp, nextAlarmAt, readState, writeState, stepAt } from './timer-core.js';

const ALARM = 'ufli-step-end';

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  syncAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  syncAlarm();
});

/** Arm (or clear) the alarm to match whatever the stored state now says. */
async function syncAlarm() {
  const state = await readState();
  const at = nextAlarmAt(state);
  if (at === null) {
    await chrome.alarms.clear(ALARM);
    return;
  }
  const existing = await chrome.alarms.get(ALARM);
  // Re-arming to the same moment would be a no-op; skip the churn.
  if (existing && Math.abs(existing.scheduledTime - at) < 1000) return;
  await chrome.alarms.create(ALARM, { when: at });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.timer) syncAlarm();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM) return;

  const state = await readState();
  const before = stepAt(state);
  const { changed, endedStep } = catchUp(state);

  if (changed) await writeState(state);

  const done = endedStep || before;
  if (done) {
    const next = changed && state.startedAt !== null ? stepAt(state) : null;
    chrome.notifications.create(`${ALARM}-${Date.now()}`, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: `Step ${done.n}: ${done.name} — time is up`,
      message: next
        ? `${done.minutes} min used. Now on Step ${next.n}: ${next.name} (${next.minutes} min).`
        : `${done.minutes} min used.`,
      priority: 2,
    });
  }

  // writeState already triggers syncAlarm via onChanged, but the worker can be
  // torn down before that lands; arming here directly keeps the chain going.
  await syncAlarm();
});
