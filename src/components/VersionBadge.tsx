import { APP_VERSION } from '@/version';

export function VersionBadge() {
  return (
    <div className="fixed top-2 right-2 z-[120] rounded border border-stone-600 bg-stone-900/90 px-2 py-1 text-[10px] font-mono tracking-wide text-stone-200">
      {APP_VERSION}
    </div>
  );
}
