import { Injectable, OnDestroy, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  interval,
  map,
  distinctUntilChanged,
} from 'rxjs';
import {
  Database,
  ref,
  onValue,
  set,
  update,
  runTransaction,
  get,
  child,
  onDisconnect,
} from '@angular/fire/database';
import { serverTimestamp } from 'firebase/database';

/**
 * One‑on‑one Set game orchestration service using Firebase Realtime Database.
 *
 * Schema (under /Game/{gameId})
 * ├─ Id: string
 * ├─ Player1 { Name, LastGamePing, ClaimedCardsCount }
 * ├─ Player2 { Name, LastGamePing, ClaimedCardsCount }
 * ├─ DealtCards: number[] (host maintains)
 * └─ Claims {
 *      DealtCardsHash: string,
 *      Player1ServerTime?: number,
 *      Player2ServerTime?: number,
 *      // Additional coordination helpers written atomically by transactions:
 *      StartAt?: number,         // first SAY-MATCH time (server)
 *      Winner?: 'Player1'|'Player2'|null,
 *      ResolvedAt?: number,
 *      PenaltyApplied?: boolean  // 3s non-response rule (set by host only once)
 *    }
 *
 * Notes
 * - Only Player1 (host) mutates DealtCards.
 * - All race-sensitive writes are via runTransaction().
 * - Pings are written as serverTimestamp() every 2s. Offline after 5s.
 * - This service is UI-agnostic: expose Observables and imperative methods.
 */

export type PlayerRole = 'Player1' | 'Player2';

export interface PlayerState {
  Name: string;
  LastGamePing: number | null; // server epoch ms
  ClaimedCardsCount: number;
}

export interface ClaimState {
  DealtCardsHash: string | null;
  Player1ServerTime?: number | null;
  Player2ServerTime?: number | null;
  StartAt?: number | null;
  Winner?: PlayerRole | null;
  ResolvedAt?: number | null;
  PenaltyApplied?: boolean | null;
}

export interface GameState {
  Id: string;
  Player1?: PlayerState | null;
  Player2?: PlayerState | null;
  DealtCards: number[];
  Claims?: ClaimState | null;
}

@Injectable({ providedIn: 'root' })
export class MatchingGameService implements OnDestroy {
  private db = inject(Database);

  private gameId: string | null = null;
  private myRole: PlayerRole | null = null;

  private pingSub?: Subscription;
  private serverOffset$ = new BehaviorSubject<number>(0);

  private gameState$ = new BehaviorSubject<GameState | null>(null);
  private opponentOnline$ = new BehaviorSubject<boolean>(false);

  /** Public streams */
  readonly game$: Observable<GameState | null> = this.gameState$.asObservable();
  readonly opponentIsOnline$: Observable<boolean> = this.opponentOnline$
    .asObservable()
    .pipe(distinctUntilChanged());

  constructor() {
    // Track server time offset for accurate timeouts.
    const infoRef = ref(this.db, '/.info/serverTimeOffset');
    onValue(infoRef, (snap) => {
      const offset = (snap.val() ?? 0) as number;
      this.serverOffset$.next(offset);
    });
  }

  /**
   * Create or join a game. Allocates Player1/Player2 atomically.
   */
  async joinGame(
    gameId: string,
    name: string
  ): Promise<{ role: PlayerRole; state: GameState }> {
    const gameRef = ref(this.db, `Game/${gameId}`);

    // Allocate role atomically
    const role = await runTransaction(gameRef, (current) => {
      const now = Date.now();
      const base: any = current || { Id: gameId, DealtCards: [] };

      if (!base.Player1) {
        base.Player1 = { Name: name, LastGamePing: now, ClaimedCardsCount: 0 };
        return base;
      }
      if (base.Player1 && base.Player1.Name === name) {
        // rejoin as Player1
        return base;
      }
      if (!base.Player2) {
        base.Player2 = { Name: name, LastGamePing: now, ClaimedCardsCount: 0 };
        return base;
      }
      if (base.Player2 && base.Player2.Name === name) {
        // rejoin as Player2
        return base;
      }
      // No slot available
      return; // abort
    }).then((res) => {
      if (!res.committed)
        throw new Error('Game is full (2 players already joined).');
      const val = res.snapshot.val();
      const assigned: PlayerRole =
        val.Player2 && val.Player2.Name === name ? 'Player2' : 'Player1';
      return assigned;
    });

    this.gameId = gameId;
    this.myRole = role;

    // Begin listening to game state
    this.startGameListener(gameId);

    // Setup ping loop and onDisconnect cleanup
    this.startPinging();

    // onDisconnect: mark LastGamePing = null so the opponent can detect drop
    const myPingRef = ref(this.db, `Game/${gameId}/${role}/LastGamePing`);
    onDisconnect(myPingRef)
      .set(null)
      .catch(() => {
        /* ignore */
      });

    const snap = await get(gameRef);
    const state = (snap.val() || { Id: gameId, DealtCards: [] }) as GameState;
    return { role, state };
  }

