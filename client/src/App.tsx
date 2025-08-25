import React from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
       <div className="workflows-tabs">
          <button className="tab active">Design</button>
          <button className="tab">Impl</button>
          <button className="tab">Exec</button>
        </div>
        <div> 
          <button className="primary-act">Generate Flow</button>
        </div>
    </div>
  );
}

export default App;
