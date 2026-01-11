import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './index';
import { Category, Activity, Delta } from '../types';

// ============== Categories ==============

export async function createCategory(
  userId: string,
  name: string,
  color: string | null,
  deviceId: string
): Promise<Category> {
  const db = getDatabase();
  const now = Date.now();
  const id = uuidv4();

  const category: Category = {
    id,
    user_id: userId,
    name,
    color,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  await db.runAsync(
    'INSERT INTO categories (id, user_id, name, color, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, userId, name, color, now, now, null]
  );

  // Create delta
  await createDelta(userId, deviceId, 'category', id, 'upsert', category);

  // Auto-sync after creating category
  import('../services/sync').then(({ sync }) => {
    sync().catch(err => console.error('Auto-sync after category create failed:', err));
  });

  return category;
}

export async function getCategories(userId: string): Promise<Category[]> {
  const db = getDatabase();
  const result = await db.getAllAsync<Category>(
    'SELECT * FROM categories WHERE user_id = ? AND deleted_at IS NULL ORDER BY name',
    [userId]
  );
  return result;
}

export async function updateCategory(
  categoryId: string,
  userId: string,
  updates: Partial<Category>,
  deviceId: string
): Promise<void> {
  const db = getDatabase();
  const now = Date.now();

  const setClauses: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    values.push(updates.name);
  }
  if (updates.color !== undefined) {
    setClauses.push('color = ?');
    values.push(updates.color);
  }

  setClauses.push('updated_at = ?');
  values.push(now);

  values.push(categoryId, userId);

  await db.runAsync(
    `UPDATE categories SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );

  // Get updated category for delta
  const category = await db.getFirstAsync<Category>(
    'SELECT * FROM categories WHERE id = ?',
    [categoryId]
  );

  if (category) {
    await createDelta(userId, deviceId, 'category', categoryId, 'upsert', category);

    // Auto-sync after updating category
    import('../services/sync').then(({ sync }) => {
      sync().catch(err => console.error('Auto-sync after category update failed:', err));
    });
  }
}

export async function deleteCategory(
  categoryId: string,
  userId: string,
  deviceId: string
): Promise<void> {
  const db = getDatabase();
  const now = Date.now();

  await db.runAsync(
    'UPDATE categories SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?',
    [now, now, categoryId, userId]
  );

  await createDelta(userId, deviceId, 'category', categoryId, 'delete', { deleted_at: now });

  // Auto-sync after deleting category
  import('../services/sync').then(({ sync }) => {
    sync().catch(err => console.error('Auto-sync after category delete failed:', err));
  });
}

// ============== Activities ==============

export async function createActivity(
  userId: string,
  categoryId: string,
  data: Partial<Activity>,
  deviceId: string,
  appVersion: string
): Promise<Activity> {
  const db = getDatabase();
  const now = Date.now();
  const id = uuidv4();

  const activity: Activity = {
    id,
    user_id: userId,
    category_id: categoryId,
    created_at: now,
    updated_at: now,
    lat: data.lat || null,
    lng: data.lng || null,
    app_version: appVersion,
    description: data.description || null,
    amount: data.amount || null,
    score: data.score || null,
    metadata: data.metadata || null,
    deleted_at: null,
  };

  await db.runAsync(
    `INSERT INTO activities (id, user_id, category_id, created_at, updated_at, lat, lng, app_version, description, amount, score, metadata, deleted_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      categoryId,
      now,
      now,
      activity.lat,
      activity.lng,
      appVersion,
      activity.description,
      activity.amount,
      activity.score,
      activity.metadata,
      null,
    ]
  );

  await createDelta(userId, deviceId, 'activity', id, 'upsert', activity);

  // Auto-sync after creating activity
  import('../services/sync').then(({ sync }) => {
    sync().catch(err => console.error('Auto-sync after create failed:', err));
  });

  return activity;
}

export async function getActivities(userId: string, limit = 100): Promise<Activity[]> {
  const db = getDatabase();
  const result = await db.getAllAsync<Activity>(
    'SELECT * FROM activities WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT ?',
    [userId, limit]
  );
  return result;
}

export async function getActivity(activityId: string): Promise<Activity | null> {
  const db = getDatabase();
  const result = await db.getFirstAsync<Activity>(
    'SELECT * FROM activities WHERE id = ?',
    [activityId]
  );
  return result || null;
}

