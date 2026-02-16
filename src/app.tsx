import React, { useEffect, useState } from 'react';
import { Explore } from './screens/Explore';
import { Capture } from './screens/Capture';

type Screen = 'explore' | 'capture';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('explore');

  useEffect(() => {
    // Determine screen from URL hash
    const hash = window.location.hash.slice(1); // Remove #
    if (hash === '/capture') {
      setCurrentScreen('capture');
    } else {
      setCurrentScreen('explore');
    }

    // Listen for hash changes
    const handleHashChange = () => {
      const newHash = window.location.hash.slice(1);
      if (newHash === '/capture') {
        setCurrentScreen('capture');
      } else {
        setCurrentScreen('explore');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden">
      {currentScreen === 'explore' && <Explore />}
      {currentScreen === 'capture' && <Capture />}
    </div>
  );
};
