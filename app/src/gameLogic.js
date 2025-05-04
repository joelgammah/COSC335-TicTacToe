// src/gameLogic.js

// Mapping from CSS color class to resource name (must match your Zustand grid values)
export const colorToResource = {
    yellow: 'Wheat',
    red:    'Brick',
    blue:   'Glass',
    brown:  'Wood',
    gray:   'Stone',
  };
  
  // Reverse lookup: resource name to CSS color class
  export const resourceToColor = Object.fromEntries(
    Object.entries(colorToResource).map(([color, name]) => [name, color])
  );
  
  // Definitions of all buildings and their base patterns
  export const buildings = {
    Cottage: {
      icon: 'cottage_ic.png',
      // 2x2 shape: top-right, bottom-left, bottom-right
      basePatterns: [
        [
          { color: 'yellow', row: 0, col: 1 },
          { color: 'red',    row: 1, col: 0 },
          { color: 'blue',   row: 1, col: 1 }
        ]
      ]
    },
    Farm: {
      icon: 'farm_ic.png',
      basePatterns: [
        [
          { color: 'yellow', row: 0, col: 0 },
          { color: 'yellow', row: 0, col: 1 },
          { color: 'brown',  row: 1, col: 0 },
          { color: 'brown',  row: 1, col: 1 }
        ]
      ]
    },
    // Add other building definitions as needed...
    Chapel: {
        icon: 'chapel_ic.png',
        basePatterns: [
          [
            { color: 'blue',  row: 0, col: 2 },
            { color: 'gray',  row: 1, col: 0 },
            { color: 'blue',  row: 1, col: 1 },
            { color: 'gray',  row: 1, col: 2 }
          ]
        ]
      },
      Tavern: {
        icon: 'tavern_ic.png',
        basePatterns: [
          [
            { color: 'red',  row: 0, col: 0 },
            { color: 'red',  row: 0, col: 1 },
            { color: 'blue', row: 0, col: 2 }
          ]
        ]
      },
      Well: {
        icon: 'well_ic.png',
        basePatterns: [
          [
            { color: 'brown', row: 0, col: 0 },
            { color: 'gray',  row: 0, col: 1 }
          ]
        ]
      },
      Theater: {
        icon: 'theater_ic.png',
        basePatterns: [
          [
            { color: 'gray',  row: 0, col: 1 },
            { color: 'brown', row: 1, col: 0 },
            { color: 'blue',  row: 1, col: 1 },
            { color: 'brown', row: 1, col: 2 }
          ]
        ]
      },
      Factory: {
        icon: 'factory_ic.png',
        basePatterns: [
          [
            { color: 'brown', row: 0, col: 0 },
            { color: 'red',   row: 1, col: 0 },
            { color: 'gray',  row: 1, col: 1 },
            { color: 'gray',  row: 1, col: 2 },
            { color: 'red',   row: 1, col: 3 }
          ]
        ]
      },
      Catedral: {
        icon: 'monu_ic.png',
        basePatterns: [
          [
            { color: 'yellow', row: 0, col: 1 },
            { color: 'gray',   row: 1, col: 0 },
            { color: 'blue',   row: 1, col: 1 }
          ]
        ]
      }
  };
  
  // Normalize a pattern so its top-left is at (0,0) and cells are sorted
  export function normalizePattern(pattern) {
    const minRow = Math.min(...pattern.map(p => p.row));
    const minCol = Math.min(...pattern.map(p => p.col));
    const shifted = pattern.map(p => ({
      color: p.color,
      row:   p.row - minRow,
      col:   p.col - minCol
    }));
    shifted.sort((a,b) => a.row === b.row ? a.col - b.col : a.row - b.row);
    return shifted;
  }
  
  // Rotate a pattern 90° clockwise: (row, col) → (col, -row)
  export function rotate90(pattern) {
      return pattern.map(({ color, row, col }) => {
        const newRow = col;
        const rawCol = -row;
        // convert -0 to +0
        const newCol = rawCol === 0 ? 0 : rawCol;
        return { color, row: newRow, col: newCol };
      });
    }
  
  // Flip a pattern horizontally: (row, col) → (row, -col)
  export function flipHorizontal(pattern) {
    return pattern.map(({ color, row, col }) => ({
      color,
      row,
      col: -col
    }));
  }
  
  // Generate all 8 orientations of a base pattern
  export function generateAllTransformations(base) {
    const results = [];
    const original = normalizePattern(base);
    results.push(original);
  
    // 3 successive rotations
    let r1 = normalizePattern(rotate90(original)); results.push(r1);
    let r2 = normalizePattern(rotate90(r1));       results.push(r2);
    let r3 = normalizePattern(rotate90(r2));       results.push(r3);
  
    // flipped horizontally
    const flipped = normalizePattern(flipHorizontal(original)); results.push(flipped);
    let fr1 = normalizePattern(rotate90(flipped)); results.push(fr1);
    let fr2 = normalizePattern(rotate90(fr1));    results.push(fr2);
    let fr3 = normalizePattern(rotate90(fr2));    results.push(fr3);
  
    return results;
  }
  
  // Compare two normalized patterns for exact match
  export function arraysMatchPositions(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (
        a[i].color !== b[i].color ||
        a[i].row   !== b[i].row   ||
        a[i].col   !== b[i].col
      ) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Validates whether the selected grid indices form a valid placement for the given building.
   * @param {Array<string|null>} grid          - flat array of resource names (length = rows*cols)
   * @param {number[]}             selectedIdx - array of flat indices selected by user
   * @param {string}               buildingName- key in `buildings` object
   * @param {number}               numCols     - number of columns in the grid (default = 4)
   * @returns {{matched: boolean, cellsToClear: number[]}}
   */
  export function validateBuildingSelection(
    grid,
    selectedIdx,
    buildingName,
    numCols = 4
  ) {
    const building = buildings[buildingName];
    if (!building) return { matched: false, cellsToClear: [] };
  
    // Map flat indices to { color, row, col }
    const squaresInfo = selectedIdx.map(idx => {
      const row = Math.floor(idx / numCols);
      const col = idx % numCols;
      const resource = grid[idx];
      const color = resourceToColor[resource];
      return { color, row, col };
    });
  
    const normPlayer = normalizePattern(squaresInfo);
  
    for (const basePattern of building.basePatterns) {
      const transforms = generateAllTransformations(basePattern);
      if (transforms.some(tf => arraysMatchPositions(normPlayer, tf))) {
        return { matched: true, cellsToClear: selectedIdx };
      }
    }
    return { matched: false, cellsToClear: [] };
  }


export function calculateScore(grid, factoryResources = {}) {
  const N = 4;
  let score = 0;

  // Count farms and cottages
  const farmCount    = grid.filter(c => c === 'Farm').length;
  const cottageCount = grid.filter(c => c === 'Cottage').length;

  // 1) Cottages: 3 pts each if fed (farm feeds 4 cottages)
  const fedCottages = Math.min(cottageCount, farmCount * 4);
  score += fedCottages * 3;

  // 2) Chapel: 1 pt for each fed cottage
  const chapelCount = grid.filter(c => c === 'Chapel').length;
  score += chapelCount * fedCottages;

  // 3) Tavern: group scoring
  const tavernCount = grid.filter(c => c === 'Tavern').length;
  const tavernTable = { 0: 0, 1: 2, 2: 5, 3: 9, 4: 14, 5: 20 };
  score += tavernTable[Math.min(tavernCount, 5)];

  // 4) Well: 1 pt for each adjacent cottage (fed or not)
  grid.forEach((c, i) => {
    if (c === 'Well') {
      const row = Math.floor(i / N), col = i % N;
      [ -1, +1, -N, +N ].forEach(d => {
        const j = i + d;
        if (
          j >= 0 &&
          j < grid.length &&
          Math.abs(Math.floor(j / N) - row) + Math.abs((j % N) - col) === 1 &&
          grid[j] === 'Cottage'
        ) {
          score += 1;
        }
      });
    }
  });

  // 5) Theater: 1 pt per unique building type in same row/col
  grid.forEach((c, i) => {
    if (c === 'Theater') {
      const row = Math.floor(i / N), col = i % N;
      const types = new Set();
      // same row
      for (let x = 0; x < N; x++) {
        const j = row * N + x;
        if (grid[j] && grid[j] !== 'Theater') types.add(grid[j]);
      }
      // same column
      for (let y = 0; y < N; y++) {
        const j = y * N + col;
        if (grid[j] && grid[j] !== 'Theater') types.add(grid[j]);
      }
      score += types.size;
    }
  });

  // 6) Cathedral of Caterina: 2 pts each
  const cathedralCount = grid.filter(c => c === 'Catedral').length;
  score += cathedralCount * 2;

  //  — Resource‐based scoring for Factories — might have to even remove it
  // Each cube stored is worth 0 point:
  Object.values(factoryResources).forEach(({ count = 1 }) => {
    score += 0
  });

  // 7) Empty squares penalty: -1 each, unless you have a Cathedral
  const emptyCount = grid.filter(c => c === null).length;
  if (cathedralCount === 0) {
    score -= emptyCount;
  }

  return score;
}

  