// IndexedDB storage for web (persistent local database)

import type { Category, Activity, Delta, SyncState } from '../types';

const DB_NAME = 'nibblelog';
const DB_VERSION = 1;

class WebStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('categories')) {
          const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
          categoryStore.createIndex('user_id', 'user_id', { unique: false });
        }

        if (!db.objectStoreNames.contains('activities')) {
          const activityStore = db.createObjectStore('activities', { keyPath: 'id' });
          activityStore.createIndex('user_id', 'user_id', { unique: false });
          activityStore.createIndex('created_at', 'created_at', { unique: false });
        }

        if (!db.objectStoreNames.contains('deltas')) {
          const deltaStore = db.createObjectStore('deltas', { keyPath: 'id' });
          deltaStore.createIndex('user_id', 'user_id', { unique: false });
          deltaStore.createIndex('sent_at', 'sent_at', { unique: false });
        }

        if (!db.objectStoreNames.contains('sync_state')) {
          db.createObjectStore('sync_state', { keyPath: 'user_id' });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async runAsync(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowId: number }> {
    const sqlLower = sql.toLowerCase();

    // Handle INSERT
    if (sqlLower.includes('insert into categories')) {
      const [id, user_id, name, color, created_at, updated_at, deleted_at] = params || [];
      const store = this.getStore('categories', 'readwrite');
      await this.promisify(store.put({ id, user_id, name, color, created_at, updated_at, deleted_at }));
      return { changes: 1, lastInsertRowId: 0 };
    }

    if (sqlLower.includes('insert into activities')) {
      const [id, user_id, category_id, created_at, updated_at, lat, lng, app_version, description, amount, score, metadata, deleted_at] = params || [];
      const store = this.getStore('activities', 'readwrite');
      await this.promisify(store.put({ 
        id, user_id, category_id, created_at, updated_at, 
        lat, lng, app_version, description, amount, score, metadata, deleted_at 
      }));
      return { changes: 1, lastInsertRowId: 0 };
    }

    if (sqlLower.includes('insert into deltas')) {
      const [id, user_id, device_id, entity, entity_id, op, payload, ts, sent_at, server_seq] = params || [];
      const store = this.getStore('deltas', 'readwrite');
      await this.promisify(store.put({ id, user_id, device_id, entity, entity_id, op, payload, ts, sent_at, server_seq }));
      return { changes: 1, lastInsertRowId: 0 };
    }

    if (sqlLower.includes('insert') && sqlLower.includes('sync_state')) {
      const userId = params?.[0];
      if (userId) {
        const store = this.getStore('sync_state', 'readwrite');
        const existing = await this.promisify<SyncState>(store.get(userId));
        if (!existing) {
          await this.promisify(store.put({ user_id: userId, last_server_seq: 0 }));
        }
      }
      return { changes: 1, lastInsertRowId: 0 };
    }

    // Handle UPDATE
    if (sqlLower.includes('update categories')) {
      const store = this.getStore('categories', 'readwrite');
      const idIndex = params?.length ? params.length - 1 : -1;
      const id = params?.[idIndex];
      const category = await this.promisify<Category>(store.get(id));

      if (category) {
        if (sqlLower.includes('deleted_at')) {
          category.deleted_at = params?.[0];
          category.updated_at = params?.[1];
        } else {
          // Parse update from SQL
          const updates: any = this.parseUpdateFields(sql, params);
          Object.assign(category, updates);
        }
        await this.promisify(store.put(category));
      }
      return { changes: 1, lastInsertRowId: 0 };
    }

    if (sqlLower.includes('update activities')) {
      const store = this.getStore('activities', 'readwrite');
      const idIndex = params?.length ? params.length - 1 : -1;
      const id = params?.[idIndex];
      const activity = await this.promisify<Activity>(store.get(id));

      if (activity) {
        if (sqlLower.includes('deleted_at')) {
          activity.deleted_at = params?.[0];
          activity.updated_at = params?.[1];
        } else {
          const updates: any = this.parseUpdateFields(sql, params);
          Object.assign(activity, updates);
        }
        await this.promisify(store.put(activity));
      }
      return { changes: 1, lastInsertRowId: 0 };
    }

    if (sqlLower.includes('update deltas')) {
      const store = this.getStore('deltas', 'readwrite');
      const deltaIds = params?.slice(2) || [];
      
      for (const id of deltaIds) {
        const delta = await this.promisify<Delta>(store.get(id));
        if (delta) {
          delta.sent_at = params?.[0];
          delta.server_seq = params?.[1];
          await this.promisify(store.put(delta));
        }
      }
      return { changes: deltaIds.length, lastInsertRowId: 0 };
    }

    if (sqlLower.includes('update sync_state')) {
      const lastServerSeq = params?.[0];
      const userId = params?.[1];
      if (userId) {
        const store = this.getStore('sync_state', 'readwrite');
        await this.promisify(store.put({ user_id: userId, last_server_seq: lastServerSeq }));
      }
      return { changes: 1, lastInsertRowId: 0 };
    }

    return { changes: 0, lastInsertRowId: 0 };
  }

  async getAllAsync(sql: string, params?: any[]): Promise<any[]> {
    const sqlLower = sql.toLowerCase();

    if (sqlLower.includes('from categories')) {
      const store = this.getStore('categories');
      const all = await this.promisify<Category[]>(store.getAll());
      
      if (sqlLower.includes('where')) {
        const userId = params?.[0];
        return all.filter(c => c.user_id === userId && !c.deleted_at)
          .sort((a, b) => a.name.localeCompare(b.name));
      }
      return all;
    }

    if (sqlLower.includes('from activities')) {
      const store = this.getStore('activities');
      const all = await this.promisify<Activity[]>(store.getAll());
      
      if (sqlLower.includes('where')) {
        const userId = params?.[0];
        const limit = params?.[1] || 100;
        const filtered = all.filter(a => {
          // Check user_id and deleted_at
          // Ignore invalid deleted_at values (should be null or timestamp, not UUID strings)
          const isDeleted = a.deleted_at && typeof a.deleted_at === 'number';
          return a.user_id === userId && !isDeleted;
        });
        console.log(`getAllAsync activities: total=${all.length}, filtered=${filtered.length}, userId=${userId}`);
        return filtered
          .sort((a, b) => b.created_at - a.created_at)
          .slice(0, limit);
      }
      return all;
    }

    if (sqlLower.includes('from deltas')) {
      const store = this.getStore('deltas');
      const all = await this.promisify<Delta[]>(store.getAll());
      
      if (sqlLower.includes('is null')) {
        const userId = params?.[0];
        return all.filter(d => d.user_id === userId && !d.sent_at)
          .sort((a, b) => a.ts - b.ts);
      }
      return all;
    }

    if (sqlLower.includes('from sync_state')) {
      const userId = params?.[0];
      if (userId) {
        const store = this.getStore('sync_state');
        const state = await this.promisify<SyncState>(store.get(userId));
        return state ? [state] : [{ user_id: userId, last_server_seq: 0 }];
      }
      const store = this.getStore('sync_state');
      return await this.promisify<SyncState[]>(store.getAll());
    }

    return [];
  }

  async getFirstAsync(sql: string, params?: any[]): Promise<any | null> {
    const sqlLower = sql.toLowerCase();

    if (sqlLower.includes('from categories')) {
      const id = params?.[0];
      if (!id) {
        console.error('getFirstAsync: no ID provided for categories query', sql, params);
        return null;
      }
      const store = this.getStore('categories');
      const result = await this.promisify<Category>(store.get(id));
      return result || null;
    }

    if (sqlLower.includes('from activities')) {
      const id = params?.[0];
      if (!id) {
        console.error('getFirstAsync: no ID provided for activities query', sql, params);
        return null;
      }
      const store = this.getStore('activities');
      const result = await this.promisify<Activity>(store.get(id));
      return result || null;
    }

    if (sqlLower.includes('from sync_state')) {
      const userId = params?.[0];
      const store = this.getStore('sync_state');
      const result = await this.promisify<SyncState>(store.get(userId));
      return result || { user_id: userId, last_server_seq: 0 };
    }

    const results = await this.getAllAsync(sql, params);
    return results[0] || null;
  }

  async execAsync(sql: string): Promise<void> {
    // Table creation queries - IndexedDB schema is created in onupgradeneeded
    return;
  }

  async closeAsync(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private promisify<T = any>(request: IDBRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private parseUpdateFields(sql: string, params?: any[]): Record<string, any> {
    const updates: any = {};
    const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
    
    if (setMatch && params) {
      const sets = setMatch[1].split(',').map(s => s.trim());
      sets.forEach((set, idx) => {
        const field = set.split('=')[0].trim();
        updates[field] = params[idx];
      });
    }
    
    return updates;
  }
}

export default WebStorage;

