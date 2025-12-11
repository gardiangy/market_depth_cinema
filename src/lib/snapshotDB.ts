import { openDB, type IDBPDatabase } from 'idb';
import type { OrderbookSnapshot } from '../types';

const DB_NAME = 'market-depth-cinema';
const STORE_NAME = 'snapshots';
const DB_VERSION = 1;

export interface SnapshotDB {
  db: IDBPDatabase;
  addSnapshot: (snapshot: OrderbookSnapshot) => Promise<void>;
  addSnapshots: (snapshots: OrderbookSnapshot[]) => Promise<void>;
  getSnapshotsInRange: (start: number, end: number) => Promise<OrderbookSnapshot[]>;
  getSnapshotAt: (timestamp: number) => Promise<OrderbookSnapshot | null>;
  deleteOldest: (count: number) => Promise<void>;
  clearAll: () => Promise<void>;
  getCount: () => Promise<number>;
  getOldestTimestamp: () => Promise<number | null>;
  getNewestTimestamp: () => Promise<number | null>;
}

/**
 * Initialize IndexedDB for snapshot persistence
 */
export async function initSnapshotDB(): Promise<SnapshotDB> {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'timestamp' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    },
  });

  return {
    db,

    async addSnapshot(snapshot: OrderbookSnapshot): Promise<void> {
      await db.put(STORE_NAME, snapshot);
    },

    async addSnapshots(snapshots: OrderbookSnapshot[]): Promise<void> {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      await Promise.all([
        ...snapshots.map((snapshot) => tx.store.put(snapshot)),
        tx.done,
      ]);
    },

    async getSnapshotsInRange(start: number, end: number): Promise<OrderbookSnapshot[]> {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const index = tx.store.index('timestamp');
      const range = IDBKeyRange.bound(start, end);
      const snapshots = await index.getAll(range);
      return snapshots.sort((a, b) => a.timestamp - b.timestamp);
    },

    async getSnapshotAt(timestamp: number): Promise<OrderbookSnapshot | null> {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const index = tx.store.index('timestamp');

      // Try to get exact match first
      const exact = await index.get(timestamp);
      if (exact) {
        return exact;
      }

      // Find closest snapshot
      const all = await index.getAll();
      if (all.length === 0) {
        return null;
      }

      let closest = all[0];
      let minDiff = Math.abs(all[0].timestamp - timestamp);

      for (const snapshot of all) {
        const diff = Math.abs(snapshot.timestamp - timestamp);
        if (diff < minDiff) {
          minDiff = diff;
          closest = snapshot;
        }
      }

      return closest;
    },

    async deleteOldest(count: number): Promise<void> {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const index = tx.store.index('timestamp');
      const snapshots = await index.getAll();

      snapshots.sort((a, b) => a.timestamp - b.timestamp);

      const toDelete = snapshots.slice(0, count);
      await Promise.all([
        ...toDelete.map((snapshot) => tx.store.delete(snapshot.timestamp)),
        tx.done,
      ]);
    },

    async clearAll(): Promise<void> {
      await db.clear(STORE_NAME);
    },

    async getCount(): Promise<number> {
      return db.count(STORE_NAME);
    },

    async getOldestTimestamp(): Promise<number | null> {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const index = tx.store.index('timestamp');
      const cursor = await index.openCursor();

      return cursor ? cursor.key as number : null;
    },

    async getNewestTimestamp(): Promise<number | null> {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const index = tx.store.index('timestamp');
      const cursor = await index.openCursor(null, 'prev');

      return cursor ? cursor.key as number : null;
    },
  };
}
