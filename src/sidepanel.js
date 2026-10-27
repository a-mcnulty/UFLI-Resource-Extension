import { APPS, STEP_RESOURCES, totalMinutes } from './steps.js';
import {
  MIN, DEFAULTS, stepKey, dayFor, stepsFor, stepAt,
  isRunning as runningOf, elapsedOf, catchUp, readState, writeState,
} from './timer-core.js';

const $ = (id) => document.getElementById(id);

let DATA = { units: {}, lessons: [] };
let byId = new Map();

let state = { ...DEFAULTS };
let ticker = null;

/* ---------- state ---------- */
// The service worker owns the alarm and the auto-advance; the panel only writes
// state and re-renders. That keeps the two in step whether the drawer is open or
// shut, and means nothing here has to run for the timer to keep time.

async function loadState() {
  state = await readState();
  if (!byId.has(state.lessonId)) state.lessonId = DATA.lessons[0]?.id ?? '1';
}

function saveState() {
  writeState(state);
}

const currentDay = () => dayFor(state);
const currentStep = () => stepAt(state);
const isRunning = () => runningOf(state);

function elapsedMs() {
  return elapsedOf(state);
}

/* ---------- controls ---------- */

function start() {
  if (isRunning()) return;
  state.startedAt = Date.now();
  saveState();
  render();
}

function pause() {
  if (!isRunning()) return;
  state.elapsedMs = elapsedMs();
  state.startedAt = null;
  saveState();
  render();
}

function resetStep() {
  state.elapsedMs = 0;
  state.startedAt = isRunning() ? Date.now() : null;
  saveState();
  render();
}

function goToStep(idx, { keepRunning = false } = {}) {
  const steps = currentDay().steps;
  const wasRunning = isRunning();
  state.idx = Math.max(0, Math.min(idx, steps.length - 1));
  state.elapsedMs = 0;
  state.startedAt = keepRunning && wasRunning ? Date.now() : null;
  saveState();
  render();
}

function nextStep() {
  const steps = currentDay().steps;
  state.done[stepKey(state.day, state.idx)] = true;
  if (state.idx >= steps.length - 1) {
    state.startedAt = null;
    state.elapsedMs = steps[state.idx].minutes * MIN;
    saveState();
    render();
    return;
  }
  goToStep(state.idx + 1);
}

function switchDay(dayKey) {
  if (state.day === dayKey) return;
  state.day = dayKey;
  state.idx = 0;
  state.elapsedMs = 0;
  state.startedAt = null;
  saveState();
  render();
}

function selectLesson(id) {
  if (!byId.has(id) || state.lessonId === id) return;
  state.lessonId = id;
  state.idx = 0;
  state.elapsedMs = 0;
  state.startedAt = null;
  state.done = {};
  saveState();
  render();
}

/* ---------- rendering ---------- */

