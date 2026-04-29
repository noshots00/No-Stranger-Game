import type { ChoiceOption, DialogueLine } from '@/hooks/useDialogueEngine';
import { GlobalNostrFeed } from '@/components/GlobalNostrFeed';

interface PlayViewProps {
  day: number;
  region: string;
  history: DialogueLine[];
  currentPrompt: ChoiceOption[] | null;
  inputMode: 'text' | 'none';
  step: string;
  onChoice: (choice: ChoiceOption) => void;
  onNameSubmit: (name: string) => void;
  onCompleteVignettes: (race: string) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export default function PlayView({
  day,
  region,
  history,
  currentPrompt,
  inputMode,
  step,
  onChoice,
  onNameSubmit,
  onCompleteVignettes,
  scrollRef,
}: PlayViewProps) {
  return (
    <div className="flex flex-col h-[100dvh] h-[calc(var(--vh,1vh)*100)] bg-stone-950 text-stone-200 overflow-hidden font-sans select-none">
      <header className="px-4 py-3 bg-stone-900/90 backdrop-blur border-b border-stone-800 text-center shrink-0 z-10 safe-area-pt">
        <span className="text-sm font-mono tracking-wide text-stone-400">
          Day {day} - {region}
        </span>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth space-y-5 pb-[84px]" role="log" aria-live="polite">
        {import.meta.env.DEV && (
          <div className="rounded border border-stone-700 bg-stone-900/70 px-3 py-2 text-[10px] font-mono text-stone-400">
            step={step} | history={history.length} | input={inputMode} | prompt={currentPrompt?.length ?? 0}
          </div>
        )}

        {history.map((line) => (
          <div key={line.id} className="animate-fadeIn">
            <p
              className={`leading-relaxed ${
                line.isSystem ? 'text-yellow-500/90 font-mono text-xs tracking-wide border-l-2 border-yellow-500/30 pl-3' : 'text-stone-300'
              }`}
            >
              {line.speaker ? (
                <>
                  <span className="font-semibold text-stone-100">{line.speaker}:</span> <span>{line.text}</span>
                </>
              ) : (
                line.text
              )}
            </p>
          </div>
        ))}

        {inputMode === 'text' && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.target as HTMLFormElement;
              const input = form.elements.namedItem('name') as HTMLInputElement;
              onNameSubmit(input.value);
              input.blur();
            }}
            className="mt-2 animate-slideUp"
          >
            <div className="flex gap-2">
              <input
                name="name"
                type="text"
                placeholder="Type your name..."
                autoFocus
                className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-4 py-3 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
              />
              <button type="submit" className="bg-yellow-600 hover:bg-yellow-500 text-stone-950 font-semibold px-5 py-3 rounded-lg min-w-[100px]">
                Confirm
              </button>
            </div>
          </form>
        )}

        {step === 'vignettes' && (
          <div className="p-4 bg-stone-900/50 border border-stone-800 rounded-lg text-center text-stone-400 animate-fadeIn">
            <p className="text-sm">[Vignette Sequence Active]</p>
            <button onClick={() => onCompleteVignettes('Elf')} className="mt-3 px-4 py-2 rounded border border-stone-700 bg-stone-800 hover:bg-stone-700 text-xs font-mono">
              Finish Vignettes
            </button>
          </div>
        )}

        {currentPrompt && step !== 'vignettes' && (
          <div className="space-y-3 mt-2 animate-slideUp">
            {currentPrompt.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChoice(opt)}
                className="w-full text-left px-5 py-4 bg-stone-800/80 hover:bg-stone-700 border border-stone-700 hover:border-stone-600 rounded-lg text-stone-200 active:scale-[0.98] touch-manipulation min-h-[52px]"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {step === 'idle_play' && <GlobalNostrFeed />}
      </main>
    </div>
  );
}
