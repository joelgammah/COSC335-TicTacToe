// src/compat-api.js
import { useTownStore } from './store.js';

/**
 * Saves (or updates) a game session via Express backend.
 * Uses Firebase auto‑IDs (gameId) for upserts.
 */
export async function saveGame({ boardState, score, startTime, endTime, metadata = {} }) {
  const auth = window.firebaseAuth;
  if (!auth?.currentUser) throw new Error('User must be signed in');
  const token  = await auth.currentUser.getIdToken(true);
  const gameId = useTownStore.getState().gameId;               // ← grab gameId, not sessionId

  const res = await fetch('/save-game', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ gameId, boardState, score, startTime, endTime, metadata }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Save failed: ${res.status}`);
  }

  const json = await res.json();
  if (json.gameId) {
    // store the Firestore document ID so next save will upsert
    useTownStore.getState().setGameId(json.gameId);
  }
  return json;
}

/**
 * Unlocks an achievement via Express backend.
 * Includes gameId for consistency with that session.
 */
export async function unlockAchievement(achievementId) {
  const auth = window.firebaseAuth;
  if (!auth?.currentUser) throw new Error('User must be signed in');
  const token  = await auth.currentUser.getIdToken(true);
  const gameId = useTownStore.getState().gameId;               // ← use gameId

  const res = await fetch('/unlock-achievement', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ gameId, achievementId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Unlock failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Upsert the current user’s profile in Firestore via Express
 */
export async function createUser({ displayName, email }) {
  const auth = window.firebaseAuth;
  if (!auth?.currentUser) throw new Error('User must be signed in');
  const token = await auth.currentUser.getIdToken(true);

  const res = await fetch('/create-user', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ displayName, email }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create user failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetches the current user’s saved games.
 */

export async function fetchUserGames() {
  const auth = window.firebaseAuth;
  if (!auth?.currentUser) throw new Error('User must be signed in');
  const token = await auth.currentUser.getIdToken(true);

  const res = await fetch('/Games', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Fetch games failed: ${res.status}`);
  }
  return res.json(); // array of game docs with { id, ...data }
}

/**
 * Fetch all games (most recent first)
 */
export async function fetchGames() {
  const auth = window.firebaseAuth;
  if (!auth?.currentUser) throw new Error('User must be signed in');
  const token = await auth.currentUser.getIdToken(true);

  const res = await fetch('/Games', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json(); // array, ordered by endTime desc
}

/**
 * GET /leaderboard → [{ userId, displayName, totalScore }, …]
 */
export async function fetchLeaderboard() {
  const auth = window.firebaseAuth;
  if (!auth?.currentUser) throw new Error('User must be signed in');
  const token = await auth.currentUser.getIdToken(true);

  const res = await fetch('/api/leaderboard', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`);
  return res.json();
}



