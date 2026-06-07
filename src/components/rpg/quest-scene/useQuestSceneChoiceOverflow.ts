import { useEffect, useState, type RefObject } from 'react';

type UseQuestSceneChoiceOverflowOptions = {
  enabled: boolean;
  actionBoxRef: RefObject<HTMLDivElement | null>;
  measureKey: string | number;
};

function actionBoxOverflows(box: HTMLDivElement): boolean {
  return box.scrollHeight > box.clientHeight + 1;
}

/**
 * Expands quest-scene layout when the default action row would force choice scrolling.
 * Stays compact when choices fit; latches expanded until step/measure key changes.
 */
export function useQuestSceneChoiceOverflow({
  enabled,
  actionBoxRef,
  measureKey,
}: UseQuestSceneChoiceOverflowOptions): boolean {
  const [choicesExpanded, setChoicesExpanded] = useState(false);

  useEffect(() => {
    setChoicesExpanded(false);
  }, [measureKey, enabled]);

  useEffect(() => {
    if (!enabled) {
      setChoicesExpanded(false);
      return;
    }

    const box = actionBoxRef.current;
    if (!box) return;

    let raf = 0;

    const check = () => {
      const el = actionBoxRef.current;
      if (!el) return;
      if (actionBoxOverflows(el)) {
        setChoicesExpanded((prev) => prev || true);
      }
    };

    const scheduleCheck = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(check);
    };

    scheduleCheck();
    const observer = new ResizeObserver(scheduleCheck);
    observer.observe(box);
    window.addEventListener('resize', scheduleCheck);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', scheduleCheck);
    };
  }, [enabled, measureKey, actionBoxRef]);

  return choicesExpanded;
}

function paneOverflowsParent(el: HTMLDivElement): boolean {
  const parent = el.parentElement;
  if (!parent) return false;
  let siblingHeight = 0;
  for (const child of parent.children) {
    if (child !== el) siblingHeight += child.clientHeight;
  }
  const available = parent.clientHeight - siblingHeight;
  return el.scrollHeight > available + 1;
}

/** Modal/inline choice panes: enable scroll cap only when content overflows its box. */
export function useChoicePaneScrollFallback({
  enabled,
  paneRef,
  measureKey,
  measureAgainstParent = false,
}: {
  enabled: boolean;
  paneRef: RefObject<HTMLDivElement | null>;
  measureKey: string | number;
  measureAgainstParent?: boolean;
}): boolean {
  const [needsScroll, setNeedsScroll] = useState(false);

  useEffect(() => {
    setNeedsScroll(false);
  }, [measureKey, enabled]);

  useEffect(() => {
    if (!enabled) {
      setNeedsScroll(false);
      return;
    }

    const pane = paneRef.current;
    if (!pane) return;

    let raf = 0;

    const check = () => {
      const el = paneRef.current;
      if (!el) return;
      setNeedsScroll(
        measureAgainstParent ? paneOverflowsParent(el) : actionBoxOverflows(el)
      );
    };

    const scheduleCheck = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(check);
    };

    scheduleCheck();
    const observer = new ResizeObserver(scheduleCheck);
    observer.observe(pane);
    window.addEventListener('resize', scheduleCheck);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', scheduleCheck);
    };
  }, [enabled, measureKey, measureAgainstParent, paneRef]);

  return needsScroll;
}
