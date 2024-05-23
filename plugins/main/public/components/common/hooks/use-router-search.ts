import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

function getSearchParamsAsObject(location) {
  const searchParams = new URLSearchParams(location.search);
  return Object.fromEntries([...searchParams.entries()]);
}

// See changes in the location object and returns the search parameters
export const useRouterSearch = () => {
  const location = useLocation();
  const [state, setState] = useState(getSearchParamsAsObject(location));
  useEffect(() => {
    setState(getSearchParamsAsObject(location));
  }, [location]);
  return state;
};
