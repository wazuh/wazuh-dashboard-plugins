import { useState } from 'react';

function transformValueToStorage(value: any){
  return typeof value !== 'string' ? JSON.stringify(value) : value;
};

function transformValueFromStorage(value: any){
  return typeof value === 'string' ? JSON.parse(value) : value;
};

export function useStateStorage(initialValue: any, storageSystem?: 'sessionStorage' | 'localStorage', storageKey?: string){
  const [state, setState] = useState(
    (storageSystem && storageKey && window?.[storageSystem]?.getItem(storageKey))
      ? transformValueFromStorage(window?.[storageSystem]?.getItem(storageKey))
      : initialValue
  );

  function setStateStorage(value: any){
    setState((state) => {
      const formattedValue = typeof value === 'function'
        ? value(state)
        : value;

      storageSystem && storageKey && window?.[storageSystem]?.setItem(storageKey, transformValueToStorage(formattedValue));
      return formattedValue;
    });
  };

  return [state, setStateStorage];
};
