import React from 'react';
import { EuiCallOut, EuiHeaderLink } from '@elastic/eui';
import { Update } from '../../common/types';
import { FormattedMessage } from '@osd/i18n/react';

export interface CurrentUpdateDetailsProps {
  currentUpdate?: Update;
}

export const CurrentUpdateDetails = ({ currentUpdate }: CurrentUpdateDetailsProps) => {
  if (!currentUpdate) return null;

  const currentRelease = `${currentUpdate?.semver.mayor}.${currentUpdate?.semver.minor}`;
  const releaseNotesUrl = `https://documentation.wazuh.com/${currentRelease}/release-notes/release-${currentUpdate?.semver.mayor}-${currentUpdate?.semver.minor}-${currentUpdate?.semver.patch}.html`;
  const upgradeGuideUrl = `https://documentation.wazuh.com/${currentRelease}/upgrade-guide/index.html`;

  return (
    <EuiCallOut title="Proceed with caution!" color="warning" iconType="help">
      <p>{currentUpdate.title}</p>
      <EuiHeaderLink href={releaseNotesUrl} isActive target="_blank">
        {
          <FormattedMessage
            id="wazuhCheckUpdates.currentUpdateDetails.releaseNotesLink"
            defaultMessage="Release notes"
          />
        }
      </EuiHeaderLink>
      <EuiHeaderLink href={upgradeGuideUrl} isActive target="_blank">
        {
          <FormattedMessage
            id="wazuhCheckUpdates.currentUpdateDetails.upgradeGuideLink"
            defaultMessage="Upgrade guide"
          />
        }
      </EuiHeaderLink>
    </EuiCallOut>
  );
};
