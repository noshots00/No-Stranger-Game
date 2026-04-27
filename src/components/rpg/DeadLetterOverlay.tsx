import { useState } from 'react';

interface DeadLetterOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSeal: (payload: { title: string; body: string }) => void;
  isPending?: boolean;
}

export function DeadLetterOverlay({ isOpen, onClose, onSeal, isPending = false }: DeadLetterOverlayProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl p-5" style={{ background: 'var(--surface)' }}>
        <p className="font-cormorant text-xl" style={{ color: 'var(--ink)' }}>Seal a letter</p>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="mt-4 w-full bg-transparent border-b p-2 text-sm"
          style={{ borderColor: 'var(--ink-ghost)', color: 'var(--ink)' }}
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write to your future self..."
          className="mt-3 w-full h-28 rounded-md p-2 text-sm"
          style={{ background: 'var(--surface-dim)', color: 'var(--ink)', border: '1px solid var(--ink-ghost)' }}
        />
        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="text-sm" style={{ color: 'var(--ink-dim)' }}>
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending || !body.trim()}
            onClick={() => {
              onSeal({ title: title.trim() || 'Untitled', body: body.trim() });
              setTitle('');
              setBody('');
            }}
            className="text-sm"
            style={{ color: 'var(--ember)' }}
          >
            {isPending ? 'Sealing...' : 'Seal'}
          </button>
        </div>
      </div>
    </div>
  );
}
