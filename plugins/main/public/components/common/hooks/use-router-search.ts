import { useEffect, useState } from 'react';
import NavigationService from '../../../react-services/navigation-service';

function getSearchParamsAsObject(location) {
  const searchParams = new URLSearchParams(location.search);
  return Object.fromEntries([...searchParams.entries()]);
}

// See changes in the location object and returns the search parameters
// FIXME: This hook relies some parent component where is used is re-rendered when the location object changes, else the hook will not update the search params. This need to be redone adding a listener to the history object, but for now this is enough for the current use cases.
export const useRouterSearch = () => {
  const navigationService = NavigationService.getInstance();
  const location = navigationService.getLocation();
  const [state, setState] = useState(getSearchParamsAsObject(location));
  useEffect(() => {
    setState(getSearchParamsAsObject(location));
  }, [location]);
  return state;
};
