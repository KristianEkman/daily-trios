import { Injectable, inject } from '@angular/core';
import { Database, ref, get, set } from '@angular/fire/database';

export type ToplistEntry = { user: string; time: number };

@Injectable({ providedIn: 'root' })
export class GameDataService {
  private db = inject(Database);

  /** Save a user's result for a given gameId if it doesn't already exist */
  async storeResult(user: string, gameId: string, seconds: number): Promise<void> {
    const path = `${gameId}/${user}`;
    const dbRef = ref(this.db, path);

    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      // Already stored; skip
      return;
    }
    await set(dbRef, { time: seconds });
  }

  /** Fetch toplist for a gameId, sorted by time (ascending) and limited */
  async getTopList(gameId: string, limit = 10): Promise<ToplistEntry[]> {
    const pathRef = ref(this.db, gameId);
    const snapshot = await get(pathRef);

    if (!snapshot.exists()) return [];

    const results: ToplistEntry[] = [];
    snapshot.forEach(child => {
      const user = child.key!;
      const time = child.val().time;
      results.push({ user, time });
    });

    return results.sort((a, b) => a.time - b.time).slice(0, limit);
  }

  /** User name helpers (localStorage) */
  getUserName(): string | null {
    return localStorage.getItem('set-user-name');
  }

  setUserName(name: string) {
    localStorage.setItem('set-user-name', name);
  }
}
