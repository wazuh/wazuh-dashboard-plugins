import React, { useState, MouseEvent } from 'react';
import { Update } from '../../../../../common/types';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiDescriptionList,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
} from '@elastic/eui';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { Markdown } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { formatUIDate } from '../../../../utils';

export interface UpdateProps {
  update: Update;
}

export const UpdateBadge = ({ update }: UpdateProps) => {
  const { title, description, tag, semver, published_date } = update;

  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleOnClickBadge = () => {
    setIsModalVisible(true);
  };

  const handleOnCloseModal = () => {
    setIsModalVisible(false);
  };

  const minorVersion = `${semver.mayor}.${semver.minor}`;
  const releaseNotesUrl = `https://documentation.wazuh.com/${minorVersion}/release-notes/release-${semver.mayor}-${semver.minor}-${semver.patch}.html`;
  const upgradeGuideUrl = `https://documentation.wazuh.com/${minorVersion}/upgrade-guide/index.html`;

  return (
    <I18nProvider>
      <EuiBadge
        color="hollow"
        onClickAriaLabel={`update-${tag}`}
        onMouseDown={(e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
        }}
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          handleOnClickBadge();
        }}
        style={{ maxWidth: 'max-content' }}
      >
        {tag}
      </EuiBadge>
      {isModalVisible ? (
        <EuiOverlayMask>
          <EuiModal onClose={handleOnCloseModal}>
            <EuiModalHeader>
              <EuiModalHeaderTitle>{title}</EuiModalHeaderTitle>
            </EuiModalHeader>

            <EuiModalBody>
              <EuiDescriptionList
                listItems={[
                  {
                    title: (
                      <FormattedMessage
                        id={`wazuhCheckUpdates.updateModal.publishedDate`}
                        defaultMessage="Published"
                      />
                    ),
                    description: formatUIDate(new Date(published_date)),
                  },
                ]}
              />
              <EuiSpacer />
              <EuiFlexGroup responsive={false} wrap>
                <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
                  <EuiLink href={releaseNotesUrl} target="_blank" external>
                    <FormattedMessage
                      id="wazuhCheckUpdates.updateModal.releaseNotesLink"
                      defaultMessage="Release notes"
                    />
                  </EuiLink>
                </EuiFlexItem>
                <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
                  <EuiLink href={upgradeGuideUrl} target="_blank" external>
                    <FormattedMessage
                      id="wazuhCheckUpdates.updateModal.upgradeGuideLink"
                      defaultMessage="Upgrade guide"
                    />
                  </EuiLink>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer />
              <Markdown markdown={description} openLinksInNewTab />
            </EuiModalBody>

            <EuiModalFooter>
              <EuiButtonEmpty onClick={handleOnCloseModal}>
                <FormattedMessage
                  id={`wazuhCheckUpdates.updateModal.closeModal`}
                  defaultMessage="Close"
                />
              </EuiButtonEmpty>
            </EuiModalFooter>
          </EuiModal>
        </EuiOverlayMask>
      ) : null}
    </I18nProvider>
  );
};
