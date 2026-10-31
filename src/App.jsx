import React from 'react';
import './App.css';
import Header from './components/Header/Header';
import Body from './components/Body/Body';
import CyberpunkCard from './components/CyberpunkCard/CyberpunkCard';

function App() {
  return (
    <div className="tum-sayfa">
      <Header />
      <Body>
        <div className="corner-panel-container">
          <CyberpunkCard />
        </div>
      </Body>
    </div>
  );
}

export default App;
