import React from 'react';
import './App.css';
import Header from './components/Header/Header';
import CRTFilter from './components/CRTFilter/CRTFilter';

function App() {
  return (
    <div className="tum-sayfa">
      {/* Tüplü Televizyon Ekran Boğumu & Filtresi (Statik CRT Efekti) */}
      <CRTFilter />

      <Header />
    </div>
  );
}

export default App;
