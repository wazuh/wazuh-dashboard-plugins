import { useEffect, useState } from 'react';
import {
  AgentReportedConfiguration,
  clearAgentReportedConfigurationCache,
  getAgentReportedConfiguration,
} from '../../../../../controllers/management/components/management/configuration/utils/agent-config-service';

export type DockerListener =
  | { status: 'loading' }
  | { status: 'enabled' }
  | { status: 'disabled' }
  | { status: 'not-configured' }
  | { status: 'not-reported' }
  | { status: 'error' };

/** Key of the Docker listener in the module-keyed configuration an agent reports. */
const DOCKER_LISTENER_MODULE = 'docker-listener';

/**
 * Reads the Docker listener out of the configuration an agent reported. The report is keyed by
 * module, so the `docker-listener` section tells whether it is turned off. A report without that
 * section means the agent has no listener configured.
 */
export const getDockerListener = (
  report: AgentReportedConfiguration | null,
): Exclude<DockerListener, { status: 'loading' | 'error' }> => {
  if (!report) {
    return { status: 'not-reported' };
  }
  const section = report.content?.[DOCKER_LISTENER_MODULE] as
    | { disabled?: string }
    | undefined;
  if (!section) {
    return { status: 'not-configured' };
  }
  return section.disabled === 'yes'
    ? { status: 'disabled' }
    : { status: 'enabled' };
};

/**
 * Docker listener of the pinned endpoint, from the configuration it last reported. Returns
 * `undefined` when no endpoint is pinned.
 */
export const useDockerListener = (
  agentId?: string,
): DockerListener | undefined => {
  const [state, setState] = useState<DockerListener | undefined>(
    agentId ? { status: 'loading' } : undefined,
  );

  useEffect(() => {
    if (!agentId) {
      setState(undefined);
      return;
    }
    let isMounted = true;
    setState({ status: 'loading' });
    getAgentReportedConfiguration(agentId)
      .then(report => isMounted && setState(getDockerListener(report)))
      .catch(() => isMounted && setState({ status: 'error' }));

    return () => {
      isMounted = false;
      /* The read is cached and shared with the agent configuration view. Leaving this page
      discards it, so opening that view later reads the current report. */
      clearAgentReportedConfigurationCache();
    };
  }, [agentId]);

  return state;
};
