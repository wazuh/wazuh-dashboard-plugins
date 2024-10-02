import { useState } from 'react';

export type UseStateStorageSystem = 'sessionStorage' | 'localStorage';
export type UseStateStorageReturn<T> = [T, (value: T) => void];
export type UseStateStorage<T> = {
  (
    initialValue: T,
    storageSystem?: UseStateStorageSystem,
    storageKey?: string,
  ): [T, (value: T) => void];
};

function transformValueToStorage(value: any) {
  return typeof value !== 'string' ? JSON.stringify(value) : value;
}

function transformValueFromStorage(value: any) {
  return typeof value === 'string' ? JSON.parse(value) : value;
}

export function useStateStorage<T>(
  initialValue: T,
  storageSystem?: UseStateStorageSystem,
  storageKey?: string,
): UseStateStorageReturn<T> {
  const [state, setState] = useState(
    storageSystem && storageKey && window?.[storageSystem]?.getItem(storageKey)
      ? transformValueFromStorage(window?.[storageSystem]?.getItem(storageKey))
      : initialValue,
  );

  function setStateStorage(value: T) {
    setState(state => {
      const formattedValue = typeof value === 'function' ? value(state) : value;

      storageSystem &&
        storageKey &&
        window?.[storageSystem]?.setItem(
          storageKey,
          transformValueToStorage(formattedValue),
        );
      return formattedValue;
    });
  }

  return [state, setStateStorage];
}
