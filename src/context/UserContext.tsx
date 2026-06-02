/**
 * 端末ごとの匿名ユーザーID・ユーザー名を提供する Context。
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getOrCreateUserId, getUsername, saveUsername } from '@/storage/userId';

interface UserContextValue {
  userId: string | null;
  username: string | null;
  /** ユーザー名が設定済みかどうか（オンボーディング完了判定） */
  hasOnboarded: boolean;
  loading: boolean;
  setUsername: (name: string) => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  userId: null,
  username: null,
  hasOnboarded: false,
  loading: true,
  setUsername: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [id, name] = await Promise.all([getOrCreateUserId(), getUsername()]);
        if (active) {
          setUserId(id);
          setUsernameState(name);
        }
      } catch (e) {
        console.warn('[UserContext] init error', e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const setUsername = useCallback(async (name: string) => {
    if (!userId) return;
    await saveUsername(userId, name);
    setUsernameState(name);
  }, [userId]);

  const value = useMemo(() => ({
    userId,
    username,
    hasOnboarded: !!username,
    loading,
    setUsername,
  }), [userId, username, loading, setUsername]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  return useContext(UserContext);
}
