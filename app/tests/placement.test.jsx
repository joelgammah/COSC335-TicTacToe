// test/placement.test.jsx
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TinyTowns from '../src/TinyTowns.jsx';
// mock out logic fetches so UI effects don't fire
import { fetchDefinitions, fetchUserAchievements } from '../src/logic.js';
vi.mock('../src/logic.js', () => ({
  fetchDefinitions: vi.fn().mockResolvedValue([]),
  fetchUserAchievements: vi.fn().mockResolvedValue([])
}));
// import colorToResource to seed names correctly
import { colorToResource } from '../src/gameLogic.js';
import { useTownStore } from '../src/store.js';

// Helper to reset store between tests
function resetStore() {
  useTownStore.setState({
    grid: Array(16).fill(null),
    resourceDeck: ['yellow','red','blue','brown','gray']
      .slice(0,3)
      .map((color,i) => ({ id:`${color}-${i}`, color, name: colorToResource[color] })),
    selectedResourceId: null,
    selectedGridIndices: [],
    selectedBuilding: null,
    patternIndices: [],
    mode: 'normal',
    buildingError: null,
    factoryResources: {},
    score: 0
  });
}

describe('UI: Resource placement flow', () => {
  beforeEach(() => {
    resetStore();
  });

  it('allows selecting a resource and placing it on the grid', () => {
    let container;
    act(() => {
      ({ container } = render(<TinyTowns />));
    });

    // Click the first resource card (Wheat)
    const wheatCard = screen.getByAltText('Wheat').closest('div[role="button"]');
    act(() => {
      fireEvent.click(wheatCard);
    });
    expect(useTownStore.getState().selectedResourceId).toBe('yellow-0');

    // Click grid cell 0
    const gridContainer = container.querySelector('.grid-cols-4');
    const cell0 = gridContainer.children[0];
    act(() => {
      fireEvent.click(cell0);
    });

    // Assert store.grid[0] is 'Wheat'
    expect(useTownStore.getState().grid[0]).toBe('Wheat');
  });
});

describe('UI: Building placement flow', () => {
  beforeEach(() => {
    resetStore();
    // Pre-populate a valid Cottage pattern at indices [1,4,5]
    useTownStore.setState(state => {
      const g = Array(16).fill(null);
      g[1] = 'Wheat'; g[4] = 'Brick'; g[5] = 'Glass';
      return { grid: g };
    });
  });

  it('selects grid cells then places a Cottage', () => {
    let container;
    act(() => {
      ({ container } = render(<TinyTowns />));
    });

    // Click the three pattern cells
    const gridContainer = container.querySelector('.grid-cols-4');
    const cellDivs = gridContainer.children;
    act(() => {
      [1,4,5].forEach(idx => fireEvent.click(cellDivs[idx]));
    });
    expect(useTownStore.getState().selectedGridIndices.sort()).toEqual([1,4,5]);

    // Click the Cottage building button
    const cottageBtn = screen.getByAltText('Cottage').closest('button');
    act(() => {
      fireEvent.click(cottageBtn);
    });
    expect(useTownStore.getState().selectedBuilding).toBe('Cottage');
    expect(useTownStore.getState().mode).toBe('placingBuilding');

    // Click one of the highlighted cells (index 5)
    act(() => {
      fireEvent.click(cellDivs[5]);
    });

    // After placement: grid[5] === 'Cottage', grid[1] & grid[4] cleared
    const finalGrid = useTownStore.getState().grid;
    expect(finalGrid[5]).toBe('Cottage');
    expect(finalGrid[1]).toBeNull();
    expect(finalGrid[4]).toBeNull();

    // selectedBuilding and patternIndices should reset
    expect(useTownStore.getState().selectedBuilding).toBeNull();
    expect(useTownStore.getState().patternIndices).toEqual([]);

    // Score should update via calculateScore
    expect(useTownStore.getState().score).toBe(-15);
  });
});
