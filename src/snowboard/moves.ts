// Every movement in the snowboard plan: a how-to video (YouTube ID), form cues, how it helps
// on the board and, where it matters, advice for the right knee (old meniscus injury).

export interface Move {
  name: string;
  video: string;
  cues: string[];
  /** How the movement carries over to snowboarding. */
  why: string;
  /** Advice for the right knee. */
  knee?: string;
  /** Done with a dumbbell, kettlebell or cable, so the weight is worth logging. */
  load?: boolean;
  /** What to search YouTube for when the video can't play. */
  search: string;
}

// Keeps the ids as a type while every entry is checked as a Move.
const defineMoves = <K extends string>(moves: Record<K, Move>) => moves;

export const MOVES = defineMoves({
  // Warm-up
  bike: {
    name: 'Easy Bike',
    video: 'tuLNGCYnuy8',
    cues: [
      'Set the seat so your knee is still slightly bent when the pedal is at the bottom.',
      'Light resistance and an easy pace: you should be able to talk.',
      'Keep your knees pointing straight ahead over the pedals.',
    ],
    why: 'Warms up the knee joint and the legs with no impact.',
    knee: 'A seat that’s too low bends the knee further under load. Raise it a notch if the knee aches.',
    search: 'stationary bike setup seat height',
  },
  tke: {
    name: 'Band Knee Extension',
    video: 'W7n9dUiEbLM',
    cues: [
      'Loop a band around a rack at knee height and step into it so it sits behind your knee.',
      'Start with the knee slightly bent, then straighten it fully against the band by squeezing your thigh.',
      'Hold the squeeze for 2 seconds, then let the knee bend slowly.',
    ],
    why: 'Switches on the inner quad (VMO), the muscle that steadies your knee.',
    knee: 'Right leg first. This is the knee’s own warm-up, so don’t skip it.',
    search: 'banded terminal knee extension',
  },
  bandwalk: {
    name: 'Mini-band Side Walk',
    video: '5wUk8wQNUT8',
    cues: [
      'Band just above your knees, feet hip-width, in a quarter squat.',
      'Step sideways with the leading foot, then follow without letting the band go slack.',
      'Push your knees out over your toes and keep your hips level. No rocking side to side.',
    ],
    why: 'Wakes up the glute muscles that stop your knees caving in on turns and landings.',
    search: 'mini band lateral walk',
  },
  hip9090: {
    name: '90/90 Hip Switch',
    video: 'qq_Z7sAmVrA',
    cues: [
      'Sit with both knees bent to 90°, one leg in front of you and one out to the side.',
      'Lift both knees and rotate them over to the other side, keeping your chest tall. Hands behind you is fine.',
      'Move slowly through the range that feels good.',
    ],
    why: 'Riding sideways takes a lot of hip rotation. Mobile hips take the twist off your knees.',
    knee: 'If the right knee complains in the side position, open that knee wider than 90°.',
    search: '90 90 hip switch',
  },

  // Legs
  boxsquat: {
    name: 'Goblet Box Squat',
    video: 'mIJub2k6YNg',
    cues: [
      'Hold a dumbbell upright against your chest, feet shoulder-width, a box or bench behind you.',
      'Sit back and down for 2 seconds until you just touch the box. Don’t relax onto it.',
      'Drive up through your whole foot with your knees pushing out over your toes.',
    ],
    why: 'Your riding stance is a half squat you hold all day. The box sets a depth that’s kind to the meniscus.',
    knee: 'Pick a box where your thighs end up about parallel or a bit higher. Go higher if the right knee pinches.',
    load: true,
    search: 'goblet box squat',
  },
  gobletsquat: {
    name: 'Goblet Squat',
    video: 'gCESNsDsbqk',
    cues: [
      'Dumbbell at your chest, elbows inside your knees, feet shoulder-width and toes slightly out.',
      'Lower for 3 seconds with your chest up, down to parallel or just above.',
      'Drive up and squeeze your glutes at the top. Knees stay in line with your toes.',
    ],
    why: 'Builds the leg strength to hold an edge and soak up bumps.',
    knee: 'Stop where it’s pain-free. Bring the box back if the right knee pinches at the bottom.',
    load: true,
    search: 'goblet squat form',
  },
  rdl: {
    name: 'DB Romanian Deadlift',
    video: 'hQgFixeXdZo',
    cues: [
      'Stand tall with the dumbbells in front of your thighs and your knees soft.',
      'Push your hips back and slide the weights down your legs, keeping your back flat.',
      'Stop at a strong hamstring stretch (around mid-shin), then drive your hips forward to stand.',
    ],
    why: 'Strong hamstrings protect the knee from behind and power the hip hinge of your stance.',
    load: true,
    search: 'dumbbell romanian deadlift',
  },
  slrdl: {
    name: 'Single-leg RDL',
    video: 'lI8-igvsnVQ',
    cues: [
      'Hold a dumbbell in the hand opposite your standing leg. Keep that knee soft.',
      'Hinge forward as the free leg reaches back, hips square to the floor, until your body is nearly level.',
      'Drive back up through the standing heel. Wobbly? Touch a rack, or rest your back toes on the floor.',
    ],
    why: 'Hamstrings, glutes and balance in one, which is what keeps you steady on one edge.',
    knee: 'Right leg first. Keep the standing knee slightly bent, never locked.',
    load: true,
    search: 'single leg romanian deadlift dumbbell',
  },
  stepup: {
    name: 'DB Step-up',
    video: 'DxUNi119Qzs',
    cues: [
      'Dumbbells at your sides. Put your whole foot on the box.',
      'Drive up through the top leg without pushing off the bottom foot, and stand tall.',
      'Step down slowly and under control.',
    ],
    why: 'One leg at a time, so the right leg can’t hide behind the left.',
    knee: 'Start with a low box (about mid-shin). The knee stays in line with your second toe.',
    load: true,
    search: 'dumbbell step up',
  },
  reverselunge: {
    name: 'Reverse Lunge',
    video: 'Ry-wqegeKlE',
    cues: [
      'Stand tall (dumbbells at your sides once it’s steady) and step one foot back.',
      'Lower until your back knee nearly touches the floor, front shin close to upright.',
      'Push through the front heel to stand. Finish one leg, then switch.',
    ],
    why: 'Single-leg strength with less load on the front knee than a forward lunge.',
    knee: 'Shorten the depth if the right knee is uncomfortable at the bottom.',
    load: true,
    search: 'reverse lunge form',
  },
  stepdown: {
    name: 'Slow Step-down',
    video: 'clYXgefsFrQ',
    cues: [
      'Stand on one leg on a low step, the other foot hanging off the edge.',
      'Bend the standing knee over 3 seconds until the free heel touches the floor. Don’t put weight on it.',
      'Stand back up (push with both legs if you need to) and repeat.',
    ],
    why: 'Slow lowering builds the knee control that soaks up bumps and softens landings.',
    knee: 'Start on a 15–20 cm step. Keep the right knee over your second toe; don’t let it dive inward.',
    search: 'eccentric step down',
  },
  slboxsquat: {
    name: 'Single-leg Box Squat',
    video: 'uJ4eA2wUXdw',
    cues: [
      'Stand on one leg in front of a box or bench at about knee height.',
      'Sit back slowly until you touch the box, reaching your arms forward for balance.',
      'Stand back up on the same leg without rocking.',
    ],
    why: 'The hardest knee-control exercise in the plan: your graduation test.',
    knee: 'Only down to the box. Use a higher box if the right knee wobbles or hurts.',
    search: 'single leg box squat',
  },
  lateralunge: {
    name: 'Side Lunge',
    video: '4NlJdSzHeUg',
    cues: [
      'Stand with your feet wide. Shift your hips back and to one side, bending that knee while the other leg stays straight.',
      'Chest up, bent knee over your toes, both feet flat.',
      'Push back to the middle. When bodyweight is easy, hold a dumbbell at your chest.',
    ],
    why: 'Snowboarding is a sideways sport. This builds strength side to side, inner thighs included.',
    knee: 'Only as deep as feels fine in the right knee.',
    load: true,
    search: 'lateral lunge',
  },
  wallsit: {
    name: 'Wall Sit',
    video: 'cWTZ8Am1Ee0',
    cues: [
      'Back flat against a wall, feet shoulder-width and a step out from it.',
      'Slide down until your knees are bent about 60°, higher than a chair. That’s your riding stance.',
      'Hold with your weight in your heels and keep breathing. Burning thighs = a long run.',
    ],
    why: 'Builds the leg endurance to hold your stance all the way down a run.',
    knee: 'Stay higher than a 90° knee bend. Less bend is easier on the meniscus and closer to how you’ll ride.',
    search: 'wall sit form',
  },
  calfraise: {
    name: 'Calf Raise',
    video: 'k8ipHzKeAkQ',
    cues: [
      'Stand tall with the balls of your feet on a step, holding something for balance.',
      'Rise as high as you can and pause for a second.',
      'Lower slowly, over 3 seconds, until your heels drop below the step.',
    ],
    why: 'Strong calves press the toe edge and protect your ankles.',
    search: 'standing calf raise',
  },
  tibraise: {
    name: 'Tibialis Raise',
    video: 'VzIcGAgBiaM',
    cues: [
      'Lean your back against a wall with your heels about a foot in front of it.',
      'Lift your toes as high as you can, keeping your legs straight.',
      'Lower slowly. Step your feet further out to make it harder.',
    ],
    why: 'Lifting your toes puts you on your heel edge, the one beginners use most.',
    search: 'tibialis wall raise',
  },
  bridge: {
    name: 'Glute Bridge',
    video: 'PhTDzR0TpZs',
    cues: [
      'Lie on your back, knees bent, feet flat and hip-width apart.',
      'Squeeze your glutes and lift your hips until you’re straight from knees to shoulders. Hold 2 seconds.',
      'Lower slowly. Don’t arch your lower back.',
    ],
    why: 'Strong glutes keep your knees in line and your hips over the board.',
    search: 'glute bridge',
  },
  slbridge: {
    name: 'Single-leg Glute Bridge',
    video: 'AVAXhy6pl7o',
    cues: [
      'Lie on your back with one foot flat and the other leg lifted.',
      'Push through the heel and lift your hips, keeping both sides level.',
      'Lower slowly. Finish one side, then switch.',
    ],
    why: 'Glute strength one side at a time for a steadier knee.',
    knee: 'Right leg first.',
    search: 'single leg glute bridge',
  },
  ballcurl: {
    name: 'Ball Hamstring Curl',
    video: 'XkESHgkTdFw',
    cues: [
      'Lie on your back with your heels on a stability ball and your arms out to the sides.',
      'Lift your hips, then curl the ball toward you with your heels, keeping your hips up.',
      'Roll it back out slowly. Too hard? Lower your hips between reps.',
    ],
    why: 'Hamstrings and core together. Strong hamstrings take strain off the knee.',
    search: 'stability ball hamstring curl',
  },

  // Balance
  slbalance: {
    name: 'Single-leg Balance',
    video: 'T6Dc8ewTJ9A',
    cues: [
      'Stand on one leg with a soft knee, hips level and the knee over your second toe.',
      'Too easy? Close your eyes, turn your head side to side, or stand on a folded mat.',
      'Touch down when you need to and carry on.',
    ],
    why: 'Retrains the balance sense in your ankle and knee, which an old meniscus injury dulls.',
    knee: 'Right leg first. It’s usually the shakier one after a knee injury.',
    search: 'single leg balance progression',
  },
  bosusquat: {
    name: 'BOSU Squat',
    video: 'nL67Ic0KChc',
    cues: [
      'Step onto the dome with your feet hip-width. Hold a rack the first time.',
      'Squat slowly to riding-stance depth (a quarter to half squat), keeping the BOSU level.',
      'Stand up without wobbling, knees in line with your toes.',
    ],
    why: 'Squatting on a wobbly surface is the closest the gym gets to standing on a moving board.',
    knee: 'Keep it shallow. This is for balance, not depth.',
    search: 'bosu ball squat',
  },
  bosustance: {
    name: 'BOSU Board Stance',
    video: 'XjQlsI2dQV8',
    cues: [
      'Stand side-on across a BOSU (dome up) in your snowboard stance: feet wide, knees bent.',
      'Hold the stance and slowly rock from heels to toes, like moving from your heel edge to your toe edge.',
      'Look ahead, not down, with your arms relaxed.',
    ],
    why: 'Shifting weight heel to toe without losing balance is how you’ll turn.',
    knee: 'Keep both knees soft and bent the whole time, the same as on the board.',
    search: 'bosu exercises for snowboarding',
  },

  // Core
  deadbug: {
    name: 'Dead Bug',
    video: 'GbSC02oU3To',
    cues: [
      'Lie on your back, arms up, hips and knees bent to 90°. Press your lower back into the floor.',
      'Breathe out as you slowly lower the opposite arm and leg. Stop before your back lifts.',
      'Come back and switch sides. Slow and controlled beats fast.',
    ],
    why: 'Teaches your core to stay braced while your arms and legs move: the base for everything else.',
    search: 'dead bug exercise',
  },
  birddog: {
    name: 'Bird Dog',
    video: 'xEDnlOxeJH4',
    cues: [
      'On hands and knees: hands under shoulders, knees under hips, back flat.',
      'Reach one arm forward and the opposite leg back until both line up with your body. Hold 2 seconds.',
      'Keep your hips square, with no arching or twisting. Come back and switch.',
    ],
    why: 'Back and core control while balancing, easy on the spine.',
    search: 'bird dog exercise',
  },
  plank: {
    name: 'Forearm Plank',
    video: '3QZlgJ40LfU',
    cues: [
      'Elbows under your shoulders, forearms on the floor, legs straight on your toes.',
      'Squeeze your glutes and pull your ribs down so your body is one straight line.',
      'Stop when your hips start to sag. Quality beats time.',
    ],
    why: 'Front core strength for pushing up off the snow after a fall.',
    search: 'forearm plank form',
  },
  sideplank: {
    name: 'Side Plank',
    video: '9dNL_mtObGQ',
    cues: [
      'Elbow under your shoulder, body straight from head to feet (or to knees while you build up).',
      'Lift your hips and hold. Don’t let them sag or roll back.',
      'Breathe steadily the whole time.',
    ],
    why: 'Side core strength keeps you upright on an edge and helps you get up after a fall.',
    search: 'side plank',
  },
  pallof: {
    name: 'Pallof Press',
    video: 'ma2OjgP5XDc',
    cues: [
      'Stand side-on to a cable at chest height, handle at your chest, knees soft.',
      'Press the handle straight out and hold 2 seconds without letting the cable turn you.',
      'Bring it back in. Finish one side, then turn around.',
    ],
    why: 'Resisting rotation keeps your upper body quiet while the board moves under you.',
    load: true,
    search: 'cable pallof press',
  },
  chopdown: {
    name: 'Cable Chop (High to Low)',
    video: 'gcGNypjIQDo',
    cues: [
      'Set the cable high. Stand side-on with both hands on the handle above your shoulder.',
      'Pull it down and across to your opposite hip, turning through your hips and chest.',
      'Let your back foot pivot. Return slowly.',
    ],
    why: 'Turns start by rotating your upper body and hips. This trains that move with control.',
    knee: 'Pivot the back foot so the knee turns with your hips. Never twist on a planted, bent knee.',
    load: true,
    search: 'cable woodchop high to low',
  },
  chopup: {
    name: 'Cable Chop (Low to High)',
    video: 'mvvu8imyMFs',
    cues: [
      'Set the cable low. Stand side-on in a slight squat with both hands on the handle by your outside knee.',
      'Stand and pull the handle up and across your body to above the opposite shoulder.',
      'Let your back foot pivot. Lower slowly.',
    ],
    why: 'Rotation from the legs up through the trunk, the way you’ll turn the board.',
    knee: 'Pivot the back foot so the right knee never twists while it’s bent.',
    load: true,
    search: 'cable woodchop low to high',
  },
  suitcase: {
    name: 'Suitcase Carry',
    video: 'y-hn_Ha1-RE',
    cues: [
      'Hold a heavy dumbbell or kettlebell in one hand at your side.',
      'Walk tall with your shoulders level. Don’t lean toward or away from the weight.',
      'Walk slowly for the time, then switch hands.',
    ],
    why: 'Trains your trunk not to bend sideways, just like carrying your board around the resort.',
    load: true,
    search: 'suitcase carry',
  },
  rollout: {
    name: 'Ball Rollout',
    video: 'zeSD85M2t6c',
    cues: [
      'Kneel with your forearms on a stability ball, body straight from knees to head.',
      'Roll the ball forward slowly, keeping your ribs down and back flat.',
      'Go only as far as you can hold that position, then pull back with your abs.',
    ],
    why: 'The strongest front-core exercise in the plan, for hard falls and getting up.',
    search: 'stability ball rollout',
  },
  copenhagen: {
    name: 'Short Copenhagen Plank',
    video: 'bU8aazv5voo',
    cues: [
      'Side plank with your top knee resting on a bench and the bottom leg underneath.',
      'Press the top knee into the bench to lift your hips into a straight line.',
      'Hold and breathe. Lower, then switch sides.',
    ],
    why: 'Inner thighs and side core, for a wide stance and pushing along with one foot.',
    knee: 'The short version (knee on the bench, not the foot) keeps strain off the knee.',
    search: 'short lever copenhagen plank',
  },

  // Power
  medball: {
    name: 'Med Ball Rotational Throw',
    video: 'hO2tKuMMoFU',
    cues: [
      'Stand side-on to a wall, about an arm’s length away, with a 3–5 kg med ball at your hip.',
      'Turn away, then throw the ball into the wall by turning your hips first, then chest and arms.',
      'Catch, reset and repeat. Let your back foot pivot.',
    ],
    why: 'Quick rotation from the hips is what swings the board round in a turn.',
    knee: 'Pivot the back foot so the right knee doesn’t twist. Fast, but controlled.',
    search: 'medicine ball rotational throw',
  },
  boxjump: {
    name: 'Box Jump',
    video: 'kNIInK_Le8I',
    cues: [
      'Use a low box, knee height or lower, and stand a short step away.',
      'Swing your arms, jump and land softly on the box in a quarter squat, knees over toes.',
      'Stand up, then step down. Don’t jump down.',
    ],
    why: 'Teaches soft, controlled landings, the way you’ll soak up bumps.',
    knee: 'Knee a bit sore after the last session? Swap these for step-ups today.',
    search: 'beginner box jump step down',
  },
  skater: {
    name: 'Skater Hop',
    video: '9_jLW6VkU8A',
    cues: [
      'Hop sideways from one leg to the other, landing softly and sinking into a quarter squat.',
      'Hold each landing for 2 seconds before the next hop, knee in line with your toes.',
      'Start with small hops and go further as the landings get steady.',
    ],
    why: 'Side-to-side power and one-leg landings: the direction knees usually get hurt in.',
    knee: 'Small hops and a full 2-second hold on the right leg. Stop if landings hurt.',
    search: 'skater hops exercise',
  },

  // Falls and cardio
  fallpractice: {
    name: 'Fall & Get-up Drill',
    video: 'pAuRz-QP5tM',
    cues: [
      'On a soft mat. Backward fall: from your stance, squat down, sit onto your bum and roll onto your back, chin tucked, arms crossed on your chest.',
      'Forward fall: drop onto your knees, then your forearms. Make fists and never land on open hands.',
      'Get up each time with your feet together as if strapped in: roll onto your knees and push up.',
    ],
    why: 'Most first-day injuries are wrists, from putting a hand out in a fall. Drill it until falling right is automatic.',
    knee: 'Use a soft mat and go down slowly at first. Don’t drop hard onto the right kneecap.',
    search: 'how to fall on a snowboard',
  },
  intervals: {
    name: 'Bike Intervals',
    video: 'Rh8VswzWDow',
    cues: [
      'Alternate hard and easy pedalling for the set times.',
      'Hard = about 8 out of 10: add resistance and push, staying seated and smooth.',
      'Easy = light resistance; spin your legs and get your breath back.',
    ],
    why: 'A day on the snow is hours of short efforts. This builds the engine for it with no impact on the knee.',
    search: 'exercise bike interval workout',
  },
});

export type MoveId = keyof typeof MOVES;

/** Snowboarding videos worth watching before the first day. */
export const RIDE_VIDEOS: { name: string; video: string; meta: string; search: string }[] = [
  { name: '10 Tips for Your First Day', video: '3GHU3DN1v4Q', meta: 'SnowboardProCamp · 8 min', search: 'beginner snowboard tips first day' },
  { name: 'How to Fall Safely', video: 'pAuRz-QP5tM', meta: 'SnowboardProCamp · 2 min', search: 'how to fall on a snowboard' },
  { name: 'How to Stand Up on a Snowboard', video: 'x4caDjjOQS4', meta: 'Snowboard Addiction · 2 min', search: 'how to stand up on a snowboard' },
];
