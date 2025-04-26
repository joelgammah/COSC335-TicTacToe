// src/store.js

import { create } from 'zustand'
import { validateBuildingSelection, calculateScore } from './gameLogic.js'

// ===== Constants & Helpers =====
const allColors = ['yellow', 'red', 'blue', 'brown', 'gray']
const colorToResource = {
  yellow: 'Wheat',
  red:    'Brick',
  blue:   'Glass',
  brown:  'Wood',
  gray:   'Stone'
}

// ===== Building Config (only metadata/icons) =====
// Actual pattern validation uses gameLogic.buildings definitions
export const buildingConfig = {
  Cottage: { icon: '/assets/cottage.png' },
  Farm:    { icon: '/assets/farm.png' },
  Chapel:  { icon: '/assets/chapel.png' },
  Tavern:  { icon: '/assets/tavern.png' },
  Well:    { icon: '/assets/well.png' },
  Theater: { icon: '/assets/theater.png' },
  Factory: { icon: '/assets/factory.png' },
  Catedral:{ icon: '/assets/caterina.png' }
}

// ===== Zustand Store =====
export const useTownStore = create((set, get) => ({
  grid: Array(16).fill(null),
  resourceDeck: allColors.slice(0,3).map((color,i)=>({ id:`${color}-${i}`, color, name: colorToResource[color] })),
  selectedResourceId: null,
  selectedGridIndices: [],
  selectedBuilding: null,
  patternIndices: [],
  mode: 'normal',
  buildingError: null,

  resetGrid: () => set({
    grid: Array(16).fill(null),
    selectedResourceId: null,
    selectedGridIndices: [],
    selectedBuilding: null,
    patternIndices: [],
    mode: 'normal',
    buildingError: null
  }),

  selectResourceCard: id => set(state => ({
    selectedResourceId: state.selectedResourceId === id ? null : id,
    selectedGridIndices: []
  })),

  refreshCard: id => set(state => ({
    resourceDeck: state.resourceDeck.map(card => {
      if (card.id !== id) return card
      const newColor = allColors[Math.floor(Math.random() * allColors.length)]
      return { id: card.id, color: newColor, name: colorToResource[newColor] }
    }),
    selectedResourceId: null
  })),

  placeResource: index => set(() => {
    const { selectedResourceId, resourceDeck, grid } = get()
    if (!selectedResourceId || grid[index] != null) return {}
    const card = resourceDeck.find(c => c.id === selectedResourceId)
    const newGrid = [...grid]; newGrid[index] = card.name
    const newDeck = resourceDeck.map(c => {
      if (c.id !== selectedResourceId) return c
      const newColor = allColors[Math.floor(Math.random() * allColors.length)]
      return { id: c.id, color: newColor, name: colorToResource[newColor] }
    })
    return { grid: newGrid, resourceDeck: newDeck, selectedResourceId: null }
  }),

  toggleGridSelection: idx => set(state => {
    console.log('[store.toggleGridSelection] clicked cell:', idx, 'before:', state.selectedGridIndices)
    const { grid, selectedBuilding, selectedGridIndices } = state
    if (!grid[idx]) return {}
    const maxLen = buildingConfig[selectedBuilding]?.length || Infinity
    const already = selectedGridIndices.includes(idx)
    if (!already && selectedGridIndices.length >= maxLen) return {}
    const newSelection = already
      ? selectedGridIndices.filter(i => i !== idx)
      : [...selectedGridIndices, idx]
    console.log('[store.toggleGridSelection] selectedGridIndices:', newSelection)
    return { selectedGridIndices: newSelection }
  }),

  selectBuilding: name => {
    // Grab current selections before clearing
    const { selectedGridIndices, grid } = get()
    console.log('[store.selectBuilding] clicked:', name, 'selection:', selectedGridIndices)
    // Validate user selection against building patterns
    if (!selectedGridIndices.length) {
      return set({ buildingError: 'Select squares first.' })
    }
    const { matched, cellsToClear } = validateBuildingSelection(
      grid,
      selectedGridIndices,
      name,
      4
    )
    if (!matched) {
      return set({ buildingError: `Invalid ${name} pattern.` })
    }
    // Valid pattern: set building mode and patternIndices
    return set({
      selectedBuilding: name,
      buildingError: null,
      mode: 'placingBuilding',
      patternIndices: cellsToClear
    })
  },

  placeBuildingAt: idx => set(state => {
    console.log('[store.placeBuildingAt] at index:', idx, 'patternIndices:', state.patternIndices)
    const { patternIndices, selectedBuilding, grid } = get()
    if (!patternIndices.includes(idx) || !selectedBuilding) return {}

    // 1) Apply the building and clear out tiles
    const newGrid = [...grid]
    newGrid[idx] = selectedBuilding
    patternIndices.forEach(i => {
      if (i !== idx) newGrid[i] = null
    })

    // 2) Recompute score
    const newScore = calculateScore(newGrid)

    // 3) Reset everything, including selectedGridIndices
    return {
      grid: newGrid,
      score: newScore,
      selectedBuilding: null,
      patternIndices: [],
      selectedGridIndices: [],   // ← clear the old selections here
      mode: 'normal'
    }
  }),

  resetGrid: () => {
    const emptyGrid = Array(16).fill(null)
    return {
      grid: emptyGrid,
      score: 0,
      /* …other resets… */
    }
  }
}))
