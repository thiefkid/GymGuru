// The W9-12 block from the Google Sheet, week by week.

export type DayId = 'd1' | 'd2' | 'd3' | 'd4';

export interface Day {
  id: DayId;
  n: number;
  name: string;
  focus: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  /** Target RPE, or null when the sheet sets none. */
  rpe: number | null;
  /** Rest between sets, in seconds. */
  rest: number;
  tempo?: string;
  optional?: boolean;
}

/** Weeks in the sheet's block. Weeks added in the app repeat week 4's plan. */
export const SHEET_WEEKS = 4;
export const WEEKS = [1, 2, 3, 4];

/** The block is weeks 9–12 of the sheet's program, plus any weeks added in the app. */
export function blockName(weeks: number): string {
  return `W9–${8 + weeks}`;
}

/** The sheet week whose plan a week follows: weeks added after the block repeat week 4. */
export function planWeek(week: number): number {
  return Math.min(week, SHEET_WEEKS);
}

export const DAYS: Day[] = [
  { id: 'd1', n: 1, name: 'Chest', focus: 'Chest · triceps' },
  { id: 'd2', n: 2, name: 'Back', focus: 'Back · hams · biceps' },
  { id: 'd3', n: 3, name: 'Legs', focus: 'Legs · bench · pulldown' },
  { id: 'd4', n: 4, name: 'Shoulders', focus: 'Delts · arms' },
];

function ex(
  id: string,
  name: string,
  sets: number,
  reps: number,
  rpe: number | null,
  rest: number,
  extra: Partial<Exercise> = {},
): Exercise {
  return { id, name, sets, reps, rpe, rest, ...extra };
}

export function program(day: DayId, programWeek: number): Exercise[] {
  const week = planWeek(programWeek);
  switch (day) {
    case 'd1': {
      const list = [
        week === 1
          ? ex('dbbench', 'Pause DB Flat Bench', 3, 10, 8, 120, { tempo: '1-1-1' })
          : ex('dbbench', 'DB Flat Bench', 3, 10, 8, 120, { tempo: '1-0-1' }),
        ex('dip', 'Dip', 3, 8, 8, 120),
        ex('decline', 'Decline Press Machine', 3, 10, 8, 120),
      ];
      if (week >= 3) list.push(ex('incline', 'Incline Press Machine', 3, 10, 8, 120));
      list.push(
        ex('fly', 'Chest Fly Machine', 3, 12, 8, 60),
        ex('pushdown', 'Cable Push-down', 3, 10, 8, 60),
        ex('skull', 'Skull Crusher', 3, 10, 8, 60),
      );
      return list;
    }
    case 'd2':
      return [
        ex('rdl', 'Romanian Deadlift', 3, 10, 8, 120),
        ex('legcurl', 'Leg Curl', 3, 12, 8, 60),
        ex('pullup', 'Pull-up', 3, 10, 8, 120),
        ex('seatedrow', 'Wide-grip Seated Row', 3, 10, null, 120),
        ex('hammerrow', 'Hammer Row', 3, 10, 8, 120),
        ex('revfly', 'Reverse Fly', 3, 12, 8, 60),
        ex('curlmachine', 'Biceps Curl Machine', 4, 8, 8, 60),
        ex('hammercurl', 'Cable Hammer Curl', 4, 8, 8, 60),
      ];
    case 'd3':
      return [
        ex('legpress', week === 1 ? 'High-stance Leg Press' : 'Leg Press', 3, 10, 7, 120),
        ex('bss', week === 1 ? 'DB Bulgarian Split Squat' : 'Smith Bulgarian Split Squat', 3, 12, 8, 120),
        ex('legcurl', 'Leg Curl', 3, 12, 8, 60),
        ex('adduction', 'Hip Adduction', 3, 12, 9, 60),
        ex('dbbench', 'DB Flat Bench', 3, 12, 8, 120),
        ex('pulldown', 'Lat Pulldown', 3, 12, 8, 120),
      ];
    case 'd4': {
      const list = [
        ex('press', week === 1 ? 'DB Shoulder Press' : 'Close-grip Shoulder Press', 3, 10, 8, 120),
        ex('lateral', 'Cable Lateral Raise', 3, 12, 8, 60),
      ];
      // The sheet lists this in week 1 only, with no sets or reps.
      if (week === 1) list.push(ex('yraise', 'Cable Y-raise / DB Lateral', 3, 12, 8, 60, { optional: true }));
      list.push(
        ex('front', 'Front Raise', 3, 12, 8, 60),
        ex('reardelt', 'Rear Delt Fly', 3, 12, 8, 60),
        ex('skull', 'Skull Crusher', 3, 12, 8, 60),
        ex('curlmachine', 'Biceps Curl Machine', 3, 12, 8, 60),
      );
      return list;
    }
  }
}

/** Weights already written in the W9-12 tab (week 1, legs day). Reps were not recorded. */
export const SHEET_HISTORY: Record<string, Record<string, { weight: number; variant?: string }>> = {
  'w1:d3': {
    legpress: { weight: 40 },
    bss: { weight: 10, variant: 'DB' },
    legcurl: { weight: 30 },
    adduction: { weight: 20 },
    dbbench: { weight: 45 },
    pulldown: { weight: 25 },
  },
};
