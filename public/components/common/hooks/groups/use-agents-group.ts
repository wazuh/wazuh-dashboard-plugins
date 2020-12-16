import { useEffect, useState } from 'react';
import WzRequest from '../../../../react-services/wz-request';

/**
 * This fetch agent group
 */
export const useAgentsGroup = (group: string): [boolean, any, string | undefined] => {
  debugger;
  const [agentsGroup, setAgentsGroup] = useState({
    totalSelectedAgents: [],
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
    WzRequest.apiReq('GET', `/groups/${group}/agents/`, {})
      .then((response) => {
        setAgentsGroup(response.data.data as any);
        setLoading(false);
      })
      .catch((error) => {
        setError(error);
        setLoading(false);
      });
  }, []);

  return [loading, agentsGroup, error];
};
