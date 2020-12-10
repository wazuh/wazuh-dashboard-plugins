import { useEffect, useState } from 'react';
import { AgentsSummary } from '../types';
import WzRequest from '../../../../react-services/wz-request';

/**
 * This fetch de agents summary
 */
export const useAgentsSummary = () : [boolean, AgentsSummary, (string | undefined)] => {
  const [summary, setSummary] = useState<AgentsSummary>({
    total: 0,
    active: 0,
    disconnected: 0,
    never_connected: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    WzRequest.apiReq('GET', '/agents/summary/status', { })
      .then(response => {
        setSummary(response.data.data as AgentsSummary);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false)
      })
  }, []);

  return [loading, summary, error];
};
