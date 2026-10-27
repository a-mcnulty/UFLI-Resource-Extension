# UFLI Foundations Lesson Companion

A Chrome side-panel extension that puts every UFLI Foundations lesson resource and a
step-by-step lesson timer one click away while you teach.

## What's in it

- **All 148 lessons** — Getting Ready A–J plus Lessons 1–128 (including the split
  lessons 35a–41c and 67a/67b), grouped by unit with each lesson's concept.
- **687 resource links** scraped from the UFLI Toolbox: lesson slide decks
  (PowerPoint + Google Slides), decodable passages, Roll and Read, and home practice.
- **Supplemental vocabulary** — 471 words across 134 lessons, each with the lesson
  steps it belongs to and its student-friendly explanation(s), from UFLI's
  [Vocabulary Resource][vocab]. Words for the step you're on are highlighted, and a
  **This step only** toggle filters the list down to them.
- **A lesson timer** for the Day 1 / Day 2 structure, with each step's allocated
  minutes, a desktop notification when a step runs out, and overtime counting.
- **Practice apps** — direct links to UFLI's Blending Board and Word Work Mats.

Everything opens from UFLI's own site. The extension itself holds only the links,
the step names and timings, and the vocabulary entries.

[vocab]: https://ufli.education.ufl.edu/wp-content/uploads/2026/02/UFLIVocab_AllLessons.pdf

## Install

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.
4. Click the extension's toolbar icon to open the side panel.

## Using it

Pick a lesson from the dropdown (or step through with `‹` / `›`). Choose **Day 1** or
**Day 2**, then:

- **Start / Pause** runs the current step's timer.
- **Next step** marks the current step done and moves on.
- **Reset** restarts just the current step.
- **Auto-advance** rolls straight into the next step when time is up.
- Click any step in the lesson plan list to jump to it.

The timer counts *down* from the allocated time, then counts *up* in red once you go
over. Each step shows a "Use:" line linking the resource that step calls for — the
slides, the decodable passage, the Blending Board or the Word Work Mat. The
vocabulary list highlights the words that belong to the step you're on.

Timer state is saved, so closing the panel or restarting Chrome won't lose your place.
It is kept on your own computer and nowhere else — see [Privacy](#privacy).

## Privacy

**This extension collects no data.** Nothing you do in the panel is recorded,
transmitted, or shared with anyone, including the author.

Concretely:

- **No network requests.** The extension makes none of its own. The lesson list,
  links and vocabulary are bundled in the package and read from disk. Nothing is
  sent anywhere, so there is nothing to intercept, log or leak.
- **No analytics, telemetry or crash reporting.** None, from any provider.
- **No accounts, sign-in or identifiers.** You are never asked who you are, and
  the extension has no way to tell one installation from another.
- **No access to your browsing.** It requests no host permissions and injects no
  content scripts, so it cannot read the pages you visit, your history, your
  tabs or your cookies. This is enforced by Chrome, not merely promised here —
  the permissions it would need are absent from `manifest.json`.

### What is stored, and where

One entry in Chrome's local extension storage (`chrome.storage.local`), holding
your place in the lesson:

| Stored | Why |
|---|---|
| Selected lesson, day, and step | Reopens the panel where you left off |
| Elapsed time and which steps are done | Keeps the timer correct while the panel is closed |
| **Auto-advance** and **This step only** settings | Remembers your preferences |

That entry stays on your computer. It is local storage, not synced storage, so it
is not copied to your Google account or to your other devices. Uninstalling the
extension deletes it; clicking **Reset** or switching lessons clears the parts of
it that relate to the timer.

### Permissions

| Permission | Used for |
|---|---|
| `storage` | Saving the lesson position described above |
| `sidePanel` | Drawing the panel itself |
| `alarms` | Ending a step at its allocated time while the panel is closed |
| `notifications` | The one desktop notification when a step's time is up |

No other permission is requested.

### Links to UFLI

Resource links open pages and files hosted by the UF Literacy Institute in an
ordinary browser tab. Once you are on their site you are subject to their privacy
practices, as with any link you click; this extension plays no part in it and is
not told whether you followed a link.

*Effective 27 October 2026. Questions: amcnulty16180@gmail.com*

## The lesson structure

From UFLI's [Lesson Planning & Implementation Support guide][impl]:

| Day 1 (30 min) | | Day 2 (30 min) | |
|---|---|---|---|
| 1. Phonemic Awareness | 2 min | 5. Review | 3 min |
| 2. Visual Drill | 3 min | 6. Word Work | 6 min |
| 3. Auditory Drill | 5 min | 7. Irregular Words | 6 min |
| 4. Blending Drill | 5 min | 8. Connected Text | 15 min |
| 5. New Concept | 15 min | | |

[impl]: https://ufli.education.ufl.edu/wp-content/uploads/2023/08/UFLIFoundations_Implementation_Support.pdf

## Refreshing the links

UFLI edits the Toolbox over time. To re-scrape:

```sh
mkdir -p ufli_raw
for u in a-j 1-34 35-41 42-53 54-62 63-68 69-76 77-83 84-88 \
         89-94 95-98 99-106 107-110 111-118 119-128; do
  curl -sL "https://ufli.education.ufl.edu/foundations/toolbox/$u/" -o "ufli_raw/$u.html"
done
python3 scrape.py          # writes lessons.json
```

Then re-extract the vocabulary and merge it in (needs `pdftotext` from poppler):

```sh
curl -sL https://ufli.education.ufl.edu/wp-content/uploads/2026/02/UFLIVocab_AllLessons.pdf -o vocab.pdf
pdftotext -bbox-layout vocab.pdf vocab.xml
python3 scrape_vocab.py    # writes vocab.json
```

`scrape_vocab.py` locates the table columns by x-coordinate rather than by
whitespace, which is what makes it survive the long concept names that run into the
Step(s) column. Merge the two files into `src/data/lessons.json` by lesson id.

## Notes

- The Getting Ready lessons (A–J) publish slide decks only, and Lessons 1–12 are
  missing some resources — that reflects what UFLI has posted, not a scraping gap.
  The panel says so rather than showing an empty list.
- Lessons 1–34 and A–J have no unit assessment on the Toolbox. The per-unit
  Fluency Check now sits at the bottom of **Lesson resources** rather than in its
  own section.
- 14 lessons have no supplemental vocabulary: Getting Ready A–J and Lessons 5, 6,
  10 and 12. UFLI's Vocabulary Resource skips them.
- UFLI's concept-based **spelling assessments** are part of the purchased Teacher
  Manual and aren't published as downloads, so they can't be linked here.
- You need the UFLI Foundations manual for the lesson plans themselves;
  [Ventris Learning](https://www.ventrislearning.com/uflifoundations/) sells it.

Not affiliated with or endorsed by the UF Literacy Institute.
