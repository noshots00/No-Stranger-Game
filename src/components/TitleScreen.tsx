import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TitleScreen() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/play', { replace: true });
  }, [navigate, user]);

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] bg-stone-950 text-stone-200 px-6 relative">
      <h1 className="text-3xl font-serif tracking-wide mb-12">No Stranger Game</h1>
      <div className="flex flex-col gap-4 w-full max-w-xs game-login">
        <LoginArea className="w-full flex justify-center" />
      </div>
      <div className={`absolute bottom-6 w-2 h-2 rounded-full ${user ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
    </div>
  );
}