function fmt(ms) {
  const total = Math.max(0, Math.round(Math.abs(ms) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buildPicker() {
  const sel = $('lessonSelect');
  sel.textContent = '';
  const groups = new Map();
  for (const lesson of DATA.lessons) {
    if (!groups.has(lesson.unit)) groups.set(lesson.unit, []);
    groups.get(lesson.unit).push(lesson);
  }
  for (const [unitId, lessons] of groups) {
    const unit = DATA.units[unitId] || {};
    const og = document.createElement('optgroup');
    og.label = `${unit.title || unitId} — Lessons ${unitId.toUpperCase()}`;
    for (const lesson of lessons) {
      const opt = document.createElement('option');
      opt.value = lesson.id;
      const label = /^\d+$/.test(lesson.id) ? `Lesson ${lesson.id}` : lesson.id;
      opt.textContent = lesson.concept ? `${label} — ${lesson.concept}` : label;
      og.append(opt);
    }
    sel.append(og);
  }
}

function linkRow(tag, text, url) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener';
  const t = document.createElement('span');
  t.className = 'tag';
  t.textContent = tag;
  const label = document.createElement('span');
  label.textContent = text;
  a.append(t, label);
  return a;
}

function emptyRow(text) {
  const p = document.createElement('p');
  p.className = 'empty';
  p.textContent = text;
  return p;
}

const RES_ORDER = [
  ['slides', 'Slides'],
  ['decodable', 'Decodable'],
  ['extra', 'Roll & Read'],
  ['home', 'Home'],
];

function renderResources(lesson) {
  const box = $('resources');
  box.textContent = '';
  let any = false;
  for (const [key, tag] of RES_ORDER) {
    for (const item of lesson.res[key] || []) {
      box.append(linkRow(tag, item.text, item.url));
      any = true;
    }
  }
  for (const [key, items] of Object.entries(lesson.res)) {
    if (RES_ORDER.some(([k]) => k === key)) continue;
    for (const item of items) {
      box.append(linkRow('More', item.text, item.url));
      any = true;
    }
  }
  if (!any) box.append(emptyRow('No downloadable resources published for this lesson.'));

  const unit = DATA.units[lesson.unit] || {};
  if (unit.assessment) {
    box.append(linkRow('Test', unit.assessment.label, unit.assessment.url));
  }
  box.append(linkRow('Unit', `Lessons ${lesson.unit.toUpperCase()} on the UFLI Toolbox`, unit.page));
}

/** Step numbers a vocabulary word is used in, e.g. "1, 5, 6" -> Set{1,5,6}. */
function stepNumbers(steps) {
  return new Set((steps || '').match(/\d+/g)?.map(Number) ?? []);
}

function renderVocab(lesson) {
  const box = $('vocab');
  box.textContent = '';

  const words = lesson.vocab || [];
  if (!words.length) {
    box.append(emptyRow('No supplemental vocabulary published for this lesson.'));
    return;
  }

  const thisStep = Number(currentStep().n);
  const onlyThisStep = state.vocabStepOnly;
  const shown = onlyThisStep
    ? words.filter((w) => stepNumbers(w.steps).has(thisStep))
    : words;

  if (!shown.length) {
    box.append(emptyRow(`No vocabulary words for Step ${thisStep} in this lesson.`));
    return;
  }

  for (const w of shown) {
    const card = document.createElement('div');
    card.className = 'vocab-item';
    if (!onlyThisStep && stepNumbers(w.steps).has(thisStep)) {
      card.classList.add('is-thisstep');
    }

    const head = document.createElement('div');
    head.className = 'vocab-head';

    const term = document.createElement('span');
    term.className = 'vocab-word';
    term.textContent = w.word;
    head.append(term);

    if (w.steps) {
      const badge = document.createElement('span');
      badge.className = 'vocab-steps';
      badge.textContent = `Step ${w.steps}`;
      head.append(badge);
    }
    card.append(head);

    for (const def of w.defs) {
      const p = document.createElement('p');
      p.className = 'vocab-def';
      p.textContent = def;
      card.append(p);
    }
    box.append(card);
  }
}

function renderApps() {
  const box = $('apps');
  if (box.childElementCount) return;
  for (const app of Object.values(APPS)) {
    box.append(linkRow('App', app.label, app.url));
  }
}

function resolveStepHint(step, lesson) {
  const out = [];
  for (const useKey of step.use) {
    const spec = STEP_RESOURCES[useKey];
    if (!spec) continue;
    if (spec.kind === 'lesson') {
      const item = (lesson.res[spec.key] || [])[0];
      if (item) out.push({ label: spec.label, url: item.url });
    } else if (spec.kind === 'app') {
      const app = APPS[spec.key];
      if (app) out.push({ label: spec.label, url: app.url });
    } else {
      out.push({ label: spec.label, url: null });
    }
  }
  return out;
}

function renderStepList(lesson) {
  const list = $('stepList');
  list.textContent = '';
  const day = currentDay();
  day.steps.forEach((step, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'step-row';
    btn.type = 'button';
    if (i === state.idx) btn.classList.add('is-current');
    if (state.done[stepKey(day.key, i)]) btn.classList.add('is-done');

    const n = document.createElement('span');
    n.className = 'step-n';
    n.textContent = step.n;

    const name = document.createElement('span');
    name.className = 'step-name';
    name.textContent = step.name;

    const min = document.createElement('span');
    min.className = 'step-min';
    min.textContent = `${step.minutes} min`;

    btn.append(n, name, min);
    btn.addEventListener('click', () => goToStep(i));
    li.append(btn);
    list.append(li);
  });
}

function renderTimer(lesson) {
  const step = currentStep();
  const day = currentDay();
  const allocMs = step.minutes * MIN;
  const used = elapsedMs();
  const remaining = allocMs - used;
  const over = remaining < 0;

  $('stepLabel').textContent = `Step ${step.n}: ${step.name}`;
  $('stepAlloc').textContent = `${step.minutes} min allocated`;

  const clock = $('clock');
  clock.textContent = (over ? '+' : '') + fmt(remaining);
  clock.classList.toggle('is-over', over);

  const bar = $('progressBar');
  bar.style.width = `${Math.min(100, (used / allocMs) * 100)}%`;
  bar.classList.toggle('is-over', over);

  const hint = $('stepHint');
  hint.textContent = '';
  const hints = resolveStepHint(step, lesson);
  if (hints.length) {
    hint.append(document.createTextNode('Use: '));
    hints.forEach((h, i) => {
      if (i) hint.append(document.createTextNode(' · '));
      if (h.url) {
        const a = document.createElement('a');
        a.href = h.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = h.label;
        hint.append(a);
      } else {
        hint.append(document.createTextNode(h.label));
      }
    });
  }

  $('startPause').textContent = isRunning() ? 'Pause' : used > 0 ? 'Resume' : 'Start';
  $('nextStep').disabled = state.idx >= day.steps.length - 1;
  $('dayTotal').textContent = `${day.label}: ${totalMinutes(day)} min · ${day.manualPages}`;
}

function render() {
  const lesson = byId.get(state.lessonId);
  if (!lesson) return;

  $('lessonSelect').value = lesson.id;
  const unit = DATA.units[lesson.unit] || {};
  const parts = [unit.title, lesson.concept ? `Concept: ${lesson.concept}` : null].filter(Boolean);
  $('lessonMeta').textContent = parts.join(' · ');

  const i = DATA.lessons.indexOf(lesson);
  $('prevLesson').disabled = i <= 0;
  $('nextLesson').disabled = i >= DATA.lessons.length - 1;

  for (const tab of document.querySelectorAll('.tab')) {
    tab.classList.toggle('is-active', tab.dataset.day === state.day);
  }

  $('autoAdvance').checked = state.autoAdvance;
  renderTimer(lesson);
  renderStepList(lesson);
  $('vocabStepOnly').checked = state.vocabStepOnly;
  renderResources(lesson);
  renderVocab(lesson);
  renderApps();
}

function tick() {
  if (!isRunning()) return;
  // Same catch-up the worker runs, so an open panel advances on the exact second
  // rather than waiting on the alarm's coarser granularity.
  const { changed } = catchUp(state);
  if (changed) {
    saveState();
    render();
    return;
  }
  renderTimer(byId.get(state.lessonId));
}

/* ---------- wiring ---------- */

function wire() {
  $('lessonSelect').addEventListener('change', (e) => selectLesson(e.target.value));

  $('prevLesson').addEventListener('click', () => {
    const i = DATA.lessons.findIndex((l) => l.id === state.lessonId);
    if (i > 0) selectLesson(DATA.lessons[i - 1].id);
  });
  $('nextLesson').addEventListener('click', () => {
    const i = DATA.lessons.findIndex((l) => l.id === state.lessonId);
    if (i >= 0 && i < DATA.lessons.length - 1) selectLesson(DATA.lessons[i + 1].id);
  });

  for (const tab of document.querySelectorAll('.tab')) {
    tab.addEventListener('click', () => switchDay(tab.dataset.day));
  }

  $('startPause').addEventListener('click', () => (isRunning() ? pause() : start()));
  $('nextStep').addEventListener('click', () => nextStep());
  $('resetStep').addEventListener('click', resetStep);
  $('autoAdvance').addEventListener('change', (e) => {
    state.autoAdvance = e.target.checked;
    saveState();
  });

  $('vocabStepOnly').addEventListener('change', (e) => {
    state.vocabStepOnly = e.target.checked;
    saveState();
    renderVocab(byId.get(state.lessonId));
  });
}

async function init() {
  const res = await fetch(chrome.runtime.getURL('src/data/lessons.json'));
  DATA = await res.json();
  byId = new Map(DATA.lessons.map((l) => [l.id, l]));

  await loadState();
  // Replay anything that happened while the drawer was shut.
  if (catchUp(state).changed) saveState();

  buildPicker();
  wire();
  render();

  // The worker advances the timer while the panel is closed, and may do so while
  // it is open too; mirror its writes instead of fighting them.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.timer) return;
    const saved = changes.timer.newValue || {};
    const next = { ...DEFAULTS, ...saved, done: { ...(saved.done || {}) } };
    if (JSON.stringify(next) === JSON.stringify(state)) return;
    state = next;
    render();
  });

  clearInterval(ticker);
  ticker = setInterval(tick, 250);
}

init();
