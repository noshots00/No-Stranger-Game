import { DIALOGUE_SCROLL_PIN_EPS } from './constants';

/** Coalesced, instant-only scroll-to-bottom for the Play tab feed. */
export type PlayFeedScrollController = {
  bindScrollElement: (el: HTMLElement | null) => void;
  snapNow: () => void;
  scheduleSnap: (opts?: { force?: boolean }) => void;
  requestForceSnap: () => void;
  markInstantScrollIntent: () => void;
  consumeInstantScrollIntent: () => boolean;
  updatePinnedFromScroll: () => void;
  onTabEnterPlay: () => void;
  onTabLeavePlay: () => void;
  dispose: () => void;
};

export function createPlayFeedScrollController(): PlayFeedScrollController {
  let scrollEl: HTMLElement | null = null;
  let pinned = true;
  let forceSnap = false;
  let scrollReady = false;
  let instantScrollIntent = false;
  let rafId: number | null = null;

  const shouldSnap = () => forceSnap || pinned;

  const snapNow = () => {
    if (!scrollEl) return;
    const maxScroll = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
    scrollEl.scrollTop = maxScroll;
    pinned = true;
    scrollReady = true;
    forceSnap = false;
    instantScrollIntent = false;
  };

  const scheduleSnap = (opts?: { force?: boolean }) => {
    if (opts?.force) forceSnap = true;
    if (!shouldSnap()) return;
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (!shouldSnap()) return;
      snapNow();
    });
  };

  return {
    bindScrollElement(el) {
      scrollEl = el;
    },
    snapNow,
    scheduleSnap,
    requestForceSnap() {
      forceSnap = true;
      scheduleSnap();
    },
    markInstantScrollIntent() {
      instantScrollIntent = true;
    },
    consumeInstantScrollIntent() {
      const had = instantScrollIntent;
      instantScrollIntent = false;
      return had;
    },
    updatePinnedFromScroll() {
      if (!scrollReady) return;
      if (!scrollEl) return;
      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
      if (maxScroll <= 0) {
        pinned = true;
        return;
      }
      pinned = scrollEl.scrollTop >= maxScroll - DIALOGUE_SCROLL_PIN_EPS;
    },
    onTabEnterPlay() {
      pinned = true;
      scrollReady = false;
      forceSnap = true;
    },
    onTabLeavePlay() {
      scrollReady = false;
      forceSnap = false;
      instantScrollIntent = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
    dispose() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    },
  };
}
