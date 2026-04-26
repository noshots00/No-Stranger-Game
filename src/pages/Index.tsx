import { useSeoMeta } from '@unhead/react';
import { Link, useNavigate } from 'react-router-dom';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEffect } from 'react';

const Index = () => {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  
  useSeoMeta({
    title: 'No Stranger Game',
    description: 'An RPG that lives inside your social network. Play with real people as NPCs.',
  });

  // Redirect to game if already logged in
  useEffect(() => {
    if (user) {
      navigate('/game');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-gray-900 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            ⚔️ No Stranger Game
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            An RPG that lives inside your social network
          </p>
        </div>
        <div className="border-2 border-dashed border-gray-600 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4 text-white text-center">
            Connect Your Nostr Account
          </h2>
          <LoginArea className="w-full flex flex-col gap-3" />
        </div>
        <p className="text-sm text-gray-400 text-center">
          Once connected, you'll enter the game world
        </p>
        <div className="text-center">
          <Link 
            to="/game" 
            className="text-purple-400 hover:text-purple-300 text-sm"
          >
            Or click here to go directly to the game →
          </Link>
        </div>
        <div className="text-sm text-gray-500 text-center pt-4 border-t border-gray-700">
          <p>Vibed with <a href="https://shakespeare.diy" className="text-purple-400 hover:underline">Shakespeare</a></p>
        </div>
      </div>
    </div>
  );
};

export default Index;