  /** Host-only: set the table (dealt cards). */
  async hostSetDealtCards(dealt: number[]): Promise<void> {
    this.ensureHost();
    const gameRef = ref(this.db, `Game/${this.requireGameId()}`);
    await update(gameRef, { DealtCards: dealt });
  }

  /** Host-only: replace claimed cards with new ones. Keep indexes stable. */
  async hostReplaceClaimedCards(
    toRemoveIds: number[],
    replaceWith: number[]
  ): Promise<void> {
    this.ensureHost();
    const gid = this.requireGameId();

    await runTransaction(ref(this.db, `Game/${gid}`), (g: any) => {
      if (!g || !Array.isArray(g.DealtCards)) return g;
      const current: number[] = g.DealtCards.slice();
      // Remove requested IDs (first occurrence each)
      toRemoveIds.forEach((id) => {
        const idx = current.indexOf(id);
        if (idx >= 0) current.splice(idx, 1);
      });
      // Append replacements
      current.push(...replaceWith);
      g.DealtCards = current;
      return g;
    });
  }

  /** SAY MATCH: records your server time for the current table atomically. */
  async sayMatch(): Promise<void> {
    const gid = this.requireGameId();
    const role = this.requireRole();

    // Read current dealt to compute hash (stable)
    const dealtSnap = await get(ref(this.db, `Game/${gid}/DealtCards`));
    const dealt: number[] = dealtSnap.val() || [];
    const hash = this.hashDealt(dealt);

    const claimsRef = ref(this.db, `Game/${gid}/Claims`);
    await runTransaction(claimsRef, (c: any) => {
      const now = serverTimestamp();
      c = c || {};
      if (!c.DealtCardsHash) {
        // First claim in this round: set hash + start time
        c.DealtCardsHash = hash;
        c.StartAt = now as any;
      }
      if (c.DealtCardsHash !== hash) {
        // Table changed: abort claim (client should re-try if still relevant)
        return; // abort transaction
      }
      const timeKey =
        role === 'Player1' ? 'Player1ServerTime' : 'Player2ServerTime';
      if (!c[timeKey]) {
        c[timeKey] = now as any;
      }
      return c;
    }).then((res) => {
      if (!res.committed)
        throw new Error(
          'Claim rejected (table changed or race). Please try again.'
        );
    });

    // Attempt resolution (both clients may race; guarded by transaction)
    await this.tryResolveClaim();
  }

  /** Host evaluates 3s non-response rule once (applies penalty exactly once). */
  async hostCheckNonResponsePenalty(): Promise<void> {
    this.ensureHost();
    const gid = this.requireGameId();
    const game = (await get(ref(this.db, `Game/${gid}`))).val();
    if (!game?.Claims?.StartAt || game?.Claims?.PenaltyApplied) return;

    // Use server time via offset
    const nowServer = Date.now() + this.serverOffset$.value;
    const startAt = game.Claims.StartAt as number; // already resolved from serverTimestamp

    if (nowServer < startAt + 3000) return; // not yet due

    const p1 = !!game.Claims.Player1ServerTime;
    const p2 = !!game.Claims.Player2ServerTime;

    if (p1 && p2) return; // both responded

    // Apply penalty to the non-responder (decrement ClaimedCardsCount >= 0)
    const loser: PlayerRole = p1 ? 'Player2' : 'Player1';

    await runTransaction(ref(this.db, `Game/${gid}`), (g: any) => {
      if (!g?.Claims || g.Claims.PenaltyApplied) return g;
      const key = loser;
      if (!g[key]) return g;
      g[key].ClaimedCardsCount = Math.max(
        0,
        (g[key].ClaimedCardsCount || 0) - 1
      );
      g.Claims.PenaltyApplied = true;
      return g;
    });
  }

  /** Host resolves winner when both timestamps exist, sets Winner & ResolvedAt once. */
  async tryResolveClaim(): Promise<void> {
    const gid = this.requireGameId();
    const claimsRef = ref(this.db, `Game/${gid}/Claims`);

    await runTransaction(claimsRef, (c: any) => {
      if (!c || c.Winner) return c;
      const t1 = c?.Player1ServerTime;
      const t2 = c?.Player2ServerTime;
      if (!t1 || !t2) return c; // need both

      const winner: PlayerRole = t1 <= t2 ? 'Player1' : 'Player2';
      c.Winner = winner;
      c.ResolvedAt = serverTimestamp() as any;
      return c;
    });
  }

