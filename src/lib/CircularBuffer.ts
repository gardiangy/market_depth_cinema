import type { OrderbookSnapshot } from '../types';

/**
 * Circular buffer for storing orderbook snapshots in memory.
 * Capacity: 6000 snapshots (~100 minutes at 1000ms intervals)
 */
export class CircularBuffer {
  private buffer: OrderbookSnapshot[];
  private head: number = 0;
  private size: number = 0;
  private readonly capacity: number;

  constructor(capacity: number = 6000) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /**
   * Add a snapshot to the buffer
   * @param snapshot - Orderbook snapshot to add
   */
  push(snapshot: OrderbookSnapshot): void {
    this.buffer[this.head] = snapshot;
    this.head = (this.head + 1) % this.capacity;

    if (this.size < this.capacity) {
      this.size++;
    }
  }

  /**
   * Get all snapshots within a time range
   * @param startTime - Start timestamp (inclusive)
   * @param endTime - End timestamp (inclusive)
   * @returns Array of snapshots within the range, sorted by timestamp
   */
  getRange(startTime: number, endTime: number): OrderbookSnapshot[] {
    if (this.size === 0) {
      return [];
    }

    const result: OrderbookSnapshot[] = [];
    const startIndex = this.size < this.capacity ? 0 : this.head;

    for (let i = 0; i < this.size; i++) {
      const index = (startIndex + i) % this.capacity;
      const snapshot = this.buffer[index];

      if (snapshot && snapshot.timestamp >= startTime && snapshot.timestamp <= endTime) {
        result.push(snapshot);
      }
    }

    return result.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get the snapshot at or closest to a specific timestamp
   * @param timestamp - Target timestamp
   * @returns Snapshot closest to the timestamp, or null if buffer is empty
   */
  getAt(timestamp: number): OrderbookSnapshot | null {
    if (this.size === 0) {
      return null;
    }

    const startIndex = this.size < this.capacity ? 0 : this.head;
    let closestSnapshot: OrderbookSnapshot | null = null;
    let minDiff = Infinity;

    for (let i = 0; i < this.size; i++) {
      const index = (startIndex + i) % this.capacity;
      const snapshot = this.buffer[index];

      if (snapshot) {
        const diff = Math.abs(snapshot.timestamp - timestamp);
        if (diff < minDiff) {
          minDiff = diff;
          closestSnapshot = snapshot;
        }
      }
    }

    return closestSnapshot;
  }

  /**
   * Get the oldest snapshot in the buffer
   * @returns Oldest snapshot or null if buffer is empty
   */
  getOldest(): OrderbookSnapshot | null {
    if (this.size === 0) {
      return null;
    }

    const startIndex = this.size < this.capacity ? 0 : this.head;
    return this.buffer[startIndex] || null;
  }

  /**
   * Get the newest snapshot in the buffer
   * @returns Newest snapshot or null if buffer is empty
   */
  getNewest(): OrderbookSnapshot | null {
    if (this.size === 0) {
      return null;
    }

    const lastIndex = this.head === 0 ? this.capacity - 1 : this.head - 1;
    return this.buffer[lastIndex] || null;
  }

  /**
   * Get all snapshots in chronological order
   * @returns All snapshots sorted by timestamp
   */
  getAll(): OrderbookSnapshot[] {
    if (this.size === 0) {
      return [];
    }

    const result: OrderbookSnapshot[] = [];
    const startIndex = this.size < this.capacity ? 0 : this.head;

    for (let i = 0; i < this.size; i++) {
      const index = (startIndex + i) % this.capacity;
      if (this.buffer[index]) {
        result.push(this.buffer[index]);
      }
    }

    return result.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get the current number of snapshots in the buffer
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Get the buffer capacity
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Check if buffer is at capacity
   */
  isFull(): boolean {
    return this.size >= this.capacity;
  }

  /**
   * Clear all snapshots from the buffer
   */
  clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.size = 0;
  }

  /**
   * Get the time range covered by the buffer
   */
  getTimeRange(): { start: number; end: number } | null {
    const oldest = this.getOldest();
    const newest = this.getNewest();

    if (!oldest || !newest) {
      return null;
    }

    return {
      start: oldest.timestamp,
      end: newest.timestamp,
    };
  }

  /**
   * Get the N oldest snapshots without copying entire buffer
   * @param n - Number of snapshots to retrieve
   * @returns Array of oldest snapshots (up to n)
   */
  getOldestN(n: number): OrderbookSnapshot[] {
    if (this.size === 0 || n <= 0) {
      return [];
    }

    const count = Math.min(n, this.size);
    const result: OrderbookSnapshot[] = [];
    const startIndex = this.size < this.capacity ? 0 : this.head;

    for (let i = 0; i < count; i++) {
      const index = (startIndex + i) % this.capacity;
      if (this.buffer[index]) {
        result.push(this.buffer[index]);
      }
    }

    return result;
  }

  /**
   * Remove the N oldest snapshots from the buffer
   * @param n - Number of snapshots to remove
   */
  removeOldestN(n: number): void {
    if (this.size === 0 || n <= 0) {
      return;
    }

    const count = Math.min(n, this.size);

    if (this.size < this.capacity) {
      // Buffer not full yet - shift elements
      for (let i = 0; i < this.size - count; i++) {
        this.buffer[i] = this.buffer[i + count];
      }
      // Clear removed slots
      for (let i = this.size - count; i < this.size; i++) {
        this.buffer[i] = undefined as unknown as OrderbookSnapshot;
      }
      this.size -= count;
      // head stays at size position since we're not at capacity
      this.head = this.size;
    } else {
      // Buffer is full - just advance the logical start
      // The old slots will be overwritten naturally
      this.size -= count;
      // Move head forward past the removed elements
      this.head = (this.head + count) % this.capacity;
    }
  }
}