export async function updateActivity(
  activityId: string,
  userId: string,
  updates: Partial<Activity>,
  deviceId: string,
  appVersion: string
): Promise<void> {
  const db = getDatabase();
  const now = Date.now();

  const setClauses: string[] = [];
  const values: any[] = [];

  if (updates.category_id !== undefined) {
    setClauses.push('category_id = ?');
    values.push(updates.category_id);
  }
  if (updates.description !== undefined) {
    setClauses.push('description = ?');
    values.push(updates.description);
  }
  if (updates.amount !== undefined) {
    setClauses.push('amount = ?');
    values.push(updates.amount);
  }
  if (updates.score !== undefined) {
    setClauses.push('score = ?');
    values.push(updates.score);
  }
  if (updates.lat !== undefined) {
    setClauses.push('lat = ?');
    values.push(updates.lat);
  }
  if (updates.lng !== undefined) {
    setClauses.push('lng = ?');
    values.push(updates.lng);
  }
  if (updates.metadata !== undefined) {
    setClauses.push('metadata = ?');
    values.push(updates.metadata);
  }

  setClauses.push('updated_at = ?');
  values.push(now);
  setClauses.push('app_version = ?');
  values.push(appVersion);

  values.push(activityId, userId);

  await db.runAsync(
    `UPDATE activities SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );

  // Get updated activity for delta
  const activity = await db.getFirstAsync<Activity>(
    'SELECT * FROM activities WHERE id = ?',
    [activityId]
  );

  if (activity) {
    await createDelta(userId, deviceId, 'activity', activityId, 'upsert', activity);

    // Auto-sync after updating activity
    import('../services/sync').then(({ sync }) => {
      sync().catch(err => console.error('Auto-sync after update failed:', err));
    });
  }
}

export async function deleteActivity(
  activityId: string,
  userId: string,
  deviceId: string
): Promise<void> {
  const db = getDatabase();
  const now = Date.now();

  await db.runAsync(
    'UPDATE activities SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?',
    [now, now, activityId, userId]
  );

  await createDelta(userId, deviceId, 'activity', activityId, 'delete', { deleted_at: now });

  // Auto-sync after deleting activity
  import('../services/sync').then(({ sync }) => {
    sync().catch(err => console.error('Auto-sync after delete failed:', err));
  });
}

// ============== Deltas ==============

async function createDelta(
  userId: string,
  deviceId: string,
  entity: 'category' | 'activity',
  entityId: string,
  op: 'upsert' | 'delete',
  payload: any
): Promise<void> {
  const db = getDatabase();
  const id = uuidv4();
  const ts = Date.now();

  await db.runAsync(
    'INSERT INTO deltas (id, user_id, device_id, entity, entity_id, op, payload, ts, sent_at, server_seq) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, userId, deviceId, entity, entityId, op, JSON.stringify(payload), ts, null, null]
  );
}

export async function getUnsentDeltas(userId: string): Promise<Delta[]> {
  const db = getDatabase();
  const result = await db.getAllAsync<any>(
    'SELECT * FROM deltas WHERE user_id = ? AND sent_at IS NULL ORDER BY ts',
    [userId]
  );

  return result.map((row) => ({
    ...row,
    payload: JSON.parse(row.payload),
  }));
}

export async function markDeltasAsSent(deltaIds: string[], serverSeq: number): Promise<void> {
  const db = getDatabase();
  const now = Date.now();

  for (const deltaId of deltaIds) {
    await db.runAsync(
      'UPDATE deltas SET sent_at = ?, server_seq = ? WHERE id = ?',
      [now, serverSeq, deltaId]
    );
  }
}

// ============== Sync State ==============

export async function getSyncState(userId: string): Promise<number> {
  const db = getDatabase();
  const result = await db.getFirstAsync<{ last_server_seq: number }>(
    'SELECT last_server_seq FROM sync_state WHERE user_id = ?',
    [userId]
  );
  return result?.last_server_seq || 0;
}

export async function updateSyncState(userId: string, serverSeq: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'UPDATE sync_state SET last_server_seq = ? WHERE user_id = ?',
    [serverSeq, userId]
  );
}

// ============== Merge Operations (LWW) ==============

export async function mergeCategory(category: Category, deviceId: string): Promise<void> {
  const db = getDatabase();

  const existing = await db.getFirstAsync<Category>(
    'SELECT * FROM categories WHERE id = ?',
    [category.id]
  );

  // Insert if doesn't exist
  if (!existing) {
    await db.runAsync(
      'INSERT INTO categories (id, user_id, name, color, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        category.id,
        category.user_id,
        category.name,
        category.color,
        category.created_at,
        category.updated_at,
        category.deleted_at,
      ]
    );
    return;
  }

  // Last-write-wins: compare updated_at
  if (category.updated_at > existing.updated_at ||
      (category.updated_at === existing.updated_at && deviceId > category.user_id)) {
    await db.runAsync(
      'UPDATE categories SET name = ?, color = ?, updated_at = ?, deleted_at = ? WHERE id = ?',
      [category.name, category.color, category.updated_at, category.deleted_at, category.id]
    );
  }
}

export async function mergeActivity(activity: Activity, deviceId: string): Promise<void> {
  const db = getDatabase();

  const existing = await db.getFirstAsync<Activity>(
    'SELECT * FROM activities WHERE id = ?',
    [activity.id]
  );

  if (!existing) {
    await db.runAsync(
      `INSERT INTO activities (id, user_id, category_id, created_at, updated_at, lat, lng, app_version, description, amount, score, metadata, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        activity.id,
        activity.user_id,
        activity.category_id,
        activity.created_at,
        activity.updated_at,
        activity.lat,
        activity.lng,
        activity.app_version,
        activity.description,
        activity.amount,
        activity.score,
        activity.metadata,
        activity.deleted_at,
      ]
    );
    return;
  }

  // Last-write-wins
  if (activity.updated_at > existing.updated_at ||
      (activity.updated_at === existing.updated_at && deviceId > activity.user_id)) {
    await db.runAsync(
      `UPDATE activities SET category_id = ?, updated_at = ?, lat = ?, lng = ?, description = ?, amount = ?, score = ?, metadata = ?, deleted_at = ? WHERE id = ?`,
      [
        activity.category_id,
        activity.updated_at,
        activity.lat,
        activity.lng,
        activity.description,
        activity.amount,
        activity.score,
        activity.metadata,
        activity.deleted_at,
        activity.id,
      ]
    );
  }
}
