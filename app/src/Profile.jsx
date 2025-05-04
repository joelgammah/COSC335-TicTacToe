// src/Profile.jsx
import React, { useState, useEffect } from 'react';
import { fetchDefinitions, fetchUserAchievements } from './logic.js';
import { fetchUserGames } from './compat-api.js';

export default function Profile() {
  const [definitions, setDefinitions] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [games, setGames] = useState([]);

  // 1) Load achievement definitions once (they're independent of auth)
  useEffect(() => {
    fetchDefinitions()
      .then(setDefinitions)
      .catch(err => console.error('Error loading definitions:', err));
  }, []);

  // 2) Watch auth state → fetch user achievements & games
  useEffect(() => {
    const auth = window.firebaseAuth;
    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        try {
          const token = await user.getIdToken(true);

          // Fetch achievements
          const userAch = await fetchUserAchievements(token);
          setAchievements(userAch);

          // Fetch games
          const userGames = await fetchUserGames(token);
          setGames(userGames);
        } catch (err) {
          console.error('Profile load error:', err);
          setAchievements([]);
          setGames([]);
        }
      } else {
        // Clear data on sign-out
        setAchievements([]);
        setGames([]);
      }
    });

    return unsubscribe;
  }, []);

  const getDef = id => definitions.find(d => d.id === id) || {};

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Achievements</h2>
        {achievements.length === 0 ? (
          <p>No achievements earned yet.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map(a => {
              const def = getDef(a.achievementId);
              const earnedAt = a.earnedAt?.toDate ? a.earnedAt.toDate() : new Date(a.earnedAt._seconds * 1000);
              return (
                <li key={a.achievementId} className="border p-4 rounded shadow">
                  <h3 className="text-xl font-bold">{def.name || a.achievementId}</h3>
                  <p className="text-sm text-gray-600">{def.description}</p>
                  <p className="mt-2 text-gray-700">Earned: {earnedAt.toLocaleString()}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Games Played</h2>
        {games.length === 0 ? (
          <p>No games played yet.</p>
        ) : (
          <table className="min-w-full bg-white shadow rounded">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left text-gray-700">Date</th>
                <th className="px-4 py-2 text-left text-gray-700">Score</th>
              </tr>
            </thead>
            <tbody>
              {games.map(g => {
                const end = g.endTime?.toDate ? g.endTime.toDate() : new Date(g.endTime._seconds * 1000);
                return (
                  <tr key={g.id} className="border-t">
                    <td className="px-4 py-2 text-gray-800">{end.toLocaleString()}</td>
                    <td className="px-4 py-2 text-gray-800">{g.score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