  /** Host applies win: increments winner count once; DOES NOT touch DealtCards. */
  async hostApplyWinnerAndClearClaim(): Promise<PlayerRole | null> {
    this.ensureHost();
    const gid = this.requireGameId();

    let winner: PlayerRole | null = null;
    await runTransaction(ref(this.db, `Game/${gid}`), (g: any) => {
      if (!g?.Claims?.Winner) return g;
      winner = g.Claims.Winner as PlayerRole;
      const key = winner!;
      if (g[key]) {
        g[key].ClaimedCardsCount = (g[key].ClaimedCardsCount || 0) + 1;
      }
      // Clear claim state for next round (keep hash for reference if desired)
      g.Claims = null;
      return g;
    });
    return winner;
  }

  /** Utility: compute stable DealtCards hash. */
  hashDealt(dealt: number[]): string {
    return [...dealt].sort((a, b) => a - b).join('-');
  }

  /**
   * Starts writing serverTimestamp pings every 2s and tracks opponent online state.
   */
  private startPinging(): void {
    if (!this.myRole || !this.gameId) return;
    const role = this.myRole;
    const gid = this.gameId;

    // Live game listener also computes online state
    const other: PlayerRole = role === 'Player1' ? 'Player2' : 'Player1';
    const otherPingRef = ref(this.db, `Game/${gid}/${other}/LastGamePing`);

    onValue(otherPingRef, (snap) => {
      const last = snap.val() as number | null;
      this.computeOpponentOnline(last);
    });

    // Write my ping every 2s as server time
    this.stopPinging();
    this.pingSub = interval(2000).subscribe(() => {
      const myPingRef = ref(this.db, `Game/${gid}/${role}/LastGamePing`);
      set(myPingRef, serverTimestamp()).catch(() => {
        /* ignore */
      });
    });
  }

  private stopPinging(): void {
    this.pingSub?.unsubscribe();
    this.pingSub = undefined;
  }

  private computeOpponentOnline(lastPing: number | null): void {
    if (!lastPing) {
      this.opponentOnline$.next(false);
      return;
    }
    const nowServer = Date.now() + this.serverOffset$.value;
    const online = nowServer - lastPing <= 5000;
    this.opponentOnline$.next(online);
  }

  private startGameListener(gameId: string): void {
    const gameRef = ref(this.db, `Game/${gameId}`);
    onValue(gameRef, (snap) => {
      const raw = snap.val();
      if (!raw) return;
      const state: GameState = {
        Id: raw.Id || gameId,
        Player1: raw.Player1 || null,
        Player2: raw.Player2 || null,
        DealtCards: raw.DealtCards || [],
        Claims: raw.Claims || null,
      };
      this.gameState$.next(state);

      // Host automation helpers: if claim in progress, check for penalty & resolution
      if (this.myRole === 'Player1' && state.Claims) {
        this.hostCheckNonResponsePenalty().catch(() => {
          /* noop */
        });
        this.tryResolveClaim().catch(() => {
          /* noop */
        });
      }
    });
  }

  /** Host-only guard */
  private ensureHost(): void {
    if (this.myRole !== 'Player1')
      throw new Error('Only Player1 (host) can perform this action.');
  }

  private requireGameId(): string {
    if (!this.gameId) throw new Error('No active game. Call joinGame() first.');
    return this.gameId;
  }

  private requireRole(): PlayerRole {
    if (!this.myRole) throw new Error('Role unknown. Call joinGame() first.');
    return this.myRole;
  }

  /** Update your display name (either player). */
  async setMyName(name: string): Promise<void> {
    const gid = this.requireGameId();
    const role = this.requireRole();
    await update(ref(this.db, `Game/${gid}/${role}`), { Name: name });
  }

  /** Clean claim node (debug/admin). */
  async clearClaim(): Promise<void> {
    const gid = this.requireGameId();
    await set(ref(this.db, `Game/${gid}/Claims`), null);
  }

  /** Reset scores (debug/admin). */
  async resetScores(): Promise<void> {
    const gid = this.requireGameId();
    await update(ref(this.db, `Game/${gid}`), {
      'Player1/ClaimedCardsCount': 0,
      'Player2/ClaimedCardsCount': 0,
    });
  }

  ngOnDestroy(): void {
    this.stopPinging();
  }
}

/**
 * Suggested UI flow (high-level):
 * 1) await service.joinGame(gameId, myName) => shows role.
 * 2) Subscribe to service.game$ for live state.
 * 3) Call service.sayMatch() when user clicks "Match".
 * 4) Host listens for Claims.Winner:
 *    - service.hostApplyWinnerAndClearClaim()
 *    - then update dealt with service.hostReplaceClaimedCards([...wonIds], [...newIds])
 * 5) Display opponentIsOnline$ (5s timeout).
 */
