import React, { useState, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import LiveSession from './components/LiveSession';
import { AppState } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  console.log('[App] Rendered with appState:', appState);

  const startSession = useCallback(() => {
    console.log('[App] 🚀 startSession called - changing state to ACTIVE');
    setAppState(AppState.ACTIVE);
  }, []);

  const endSession = useCallback(() => {
    console.log('[App] 🛑 endSession called - changing state to LANDING');
    setAppState(AppState.LANDING);
  }, []);

  return (
    <>
      {appState === AppState.LANDING && (
        <LandingPage onInitialize={startSession} />
      )}
      {appState === AppState.ACTIVE && (
        <LiveSession onEndSession={endSession} />
      )}
    </>
  );
};

export default App;
