import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CreateGuildNameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
  isPending: boolean;
};

export function CreateGuildNameDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: CreateGuildNameDialogProps) {
  const [name, setName] = useState('');

  const handleOpenChange = (next: boolean) => {
    if (!next) setName('');
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={false}>
      <DialogContent
        className="z-[70] border border-[var(--candle-rule)] bg-[var(--candle-hearth)] text-[var(--candle-ink)] sm:max-w-sm"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-cormorant text-lg text-[var(--candle-wax)]">Name your guild</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="guild-name" className="font-serif text-xs text-[var(--candle-ink-soft)]">
            Guild name
          </Label>
          <Input
            id="guild-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-[var(--candle-rule)] bg-black/30 font-serif text-[var(--candle-ink)]"
            placeholder="Silver Companions"
            maxLength={48}
            disabled={isPending}
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="font-serif"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="font-serif"
            disabled={isPending || name.trim().length === 0}
            onClick={() => {
              onSubmit(name.trim());
              setName('');
            }}
          >
            {isPending ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
