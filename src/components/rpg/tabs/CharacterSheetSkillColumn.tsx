import { cn } from '@/lib/utils';
import { CHAR_MINOR, CHAR_STAT_LABEL } from './characterSheetTypography';

type CharacterSheetSkillColumnProps = {
  label: string;
  placeholders: readonly string[];
  accentClassName?: string;
};

/** Vertical skill/spell column aligned with the primary stat grid. */
export function CharacterSheetSkillColumn({
  label,
  placeholders,
  accentClassName,
}: CharacterSheetSkillColumnProps) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <div className={CHAR_STAT_LABEL}>{label}</div>
      <ul className="mt-0 w-full space-y-0" aria-label={label}>
        {placeholders.map((name) => (
          <li
            key={name}
            className={cn(CHAR_MINOR, 'break-words', accentClassName ?? 'text-[var(--candle-ink-faint)]')}
          >
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}
