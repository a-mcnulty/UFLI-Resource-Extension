// Timer state shared by the side panel and the service worker.
//
// The elapsed time is always derived from wall-clock timestamps rather than
// counted up by a tick, so it stays correct across anything that stops the panel
// running: closing the drawer, the service worker being evicted, Chrome
// restarting, or the machine sleeping. `catchUp` then replays whatever should
// have happened during the gap.

import { DAYS } from './steps.js';

export const MIN = 60_000;

export const DEFAULTS = {
  lessonId: '1',
  day: 'day1',
  idx: 0,
  elapsedMs: 0,
  startedAt: null,
  autoAdvance: false,
  vocabStepOnly: false,
  done: {},
};

export const stepKey = (dayKey, idx) => `${dayKey}:${idx}`;

export const dayFor = (state) => DAYS.find((d) => d.key === state.day) ?? DAYS[0];

export function stepsFor(state) {
  return dayFor(state).steps;
}

export function stepAt(state, idx = state.idx) {
  const steps = stepsFor(state);
  return steps[Math.max(0, Math.min(idx, steps.length - 1))];
}

export const isRunning = (state) => state.startedAt !== null;

export function elapsedOf(state, now = Date.now()) {
  return state.elapsedMs + (isRunning(state) ? now - state.startedAt : 0);
}

export function remainingOf(state, now = Date.now()) {
  return stepAt(state).minutes * MIN - elapsedOf(state, now);
}

export async function readState() {
  const saved = (await chrome.storage.local.get('timer')).timer || {};
  // `done` must be copied, not aliased: spreading DEFAULTS shares one object, and
  // catchUp writing into it would leak completed steps across lessons and reloads.
  return { ...DEFAULTS, ...saved, done: { ...(saved.done || {}) } };
}

export async function writeState(state) {
  await chrome.storage.local.set({ timer: state });
}

/**
 * Advance the timer to where it should be now, mutating `state`.
 *
 * Auto-advance carries any overflow into the following step, so a gap of any
 * length lands on the right step with the right time on the clock. Without
 * auto-advance the step simply runs into overtime.
 *
 * @returns {{changed: boolean, endedStep: object|null}} `endedStep` is the step
 *   that reached its allocated time, whether or not the timer moved on.
 */
export function catchUp(state, now = Date.now()) {
  if (!isRunning(state)) return { changed: false, endedStep: null };

  const steps = stepsFor(state);
  let changed = false;
  let endedStep = null;

  for (let guard = 0; guard <= steps.length; guard++) {
    const step = stepAt(state);
    const alloc = step.minutes * MIN;
    const used = state.elapsedMs + (now - state.startedAt);
    if (used < alloc) break;

    endedStep = step;
    if (!state.autoAdvance) break;

    state.done[stepKey(state.day, state.idx)] = true;
    changed = true;

    if (state.idx >= steps.length - 1) {
      state.elapsedMs = alloc;
      state.startedAt = null;
      break;
    }

    state.idx += 1;
    state.elapsedMs = 0;
    state.startedAt = now - (used - alloc); // carry the overflow forward
  }

  return { changed, endedStep };
}

/** When the running step reaches its allocated time, or null if that has passed. */
export function nextAlarmAt(state, now = Date.now()) {
  if (!isRunning(state)) return null;
  const at = state.startedAt + stepAt(state).minutes * MIN - state.elapsedMs;
  return at > now ? at : null;
}
