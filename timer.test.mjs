import { DAYS } from '/Users/ammc/ufliExtension/src/steps.js';
import { DEFAULTS, catchUp, nextAlarmAt, elapsedOf, remainingOf, stepAt }
  from '/Users/ammc/ufliExtension/src/timer-core.js';

const MIN = 60_000;
const T0 = 1_700_000_000_000;
let pass = 0, fail = 0;
const ok = (name, got, want) => {
  const good = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${good ? ' PASS' : ' FAIL'}  ${name}` + (good ? '' : `\n        got ${JSON.stringify(got)}  want ${JSON.stringify(want)}`));
  good ? pass++ : fail++;
};

const fresh = (over = {}) => ({ ...structuredClone(DEFAULTS), day: 'day1', startedAt: T0, ...over });
const at = (min) => T0 + min * MIN;
const where = (s, now) => ({ step: stepAt(s).n, name: stepAt(s).name, remainingMin: +(remainingOf(s, now) / MIN).toFixed(2) });

console.log('Day 1 steps:', DAYS[0].steps.map(s => `${s.n}=${s.minutes}m`).join(' '));

// 1. Drawer shut 12 min, auto-advance ON. 2+3+5 = 10 min of steps 1-3, so 2 min into step 4 (5 min).
{
  const s = fresh({ autoAdvance: true });
  const r = catchUp(s, at(12));
  ok('closed 12m, auto on -> Step 4 with 3m left', where(s, at(12)), { step: '4', name: 'Blending Drill', remainingMin: 3 });
  ok('  ... reports a step ended', r.changed, true);
  ok('  ... steps 1-3 marked done', [0,1,2].map(i => !!s.done[`day1:${i}`]), [true,true,true]);
  ok('  ... still running', s.startedAt !== null, true);
}

// 2. Same gap, auto-advance OFF -> stays put and runs into overtime.
{
  const s = fresh({ autoAdvance: false });
  catchUp(s, at(12));
  ok('closed 12m, auto off -> still Step 1', stepAt(s).n, '1');
  ok('  ... 10m overtime', +(remainingOf(s, at(12)) / MIN).toFixed(2), -10);
}

// 3. Gap longer than the whole day -> parks on the last step, stopped.
{
  const s = fresh({ autoAdvance: true });
  catchUp(s, at(500));
  ok('closed 500m -> last step of the day', stepAt(s).n, '5');
  ok('  ... timer stopped', s.startedAt, null);
  ok('  ... clock reads full allocation', elapsedOf(s, at(500)) / MIN, 15);
}

// 4. Overflow carries exactly: 2m + 3m + 0.5m into step 3.
{
  const s = fresh({ autoAdvance: true });
  catchUp(s, at(5.5));
  ok('overflow carries into Step 3', where(s, at(5.5)), { step: '3', name: 'Auditory Drill', remainingMin: 4.5 });
}

// 5. A paused timer ignores the gap entirely.
{
  const s = fresh({ autoAdvance: true, startedAt: null, elapsedMs: 30_000 });
  catchUp(s, at(90));
  ok('paused -> untouched by a 90m gap', [stepAt(s).n, elapsedOf(s, at(90)) / 1000], ['1', 30]);
}

// 6. Alarm is armed for the real end of the step, and not re-armed once passed.
{
  const s = fresh({ autoAdvance: false });
  ok('alarm armed at step end', nextAlarmAt(s, T0) - T0, 2 * MIN);
  ok('no alarm once the moment has passed', nextAlarmAt(s, at(5)), null);
  const p = fresh({ startedAt: null, elapsedMs: 1000 });
  ok('no alarm while paused', nextAlarmAt(p, T0), null);
}

// 7. Resuming mid-step arms the alarm for only the time left.
{
  const s = fresh({ elapsedMs: 90_000 });   // 1m30s already used of a 2m step
  ok('resumed step arms for remaining 30s', (nextAlarmAt(s, T0) - T0) / 1000, 30);
}

// 8. Regression: a fresh state must not share DEFAULTS.done by reference.
{
  const a = { ...DEFAULTS, done: { ...(DEFAULTS.done || {}) }, day: 'day1', startedAt: T0, autoAdvance: true };
  catchUp(a, at(12));
  ok('marking steps done leaves DEFAULTS clean', Object.keys(DEFAULTS.done).length, 0);
  const b = { ...DEFAULTS, done: { ...(DEFAULTS.done || {}) }, day: 'day1', startedAt: T0 };
  ok('a later state starts with nothing done', Object.keys(b.done).length, 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
