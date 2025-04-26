// ResourcePalette.jsx
import React from 'react'
import { useTownStore } from './store'

export function ResourcePalette() {
  const { activeSet, selectedResource, selectResource } = useTownStore((s) => ({
    activeSet:        s.activeSet,
    selectedResource: s.selectedResource,
    selectResource:   s.selectResource,
  }))

  return (
    <div className="flex space-x-2 mb-4">
      {activeSet.map((res) => (
        <button
          key={res}
          onClick={() => selectResource(res)}
          className={
            `px-3 py-1 rounded 
             ${selectedResource === res
               ? 'bg-blue-600 text-white'
               : 'bg-gray-200 text-gray-800'}`
          }
        >
          {res}
        </button>
      ))}
    </div>
  )
}
