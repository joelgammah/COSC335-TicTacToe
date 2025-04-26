// src/compat-api.js
/**
 * Saves a finished game via Express backend using compat SDK
 */
export async function saveGame({ boardState, score, startTime, endTime, metadata = {} }) {
    const auth = window.firebaseAuth;
    if (!auth?.currentUser) throw new Error('User must be signed in');
    const token = await auth.currentUser.getIdToken(true);
  
    const res = await fetch('/save-game', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ boardState, score, startTime, endTime, metadata }),
    });
  
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Save failed: ${res.status}`);
    }
    return res.json();
  }
  
  /**
   * Unlocks an achievement via Express backend using compat SDK
   */
  export async function unlockAchievement(achievementId, viaGame) {
    const auth = window.firebaseAuth;
    if (!auth?.currentUser) throw new Error('User must be signed in');
    const token = await auth.currentUser.getIdToken(true);
  
    const res = await fetch('/unlock-achievement', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ achievementId, viaGame }),
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