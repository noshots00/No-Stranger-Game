import { cn } from '@/lib/utils';
import type { BlobbiSnapshot } from './blobbiStateNostr';

type BlobbiPortraitProps = {
  blobbi: Pick<
    BlobbiSnapshot,
    | 'displayName'
    | 'stage'
    | 'baseColor'
    | 'secondaryColor'
    | 'eyeColor'
    | 'pattern'
    | 'specialMark'
    | 'imageUrl'
    | 'dittoPageUrl'
  >;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZE_PX = { sm: 20, md: 40, lg: 96 } as const;

function markGlyph(mark: BlobbiSnapshot['specialMark']): string | null {
  switch (mark) {
    case 'star':
      return '★';
    case 'heart':
      return '♥';
    case 'sparkle':
      return '✦';
    case 'blush':
      return '◡';
    default:
      return null;
  }
}

function PortraitSvg({
  blobbi,
  px,
}: {
  blobbi: BlobbiPortraitProps['blobbi'];
  px: number;
}) {
  const base = blobbi.baseColor ?? '#888888';
  const secondary = blobbi.secondaryColor ?? '#ffffff55';
  const eye = blobbi.eyeColor ?? '#1f2937';
  const isEgg = blobbi.stage === 'egg';
  const rx = isEgg ? px * 0.38 : px * 0.42;
  const ry = isEgg ? px * 0.48 : px * 0.4;
  const cx = px / 2;
  const cy = px / 2 + (isEgg ? px * 0.02 : 0);
  const patternId = `blobbi-pattern-${blobbi.displayName}-${blobbi.stage}`;

  return (
    <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} aria-hidden className="shrink-0">
      <defs>
        <pattern id={patternId} width="4" height="4" patternUnits="userSpaceOnUse">
          {blobbi.pattern === 'striped' ? (
            <rect width="2" height="4" fill={secondary} />
          ) : blobbi.pattern === 'spotted' ? (
            <circle cx="1" cy="1" r="0.8" fill={secondary} />
          ) : blobbi.pattern === 'gradient' ? (
            <linearGradient id={`${patternId}-grad`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={base} />
              <stop offset="100%" stopColor={secondary} />
            </linearGradient>
          ) : null}
        </pattern>
      </defs>
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={blobbi.pattern === 'gradient' ? `url(#${patternId}-grad)` : base}
        stroke="#ffffff33"
        strokeWidth="0.6"
      />
      {blobbi.pattern && blobbi.pattern !== 'gradient' && blobbi.pattern !== 'solid' ? (
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${patternId})`} opacity="0.55" />
      ) : null}
      {!isEgg ? (
        <>
          <circle cx={cx - rx * 0.35} cy={cy - ry * 0.1} r={px * 0.06} fill={eye} />
          <circle cx={cx + rx * 0.35} cy={cy - ry * 0.1} r={px * 0.06} fill={eye} />
        </>
      ) : null}
      {markGlyph(blobbi.specialMark) ? (
        <text
          x={cx}
          y={cy + ry * 0.15}
          textAnchor="middle"
          fontSize={px * 0.28}
          fill="#ffffffcc"
        >
          {markGlyph(blobbi.specialMark)}
        </text>
      ) : null}
    </svg>
  );
}

export function BlobbiPortrait({ blobbi, size = 'sm', className }: BlobbiPortraitProps) {
  const px = SIZE_PX[size];
  const label = `View ${blobbi.displayName} on Ditto`;

  const body =
    blobbi.imageUrl ? (
      <img
        src={blobbi.imageUrl}
        alt=""
        width={px}
        height={px}
        className="h-full w-full shrink-0 rounded-full border border-white/20 object-cover"
      />
    ) : (
      <PortraitSvg blobbi={blobbi} px={px} />
    );

  if (!blobbi.dittoPageUrl) {
    return <span className={cn('inline-flex shrink-0', className)}>{body}</span>;
  }

  return (
    <a
      href={blobbi.dittoPageUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className={cn('inline-flex shrink-0 rounded-full transition-opacity hover:opacity-90', className)}
      onClick={(e) => e.stopPropagation()}
    >
      {body}
    </a>
  );
}
