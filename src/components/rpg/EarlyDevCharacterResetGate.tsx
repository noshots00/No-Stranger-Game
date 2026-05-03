import { Button } from '@/components/ui/button';

type EarlyDevCharacterResetGateProps = {
  onOkay: () => void | Promise<void>;
};

export function EarlyDevCharacterResetGate({ onOkay }: EarlyDevCharacterResetGateProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-6 py-10 text-center">
      <p className="max-w-md font-serif text-lg leading-relaxed text-[var(--candle-ink-soft)]">
        While the game is in early development you will be forced to make a new character from time to time. This is one
        of those times.
      </p>
      <Button
        type="button"
        className="min-w-[8rem] font-serif text-base"
        onClick={() => void onOkay()}
      >
        Okay.
      </Button>
    </div>
  );
}
