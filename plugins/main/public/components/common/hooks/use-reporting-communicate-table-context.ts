import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { updateReportingTableContext } from '../../../redux/actions/reportingActions';

/**
 * Publishes the mounted inventory table so the Generate report button of the tab can export it.
 */
export function useReportingCommunicateTableContext({
  totalResults,
  generateReport,
}: {
  totalResults?: number;
  generateReport: () => Promise<void>;
}) {
  const dispatch = useDispatch();
  // The button calls the latest closure, so the context only changes with the total
  const generateReportRef = useRef(generateReport);
  generateReportRef.current = generateReport;

  useEffect(() => {
    dispatch(
      updateReportingTableContext({
        totalResults,
        generateReport: () => generateReportRef.current(),
      }),
    );
  }, [dispatch, totalResults]);

  useEffect(
    () => () => dispatch(updateReportingTableContext(null)),
    [dispatch],
  );
}
