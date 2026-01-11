export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Activity {
  id: string;
  user_id: string;
  category_id: string;
  created_at: number;
  updated_at: number;
  lat: number | null;
  lng: number | null;
  app_version: string;
  description: string | null;
  amount: number | null;
  score: number | null;
  metadata: string | null;
  deleted_at: number | null;
}

export interface Delta {
  id: string;
  user_id: string;
  device_id: string;
  entity: 'category' | 'activity';
  entity_id: string;
  op: 'upsert' | 'delete';
  payload: any;
  ts: number;
  sent_at: number | null;
  server_seq: number | null;
}

export interface SyncState {
  user_id: string;
  last_server_seq: number;
}
