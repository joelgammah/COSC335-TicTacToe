// test/gameLogic.test.js
import {
    buildings,
    normalizePattern,
    generateAllTransformations,
    arraysMatchPositions,
    validateBuildingSelection
  } from '../src/gameLogic.js';
  
  describe('gameLogic utilities', () => {
    it('normalizePattern shifts to origin and sorts', () => {
      const pat = [
        { color: 'A', row: 2, col: 3 },
        { color: 'B', row: 2, col: 4 },
        { color: 'C', row: 3, col: 3 }
      ];
      const norm = normalizePattern(pat);
      expect(norm).toEqual([
        { color: 'A', row: 0, col: 0 },
        { color: 'B', row: 0, col: 1 },
        { color: 'C', row: 1, col: 0 }
      ]);
    });
  
    it('generateAllTransformations returns 8 orientations', () => {
      const base = buildings.Cottage.basePatterns[0];
      const all = generateAllTransformations(base);
      expect(all).toHaveLength(8);
      // None of them should be identical
      const uniq = new Set(all.map(a => JSON.stringify(a)));
      expect(uniq.size).toBe(8);
    });
  
    it('arraysMatchPositions correctly compares two patterns', () => {
      const a = [ { color:'X',row:0,col:0 }, { color:'Y',row:0,col:1 } ];
      const b = [ { color:'X',row:0,col:0 }, { color:'Y',row:0,col:1 } ];
      const c = [ { color:'Y',row:0,col:0 }, { color:'X',row:0,col:1 } ];
      expect(arraysMatchPositions(a, b)).toBe(true);
      expect(arraysMatchPositions(a, c)).toBe(false);
    });
  
    it('validateBuildingSelection matches a correct Cottage placement', () => {
      // Build a 2×2 grid flattened into 1D: rows=4, cols=4
      // Place Yellow at (0,1)=index1, Red at (1,0)=4, Blue at (1,1)=5
      const grid = Array(16).fill(null);
      grid[1] = 'Wheat'; // yellow
      grid[4] = 'Brick'; // red
      grid[5] = 'Glass'; // blue
      const selected = [1, 4, 5];
      const { matched, cellsToClear } = validateBuildingSelection(
        grid, selected, 'Cottage', 4
      );
      expect(matched).toBe(true);
      expect(cellsToClear).toEqual(selected);
    });
  
    it('validateBuildingSelection rejects a wrong shape', () => {
      const grid = Array(16).fill(null);
      grid[0] = 'Wheat';
      grid[1] = 'Brick';
      grid[2] = 'Glass';
      const { matched } = validateBuildingSelection(grid, [0,1,2], 'Cottage', 4);
      expect(matched).toBe(false);
    });
  });
  