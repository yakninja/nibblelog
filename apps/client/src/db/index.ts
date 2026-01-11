import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import WebStorage from './web-storage';
import {
  CREATE_CATEGORIES_TABLE,
  CREATE_ACTIVITIES_TABLE,
  CREATE_DELTAS_TABLE,
  CREATE_SYNC_STATE_TABLE,
  CREATE_INDEXES,
} from './schema';

type DatabaseType = SQLite.SQLiteDatabase | WebStorage;

let db: DatabaseType | null = null;

export async function initDatabase(userId: string): Promise<DatabaseType> {
  if (db) return db;

  if (Platform.OS === 'web') {
    // Use IndexedDB for persistent storage on web
    db = new WebStorage();
    await (db as WebStorage).init();
    
    // Initialize sync state for this user if not exists
    const existingState = await db.getFirstAsync(
      'SELECT * FROM sync_state WHERE user_id = ?',
      [userId]
    );
    
    if (!existingState || existingState.last_server_seq === undefined) {
      await db.runAsync(
        'INSERT INTO sync_state (user_id, last_server_seq) VALUES (?, 0)',
        [userId]
      );
    }
    
    console.log('IndexedDB storage initialized');
  } else {
    // Use SQLite for native platforms
    db = await SQLite.openDatabaseAsync('nibblelog.db');

    // Create tables
    await db.execAsync(CREATE_CATEGORIES_TABLE);
    await db.execAsync(CREATE_ACTIVITIES_TABLE);
    await db.execAsync(CREATE_DELTAS_TABLE);
    await db.execAsync(CREATE_SYNC_STATE_TABLE);
    await db.execAsync(CREATE_INDEXES);

    // Initialize sync state for this user if not exists
    await db.runAsync(
      'INSERT OR IGNORE INTO sync_state (user_id, last_server_seq) VALUES (?, 0)',
      [userId]
    );

    console.log('SQLite database initialized');
  }

  return db;
}

export function getDatabase(): DatabaseType {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
