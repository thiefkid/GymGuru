// How-to videos (YouTube IDs) and form cues for every movement in the program, by exercise name.

export interface ExerciseGuide {
  video: string;
  cues: string[];
}

const dbBench: ExerciseGuide = {
  video: 'epUEDuFBmvk',
  cues: [
    'Sit with the dumbbells on your knees, then kick them up as you lie back. Plant your feet.',
    'Squeeze your shoulder blades back and down and keep them there.',
    'Lower to chest level with elbows about 45° from your body, then press up and slightly in.',
  ],
};

const legPress: ExerciseGuide = {
  video: '90NY9tka1TQ',
  cues: [
    'Feet shoulder-width in the middle of the platform, back flat against the pad.',
    'Lower under control as far as you can without your lower back or hips lifting off the seat.',
    'Push through your heels with knees tracking over your toes. Don’t slam into a locked knee at the top.',
  ],
};

const rearDeltFly: ExerciseGuide = {
  video: 'hmtnyIGgR9A',
  cues: [
    'Sit facing the pad with the handles at shoulder height and a slight bend in your elbows.',
    'Sweep your arms out and back, leading with the elbows. Don’t shrug.',
    'Return slowly until your hands are in front of you again.',
  ],
};

const skullCrusher: ExerciseGuide = {
  video: 'GaK2da6B2zM',
  cues: [
    'Lie on a flat bench holding the EZ bar with straight arms above your shoulders.',
    'Bend only at the elbows to lower the bar toward your forehead. Keep elbows pointing up, not flaring.',
    'Straighten your arms back up and squeeze your triceps.',
  ],
};

const legCurl: ExerciseGuide = {
  video: 'Z5pRnXaCjpM',
  cues: [
    'Line your knees up with the machine’s pivot point and set the pad just above your heels.',
    'Curl as far as you can and squeeze your hamstrings for a moment.',
    'Let the pad back up slowly. Keep your hips down in the seat.',
  ],
};

const curlMachine: ExerciseGuide = {
  video: 'to3m8zws1n8',
  cues: [
    'Set the seat so your armpits rest on top of the pad.',
    'Curl the handles up without lifting your elbows off the pad.',
    'Lower all the way down slowly to a full stretch.',
  ],
};

const bulgarianDb: ExerciseGuide = {
  video: 'iwV9rTHKrOg',
  cues: [
    'Stand 2–3 feet in front of a bench and rest the top of your back foot on it, a dumbbell in each hand.',
    'Drop straight down until your back knee nearly touches the floor, with a slight forward lean.',
    'Drive up through your front foot. Keep the front knee in line with your toes.',
  ],
};

const shoulderPressDb: ExerciseGuide = {
  video: 'qEwKCR5JCog',
  cues: [
    'Sit on a bench set almost upright with the dumbbells at shoulder height.',
    'Press straight up until your arms are straight, without banging the dumbbells together.',
    'Lower slowly to about ear level. Keep your back against the pad and ribs down.',
  ],
};

