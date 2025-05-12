// 1. Install React Router DOM
// Run this in your project root:
// npm install react-router-dom

// 2. Create src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import TinyTowns from './TinyTowns.jsx';
import Profile from './Profile.jsx';
import Leaderboard from './Leaderboard.jsx';

export function App() {
  return (
    <BrowserRouter>
      {/* Navigation Bar */}
      <nav className="p-4 bg-gray-100 flex space-x-4">
        <Link to="/" className="text-blue-600 hover:underline">Game</Link>
        <Link to="/profile" className="text-blue-600 hover:underline">Profile</Link>
        <Link to="/leaderboard" className='text-blue-600 hover:underline'>Leaderboard</Link>
      </nav>

      {/* Route Definitions */}
      <Routes>
        <Route path="/" element={<TinyTowns />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}
