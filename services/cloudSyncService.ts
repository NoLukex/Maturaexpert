import type { UserStats, Flashcard } from '../types';

export interface CloudDataPayload {
  stats?: UserStats;
  flashcards?: {
    items: Flashcard[];
    updatedAt: number;
  };
  updatedAt: number;
}

const CLOUD_USER_KEY = 'matura_master_cloud_user_id';
const DEFAULT_USER_ID = 'mateusz-wisniewski';

export const getCloudUserId = (): string => {
  try {
    const saved = localStorage.getItem(CLOUD_USER_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // ignore
  }
  return DEFAULT_USER_ID;
};

export const setCloudUserId = (userId: string): string => {
  const clean = (userId || DEFAULT_USER_ID).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  try {
    localStorage.setItem(CLOUD_USER_KEY, clean);
  } catch {
    // ignore
  }
  return clean;
};

export const fetchServerCloudPayload = async (userId: string): Promise<CloudDataPayload | null> => {
  try {
    const res = await fetch(`/api/cloud/sync/${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (error) {
    console.warn('Could not fetch cloud data from server:', error);
    return null;
  }
};

export const saveServerCloudPayload = async (userId: string, payload: CloudDataPayload): Promise<boolean> => {
  try {
    const res = await fetch(`/api/cloud/sync/${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (error) {
    console.warn('Could not save cloud data to server:', error);
    return false;
  }
};

export const checkCloudStatus = async () => {
  try {
    const res = await fetch('/api/cloud/status');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return { ok: true, cloudActive: true, storageType: 'local-persistent' };
};
