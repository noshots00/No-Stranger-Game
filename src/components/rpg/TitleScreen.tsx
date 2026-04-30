import { Navigate } from 'react-router-dom';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function TitleScreen() {
  const { user } = useCurrentUser();

  if (user) {
    return <Navigate to="/game" replace />;
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col items-center justify-center gap-6">
        <h1 className="text-center text-3xl font-semibold tracking-tight text-foreground">No Stranger Game</h1>
        <div className="flex h-56 w-full items-center justify-center rounded-lg border border-border bg-muted text-sm text-muted-foreground">
          Placeholder image
        </div>
        <LoginArea className="flex w-full justify-center" />
      </div>
    </main>
  );
}
