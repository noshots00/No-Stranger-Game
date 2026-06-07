import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  buildJobEarningLines,
  formatNextDayCountdownCorner,
  getJobProfessionLevel,
} from '../jobs/earningDisplay';
import { getJobCardImageSrc } from '../jobs/jobArt';
import { getJobDefinition } from '../jobs/registry';
import type { QuestState } from '../quests/types';
import { formatCommunityGoalBannerText } from '../villageProjects/communityGoalDisplay';
import type { VillageProjectProgress } from '../villageProjects/villageProjectNostr';
import { RPG_VILLAGE_HUB_STRIP } from '../typography/rpgUiTypography';

type ActiveStateCardProps = {
  activeJobSlug: string;
  skills: QuestState['skills'];
  dayCounter: number;
  dayPacingActive: boolean;
  nextDayResetMs: number | null;
  communityProject?: Pick<VillageProjectProgress, 'definition' | 'totals'> | null;
};

function useRemainingMs(targetMs: number | null): number | null {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (targetMs === null) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  if (targetMs === null) return null;
  return Math.max(0, targetMs - nowMs);
}

export function ActiveStateCard({
  activeJobSlug,
  skills,
  dayCounter,
  dayPacingActive,
  nextDayResetMs,
  communityProject = null,
}: ActiveStateCardProps) {
  const job = getJobDefinition(activeJobSlug);
  if (!job) return null;

  const artSrc = getJobCardImageSrc(activeJobSlug);
  const professionLevel = getJobProfessionLevel(job, skills);
  const earningLines = buildJobEarningLines(activeJobSlug, skills);
  const earningsSummary = earningLines.join(' · ');
  const communityGoalLine = communityProject ? formatCommunityGoalBannerText(communityProject) : null;
  const remainingMs = useRemainingMs(nextDayResetMs);
  const showCountdown = dayPacingActive && remainingMs !== null;
  const countdownLine = showCountdown
    ? formatNextDayCountdownCorner(dayCounter, remainingMs)
    : null;

  return (
    <div
      className={cn(
        'village-location-cloud-panel active-state-strip relative isolate min-h-[4.75rem] font-sans select-none',
        RPG_VILLAGE_HUB_STRIP,
        'h-auto',
        showCountdown && 'pb-5'
      )}
      aria-label={`${job.displayName} daily earnings`}
    >
      <img src={artSrc} alt="" className="village-location-cloud-panel__art" />
      <div className="absolute inset-0 z-[2] flex items-center gap-2.5 px-2.5 py-1.5">
        <img
          src={artSrc}
          alt=""
          className="h-[3.25rem] w-[3.25rem] shrink-0 rounded-sm border border-[var(--candle-rule)]/80 object-cover shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
          loading="lazy"
          aria-hidden
        />
        <div className={cn('min-w-0 flex-1 space-y-0.5 leading-none', showCountdown && 'pr-1')}>
          <p className="truncate text-[12px] font-medium leading-tight text-[var(--candle-flame-soft)]">
            {job.displayName} · Lvl {professionLevel}
            {earningsSummary ? (
              <span className="font-normal text-[var(--candle-wax)]"> · {earningsSummary}</span>
            ) : null}
          </p>
          {communityGoalLine ? (
            <p className="truncate text-[11px] leading-tight text-[var(--candle-wax)]/90">
              {communityGoalLine}
            </p>
          ) : null}
        </div>
      </div>
      {countdownLine ? (
        <p
          className="absolute bottom-1.5 right-2.5 z-[3] text-[10px] tabular-nums leading-none tracking-[0.01em] text-[var(--candle-ink-soft)]"
          aria-live="polite"
          aria-atomic="true"
        >
          {countdownLine}
        </p>
      ) : null}
    </div>
  );
}
