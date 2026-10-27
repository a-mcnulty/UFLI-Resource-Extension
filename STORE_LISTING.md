# Chrome Web Store submission pack

Everything below is copy-paste ready for the
[Developer Dashboard](https://chrome.google.com/webstore/devconsole).

> **Read `## Before you submit` at the bottom first.** Two items need a decision
> before this goes public, and neither is a code change.

---

## 1. Account and package

| | |
|---|---|
| Developer account | One-time **$5** registration fee |
| Package | `ufli-companion-v1.0.0.zip` (44KB, 14 files) — already built |
| Rebuild command | `zip -r ufli-companion-v1.0.0.zip manifest.json src icons -x '*.DS_Store'` |
| Review time | Usually 1–3 days; first submissions can take longer |

The ZIP contains only what runs. The scrapers (`scrape.py`, `scrape_vocab.py`),
the test suite and the README are deliberately excluded.

---

## 2. Store listing

**Name** (33/75 characters)

```
UFLI Foundations Lesson Companion
```

**Summary** (101/132 characters)

```
Every UFLI Foundations lesson resource plus a step timer for the 30-minute Day 1 / Day 2 lesson plan.
```

**Category:** Education  **Language:** English (United States)

**Detailed description**

```
A side-panel companion for teachers delivering UFLI Foundations lessons.

Pick a lesson and every resource for it is one click away — no more hunting
through the Toolbox mid-lesson.

LESSON RESOURCES
• All 148 lessons: Getting Ready A-J and Lessons 1-128, including the split
  lessons 35a-41c and 67a/67b
• Slide decks in both PowerPoint and Google Slides format
• Decodable passages, Roll and Read, and home practice sheets
• The Fluency Check for each unit
• Direct links to the Blending Board and Word Work Mat practice apps

LESSON TIMER
• Follows the Day 1 / Day 2 structure, 30 minutes each
• Each step carries its allocated time, counting down and then counting up in
  red when you run over
• A desktop notification when a step's time is up
• Optional auto-advance straight into the next step
• Jump to any step by clicking it
• Your place is saved — close the panel or restart Chrome without losing it

SUPPLEMENTAL VOCABULARY
• Vocabulary for each lesson with the steps it belongs to
• Words for the step you are currently teaching are highlighted
• A "This step only" toggle narrows the list to just those words

PRIVACY
No accounts, no tracking, no analytics, no network requests. The only thing
stored is your timer position, and it stays on your computer.

You will need the UFLI Foundations teacher manual for the lesson plans
themselves. This extension links to the free companion resources published by
the UF Literacy Institute; it does not replace the manual.

Not affiliated with, endorsed by, or sponsored by the University of Florida
Literacy Institute.
```

---

## 3. Graphic assets

| Asset | Size | Status |
|---|---|---|
| Store icon | 128×128 PNG | Ready — `icons/icon128.png` |
| Screenshot (1–5, at least 1) | **1280×800** or 640×400 PNG | **You need to capture these** |
| Small promo tile | 440×280 PNG | Optional |
| Marquee promo tile | 1400×560 PNG | Optional |

Screenshots are the one thing I can't generate — they need the extension running
in Chrome. Load it unpacked, open the side panel, and capture these four:

1. **A mid-unit lesson** (try Lesson 59 or 118) showing the picker, concept line,
   and the resource list
2. **The timer running** on Step 5 — the large countdown and progress bar
3. **The vocabulary section** with step highlighting visible
4. **The lesson plan list** showing completed steps and the current one

The panel is narrow, so put each capture on a 1280×800 canvas rather than
stretching it — a screenshot of the panel centred on a plain background reads far
better than an upscaled strip.

---

## 4. Privacy tab

This is where most rejections happen. Be specific; vague justifications get bounced.

**Single purpose**

```
Gives teachers one-click access to the free lesson resources published for UFLI
Foundations, and times the steps of the lesson plan.
```

**Permission justifications**

| Permission | Justification to paste |
|---|---|
| `storage` | Saves the teacher's selected lesson, chosen day, current step, and timer position locally so the panel restores the same state when reopened. No data leaves the device. |
| `sidePanel` | The entire user interface is a side panel, so it stays visible beside lesson materials while teaching. |
| `alarms` | Ends each lesson step at its allocated time and starts the next one. This must happen while the side panel is closed, so it cannot be a page timer. |
| `notifications` | Shows a single desktop notification when a lesson step reaches its allocated time, so the teacher does not have to watch the clock. |

**Host permissions:** none requested. Say so if asked — the extension opens
resource links in a normal new tab and makes no network requests of its own.

**Remote code:** No, I am not using remote code. All code is in the package.

**Data usage** — tick **nothing**, then certify all three statements:

- Does not collect or use personal or sensitive user data
- Not being sold to third parties
- Not being used for purposes unrelated to the item's single purpose
- Not being used to determine creditworthiness or for lending

**Privacy policy URL:** not required while you collect no data. If the dashboard
insists, a one-paragraph page stating the extension collects nothing satisfies it.

---

## 5. Distribution

| Setting | Recommendation |
|---|---|
| Visibility | See below — **Unlisted** is the safe default for this extension |
| Regions | All, or just your own |
| Pricing | Free |

---

## Before you submit

Two things need your decision. Both concern the listing, not the code.

**1. The name uses UFLI's trademark.** Chrome Web Store policy prohibits using
another organisation's brand in a way implying affiliation, and "UFLI Foundations
Lesson Companion" leads with theirs. The in-listing disclaimer helps but does not
settle it, because the *name* is the issue. A reviewer may reject it, and UF can
request takedown regardless of what the store decides. Renaming to something
descriptive that doesn't lead with the mark — "Foundations Lesson Companion",
"Structured Literacy Lesson Timer" — removes the exposure, with "works with UFLI
Foundations" in the description body.

**2. The vocabulary text is UFLI's copyrighted content.** The resource links are
fine: they point at UFLI's own servers and send teachers there. The vocabulary is
different — `lessons.json` embeds 471 words and 511 explanation sentences copied
from a document marked © 2025 University of Florida Literacy Institute. Publishing
that to a public store is redistributing their material, which is a meaningfully
different act from the local classroom tool you asked me to build.

Three ways forward:

- **Publish Unlisted** (my recommendation if you want this now). The extension
  works identically and installs by link for you and colleagues you share it with,
  but it isn't in public search results. This is the normal route for a teacher
  tool built around a publisher's materials.
- **Ask UFLI for permission.** They publish these resources free for teachers and
  may well say yes. Worth an email before a public launch — their contact is on
  the Toolbox page.
- **Ship public without the bundled text.** Keep the word lists and step numbers
  but drop the explanation sentences, linking to the Vocabulary Resource PDF
  instead. That guts the section's value, so I'd only do it if a public listing
  matters more than the feature.

Say which way you want to go and I'll make the change — renaming and stripping the
explanations are both small edits.
