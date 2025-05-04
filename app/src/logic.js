// src/logic.js
/**
 * @param {Array<string|null>} boardState  16-slot array of resources
 * @param {"X"|"O"|null}      winner
 * @param {string}            idToken  Firebase ID token
 * @returns {Promise<{success: boolean, gameId: string}>}
 */
export async function saveGame(boardState, winner, idToken) {
  const res = await fetch("http://localhost:3000/save-game", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({
      boardState,
      score: winner === "X" ? 1 : 0, // or however you derive score
      startTime: new Date().toISOString(),  
      endTime:   new Date().toISOString(),
      metadata: {}  
    })
  });
  return res.json();
}

/**
 * @param {string} achievementId  e.g. "perfectTown"
 * @param {string} viaGame        gameId returned from saveGame
 * @param {string} idToken
 */
export async function unlockAchievement(achievementId, viaGame, idToken) {
  const res = await fetch("http://localhost:3000/unlock-achievement", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({ achievementId, viaGame })
  });
  return res.json();
}

/** Fetch the catalog of all achievements */
// before: export function fetchDefinitions() { … }

export async function fetchDefinitions() {
  const res = await fetch('/api/achievement-definitions');
  if (!res.ok) throw new Error(`Fetch definitions failed: ${res.status}`);
  return res.json();
}

/**
 * Fetch the badges this user has unlocked
 * @param {string} idToken Firebase ID token
 */
export async function fetchUserAchievements(token) {
  const res = await fetch('/api/user-achievements', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Fetch user achievements failed: ${res.status}`);
  return res.json();
}
