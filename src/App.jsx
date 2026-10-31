import React from 'react';
import './App.css';
import Header from './components/Header/Header';
import Body from './components/Body/Body';
import CyberpunkCard from './components/CyberpunkCard/CyberpunkCard';
import CRTFilter from './components/CRTFilter/CRTFilter';

function App() {
  return (
    <div className="tum-sayfa">
      {/* Tüplü Televizyon Ekran Boğumu & Filtresi (Tamamen Statik, Sıfır Hareket) */}
      <CRTFilter />

      <Header />

      <Body>
        <CyberpunkCard />
      </Body>
    </div>
  );
}

export default App;
