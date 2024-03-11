import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateReportingCommunicateSearchContext } from '../../../redux/actions/reportingActions';

/**
 * WORKAROUND: this hook stores the search context to be used by the Generate report button of
 * module dashboards
 * @param context
 */
export function useReportingCommunicateSearchContext(context) {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(updateReportingCommunicateSearchContext(context));
    return () => dispatch(updateReportingCommunicateSearchContext(null));
  }, [JSON.stringify(context)]);
}
