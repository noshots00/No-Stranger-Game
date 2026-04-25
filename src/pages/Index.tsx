import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';

const Index = () => {
  useSeoMeta({
    title: 'No Stranger Game',
    description: 'An RPG that lives inside your social network. Play with real people as NPCs.',
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            No Stranger Game
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            An RPG that lives inside your social network. Not separate from it. Not a Discord server or a Web3 lobby. Just… there. Underneath everything you already see.
          </p>
          <Link
            to="/game"
            className="inline-block px-8 py-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors transform hover:-scale-105"
          >
            Start Your Adventure
          </Link>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>Connect your Nostr account to begin playing</p>
          <p className="mt-2">Vibed with <a href="https://shakespeare.diy" className="text-primary hover:underline">Shakespeare</a></p>
        </div>
      </div>
    </div>
  );
};

export default Index;
