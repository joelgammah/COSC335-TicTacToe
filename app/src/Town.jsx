// Town.jsx
import React from 'react'
import { useTownStore } from './store.js'

export function TownGrid() {
  const { grid, placeResource } = useTownStore((s) => ({
    grid:          s.grid,
    placeResource: s.placeResource,
  }))

  return (
    <div className="grid grid-cols-4 gap-1">
      {grid.map((cell, i) => (
        <div
          key={i}
          onClick={() => placeResource(i)}
          className="
            w-16 h-16 border flex
            items-center justify-center
            cursor-pointer bg-gray-100
          "
        >
          {cell
            ? <span className="font-bold">{cell}</span>
            : <span className="text-gray-400">—</span>
          }
        </div>
      ))}
    </div>
  )
}
