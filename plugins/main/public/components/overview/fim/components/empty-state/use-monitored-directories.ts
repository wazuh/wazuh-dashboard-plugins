import { useEffect, useState } from 'react';
import {
  AgentReportedConfiguration,
  clearAgentReportedConfigurationCache,
  getAgentReportedConfiguration,
} from '../../../../../controllers/management/components/management/configuration/utils/agent-config-service';

export type MonitoredDirectories =
  | { status: 'loading' }
  | { status: 'monitored'; directories: string[] }
  | { status: 'none' }
  | { status: 'disabled' }
  | { status: 'not-reported' }
  | { status: 'error' };

interface ReportedSyscheck {
  disabled?: string;
  directories?: unknown;
}

const toDirectoryPath = (entry: unknown): string | undefined =>
  typeof entry === 'string' ? entry : (entry as { dir?: string })?.dir;

/**
 * Reads the monitored directories out of the configuration an agent reported. The report keeps
 * the `syscheck` section as the agent parsed it, so a single `<directories>` entry can arrive as
 * an object instead of a list.
 */
export const getMonitoredDirectories = (
  report: AgentReportedConfiguration | null,
): Exclude<MonitoredDirectories, { status: 'loading' | 'error' }> => {
  if (!report) {
    return { status: 'not-reported' };
  }
  const syscheck = (report.content?.fim as { syscheck?: ReportedSyscheck })
    ?.syscheck;
  if (syscheck?.disabled === 'yes') {
    return { status: 'disabled' };
  }
  const entries = Array.isArray(syscheck?.directories)
    ? syscheck.directories
    : [syscheck?.directories];
  const directories = [
    ...new Set(entries.map(toDirectoryPath).filter(Boolean) as string[]),
  ];

  return directories.length
    ? { status: 'monitored', directories }
    : { status: 'none' };
};

/**
 * Monitored directories of the pinned endpoint, from the configuration it last reported. Returns
 * `undefined` when no endpoint is pinned.
 */
export const useMonitoredDirectories = (
  agentId?: string,
): MonitoredDirectories | undefined => {
  const [state, setState] = useState<MonitoredDirectories | undefined>(
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
      .then(report => isMounted && setState(getMonitoredDirectories(report)))
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
