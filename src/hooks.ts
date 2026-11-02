import { useEffect, useRef, useState } from 'react';
import { beep } from './beep';

/** Double beep, plus a buzz where the phone allows it (iPhones can't vibrate from the web). */
export function timeUp() {
  beep();
  navigator.vibrate?.([200, 100, 200]);
}

/**
 * Seconds left until `end` (epoch ms), re-rendering a few times a second while it runs.
 * Calls `onEnd` once when it runs out; `fresh` is false when it ran out a while ago, such as
 * when the app is reopened long after, so callers only alert for a timer that just ended.
 */
export function useCountdown(end: number | null, onEnd: (fresh: boolean) => void): number {
  const [now, setNow] = useState(() => Date.now());
  const callback = useRef(onEnd);
  callback.current = onEnd;
  useEffect(() => {
    if (!end) return;
    let ended = false;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (!ended && t >= end) {
        ended = true;
        callback.current(t - end < 5000);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [end]);
  return end ? Math.max(0, (end - now) / 1000) : 0;
}

/** Keeps the phone screen awake while mounted, where supported. */
export function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      navigator.wakeLock
        ?.request('screen')
        .then((l) => (lock = l))
        .catch(() => {});
    };
    const onVisible = () => document.visibilityState === 'visible' && request();
    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    };
  }, []);
}
