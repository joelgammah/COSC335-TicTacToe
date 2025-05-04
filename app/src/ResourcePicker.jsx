// src/ResourcePicker.jsx
import React from 'react'
import { resourceIcons } from './iconMap.js'

export default function ResourcePicker({ onPick, onCancel }) {
  const resources = ['Wheat', 'Brick', 'Glass', 'Wood', 'Stone']

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg text-gray-500 font-semibold mb-4">Choose a resource to place on Factory</h3>
        <div className="flex space-x-4">
          {resources.map(name => (
            <button
              key={name}
              onClick={() => onPick(name)}
              className="flex flex-col items-center p-2 hover:bg-gray-100 rounded"
            >
              <img
                src={resourceIcons[name]}
                alt={name}
                className="w-10 h-10 mb-1"
              />
              <span className="text-sm text-black">{name}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="mt-4 text-sm text-red-500 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
