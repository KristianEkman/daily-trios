import { Injectable, inject } from '@angular/core';
import { Database, ref, get, set } from '@angular/fire/database';

export type ToplistEntry = { user: string; time: number };

@Injectable({ providedIn: 'root' })
export class GameDataService {
  private db = inject(Database);
  private username = localStorage.getItem('set-user-name') ?? 'Guest';

  /** Save a user's result for a given gameId if it doesn't already exist */
  async storeResult(gameId: string, seconds: number, gameType: string): Promise<void> {
    const path = `${gameId}/${gameType}/${this.username}`;
    const dbRef = ref(this.db, path);

    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      // Already stored; skip
      return;
    }
    await set(dbRef, { time: seconds });
  }

  /** Fetch toplist for a gameId, sorted by time (ascending) and limited */
  async getTopList(gameId: string, gameType: string, limit = 10): Promise<ToplistEntry[]> {
    if (gameId === '') {
      throw new Error('getTopList called with empty gameId');
    }
    const pathRef = ref(this.db, `${gameId}/${gameType}`);
    const snapshot = await get(pathRef);

    if (!snapshot.exists()) return [];

    const results: ToplistEntry[] = [];
    snapshot.forEach((child) => {
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

  setUserName() {
    let name = localStorage.getItem('set-user-name');

    if (!name) {
      name = prompt('What is your name?');
      if (name) {
        localStorage.setItem('set-user-name', name);
      } else {
        name = 'Guest';
      }
    }
    this.username = name;
  }

  changeUserName() {
    let name = prompt('What is your name?');
    if (name) {
      localStorage.setItem('set-user-name', name);
    } else {
      name = 'Guest';
    }
    this.username = name;
  }
}
