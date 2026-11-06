import React from 'react';
import {
  EuiCode,
  EuiDescriptionList,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { AboutFlyoutButton } from '../../common/flyouts/about-flyout-button';
import {
  CTI_IOCS_PATTERN,
  CTI_VULNERABILITIES_PATTERN,
} from '../../../../common/cti-explorer/constants';

/** Page of the CTI feed in the documentation (published in 5.0-rc). */
export const CTI_EXPLORER_DOCS_PATH = 'wazuh-cti/index.html';

export const AboutCtiExplorer = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.ctiExplorer.aboutFlyout.title', {
      defaultMessage: 'About CTI Explorer',
    })}
    testSubj='CtiExplorer'
    docsPath={CTI_EXPLORER_DOCS_PATH}
  >
    <EuiText size='s'>
      <p>
        {i18n.translate('wazuh.ctiExplorer.aboutFlyout.whatItShows', {
          defaultMessage:
            'CTI Explorer shows what the Cyber Threat Intelligence (CTI) feed delivered to the indexer: the indicators of compromise (IOCs) that malware detection matches events against, and the vulnerability records that vulnerability detection scores packages with. It shows feed knowledge only: to find the events that matched an IOC, hunt for it in Threat Hunting.',
        })}
      </p>
    </EuiText>
    <EuiSpacer size='m' />
    <EuiTitle size='xs'>
      <h3>
        {i18n.translate('wazuh.ctiExplorer.aboutFlyout.indicesTitle', {
          defaultMessage: 'Indices',
        })}
      </h3>
    </EuiTitle>
    <EuiSpacer size='s' />
    <EuiDescriptionList
      compressed
      listItems={[
        {
          title: <EuiCode>{CTI_IOCS_PATTERN}</EuiCode>,
          description: i18n.translate(
            'wazuh.ctiExplorer.aboutFlyout.iocsIndex',
            {
              defaultMessage:
                'One record per IOC and provider: malicious domains, URLs, host:port pairs and file hashes. Read by the Overview and IOCs tabs.',
            },
          ),
        },
        {
          title: <EuiCode>{CTI_VULNERABILITIES_PATTERN}</EuiCode>,
          description: i18n.translate(
            'wazuh.ctiExplorer.aboutFlyout.vulnerabilitiesIndex',
            {
              defaultMessage:
                'CVE records and translation rules (TID). The records are stored without being indexed, so they are listed newest first and opened by their full id, but their content cannot be searched. Read by the Vulnerabilities tab.',
            },
          ),
        },
      ]}
    />
    <EuiSpacer size='m' />
    <EuiTitle size='xs'>
      <h3>
        {i18n.translate('wazuh.ctiExplorer.aboutFlyout.matchingTitle', {
          defaultMessage: 'Checking a value',
        })}
      </h3>
    </EuiTitle>
    <EuiSpacer size='s' />
    <EuiText size='s'>
      <p>
        {i18n.translate('wazuh.ctiExplorer.aboutFlyout.matching', {
          defaultMessage:
            'A value matches when it equals a catalog value, ignoring case. An IP address also matches its host:port records, and a URL also matches the domain of its host. A value that is not found is only absent from the catalog: it is not a verdict that the value is safe.',
        })}
      </p>
      <p>
        {i18n.translate('wazuh.ctiExplorer.aboutFlyout.permissions', {
          defaultMessage:
            'The page reads both indices as your user. A section that your user cannot read names its index, and the rest of the page keeps working.',
        })}
      </p>
    </EuiText>
  </AboutFlyoutButton>
);
