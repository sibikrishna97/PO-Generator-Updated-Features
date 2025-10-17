import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import POList from './pages/POList';
import POEditor from './pages/POEditor';
import Settings from './pages/Settings';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<POList />} />
          <Route path="/po/new" element={<POEditor />} />
          <Route path="/po/:id" element={<POEditor />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;