export const GUIDES: Record<string, ExerciseGuide> = {
  // Chest
  'Pause DB Flat Bench': {
    ...dbBench,
    cues: [...dbBench.cues.slice(0, 2), 'Lower to chest level and hold still for one second at the bottom, then press up. No bounce.'],
  },
  'DB Flat Bench': dbBench,
  Dip: {
    video: 'fwfZchB1mvA',
    cues: [
      'Lean your torso forward with elbows slightly out to work the chest.',
      'Lower under control until your shoulders are just below your elbows. Stop short if your shoulders hurt.',
      'Press back up to straight arms without shrugging. Too hard? Use the assisted dip machine.',
    ],
  },
  'Decline Press Machine': {
    video: '_DsWm45BCqg',
    cues: [
      'Set the seat so the handles line up with your lower chest.',
      'Keep your back and shoulder blades pressed into the pad.',
      'Press out smoothly without slamming your elbows straight, then lower slowly to a stretch.',
    ],
  },
  'Incline Press Machine': {
    video: '7_scLkTCwTU',
    cues: [
      'Set the seat so the handles start level with your upper chest.',
      'Shoulder blades back and ribs down. Don’t arch to lift more.',
      'Press up and slightly in, then control the return to a stretch.',
    ],
  },
  'Chest Fly Machine': {
    video: 'hZ0CGRaKwbQ',
    cues: [
      'Set the seat so the handles are at chest height. Keep a slight bend in your elbows.',
      'Bring your hands together in a wide arc and squeeze your chest. Keep your chest up.',
      'Open slowly until you feel a stretch, without letting the weight stack touch.',
    ],
  },
  'Cable Push-down': {
    video: 'K--j4Qh9d2s',
    cues: [
      'Set the pulley high. Pin your elbows to your sides with a slight forward lean.',
      'Push down until your arms are straight and squeeze your triceps.',
      'Only your forearms move. Let the handle rise slowly.',
    ],
  },
  'Skull Crusher': skullCrusher,

  // Back
  'Romanian Deadlift': {
    video: 'lKLYvNGz6mk',
    cues: [
      'Stand holding the bar against your thighs, knees slightly bent.',
      'Push your hips back and let the bar slide down your legs. Keep your back flat.',
      'Stop at a strong hamstring stretch (usually around mid-shin), then drive your hips forward to stand.',
    ],
  },
  'Leg Curl': legCurl,
  'Pull-up': {
    video: 'Y44dJcTEhJE',
    cues: [
      'Hands a little wider than your shoulders. Start from a dead hang.',
      'Pull your shoulders down and back, then drive your elbows down until your chin clears the bar.',
      'Lower all the way under control with no swinging. Use the assisted pull-up machine if needed.',
    ],
  },
  'Wide-grip Seated Row': {
    video: 'y7h823PdWIY',
    cues: [
      'Feet on the platform, knees soft, sit tall holding the wide bar.',
      'Pull the bar to your upper stomach with elbows out and back. Squeeze your shoulder blades.',
      'Let your arms extend forward slowly without rounding your lower back.',
    ],
  },
  'Hammer Row': {
    video: '4KmUkufLnPc',
    cues: [
      'Chest against the pad. Set the seat so the handles are about shoulder level.',
      'Drive your elbows back and squeeze your shoulder blades together.',
      'Let your shoulders stretch forward on the way back.',
    ],
  },
  'Reverse Fly': rearDeltFly,
  'Biceps Curl Machine': curlMachine,
  'Cable Hammer Curl': {
    video: 'vsarApmqJmo',
    cues: [
      'Attach a rope to the low pulley and hold it with your palms facing each other.',
      'Keep your elbows at your sides and curl the rope up toward your shoulders.',
      'No swinging. Lower slowly to straight arms.',
    ],
  },

  // Legs
  'High-stance Leg Press': {
    video: 'k2AmhfP5ku8',
    cues: [
      'Place your feet high on the platform, shoulder-width. This shifts the work to glutes and hamstrings.',
      'Lower until your knees come toward your chest, without your lower back lifting off the pad.',
      'Push through your heels. Don’t slam into a locked knee at the top.',
    ],
  },
  'Leg Press': legPress,
  'DB Bulgarian Split Squat': bulgarianDb,
  'Smith Bulgarian Split Squat': {
    video: 'adHTwUipN1o',
    cues: [
      'Bar across your upper back, back foot on a bench. Step the front foot out so your shin is near vertical at the bottom.',
      'Lower straight down until your back knee nearly touches the floor.',
      'Drive up through your front heel, then re-rack the bar carefully.',
    ],
  },
  'Hip Adduction': {
    video: 'ScqpbvOZWe8',
    cues: [
      'Sit back with the pads on the inside of your knees, opened to a comfortable stretch.',
      'Squeeze your legs together and pause for a moment.',
      'Open slowly. Don’t let the weights slam.',
    ],
  },
  'Lat Pulldown': {
    video: 'rpkWBC1gCcE',
    cues: [
      'Lock your thighs under the pads and grip a little wider than your shoulders.',
      'Lean back slightly and pull the bar to your upper chest, driving your elbows down.',
      'Let the bar rise slowly to a full stretch.',
    ],
  },

  // Shoulders
  'DB Shoulder Press': shoulderPressDb,
  'Close-grip Shoulder Press': {
    video: '5PJfQYtbnKk',
    cues: [
      'Hold the dumbbells at your shoulders with palms facing each other and elbows in front of you.',
      'Press straight up and keep your ribs down.',
      'Lower slowly back to shoulder level.',
    ],
  },
  'Cable Lateral Raise': {
    video: 'nMCQuV6HE3A',
    cues: [
      'Stand side-on to a low pulley and take the handle in the far hand.',
      'Raise your arm out to the side to shoulder height with a slight elbow bend, leading with the elbow.',
      'Lower slowly. Keep it light enough not to swing.',
    ],
  },
  'Cable Y-raise / DB Lateral': {
    video: 'GhhBwqmsx3s',
    cues: [
      'Use low cables (or light dumbbells) and raise your arms up and out in a Y shape, thumbs up.',
      'Keep your shoulders down, away from your ears.',
      'Go light and slow.',
    ],
  },
  'Front Raise': {
    video: 'zkP0MsTcIVU',
    cues: [
      'Hold the dumbbells in front of your thighs.',
      'Raise them to shoulder height with a slight elbow bend, without swinging.',
      'Lower slowly.',
    ],
  },
  'Rear Delt Fly': rearDeltFly,
};

export function guideFor(name: string): ExerciseGuide | undefined {
  return GUIDES[name];
}

export function youtubeSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name.replace(' / ', ' or ')} exercise proper form`)}`;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
