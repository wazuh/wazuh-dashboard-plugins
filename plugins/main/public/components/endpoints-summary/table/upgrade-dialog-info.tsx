import React, { useEffect, useState } from 'react';
import { EuiCallOut, EuiSpacer, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { getWazuhAPIVersion } from '../services';

/** Upgrade errors stay on screen until the user dismisses them (about 24 hours). */
export const UPGRADE_ERROR_TOAST_LIFETIME_MS = 24 * 60 * 60 * 1000;

const LEGACY_AGENT_VERSION_REGEX = /^v?4\./i;

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

interface UpgradeDialogInfoProps {
  targetVersion?: string;
  showLegacyAgentsNote: boolean;
  /** The dialog upgrades one agent, so the target version message is singular. */
  isSingleAgent?: boolean;
}

export const UpgradeDialogInfo = ({
  targetVersion,
  showLegacyAgentsNote,
  isSingleAgent = false,
}: UpgradeDialogInfoProps) => (
  <>
    {targetVersion ? (
      <EuiText size='s' data-test-subj='upgradeTargetVersion'>
        {isSingleAgent
          ? i18n.translate(
              'wazuh.endpointsSummary.upgradeDialog.targetVersionSingleAgent',
              {
                defaultMessage:
                  'The agent will be upgraded to version {version}.',
                values: { version: targetVersion },
              },
            )
          : i18n.translate(
              'wazuh.endpointsSummary.upgradeDialog.targetVersion',
              {
                defaultMessage:
                  'The agents will be upgraded to version {version}.',
                values: { version: targetVersion },
              },
            )}
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
                "Agents on version 4.x start the upgrade on the manager's next delivery cycle, every 15 minutes by default.",
            },
          )}
        />
      </>
    ) : null}
  </>
);
