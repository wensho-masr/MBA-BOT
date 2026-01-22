
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import History from './pages/History';
import About from './pages/About';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <Navbar isLoading={isLoading} />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home setGlobalLoading={setIsLoading} />} />
            <Route path="/history" element={<History />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
