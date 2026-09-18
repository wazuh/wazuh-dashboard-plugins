import { useEffect, useState } from 'react';
import NavigationService from '../../../react-services/navigation-service';

function getSearchParamsAsObject(location) {
  const searchParams = new URLSearchParams(location.search);
  return Object.fromEntries([...searchParams.entries()]);
}

// Tracks the router's query params, resyncing on every navigation (in-app,
// browser back/forward, or a shared link) via a history listener.
export const useRouterSearch = () => {
  const navigationService = NavigationService.getInstance();
  const [state, setState] = useState(() =>
    getSearchParamsAsObject(navigationService.getLocation()),
  );
  useEffect(() => {
    const unlisten = navigationService.listen(location => {
      setState(getSearchParamsAsObject(location));
    });
    return unlisten;
  }, [navigationService]);
  return state;
};
