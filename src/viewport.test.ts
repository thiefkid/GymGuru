import { describe, expect, it } from 'vitest';
import { standaloneHeightFix, type ViewportInfo } from './viewport';

// iPhone 13 Pro Max opened from the Home Screen: 428×926 screen, 47px status bar.
const iphone13ProMax: ViewportInfo = {
  standalone: true,
  viewportHeight: 879,
  screenWidth: 428,
  screenHeight: 926,
  landscape: false,
  safeTop: 47,
};

describe('standaloneHeightFix', () => {
  it('stretches to the full screen when the viewport is short by the status bar', () => {
    expect(standaloneHeightFix(iphone13ProMax)).toBe(926);
    // Dynamic Island phones have a taller status bar.
    expect(standaloneHeightFix({ ...iphone13ProMax, screenWidth: 430, screenHeight: 932, viewportHeight: 873, safeTop: 59 })).toBe(932);
  });

  it('leaves a correct viewport alone', () => {
    expect(standaloneHeightFix({ ...iphone13ProMax, viewportHeight: 926 })).toBeNull();
  });

  it('only applies to Home Screen apps with a status bar inset', () => {
    expect(standaloneHeightFix({ ...iphone13ProMax, standalone: false })).toBeNull();
    // Landscape iPhone: no status bar.
    expect(standaloneHeightFix({ ...iphone13ProMax, landscape: true, viewportHeight: 428, safeTop: 0 })).toBeNull();
  });

  it('ignores windows smaller than the screen, like iPad Slide Over', () => {
    expect(standaloneHeightFix({ standalone: true, viewportHeight: 700, screenWidth: 1024, screenHeight: 1366, landscape: false, safeTop: 24 })).toBeNull();
  });
});
