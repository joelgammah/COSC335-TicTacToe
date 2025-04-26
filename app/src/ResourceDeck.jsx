// src/ResourceDeck.jsx
import React from 'react'
import { useTownStore } from './store.js'

export default function ResourceDeck() {
  const resourceDeck       = useTownStore(s => s.resourceDeck)
  const selectedResourceId = useTownStore(s => s.selectedResourceId)
  const selectResourceCard = useTownStore(s => s.selectResourceCard)
  const refreshCard        = useTownStore(s => s.refreshCard)

  return (
    <div className="flex flex-wrap gap-4 mb-8 justify-center">
      {resourceDeck.map(card => {
        const isSelected = card.id === selectedResourceId
        return (
          <div
            key={card.id}
            onClick={() => selectResourceCard(card.id)}
            role="button"
            tabIndex={0}
            className={
              `flex flex-col items-center p-4 border rounded-2xl shadow-lg
               cursor-pointer transition-transform transform
               hover:scale-105
               ${isSelected ? 'ring-4 ring-green-400' : 'hover:ring-4 hover:ring-green-200'}
               bg-white text-gray-800 w-32`
            }
            onKeyPress={e => {
              if (e.key === 'Enter' || e.key === ' ') selectResourceCard(card.id)
            }}
          >
            {/* Resource Icon */}
            <img
              src={`/assets/${card.name.toLowerCase()}.png`}
              alt={card.name}
              className="w-12 h-12 mb-2"
            />

            {/* Resource Name */}
            <span className="text-sm font-semibold">{card.name}</span>

            {/* Refresh button (only when selected) */}
            {isSelected && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  refreshCard(card.id)
                }}
                className="mt-2 px-3 py-1 text-xs font-medium bg-yellow-300 rounded-full hover:bg-yellow-400 transition"
              >
                Refresh
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}