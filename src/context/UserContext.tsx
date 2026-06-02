/**
 * 端末ごとの匿名ユーザーID（UUID）を提供する Context。
 *
 * 起動時に `getOrCreateUserId()` でID を取得・生成し、子コンポーネントへ配布する。
 * ID 取得中は `userId` が null、`loading` が true になる。
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getOrCreateUserId } from '@/storage/userId';

interface UserContextValue {
  /** 端末の匿名ユーザーID。取得前は null。 */
  userId: string | null;
  /** ID 取得中フラグ */
  loading: boolean;
}

const UserContext = createContext<UserContextValue>({ userId: null, loading: true });

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getOrCreateUserId()
      .then((id) => {
        if (active) {
          setUserId(id);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.warn('[UserContext] failed to get/create userId', e);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({ userId, loading }), [userId, loading]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/** userId と loading を取得するフック */
export function useUser(): UserContextValue {
  return useContext(UserContext);
}
