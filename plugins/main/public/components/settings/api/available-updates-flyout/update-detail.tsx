import React from 'react';
import { Update } from '../../../../../../wazuh-check-updates/common/types';
import { Markdown } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  EuiAccordion,
  EuiDescriptionList,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiBadge,
  EuiTitle,
} from '@elastic/eui';
import { getWazuhCorePlugin } from '../../../../kibana-services';

interface UpdateDetailProps {
  update: Partial<Update>;
  type: string;
}

export const UpdateDetail = ({ update, type }: UpdateDetailProps) => {
  const { tag, title, semver, published_date, description } = update;

  const hasVersions =
    semver?.major &&
    (semver?.minor || semver?.minor === 0) &&
    (semver?.patch || semver?.patch === 0);
  const minorVersion = hasVersions
    ? `${semver.major}.${semver.minor}`
    : undefined;
  const releaseNotesUrl = hasVersions
    ? `https://documentation.wazuh.com/current/release-notes/release-${semver.major}-${semver.minor}-${semver.patch}.html`
    : undefined;
  const upgradeGuideUrl = hasVersions
    ? `https://documentation.wazuh.com/${minorVersion}/upgrade-guide/index.html`
    : undefined;

  return title && tag ? (
    <EuiAccordion
      id={tag}
      className='euiAccordionForm'
      buttonClassName='euiAccordionForm__button'
      buttonContent={
        <EuiFlexGroup alignItems='center' responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiTitle size='s' className='euiAccordionForm__title'>
              <h3>{title}</h3>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge color='hollow'>{type}</EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
      }
      paddingSize='l'
    >
      {published_date ? (
        <>
          <EuiDescriptionList
            listItems={[
              {
                title: 'Published',
                description:
                  getWazuhCorePlugin().utils.formatUIDate(published_date),
              },
            ]}
          />
          <EuiSpacer />
        </>
      ) : null}
      {hasVersions ? (
        <>
          <EuiFlexGroup responsive={false} wrap>
            <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
              <EuiLink href={releaseNotesUrl} target='_blank' external>
                Release notes
              </EuiLink>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
              <EuiLink href={upgradeGuideUrl} target='_blank' external>
                Upgrade guide
              </EuiLink>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer />
        </>
      ) : null}
      {description ? (
        <Markdown markdown={description} openLinksInNewTab />
      ) : null}
    </EuiAccordion>
  ) : null;
};
