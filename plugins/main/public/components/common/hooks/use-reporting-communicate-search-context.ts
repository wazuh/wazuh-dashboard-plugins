import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateReportingCommunicateSearchContext } from '../../../redux/actions/reportingActions';
import { IIndexPattern } from '../../../../../../src/plugins/data/public';
/**
 * WORKAROUND: this hook stores the search context to be used by the Generate report button of
 * module dashboards
 * @param context
 */
export function useReportingCommunicateSearchContext(context: {
  isSearching: boolean;
  totalResults: number;
  indexPattern: IIndexPattern;
  filters: any;
  time?: any;
  query: any;
}) {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(updateReportingCommunicateSearchContext(context));
    return () => dispatch(updateReportingCommunicateSearchContext(null));
  }, [JSON.stringify(context)]);
}
