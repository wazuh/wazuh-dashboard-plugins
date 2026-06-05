import { WzRequest } from '../../../react-services';
import useObservable from 'react-use/lib/useObservable';

export const useServerApiAvailable = () => {
  const isAvailable = useObservable(
    WzRequest.serverAPIAvailableChanged$,
    WzRequest.serverAPIAvailable$.getValue(),
  );

  return { isAvailable };
};
