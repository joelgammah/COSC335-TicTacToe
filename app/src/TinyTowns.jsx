// src/TinyTowns.jsx
import React, { useEffect, useState } from 'react';
import ResourceDeck from './ResourceDeck.jsx';
import BuildingDeck from './BuildingDeck.jsx';
import { useTownStore } from './store.js';
import { saveGame, unlockAchievement } from './compat-api.js';
import { fetchDefinitions, fetchUserAchievements } from './logic.js';
import { resourceIcons, buildingIcons } from './iconMap.js';

export default function TinyTowns() {
  const grid            = useTownStore(s => s.grid);
  const placeResource   = useTownStore(s => s.placeResource);
  const mode            = useTownStore(s => s.mode);
  const selectedGridIndices = useTownStore(s => s.selectedGridIndices)
  const patternIndices  = useTownStore(s => s.patternIndices);
  const placeBuildingAt = useTownStore(s => s.placeBuildingAt);
  const toggleSelection = useTownStore(s => s.toggleGridSelection);
  const selectedId      = useTownStore(s => s.selectedResourceId);
  const score           = useTownStore(s => s.score);

  const [definitions, setDefinitions] = useState([]);
  const [unlocked,    setUnlocked]    = useState([]);
  const [startTime]   = useState(() => new Date().toISOString());

  

  // 1) Load all achievement definitions once
  useEffect(() => {
    fetchDefinitions()
      .then(setDefinitions)
      .catch(err => console.error('Error loading definitions:', err));
  }, []);

  // 2) Watch auth state → fetch user achievements
  useEffect(() => {
    const auth = window.firebaseAuth;
    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        user.getIdToken(true)
          .then(fetchUserAchievements)
          .then(setUnlocked)
          .catch(err => console.error('Error loading user achievements:', err));
      } else {
        setUnlocked([]);
      }
    });
    return unsubscribe;
  }, []);

  // 3) When grid is full, attempt save & unlock (only if signed in)
  useEffect(() => {
    const isFull = grid.every(cell => cell !== null);
    if (!isFull || definitions.length === 0) return;

    const auth = window.firebaseAuth;
    if (!auth || !auth.currentUser) {
      console.warn('SaveGame skipped: user not signed in');
      return;
    }

    (async () => {
      try {
        const endTime = new Date().toISOString();
        // saveGame() will fetch the ID token internally
        const { success, gameId } = await saveGame({
          boardState: grid,
          score,
          startTime,
          endTime,
          metadata: {}
        });
        if (!success) return;

        // Award any matching achievements
        for (const def of definitions) {
          const already = unlocked.some(u => u.achievementId === def.id);
          if (def.criteria.type === 'noEmptyTiles' && !already) {
            await unlockAchievement(def.id, gameId);
          }
          if (def.criteria.type === 'minScore' && score >= def.criteria.requiredValue && !already) {
            await unlockAchievement(def.id, gameId);
          }
        }
      } catch (err) {
        console.error('saveGame error:', err);
      }
    })();
  }, [grid, definitions, unlocked, score, startTime]);


  const handleClick = i => {
    if (selectedId !== null) {
      placeResource(i);
      return;
    }
    if (mode === 'placingBuilding' && patternIndices.includes(i)) {
      placeBuildingAt(i);
      return;
    }
    toggleSelection(i);
  };

  const handleManualSave = async () => {
    const endTime = new Date().toISOString()
    const { success } = await saveGame({ boardState: grid, score, startTime, endTime, metadata: {} })
    if (success) {
      // e.g. toast “Saved!” or disable button briefly
    }
  }

  return (
    <div className="px-8 pt-6">
      {/* ─── HEADER: Score & Save ─── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Score: {score}
        </h2>
        <button
          onClick={handleManualSave}
          disabled={score === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Save Game
        </button>
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <div className="flex justify-end items-start gap-x-12">
        {/* LEFT COLUMN: Resources + Grid */}
        <div className="flex flex-col items-start space-y-10 mt-0">
          <ResourceDeck />
          <div className="grid grid-cols-4 gap-1 p-2 bg-white/10 rounded-lg w-max">
            {grid.map((cell, i) => {
              const isEmptyOrResource = cell === null || resourceIcons[cell]
              const isSelectingCell   = selectedGridIndices.includes(i)
              const isMatchingCell    = patternIndices.includes(i)

              let highlightClass = ''
              if (isSelectingCell) {
                highlightClass = 'ring-4 ring-blue-400'
              }
              if (isMatchingCell && mode === 'placingBuilding') {
                highlightClass = 'ring-4 ring-green-500'
              }

              return (
                <div
                  key={i}
                  onClick={() => isEmptyOrResource && handleClick(i)}
                  className={`
                    relative
                    w-20 h-20 bg-white border border-gray-300
                    flex items-center justify-center
                    transition-colors transition-transform duration-150
                    ${isEmptyOrResource
                      ? 'cursor-pointer hover:bg-blue-200'
                      : 'cursor-default pointer-events-none'}
                    ${highlightClass}
                  `}
                >
                  {cell && (
                    <img
                      src={resourceIcons[cell] ?? buildingIcons[cell]}
                      alt={cell}
                      className="w-10 h-10 object-contain"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Building Deck */}
        <BuildingDeck />
      </div>
    </div>
  )
}
