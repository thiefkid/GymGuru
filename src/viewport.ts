// iOS Home Screen apps with a translucent status bar can report a viewport that is short by
// the status bar's height while still drawing the page from the very top of the screen. The
// layout then ends that far above the bottom edge, leaving an empty strip under the tab bar.

export interface ViewportInfo {
  standalone: boolean;
  /** Height the browser lays the page out in (the viewport / `100%` of the root). */
  viewportHeight: number;
  screenWidth: number;
  screenHeight: number;
  landscape: boolean;
  /** `env(safe-area-inset-top)` in px. */
  safeTop: number;
}

/** The real screen height when the viewport is short by exactly the status bar, otherwise null. */
export function standaloneHeightFix(v: ViewportInfo): number | null {
  if (!v.standalone || v.safeTop <= 0) return null;
  const full = v.landscape ? Math.min(v.screenWidth, v.screenHeight) : Math.max(v.screenWidth, v.screenHeight);
  return Math.abs(full - v.viewportHeight - v.safeTop) <= 2 ? full : null;
}

export function fitStandaloneViewport() {
  const root = document.documentElement;
  const probe = document.createElement('div');
  probe.className = 'safe-top-probe';
  probe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(probe);

  const update = () => {
    const height = standaloneHeightFix({
      standalone: (navigator as Navigator & { standalone?: boolean }).standalone === true,
      viewportHeight: root.clientHeight,
      screenWidth: screen.width,
      screenHeight: screen.height,
      landscape: matchMedia('(orientation: landscape)').matches,
      safeTop: probe.getBoundingClientRect().height,
    });
    if (height) root.style.setProperty('--app-height', `${height}px`);
    else root.style.removeProperty('--app-height');
  };

  update();
  addEventListener('resize', update);
  addEventListener('pageshow', update);
  addEventListener('orientationchange', () => setTimeout(update, 300));

  // The page itself never scrolls, but focusing a field near the keyboard can nudge it; put it back.
  document.addEventListener('focusout', () =>
    setTimeout(() => {
      const active = document.activeElement;
      if ((!active || active === document.body) && (scrollX || scrollY)) scrollTo(0, 0);
    }, 100),
  );
}
