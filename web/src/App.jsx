import React from 'react';
import './App.css';
import CRTTerminal from './components/CRTTerminal/CRTTerminal';
import SettingsWindow from './components/SettingsWindow/SettingsWindow';

function App() {
  const isSettings = 
    window.location.search.includes('mode=settings') || 
    window.location.hash.includes('settings');

  if (isSettings) {
    return <SettingsWindow />;
  }

  return <CRTTerminal />;
}

export default App;
