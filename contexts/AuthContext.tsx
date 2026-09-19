import * as React from 'react';
import type { User } from 'firebase/auth';
import {
  consumeRedirectSignIn,
  fetchCloudPayload,
  isFirebaseEnabled,
  observeAuth,
  saveCloudPayload,
  signInWithGoogle,
  signOutFirebase
} from '../services/firebaseService';
import {
  FLASHCARDS_UPDATED_EVENT,
  STATS_UPDATED_EVENT,
  getFlashcardsSyncPayload,
  getStats,
  replaceLocalFlashcards,
  replaceLocalStats
} from '../services/storageService';
import {
  getCloudUserId,
  setCloudUserId,
  fetchServerCloudPayload,
  saveServerCloudPayload,
  type CloudDataPayload
} from '../services/cloudSyncService';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  syncing: boolean;
  enabled: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  cloudUserId: string;
  cloudActive: boolean;
  lastSyncedAt: number | null;
  syncNow: () => Promise<void>;
  switchCloudUser: (id: string) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const mergeServerCloud = async (userId: string): Promise<boolean> => {
  const localStats = getStats();
  const localFlashcards = getFlashcardsSyncPayload();
  const cloud = await fetchServerCloudPayload(userId);

  if (!cloud) {
    // Upload local to cloud as initial seed
    await saveServerCloudPayload(userId, {
      stats: localStats,
      flashcards: localFlashcards,
      updatedAt: Date.now()
    });
    return true;
  }

  const localStatsUpdatedAt = localStats.updatedAt || 0;
  const cloudStatsUpdatedAt = cloud.stats?.updatedAt || 0;
  const useCloudStats = cloud.stats && cloudStatsUpdatedAt > localStatsUpdatedAt;

  const localFlashUpdatedAt = localFlashcards.updatedAt || 0;
  const cloudFlashUpdatedAt = cloud.flashcards?.updatedAt || 0;
  const useCloudFlash = cloud.flashcards && cloudFlashUpdatedAt > localFlashUpdatedAt;

  if (useCloudStats && cloud.stats) {
    replaceLocalStats(cloud.stats);
  }

  if (useCloudFlash && cloud.flashcards) {
    replaceLocalFlashcards(cloud.flashcards);
  }

  const mergedStats = useCloudStats && cloud.stats ? cloud.stats : getStats();
  const mergedFlashcards = useCloudFlash && cloud.flashcards ? cloud.flashcards : getFlashcardsSyncPayload();

  await saveServerCloudPayload(userId, {
    stats: mergedStats,
    flashcards: mergedFlashcards,
    updatedAt: Date.now()
  });
  return true;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [cloudUserId, setCloudUserIdState] = React.useState<string>(getCloudUserId());
  const [lastSyncedAt, setLastSyncedAt] = React.useState<number | null>(null);
  const enabled = isFirebaseEnabled();

  // Initial Sync from Server Cloud Database
  React.useEffect(() => {
    let isMounted = true;
    const initCloud = async () => {
      setSyncing(true);
      try {
        await mergeServerCloud(cloudUserId);
        if (isMounted) setLastSyncedAt(Date.now());
      } catch (err) {
        console.warn('Initial server cloud sync warning:', err);
      } finally {
        if (isMounted) {
          setSyncing(false);
          setLoading(false);
        }
      }
    };
    initCloud();
    return () => {
      isMounted = false;
    };
  }, [cloudUserId]);

  // Firebase auth listener if configured
  React.useEffect(() => {
    if (!enabled) return;

    void consumeRedirectSignIn();

    const unsub = observeAuth(async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) return;

      setSyncing(true);
      try {
        await mergeServerCloud(nextUser.uid);
      } catch {
        // no-op
      } finally {
        setSyncing(false);
      }
    });

    return unsub;
  }, [enabled]);

  // Auto-sync listener for local storage changes (debounced)
  React.useEffect(() => {
    let timer: number | null = null;
    const syncNowToServer = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        setSyncing(true);
        try {
          const payload: CloudDataPayload = {
            stats: getStats(),
            flashcards: getFlashcardsSyncPayload(),
            updatedAt: Date.now()
          };
          const targetId = user?.uid || cloudUserId;
          await saveServerCloudPayload(targetId, payload);
          setLastSyncedAt(Date.now());
        } catch (err) {
          console.warn('Auto cloud sync failed:', err);
        } finally {
          setSyncing(false);
        }
      }, 500);
    };

    window.addEventListener(STATS_UPDATED_EVENT, syncNowToServer);
    window.addEventListener(FLASHCARDS_UPDATED_EVENT, syncNowToServer);

    return () => {
      window.removeEventListener(STATS_UPDATED_EVENT, syncNowToServer);
      window.removeEventListener(FLASHCARDS_UPDATED_EVENT, syncNowToServer);
      if (timer) window.clearTimeout(timer);
    };
  }, [cloudUserId, user]);

  const syncNow = React.useCallback(async () => {
    setSyncing(true);
    try {
      const payload: CloudDataPayload = {
        stats: getStats(),
        flashcards: getFlashcardsSyncPayload(),
        updatedAt: Date.now()
      };
      const targetId = user?.uid || cloudUserId;
      await saveServerCloudPayload(targetId, payload);
      setLastSyncedAt(Date.now());
    } finally {
      setSyncing(false);
    }
  }, [cloudUserId, user]);

  const switchCloudUser = React.useCallback(async (newId: string) => {
    const clean = setCloudUserId(newId);
    setCloudUserIdState(clean);
    setSyncing(true);
    try {
      await mergeServerCloud(clean);
      setLastSyncedAt(Date.now());
    } finally {
      setSyncing(false);
    }
  }, []);

  const login = React.useCallback(async () => {
    if (!enabled) return;
    await signInWithGoogle();
  }, [enabled]);

  const logout = React.useCallback(async () => {
    if (!enabled) return;
    await signOutFirebase();
  }, [enabled]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      syncing,
      enabled,
      login,
      logout,
      cloudUserId,
      cloudActive: true,
      lastSyncedAt,
      syncNow,
      switchCloudUser
    }),
    [user, loading, syncing, enabled, login, logout, cloudUserId, lastSyncedAt, syncNow, switchCloudUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

