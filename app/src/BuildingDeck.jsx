// src/BuildingDeck.jsx
import React from 'react'
import { useTownStore, buildingConfig } from './store.js'

export default function BuildingDeck() {
  const selectBuilding   = useTownStore(s => s.selectBuilding)
  const selectedBuilding = useTownStore(s => s.selectedBuilding)
  const buildingError    = useTownStore(s => s.buildingError)

  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-4 mb-8">
      {Object.keys(buildingConfig).map(name => {
        const isActive = selectedBuilding === name
        const iconSrc  = buildingConfig[name].icon

        return (
          <button
            key={name}
            onClick={() => selectBuilding(name)}
            className={`
              w-36 h-70 rounded-2xl shadow-lg
              overflow-hidden cursor-pointer transition-transform transform hover:scale-105
              ${isActive ? 'ring-4 ring-blue-500' : 'hover:ring-4 hover:ring-blue-200'}
            `}
          >
            <img
              src={iconSrc}
              alt={name}
              className="w-40 h-55 object-contain"
            />
          </button>
        )
      })}

      {buildingError && (
        <div className="w-full text-red-600 text-center mt-2">
          {buildingError}
        </div>
      )}
    </div>
  )
}
