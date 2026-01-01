import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import LiveSession from './components/LiveSession';
import { AppState } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);

  const startSession = () => {
    setAppState(AppState.ACTIVE);
  };

  const endSession = () => {
    setAppState(AppState.LANDING);
  };

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