// Advice shown around the plan: the right-knee check, and the how-to sheet for each movement.

import type { HowTo } from '../components/ExerciseSheet';
import { youtubeQueryUrl } from '../exerciseGuides';
import { MOVES, RIDE_VIDEOS } from './moves';
import { prescription, type Item } from './plan';
import type { KneeFeel } from './store';

export const KNEE_FEELS: { id: KneeFeel; label: string; hint: string }[] = [
  { id: 'good', label: 'Fine', hint: 'No pain' },
  { id: 'achy', label: 'A bit achy', hint: 'Mild, settles soon' },
  { id: 'sore', label: 'Sore', hint: 'Pain or swelling' },
];

export const KNEE_ADVICE: Record<KneeFeel, string> = {
  good: 'Good. Carry on with the plan as written.',
  achy:
    'Mild aching is normal while the knee gets used to the work, as long as it has settled by the next morning. Next session, keep the same weights and stay out of any range that pinches.',
  sore:
    'Ease off next session: 2 sets of each exercise, shallower squats and lunges, and step-ups instead of jumps. If the knee swells, catches, locks or gives way, or is still sore after 2 days, see a physio before you carry on.',
};

/** What the how-to sheet shows for a movement in a session. */
export function howToFor(item: Item): HowTo {
  const move = MOVES[item.move];
  const notes: NonNullable<HowTo['notes']> = [{ title: 'On the board', text: move.why }];
  if (move.knee) notes.push({ title: 'Right knee', text: move.knee, tone: 'knee' });
  if (item.note) notes.unshift({ title: 'This week', text: item.note });
  return { name: move.name, meta: prescription(item), video: move.video, cues: move.cues, notes, searchUrl: youtubeQueryUrl(move.search) };
}

export function rideVideoHowTo(video: (typeof RIDE_VIDEOS)[number]): HowTo {
  return { name: video.name, eyebrow: 'Watch before you go', meta: video.meta, video: video.video, searchUrl: youtubeQueryUrl(video.search) };
}
