// Lesson step structure and allocated minutes, from the UFLI Foundations
// "Lesson Planning & Implementation Support" guide:
// https://ufli.education.ufl.edu/wp-content/uploads/2023/08/UFLIFoundations_Implementation_Support.pdf
// Day 1 covers Steps 1-5 (30 min); Day 2 covers the Review plus Steps 6-8 (30 min).

export const DAYS = [
  {
    key: 'day1',
    label: 'Day 1',
    manualPages: 'Teacher Manual pp. 23-29',
    steps: [
      { n: '1', name: 'Phonemic Awareness', minutes: 2, use: ['lessonPlan'] },
      { n: '2', name: 'Visual Drill', minutes: 3, use: ['slides'] },
      { n: '3', name: 'Auditory Drill', minutes: 5, use: [] },
      { n: '4', name: 'Blending Drill', minutes: 5, use: ['blendingBoard'] },
      { n: '5', name: 'New Concept', minutes: 15, use: ['slides'] },
    ],
  },
  {
    key: 'day2',
    label: 'Day 2',
    manualPages: 'Teacher Manual pp. 29-33',
    steps: [
      { n: '5', name: 'Review', minutes: 3, use: ['slides'] },
      { n: '6', name: 'Word Work', minutes: 6, use: ['wordWorkMat'] },
      { n: '7', name: 'Irregular Words', minutes: 6, use: ['slides'] },
      { n: '8', name: 'Connected Text', minutes: 15, use: ['slides', 'decodable'] },
    ],
  },
];

// UFLI's browser-based practice apps, linked from the Toolbox page.
export const APPS = {
  blendingBoard: {
    label: 'Blending Board',
    url: 'https://ufli.education.ufl.edu/tdr/file/bca9ju45kvvrvoan@research.dwi.ufl.edu_op.n?embed',
  },
  wordWorkMatBeginner: {
    label: 'Word Work Mat - Beginner',
    url: 'https://ufli.education.ufl.edu/tdr/file/cbhd8xmn9i4ctf7i@research.dwi.ufl.edu_op.n?embed',
  },
  wordWorkMatIntermediate: {
    label: 'Word Work Mat - Intermediate',
    url: 'https://ufli.education.ufl.edu/tdr/file/gc8nkxns914enc7d@research.dwi.ufl.edu_op.n?embed',
  },
};

// Which resource each step points at, for the "use this now" hint.
export const STEP_RESOURCES = {
  slides: { kind: 'lesson', key: 'slides', label: 'Lesson slides' },
  decodable: { kind: 'lesson', key: 'decodable', label: 'Decodable passage' },
  blendingBoard: { kind: 'app', key: 'blendingBoard', label: 'Blending Board app' },
  wordWorkMat: { kind: 'app', key: 'wordWorkMatBeginner', label: 'Word Work Mat app' },
  lessonPlan: { kind: 'note', label: 'Lesson plan (manual)' },
};

export const totalMinutes = (day) => day.steps.reduce((t, s) => t + s.minutes, 0);
