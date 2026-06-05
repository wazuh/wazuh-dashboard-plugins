import { AppState } from '../../../react-services';
import useObservable from 'react-use/lib/useObservable';

export const useSelectedServerApi = () => {
  const selectedAPI = useObservable(
    AppState.selectedServerAPIChanged$,
    AppState.selectedServerAPI$.getValue(),
  );

  return { selectedAPI };
};
