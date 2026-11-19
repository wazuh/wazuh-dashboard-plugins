import React, { useEffect, useState } from 'react';
import { EuiCallOut, EuiSpacer, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { getWazuhAPIVersion } from '../services';

/** Upgrade errors stay on screen until the user dismisses them (about 24 hours). */
export const UPGRADE_ERROR_TOAST_LIFETIME_MS = 24 * 60 * 60 * 1000;

const LEGACY_AGENT_VERSION_REGEX = /^v?4\./i;
const URL_REGEX = /https?:\/\/[^\s"'<>)]+/i;

export const isLegacyAgentVersion = (version?: string): boolean =>
  LEGACY_AGENT_VERSION_REGEX.test(version ?? '');

/** Version the agents are upgraded to: the one of the manager. */
export const useUpgradeTargetVersion = (): string | undefined => {
  const [targetVersion, setTargetVersion] = useState<string>();

  useEffect(() => {
    let isMounted = true;
    getWazuhAPIVersion('UpgradeDialog.getTargetVersion').then(version => {
      if (isMounted && version) {
        setTargetVersion(version);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return targetVersion;
};

/**
 * Names the repository in the upgrade error when the manager returns its URL
 * outside of the message (for example in the detail or the remediation).
 */
type UpgradeError = {
  response?: {
    data?: {
      detail?: unknown;
      remediation?: unknown;
      error?: { remediation?: unknown };
    };
  };
};

export const addRepositoryUrl = (
  message: string,
  error: UpgradeError,
): string => {
  const data = error?.response?.data;
  const candidates = [
    data?.detail,
    data?.remediation,
    data?.error?.remediation,
  ];
  const url = candidates
    .map(candidate =>
      typeof candidate === 'string' ? candidate.match(URL_REGEX)?.[0] : '',
    )
    .find(Boolean);

  if (!url || message.includes(url)) {
    return message;
  }

  return i18n.translate(
    'wazuh.endpointsSummary.upgradeDialog.repositoryError',
    {
      defaultMessage: '{message} Repository: {url}',
      values: { message, url },
    },
  );
};

interface UpgradeDialogInfoProps {
  targetVersion?: string;
  showLegacyAgentsNote: boolean;
}

export const UpgradeDialogInfo = ({
  targetVersion,
  showLegacyAgentsNote,
}: UpgradeDialogInfoProps) => (
  <>
    {targetVersion ? (
      <EuiText size='s' data-test-subj='upgradeTargetVersion'>
        {i18n.translate('wazuh.endpointsSummary.upgradeDialog.targetVersion', {
          defaultMessage: 'The agents will be upgraded to version {version}.',
          values: { version: targetVersion },
        })}
      </EuiText>
    ) : null}
    {showLegacyAgentsNote ? (
      <>
        {targetVersion ? <EuiSpacer size='s' /> : null}
        <EuiCallOut
          size='s'
          iconType='iInCircle'
          data-test-subj='upgradeLegacyAgentsNote'
          title={i18n.translate(
            'wazuh.endpointsSummary.upgradeDialog.legacyAgentsNote',
            {
              defaultMessage:
                'Agents on version 4.x start the upgrade within the next 15 minutes.',
            },
          )}
        />
      </>
    ) : null}
  </>
);
