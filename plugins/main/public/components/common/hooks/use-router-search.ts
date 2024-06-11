import { useEffect, useState } from 'react';
import NavigationService from '../../../react-services/navigation-service';

function getSearchParamsAsObject(location) {
  const searchParams = new URLSearchParams(location.search);
  return Object.fromEntries([...searchParams.entries()]);
}

// See changes in the location object and returns the search parameters
export const useRouterSearch = () => {
  const navigationService = NavigationService.getInstance();
  const location = navigationService.getLocation();
  const [state, setState] = useState(getSearchParamsAsObject(location));
  useEffect(() => {
    setState(getSearchParamsAsObject(location));
  }, [location]);
  return state;
};
