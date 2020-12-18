import { useEffect, useState } from 'react';
import WzRequest from '../../../../react-services/wz-request';

/**
 * This fetch management rules
 */
export const useRules = (): [boolean, any, string | undefined] => {
  const [rules, setRules] = useState({
    failed_items: [],
    total_affected_items: 0,
    total_failed_items: 0,
    affected_items: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    WzRequest.apiReq('GET', `/rules/`, {})
      .then((response) => {
        setRules(response.data.data as any);
        setLoading(false);
      })
      .catch((error) => {
        setError(error);
        setLoading(false);
      });
  }, []);

  return [loading, rules, error];
};
