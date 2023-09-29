import React from 'react';
import {
  EuiAccordion,
  EuiBadge,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHeaderLink,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';
import { Update } from '../../../common/types';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';

export interface UpdateDetailsProps {
  update: Update;
}

export const UpdateDetails = ({ update }: UpdateDetailsProps) => {
  const release = `${update?.semver.mayor}.${update?.semver.minor}`;
  const releaseNotesUrl = `https://documentation.wazuh.com/${release}/release-notes/release-${update.semver.mayor}-${update.semver.minor}-${update.semver.patch}.html`;
  const upgradeGuideUrl = `https://documentation.wazuh.com/${release}/upgrade-guide/index.html`;

  return (
    <I18nProvider>
      <EuiCallOut
        title={
          <EuiFlexGroup gutterSize="m">
            <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
              <FormattedMessage
                id="wazuhCheckUpdates.currentUpdateDetails.title"
                defaultMessage="Wazuh new release is available now!"
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
              <EuiBadge>{update.tag}</EuiBadge>
            </EuiFlexItem>
          </EuiFlexGroup>
        }
        color="warning"
        iconType="bell"
      >
        <EuiFlexGroup gutterSize="m">
          <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
            <EuiHeaderLink
              href={releaseNotesUrl}
              isActive
              target="_blank"
              iconType="popout"
              iconSide="right"
            >
              <FormattedMessage
                id="wazuhCheckUpdates.currentUpdateDetails.releaseNotesLink"
                defaultMessage="Release notes"
              />
            </EuiHeaderLink>
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
            <EuiHeaderLink
              href={upgradeGuideUrl}
              isActive
              target="_blank"
              iconType="popout"
              iconSide="right"
            >
              <FormattedMessage
                id="wazuhCheckUpdates.currentUpdateDetails.upgradeGuideLink"
                defaultMessage="Upgrade guide"
              />
            </EuiHeaderLink>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiAccordion
          id="accordionUpdateDetails"
          buttonContent={
            <FormattedMessage
              id="wazuhCheckUpdates.currentUpdateDetails.showDetails"
              defaultMessage="Show details"
            />
          }
          paddingSize="m"
        >
          <EuiText>
            {update.description.split('\r\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </EuiText>
        </EuiAccordion>
      </EuiCallOut>
    </I18nProvider>
  );
};
