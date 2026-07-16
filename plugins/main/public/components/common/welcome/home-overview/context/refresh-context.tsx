import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

interface RefreshContextValue {
  /** Bumped on each Refresh; data groups list it as a fetch dependency. */
  refreshToken: number;
  refresh: () => void;
}

const RefreshContext = createContext<RefreshContextValue>({
  refreshToken: 0,
  refresh: () => {},
});

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [refreshToken, setRefreshToken] = useState(0);
  const refresh = useCallback(() => setRefreshToken(token => token + 1), []);
  const value = useMemo(
    () => ({ refreshToken, refresh }),
    [refreshToken, refresh],
  );
  return (
    <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>
  );
};

export const useRefresh = (): RefreshContextValue => useContext(RefreshContext);
