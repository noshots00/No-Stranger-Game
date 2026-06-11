import { cn } from '@/lib/utils';
import { playerNameMarkClass } from './characterHighlights';
import { QUEST_SCENE_CONTINUE } from './typography/rpgDialogTypography';
import { RPG_UI_META } from './typography/rpgUiTypography';

export const PLAYER_NAME_INPUT_CLASS = cn(
  playerNameMarkClass(),
  'w-full border-b border-[var(--candle-rule)] bg-transparent px-0 py-2',
  'rpg-font-ui text-[18px] font-medium leading-snug tracking-[0.01em]',
  'placeholder:font-normal placeholder:text-[var(--candle-ink-faint)]/80',
  'focus:border-[var(--candle-flame-soft)] focus:outline-none'
);

type PlayerNameEntryFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  submitLabel: string;
  onSubmit: () => void;
  isValid: boolean;
  error?: string | null;
  className?: string;
  submitButtonClassName?: string;
};

export function PlayerNameEntryField({
  value,
  onChange,
  placeholder,
  submitLabel,
  onSubmit,
  isValid,
  error = null,
  className,
  submitButtonClassName,
}: PlayerNameEntryFieldProps) {
  return (
    <div className={cn('space-y-1 px-0.5 py-0.5', className)}>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={PLAYER_NAME_INPUT_CLASS}
        autoComplete="off"
        spellCheck={false}
      />
      {error ? <p className={cn(RPG_UI_META, 'text-rose-300/90')}>{error}</p> : null}
      <button
        type="button"
        onClick={onSubmit}
        className={
          submitButtonClassName ??
          cn(QUEST_SCENE_CONTINUE, !isValid && 'text-red-300 hover:text-red-200')
        }
      >
        {submitLabel}
      </button>
    </div>
  );
}
