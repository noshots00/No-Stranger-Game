import { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

import { VILLAGE_MAP_SRC } from './villageArt';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.35;
const WHEEL_ZOOM_FACTOR = 0.0012;

type Point = { x: number; y: number };

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

type VillageMapViewerProps = {
  className?: string;
  alt?: string;
  /** Decorative thumbnail (~¼ height); disables flex growth and pan hint. */
  compact?: boolean;
  src?: string;
};

export function VillageMapViewer({
  className,
  alt = 'Strange Village map',
  compact = false,
  src = VILLAGE_MAP_SRC,
}: VillageMapViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(MIN_SCALE);
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });

  const scaleRef = useRef(scale);
  const translateRef = useRef(translate);
  scaleRef.current = scale;
  translateRef.current = translate;

  const panRef = useRef<{
    pointerId: number;
    startClient: Point;
    startTranslate: Point;
  } | null>(null);
  const pinchRef = useRef<{
    startDistance: number;
    startScale: number;
    startTranslate: Point;
    startMid: Point;
  } | null>(null);
  const activePointersRef = useRef<Map<number, Point>>(new Map());

  const applyZoom = useCallback((nextScale: number, focal?: Point) => {
    const prevScale = scaleRef.current;
    const clamped = clampScale(nextScale);
    if (clamped === prevScale) return;

    if (focal) {
      const ratio = clamped / prevScale;
      const prevT = translateRef.current;
      setTranslate({
        x: focal.x - (focal.x - prevT.x) * ratio,
        y: focal.y - (focal.y - prevT.y) * ratio,
      });
    }
    setScale(clamped);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setViewportSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheelNative = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      const focal = {
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      };
      applyZoom(scaleRef.current - event.deltaY * WHEEL_ZOOM_FACTOR, focal);
    };
    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, [applyZoom]);

  const resetView = useCallback(() => {
    setScale(MIN_SCALE);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback(
    (delta: number, focal?: Point) => {
      applyZoom(scaleRef.current + delta, focal);
    },
    [applyZoom]
  );

  const syncPinch = useCallback(() => {
    const pointers = [...activePointersRef.current.values()];
    if (pointers.length !== 2) {
      pinchRef.current = null;
      return;
    }
    const [a, b] = pointers;
    const dist = distance(a, b);
    const mid = midpoint(a, b);
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const focal = {
      x: mid.x - rect.left - rect.width / 2,
      y: mid.y - rect.top - rect.height / 2,
    };

    if (!pinchRef.current) {
      pinchRef.current = {
        startDistance: dist,
        startScale: scaleRef.current,
        startTranslate: { ...translateRef.current },
        startMid: focal,
      };
      panRef.current = null;
      return;
    }

    const { startDistance, startScale, startTranslate, startMid } = pinchRef.current;
    if (startDistance < 1) return;
    const nextScale = clampScale(startScale * (dist / startDistance));
    const ratio = nextScale / startScale;
    setScale(nextScale);
    setTranslate({
      x: startMid.x - (startMid.x - startTranslate.x) * ratio,
      y: startMid.y - (startMid.y - startTranslate.y) * ratio,
    });
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.button !== 0) return;
      const target = viewportRef.current;
      if (!target) return;
      target.setPointerCapture(event.pointerId);
      activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (activePointersRef.current.size === 2) {
        syncPinch();
        return;
      }

      if (scaleRef.current > MIN_SCALE) {
        panRef.current = {
          pointerId: event.pointerId,
          startClient: { x: event.clientX, y: event.clientY },
          startTranslate: { ...translateRef.current },
        };
      }
    },
    [syncPinch]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!activePointersRef.current.has(event.pointerId)) return;
      activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (activePointersRef.current.size >= 2) {
        syncPinch();
        return;
      }

      const pan = panRef.current;
      if (!pan || pan.pointerId !== event.pointerId) return;
      const dx = event.clientX - pan.startClient.x;
      const dy = event.clientY - pan.startClient.y;
      setTranslate({
        x: pan.startTranslate.x + dx,
        y: pan.startTranslate.y + dy,
      });
    },
    [syncPinch]
  );

  const endPointer = useCallback((event: React.PointerEvent) => {
    activePointersRef.current.delete(event.pointerId);
    if (panRef.current?.pointerId === event.pointerId) {
      panRef.current = null;
    }
    if (activePointersRef.current.size < 2) {
      pinchRef.current = null;
    }
    if (activePointersRef.current.size === 1 && scaleRef.current > MIN_SCALE) {
      const remaining = [...activePointersRef.current.entries()][0];
      if (remaining) {
        const [, pt] = remaining;
        panRef.current = {
          pointerId: remaining[0],
          startClient: pt,
          startTranslate: { ...translateRef.current },
        };
      }
    }
    try {
      viewportRef.current?.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
  }, []);

  const canPan = scale > MIN_SCALE;
  const mapMaxW = Math.max(0, viewportSize.w);
  const mapMaxH = Math.max(0, viewportSize.h);

  return (
    <div
      className={cn(
        'relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-[var(--candle-rule)] bg-black/40',
        compact ? 'h-[3rem] max-h-[3rem] shrink-0' : 'min-w-0 flex-1',
        className
      )}
    >
      <div
        className="absolute right-1 top-1 z-10 flex items-center gap-0.5 rounded-md border border-[var(--candle-rule)]/80 bg-black/55 p-0.5 backdrop-blur-sm"
        role="toolbar"
        aria-label="Map zoom"
      >
        <button
          type="button"
          className="rounded p-1 text-[var(--candle-ink-soft)] hover:bg-[var(--candle-flame)]/15 hover:text-[var(--candle-wax)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--candle-flame-soft)]"
          aria-label="Zoom out"
          disabled={scale <= MIN_SCALE}
          onClick={() => zoomBy(-ZOOM_STEP)}
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className="rounded p-1 text-[var(--candle-ink-soft)] hover:bg-[var(--candle-flame)]/15 hover:text-[var(--candle-wax)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--candle-flame-soft)]"
          aria-label="Zoom in"
          disabled={scale >= MAX_SCALE}
          onClick={() => zoomBy(ZOOM_STEP)}
        >
          <Plus className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className="rounded p-1 text-[var(--candle-ink-soft)] hover:bg-[var(--candle-flame)]/15 hover:text-[var(--candle-wax)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--candle-flame-soft)]"
          aria-label="Reset map view"
          onClick={resetView}
        >
          <RotateCcw className="size-4" aria-hidden />
        </button>
      </div>

      <div
        ref={viewportRef}
        className={cn(
          'relative min-h-0 flex-1 touch-none select-none',
          canPan ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        aria-label={alt}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/2 top-1/2 will-change-transform"
            style={{
              transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px)) scale(${scale})`,
            }}
          >
            {mapMaxW > 0 && mapMaxH > 0 ? (
              <img
                src={src}
                alt=""
                draggable={false}
                className="block object-contain"
                style={{
                  maxWidth: mapMaxW,
                  maxHeight: mapMaxH,
                  width: 'auto',
                  height: 'auto',
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      {!compact ? (
        <p className="pointer-events-none absolute bottom-1 left-1.5 font-serif text-[0.6rem] text-[var(--candle-ink-faint)]">
          Pinch or scroll to zoom · drag when zoomed
        </p>
      ) : null}
    </div>
  );
}
