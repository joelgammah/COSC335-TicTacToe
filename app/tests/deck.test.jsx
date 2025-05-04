// tests/deck.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResourceDeck from '../src/ResourceDeck.jsx';
import BuildingDeck from '../src/BuildingDeck.jsx';
import { useTownStore, buildingConfig } from '../src/store.js';

// Helper to reset the store to initial state
function resetStore() {
  useTownStore.setState({
    resourceDeck: [
      { id: 'yellow-0', color: 'yellow', name: 'Wheat' },
      { id: 'red-1',    color: 'red',    name: 'Brick' },
      { id: 'blue-2',   color: 'blue',   name: 'Glass' }
    ],
    selectedResourceId: null,
    selectedBuilding: null,
    buildingError: null
  });
}

describe('ResourceDeck Component', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders all resource cards with names and icons', () => {
    render(<ResourceDeck />);
    expect(screen.getByText('Wheat')).toBeInTheDocument();
    expect(screen.getByText('Brick')).toBeInTheDocument();
    expect(screen.getByText('Glass')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('selects a resource card on click', () => {
    render(<ResourceDeck />);
    const wheatCard = screen.getByText('Wheat').closest('div[role="button"]');
    fireEvent.click(wheatCard);
    // selectedResourceId in store should update
    expect(useTownStore.getState().selectedResourceId).toBe('yellow-0');
    // the card should have the selected ring class
    expect(wheatCard).toHaveClass('ring-4');
  });

  it('shows and applies refresh when selected', () => {
    // override refreshCard with a mock
    const mockRefresh = vi.fn();
    useTownStore.setState({ refreshCard: mockRefresh });

    render(<ResourceDeck />);
    // select the second card (Brick)
    const brickCard = screen.getByText('Brick').closest('div[role="button"]');
    fireEvent.click(brickCard);
    const refreshBtn = screen.getByText('Refresh');
    expect(refreshBtn).toBeInTheDocument();
    // click the refresh button
    fireEvent.click(refreshBtn);
    expect(mockRefresh).toHaveBeenCalledWith('red-1');
  });
});

describe('BuildingDeck Component', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders all building buttons', () => {
    render(<BuildingDeck />);
    const keys = Object.keys(buildingConfig);
    keys.forEach(name => {
      expect(screen.getByAltText(name)).toBeInTheDocument();
    });
  });

    it('shows error when selecting a building without grid selection', () => {
    render(<BuildingDeck />);
    const btn = screen.getByAltText('Cottage').closest('button');
    fireEvent.click(btn);
    // without prior grid selection, buildingError is set
    expect(useTownStore.getState().buildingError).toBe('Select squares first.');
  });

  it('displays buildingError when present in store', () => {
    // set an error
    useTownStore.setState({ buildingError: 'Invalid pattern.' });
    render(<BuildingDeck />);
    expect(screen.getByText('Invalid pattern.')).toBeInTheDocument();
  });
});
