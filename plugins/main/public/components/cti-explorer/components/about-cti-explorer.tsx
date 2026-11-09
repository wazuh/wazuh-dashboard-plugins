import React from 'react';
import { EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { AboutFlyoutButton } from '../../common/flyouts/about-flyout-button';
import { DOCS_PATHS } from '../../../../common/services/docs-paths';

export const AboutCtiExplorer = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.ctiExplorer.aboutFlyout.title', {
      defaultMessage: 'About CTI Explorer',
    })}
    testSubj='CtiExplorer'
    docsPath={DOCS_PATHS.ctiExplorer}
    overview={
      <p>
        {i18n.translate('wazuh.ctiExplorer.aboutFlyout.whatItShows', {
          defaultMessage:
            'CTI Explorer shows what the Cyber Threat Intelligence (CTI) feed delivered to the indexer: the indicators of compromise (IOCs) that malware detection matches events against, and the vulnerability records that vulnerability detection scores packages with. It shows feed knowledge only: to find the events that matched an IOC, hunt for it in Threat Hunting.',
        })}
      </p>
    }
    extraSections={[
      {
        title: i18n.translate('wazuh.ctiExplorer.aboutFlyout.matchingTitle', {
          defaultMessage: 'Checking a value',
        }),
        content: (
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
                  'The page reads the CTI indices as your user. A section that your user cannot read names its index, and the rest of the page keeps working.',
              })}
            </p>
          </EuiText>
        ),
      },
    ]}
  />
);
