import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { getToken, getUserId } from './auth';
import {
  getUnsentDeltas,
  markDeltasAsSent,
  getSyncState,
  updateSyncState,
  mergeCategory,
  mergeActivity,
} from '../db/queries';
import { Delta, Category, Activity } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const DEVICE_ID_KEY = 'nibble_device_id';

export async function getDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = uuidv4();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export async function pushDeltas(): Promise<void> {
  const token = await getToken();
  const userId = await getUserId();
  const deviceId = await getDeviceId();

  if (!token || !userId) {
    throw new Error('Not authenticated');
  }

  const deltas = await getUnsentDeltas(userId);
  if (deltas.length === 0) {
    console.log('No deltas to push');
    return;
  }

  console.log(`Pushing ${deltas.length} deltas...`);

  const response = await fetch(`${API_URL}/sync/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      device_id: deviceId,
      deltas: deltas,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Push failed');
  }

  const result = await response.json();
  console.log(`Pushed ${result.acked.length} deltas, server_seq: ${result.last_server_seq}`);

  // Mark deltas as sent
  await markDeltasAsSent(result.acked, result.last_server_seq);
}

export async function pullDeltas(): Promise<void> {
  const token = await getToken();
  const userId = await getUserId();
  const deviceId = await getDeviceId();

  if (!token || !userId) {
    throw new Error('Not authenticated');
  }

  const cursor = await getSyncState(userId);
  console.log(`Pulling deltas from cursor ${cursor}...`);

  const response = await fetch(
    `${API_URL}/sync/pull?cursor=${cursor}&device_id=${deviceId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error('Pull failed with status', response.status, ':', text);
    try {
      const error = JSON.parse(text);
      throw new Error(error.detail || 'Pull failed');
    } catch (e) {
      throw new Error(`Pull failed: ${text}`);
    }
  }

  const result = await response.json();
  console.log(`Pulled ${result.deltas.length} deltas, new cursor: ${result.cursor}`);

  // Apply deltas
  for (const delta of result.deltas) {
    await applyDelta(delta, deviceId);
  }

  // Update sync state
  if (result.cursor > cursor) {
    await updateSyncState(userId, result.cursor);
  }
}

async function applyDelta(delta: any, deviceId: string): Promise<void> {
  console.log(`Applying delta: ${delta.entity} ${delta.op} ${delta.entity_id}`);

  if (delta.entity === 'category') {
    if (delta.op === 'upsert') {
      await mergeCategory(delta.payload as Category, deviceId);
    } else if (delta.op === 'delete') {
      await mergeCategory(
        {
          ...delta.payload,
          deleted_at: delta.payload.deleted_at || Date.now(),
        } as Category,
        deviceId
      );
    }
  } else if (delta.entity === 'activity') {
    if (delta.op === 'upsert') {
      await mergeActivity(delta.payload as Activity, deviceId);
    } else if (delta.op === 'delete') {
      await mergeActivity(
        {
          ...delta.payload,
          deleted_at: delta.payload.deleted_at || Date.now(),
        } as Activity,
        deviceId
      );
    }
  }
}

export async function sync(): Promise<void> {
  console.log('Starting sync...');
  
  try {
    // Push local changes first
    await pushDeltas();
    
    // Then pull remote changes
    await pullDeltas();
    
    console.log('Sync completed successfully');
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}
