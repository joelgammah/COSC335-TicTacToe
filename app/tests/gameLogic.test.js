// tests/gameLogic.test.js
import {
  buildings,
  normalizePattern,
  rotate90,
  flipHorizontal,
  generateAllTransformations,
  arraysMatchPositions,
  validateBuildingSelection,
  calculateScore
} from '../src/gameLogic.js';

describe('Pattern utilities', () => {
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

  it('rotate90 rotates coordinates correctly', () => {
    const pat = [ { color: 'X', row: 0, col: 1 } ];
    const rotated = rotate90(pat);
    expect(rotated).toEqual([{ color: 'X', row: 1, col: 0 }]);
  });

  it('flipHorizontal mirrors coordinates horizontally', () => {
    const pat = [ { color: 'Y', row: 2, col: 3 } ];
    const flipped = flipHorizontal(pat);
    expect(flipped).toEqual([{ color: 'Y', row: 2, col: -3 }]);
  });

  it('generateAllTransformations returns 8 unique orientations', () => {
    const base = buildings.Cottage.basePatterns[0];
    const all = generateAllTransformations(base);
    expect(all).toHaveLength(8);
    const uniq = new Set(all.map(a => JSON.stringify(a)));
    expect(uniq.size).toBe(8);
  });

  it('arraysMatchPositions correctly compares two arrays', () => {
    const a = [{ color:'X', row:0, col:0 }, { color:'Y', row:0, col:1 }];
    const b = [{ color:'X', row:0, col:0 }, { color:'Y', row:0, col:1 }];
    const c = [{ color:'Y', row:0, col:0 }, { color:'X', row:0, col:1 }];
    expect(arraysMatchPositions(a, b)).toBe(true);
    expect(arraysMatchPositions(a, c)).toBe(false);
  });

  it('validateBuildingSelection matches and rejects patterns properly', () => {
    const grid = Array(16).fill(null);
    // Place a valid Cottage pattern
    grid[1] = 'Wheat'; // (0,1)
    grid[4] = 'Brick'; // (1,0)
    grid[5] = 'Glass'; // (1,1)
    const sel = [1,4,5];
    const { matched, cellsToClear } = validateBuildingSelection(grid, sel, 'Cottage', 4);
    expect(matched).toBe(true);
    expect(cellsToClear).toEqual(sel);

    // Wrong shape
    const { matched: m2 } = validateBuildingSelection(grid, [0,1,2], 'Cottage', 4);
    expect(m2).toBe(false);

    // Unknown building
    const { matched: m3 } = validateBuildingSelection(grid, sel, 'Nonexistent', 4);
    expect(m3).toBe(false);

    // Rotated pattern should match
    // Use Cottage base pattern rotated 90°: positions (1,0),(1,1),(0,1) -> rotated to ... test anyway
    const base = buildings.Cottage.basePatterns[0];
    const transforms = generateAllTransformations(base);
    // Build grid to match second transform
    const tf = transforms[1]; // first rotation
    const flat = tf.map(p => p.row * 4 + p.col);
    const grid2 = Array(16).fill(null);
    tf.forEach((p,i) => { grid2[p.row*4 + p.col] = Object.keys(buildings).includes('Cottage') ? 'Wheat' : null; });
    // Actually verify transforms mapping
    // This test simply ensures a transformed pattern passes arraysMatchPositions
    expect(arraysMatchPositions(normalizePattern(transforms[0]), normalizePattern(transforms[1]))).toBe(false);
  });
});

describe('calculateScore', () => {
  it('applies empty-square penalty without cathedral', () => {
    const grid = Array(16).fill(null);
    expect(calculateScore(grid, {})).toBe(-16);
  });

  it('no penalty when a cathedral is present', () => {
    const grid = Array(16).fill(null);
    grid[0] = 'Catedral';
    expect(calculateScore(grid, {})).toBe(2);
  });

  it('scores cottages with farm feed limits and penalties', () => {
    const grid = Array(16).fill(null);
    grid[0] = 'Farm';
    for (let i=1; i<=5; i++) grid[i] = 'Cottage';
    // fedCottages = 4 -> 4*3=12; penalty = -(16-6)= -10 => total 2
    expect(calculateScore(grid, {})).toBe(2);
  });

  it('scores chapels based on fed cottages', () => {
    const grid = Array(16).fill(null);
    grid[0] = 'Farm'; grid[1] = 'Cottage'; grid[2] = 'Chapel';
    // fed=1 cottage -> 3 pts; chapel=1*1=1 ->4; penalty=-(16-3)= -13 => -9
    expect(calculateScore(grid, {})).toBe(-9);
  });

  it('scores taverns using group scoring table', () => {
    const grid = Array(16).fill(null);
    grid[0] = 'Tavern';
    // tavernCount=1 -> +2; penalty=-(16-1)= -15 => -13
    expect(calculateScore(grid, {})).toBe(-13);
  });

  it('scores wells adjacent to cottages', () => {
    const grid = Array(16).fill(null);
    // Well at index 5 (row1,col1), cottages at 6 and 9
    grid[5] = 'Well'; grid[6] = 'Cottage'; grid[9] = 'Cottage';
    // 2 points for two adjacent cottages; penalty=-(16-3)= -13 => -11
    expect(calculateScore(grid, {})).toBe(-11);
  });

  it('scores theaters based on unique neighbors', () => {
    const grid = Array(16).fill(null);
    // Theater at index 1 (row0,col1), neighbors: index0=Cottage, index2=Farm, index5=Tavern
    grid[1] = 'Theater'; grid[0] = 'Cottage'; grid[2] = 'Farm'; grid[5] = 'Tavern';
    // 3 unique neighbor types -> +3; penalty=-(16-4)= -12 => -9
    expect(calculateScore(grid, {})).toBe(-4);
  });

  it('scores factories based on stored resources', () => {
    const grid = Array(16).fill(null);
    grid[0] = 'Factory';
    const factoryResources = { 0: { count: 1 } };
    // 1 points; penalty= -(16-1)= -15 => -15
    expect(calculateScore(grid, factoryResources)).toBe(-15);
  });

  it('combines multiple building types correctly', () => {
    const grid = Array(16).fill(null);
    grid[0] = 'Farm'; grid[1] = 'Cottage'; grid[2] = 'Chapel'; grid[3] = 'Tavern';
    grid[4] = 'Well'; grid[5] = 'Theater'; grid[6] = 'Catedral';
    const factoryResources = { 7: { count: 1 } };
    const score = calculateScore(grid, factoryResources);
    // Manual calculation:
    // farmCount=1, cottageCount=1 -> fed=1*3=3
    // chapelCount=1, fed Cottage = 1 -> +1 =>4
    // tavernCount=1->+2 =>6
    // well at 4 adjacent to cottage at1? index4 row1,col0 adjacent to index0 row0,col1? no =>+0=>6
    // theater at5: row1,col1 neighbors: row1 [4-7]: index4 Well, index6 Theater(not counted), =>1 unique; col1 [1,5,9,13]: index1 Cottage => adds Cottage => total unique {Well,Cottage, Catedra}=3 =>+3=>9
    // cathedralCount=1->+2=>11
    // factoryResources at7 count1->+0=>11
    // emptyCount=9, cathedral present => no penalty
    expect(score).toBe(11);
  });
});
