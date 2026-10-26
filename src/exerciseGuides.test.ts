import { describe, expect, it } from 'vitest';
import { GUIDES, guideFor, youtubeSearchUrl } from './exerciseGuides';
import { DAYS, WEEKS, program } from './program';

const allNames = [...new Set(WEEKS.flatMap((w) => DAYS.flatMap((d) => program(d.id, w).map((e) => e.name))))];

describe('exercise guides', () => {
  it('cover every movement in the program', () => {
    expect(allNames.filter((n) => !guideFor(n))).toEqual([]);
  });

  it('have a valid YouTube ID and at least three form cues', () => {
    for (const name of allNames) {
      const guide = guideFor(name)!;
      expect(guide.video, name).toMatch(/^[\w-]{11}$/);
      expect(guide.cues.length, name).toBeGreaterThanOrEqual(3);
    }
  });

  it('has no guides for movements that are not in the program', () => {
    expect(Object.keys(GUIDES).filter((n) => !allNames.includes(n))).toEqual([]);
  });

  it('searches YouTube for the movement', () => {
    expect(youtubeSearchUrl('Cable Y-raise / DB Lateral')).toBe(
      'https://www.youtube.com/results?search_query=Cable%20Y-raise%20or%20DB%20Lateral%20exercise%20proper%20form',
    );
  });
});
