interface WorldWelcomeProps {
  characterName: string;
  onDismiss: () => void;
}

export function WorldWelcome({ characterName, onDismiss }: WorldWelcomeProps) {
  return (
    <div className="min-h-[60vh] flex flex-col justify-center px-6 max-w-lg mx-auto text-center">
      <p className="font-cormorant text-2xl emerge" style={{ color: 'var(--ink)' }}>
        {characterName} has entered the world.
      </p>
      <p className="mt-6 font-cormorant text-base emerge emerge-delay-1" style={{ color: 'var(--ink-dim)' }}>
        While you are away, your stranger will work, struggle, and grow.
      </p>
      <p className="mt-3 font-cormorant text-base emerge emerge-delay-2" style={{ color: 'var(--ink-dim)' }}>
        Return each day for a new chapter. Each choice closes a door forever.
      </p>
      <p className="mt-3 font-cormorant text-sm italic emerge emerge-delay-3" style={{ color: 'var(--ink-ghost)' }}>
        The Territory shows where you&apos;ve been. The Self reveals who you&apos;re becoming.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-10 font-cormorant text-lg tracking-wide emerge emerge-delay-4"
        style={{ color: 'var(--ember)' }}
      >
        Begin the long road →
      </button>
    </div>
  );
}
