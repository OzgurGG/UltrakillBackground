import React from 'react';
import './App.css';
import Header from './components/Header/Header';
import Body from './components/Body/Body';
import CRTFilter from './components/CRTFilter/CRTFilter';

function App() {
  return (
    <CRTFilter>
      <Header />
      <Body />
    </CRTFilter>
  );
}

export default App;
