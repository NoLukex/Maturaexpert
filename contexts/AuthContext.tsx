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

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  syncing: boolean;
  enabled: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const mergeAndApplyCloud = async (uid: string) => {
  const localStats = getStats();
  const localFlashcards = getFlashcardsSyncPayload();
  const cloud = await fetchCloudPayload(uid);

  if (!cloud) {
    await saveCloudPayload(uid, {
      stats: localStats,
      flashcards: localFlashcards,
      updatedAt: Date.now()
    });
    return;
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

  await saveCloudPayload(uid, {
    stats: mergedStats,
    flashcards: mergedFlashcards,
    updatedAt: Date.now()
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const enabled = isFirebaseEnabled();

  React.useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    void consumeRedirectSignIn();

    const unsub = observeAuth(async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setLoading(false);
        return;
      }

      setSyncing(true);
      try {
        await mergeAndApplyCloud(nextUser.uid);
      } catch {
        // no-op
      } finally {
        setSyncing(false);
        setLoading(false);
      }
    });

    return unsub;
  }, [enabled]);

  React.useEffect(() => {
    if (!enabled || !user) return;

    let timer: number | null = null;
    const syncNow = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        try {
          await saveCloudPayload(user.uid, {
            stats: getStats(),
            flashcards: getFlashcardsSyncPayload(),
            updatedAt: Date.now()
          });
        } catch {
          // no-op
        }
      }, 400);
    };

    window.addEventListener(STATS_UPDATED_EVENT, syncNow);
    window.addEventListener(FLASHCARDS_UPDATED_EVENT, syncNow);

    return () => {
      window.removeEventListener(STATS_UPDATED_EVENT, syncNow);
      window.removeEventListener(FLASHCARDS_UPDATED_EVENT, syncNow);
      if (timer) window.clearTimeout(timer);
    };
  }, [enabled, user]);

  const login = React.useCallback(async () => {
    if (!enabled) return;
    await signInWithGoogle();
  }, [enabled]);

  const logout = React.useCallback(async () => {
    if (!enabled) return;
    await signOutFirebase();
  }, [enabled]);

  const value = React.useMemo<AuthContextValue>(() => ({ user, loading, syncing, enabled, login, logout }), [user, loading, syncing, enabled, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
