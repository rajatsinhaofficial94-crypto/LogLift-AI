const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

const sets = (reps, weight, rir = 2) =>
  Array.from({ length: 4 }, (_, i) => ({
    id: `s-${Date.now()}-${Math.random()}`,
    reps: String(reps),
    weight: String(weight),
    rir: String(rir),
    completed: true,
  }));

const sets3 = (reps, weight, rir = 2) =>
  Array.from({ length: 3 }, (_, i) => ({
    id: `s-${Date.now()}-${Math.random()}`,
    reps: String(reps),
    weight: String(weight),
    rir: String(rir),
    completed: true,
  }));

export const generateSampleSessions = () => [
  // ── Week 1 ──────────────────────────────────────────────
  {
    id: 'sample-1',
    name: 'Push Day',
    date: daysAgo(13),
    endTime: daysAgo(13),
    isFinished: true,
    workoutExercises: [
      { workoutExerciseId: 'we-1-1', exercise: { id: '34',  name: 'Bench Press',           bodyPart: 'Chest' },           sets: sets(8, 80) },
      { workoutExerciseId: 'we-1-2', exercise: { id: '296', name: 'Incline Dumbbell Press', bodyPart: 'Chest' },           sets: sets3(10, 30) },
      { workoutExerciseId: 'we-1-3', exercise: { id: '289', name: 'Cable Crossover',         bodyPart: 'Chest' },           sets: sets3(12, 20) },
      { workoutExerciseId: 'we-1-4', exercise: { id: '110', name: 'Dumbbell Lateral Raise',  bodyPart: 'Shoulders' },       sets: sets3(15, 12) },
      { workoutExerciseId: 'we-1-5', exercise: { id: '258', name: 'Push-down',               bodyPart: 'Triceps' },         sets: sets3(12, 25) },
    ],
  },
  {
    id: 'sample-2',
    name: 'Pull Day',
    date: daysAgo(11),
    endTime: daysAgo(11),
    isFinished: true,
    workoutExercises: [
      { workoutExerciseId: 'we-2-1', exercise: { id: '225', name: 'Pull-Up',          bodyPart: 'Back / Wing, Calisthenic' }, sets: sets(8, 0) },
      { workoutExerciseId: 'we-2-2', exercise: { id: '227', name: 'Lat Pulldown',      bodyPart: 'Back / Wing' },             sets: sets(10, 65) },
      { workoutExerciseId: 'we-2-3', exercise: { id: '228', name: 'Seated Cable Row',  bodyPart: 'Back / Wing' },             sets: sets3(10, 60) },
      { workoutExerciseId: 'we-2-4', exercise: { id: '252', name: 'Barbell Curl',      bodyPart: 'Biceps' },                  sets: sets3(10, 40) },
      { workoutExerciseId: 'we-2-5', exercise: { id: '251', name: 'Dumbbell Curl',     bodyPart: 'Biceps' },                  sets: sets3(12, 14) },
    ],
  },
  {
    id: 'sample-3',
    name: 'Leg Day',
    date: daysAgo(9),
    endTime: daysAgo(9),
    isFinished: true,
    workoutExercises: [
      { workoutExerciseId: 'we-3-1', exercise: { id: '239', name: 'Barbell Squat',      bodyPart: 'Hip, Leg' },                              sets: sets(6, 100) },
      { workoutExerciseId: 'we-3-2', exercise: { id: '280', name: 'Romanian Deadlift',  bodyPart: 'Back / Wing, Erector Spinae, Hip, Leg' },  sets: sets(8, 80) },
      { workoutExerciseId: 'we-3-3', exercise: { id: '244', name: 'Leg Press',           bodyPart: 'Leg' },                                   sets: sets(10, 120) },
    ],
  },
  // ── Week 2 ──────────────────────────────────────────────
  {
    id: 'sample-4',
    name: 'Push Day',
    date: daysAgo(6),
    endTime: daysAgo(6),
    isFinished: true,
    workoutExercises: [
      { workoutExerciseId: 'we-4-1', exercise: { id: '34',  name: 'Bench Press',           bodyPart: 'Chest' },     sets: sets(8, 82.5) },
      { workoutExerciseId: 'we-4-2', exercise: { id: '296', name: 'Incline Dumbbell Press', bodyPart: 'Chest' },     sets: sets3(10, 32) },
      { workoutExerciseId: 'we-4-3', exercise: { id: '111', name: 'Dumbbell Shoulder Press',bodyPart: 'Shoulders' }, sets: sets3(10, 28) },
      { workoutExerciseId: 'we-4-4', exercise: { id: '110', name: 'Dumbbell Lateral Raise', bodyPart: 'Shoulders' }, sets: sets3(15, 12) },
      { workoutExerciseId: 'we-4-5', exercise: { id: '258', name: 'Push-down',              bodyPart: 'Triceps' },   sets: sets3(12, 27.5) },
    ],
  },
  {
    id: 'sample-5',
    name: 'Pull Day',
    date: daysAgo(4),
    endTime: daysAgo(4),
    isFinished: true,
    workoutExercises: [
      { workoutExerciseId: 'we-5-1', exercise: { id: '225', name: 'Pull-Up',         bodyPart: 'Back / Wing, Calisthenic' }, sets: sets(9, 0) },
      { workoutExerciseId: 'we-5-2', exercise: { id: '227', name: 'Lat Pulldown',     bodyPart: 'Back / Wing' },             sets: sets(10, 67.5) },
      { workoutExerciseId: 'we-5-3', exercise: { id: '228', name: 'Seated Cable Row', bodyPart: 'Back / Wing' },             sets: sets3(10, 62.5) },
      { workoutExerciseId: 'we-5-4', exercise: { id: '252', name: 'Barbell Curl',     bodyPart: 'Biceps' },                  sets: sets3(10, 42.5) },
    ],
  },
  {
    id: 'sample-6',
    name: 'Leg Day',
    date: daysAgo(2),
    endTime: daysAgo(2),
    isFinished: true,
    workoutExercises: [
      { workoutExerciseId: 'we-6-1', exercise: { id: '239', name: 'Barbell Squat',     bodyPart: 'Hip, Leg' },                             sets: sets(6, 102.5) },
      { workoutExerciseId: 'we-6-2', exercise: { id: '280', name: 'Romanian Deadlift', bodyPart: 'Back / Wing, Erector Spinae, Hip, Leg' }, sets: sets(8, 82.5) },
      { workoutExerciseId: 'we-6-3', exercise: { id: '244', name: 'Leg Press',          bodyPart: 'Leg' },                                  sets: sets(10, 125) },
    ],
  },
];
