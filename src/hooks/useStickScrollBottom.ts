import { type RefObject, useLayoutEffect } from 'react';

const SENTINEL_SELECTOR = '[data-stick-scroll-bottom-sentinel]';

function snapScrollContainer(el: HTMLElement): void {
  el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
  el.querySelector<HTMLElement>(SENTINEL_SELECTOR)?.scrollIntoView({
    block: 'end',
    behavior: 'auto',
  });
}

/**
 * After layout + async subtree growth (fonts, images), pins scroll container to the bottom.
 * Expect a descendant with `data-stick-scroll-bottom-sentinel` for a reliable scrollIntoView target.
 */
export function useStickScrollBottom(
  scrollElRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  /** Bump when content meaningfully changes (e.g. message count). */
  revision: number | string
): void {
  useLayoutEffect(() => {
    if (!enabled) return;
    const el = scrollElRef.current;
    if (!el) return;

    snapScrollContainer(el);

    const ro = new ResizeObserver(() => snapScrollContainer(el));
    ro.observe(el);
    const inner = el.firstElementChild;
    if (inner instanceof HTMLElement) ro.observe(inner);

    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      snapScrollContainer(el);
      raf2 = requestAnimationFrame(() => snapScrollContainer(el));
    });

    const timeouts = [32, 100, 320, 800, 2000].map((ms) => window.setTimeout(() => snapScrollContainer(el), ms));

    let cancelled = false;
    void document.fonts?.ready?.then(() => {
      if (!cancelled) snapScrollContainer(el);
    });

    return () => {
      cancelled = true;
      ro.disconnect();
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      timeouts.forEach(clearTimeout);
    };
  }, [enabled, revision, scrollElRef]);
}
