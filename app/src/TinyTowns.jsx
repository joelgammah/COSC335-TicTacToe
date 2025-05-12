// src/TinyTowns.jsx
import React, { useEffect, useState } from 'react';
import ResourceDeck from './ResourceDeck.jsx';
import BuildingDeck from './BuildingDeck.jsx';
import ResourcePicker from './ResourcePicker.jsx';
import { useTownStore } from './store.js';
import { saveGame, unlockAchievement, fetchGames } from './compat-api.js';
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
  const selectedBuilding = useTownStore(s => s.selectedBuilding);
  const factoryResources = useTownStore(s => s.factoryResources);
  const assignFactoryResource = useTownStore(s => s.assignFactoryResource);
  const resetGrid           = useTownStore(s => s.resetGrid);
  const loadGame            = useTownStore(s => s.loadGame);
  const gameId              = useTownStore(s => s.gameId);

  const [definitions, setDefinitions] = useState([]);
  const [unlocked,    setUnlocked]    = useState([]);
  const [startTime]   = useState(() => new Date().toISOString());
  const [saveStatus, setSaveStatus] = useState('idle');  // 'idle' | 'saving' | 'success' | 'error'
  const [pickingFor, setPickingFor] = useState(null);


  

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
        // clear achievements + game state
        setUnlocked([])
        resetGrid();
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
          factoryResources,
          metadata: {}
        });
        if (!success) return;

        // Award any matching achievements
        for (const def of definitions) {
          // skip any def without a proper criteria object
          if (!def.criteria || typeof def.criteria.type !== 'string') {
            console.warn('Skipping malformed achievement:', def)
            continue
          }
        
          const already = unlocked.some(u => u.achievementId === def.id)
        
          if (def.criteria.type === 'noEmptyTiles' && !already) {
            await unlockAchievement(def.id, gameId)
          }
        
          if (
            def.criteria.type === 'minScore' &&
            score >= def.criteria.requiredValue &&
            !already
          ) {
            await unlockAchievement(def.id, gameId)
          }
        
          if (
            def.criteria.type === 'range' &&
            score >= def.criteria.min &&
            score <= def.criteria.max &&
            !already
          ) {
            await unlockAchievement(def.id, gameId)
          }

          if (
            def.criteria.type === 'countBuilding' &&
            grid.filter(c => c === def.criteria.building).length >= def.criteria.requiredCount &&
            !already
          ) {
            await unlockAchievement(def.id, gameId)
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
    if (mode === 'placingBuilding' && selectedBuilding === 'Factory' && patternIndices.includes(i)) {
      setPickingFor(i)
      return;
    }
    if (mode === 'placingBuilding' && patternIndices.includes(i)) {
      placeBuildingAt(i);
      return;
    }
    toggleSelection(i);
  };

  // ─── END GAME HANDLER ────────────────────────────────────────────
  const handleEndGame = async () => {
    const finalScore = useTownStore.getState().computeScore();
    setSaveStatus('saving');
    const endTime = new Date().toISOString();
    try {
      const { success } = await saveGame({
        boardState: grid,
        score: finalScore,
        startTime,
        endTime,
        factoryResources,
        metadata: { final: true }
      });
      if (!success) throw new Error('End Game save failed');
      setSaveStatus('success');
      // flip UI mode
      useTownStore.setState({ mode: 'gameOver' });
    } catch (err) {
      console.error('End Game error:', err);
      setSaveStatus('error');
    }
  };

  const handleManualSave = async () => {
    const finalScore = useTownStore.getState().computeScore();
    setSaveStatus('saving')
    try {
      const endTime = new Date().toISOString()
      const { success } = await saveGame({
        boardState: grid,
        score: finalScore,
        startTime,
        endTime,
        metadata: {}
      })
      if (success) {
        setSaveStatus('success')
        // clear “saved” after 2s
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        throw new Error('Save returned !success')
      }
    } catch (err) {
      console.error('Manual save failed', err)
      setSaveStatus('error')
    }
  }

  // ─── GAME OVER SCREEN ────────────────────────────────────────────
  if (mode === 'gameOver') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-3xl font-bold mb-4">Game Over! Your final score: {score} 🎉</h2>
        <button
          onClick={() => {
            resetGrid();
            useTownStore.setState({ mode: 'normal' });
          }}
          className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Play Again
        </button>
      </div>
    );
  }  

  // ─── MAIN UI ─────────────────────────────────────────────────────
  return (
    <div className="px-8 pt-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Score: {score}</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleEndGame}
            disabled={saveStatus === 'saving'}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
          >
            {saveStatus === 'saving' ? 'Ending…' : 'End Game'}
          </button>
          <button
            onClick={handleManualSave}
            className={`
              px-4 py-2 rounded
              ${saveStatus === 'saving'
                ? 'bg-gray-400 text-gray-200 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-700 text-white'}
              disabled:opacity-50
            `}
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save Game'}
          </button>
          <button
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            onClick={async () => {
              const games = await fetchGames();
              if (games.length) {
                const last = games[0];
                loadGame(last);
              }
            }}
          >
            Load Last Game
          </button>

          {saveStatus === 'success' && <span className="text-green-600">Saved!</span>}
          {saveStatus === 'error'   && <span className="text-red-600">Error</span>}
        </div>
      </div>

      {/* MAIN LAYOUT (unchanged) */}
      <div className="flex justify-end items-start gap-x-12">
        <div className="flex flex-col items-start space-y-10 mt-0">
          <ResourceDeck />
          <div className="grid grid-cols-4 gap-1 p-2 bg-white/10 rounded-lg w-max">
            {grid.map((cell, i) => {
              const isEmptyOrResource = cell === null || resourceIcons[cell];
              const isSelectingCell   = selectedGridIndices.includes(i);
              const isMatchingCell    = patternIndices.includes(i);

              let highlightClass = '';
              if (isSelectingCell) highlightClass = 'ring-4 ring-blue-400';
              if (isMatchingCell && mode === 'placingBuilding') highlightClass = 'ring-4 ring-green-500';

              return (
                <div
                  key={i}
                  onClick={() => (cell===null||resourceIcons[cell]) && (
                    mode==='placingBuilding' && selectedBuilding==='Factory' && patternIndices.includes(i)
                      ? setPickingFor(i)
                      : mode==='placingBuilding' && patternIndices.includes(i)
                        ? placeBuildingAt(i)
                        : selectedId!==null
                          ? placeResource(i)
                          : toggleSelection(i)
                  )}
                  className={`
                    relative w-20 h-20 bg-white border border-gray-300
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
                  {cell === 'Factory' && factoryResources[i] && (
                    <img
                      src={resourceIcons[factoryResources[i].resource]}
                      alt={factoryResources[i].resource}
                      className="absolute bottom-1 right-1 w-5 h-5"
                    />
                  )}
                </div>
              );
            })}
            {pickingFor !== null && (
              <ResourcePicker
                onPick={resource => {
                  assignFactoryResource(pickingFor, resource);
                  placeBuildingAt(pickingFor);
                  setPickingFor(null);
                }}
                onCancel={() => setPickingFor(null)}
              />
            )}
          </div>
        </div>
        <BuildingDeck />
      </div>
    </div>
  );
}