import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonIcon,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiSpacer,
  EuiSteps,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';

const TITLE_ID = 'ctiFeedCheckForUpdatesAboutTitle';

const BUTTON_LABEL = i18n.translate(
  'wazuhCheckUpdates.ctiFeed.checkForUpdatesAbout.buttonLabel',
  { defaultMessage: 'How Check for updates works' },
);

/** An (i) button next to Check for updates, opening how the check works. */
export const CheckForUpdatesAbout: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <EuiToolTip content={BUTTON_LABEL}>
        <EuiButtonIcon
          iconType='iInCircle'
          aria-label={BUTTON_LABEL}
          aria-haspopup='dialog'
          onClick={() => setIsOpen(true)}
          data-test-subj='ctiFeedCheckForUpdatesAboutButton'
        />
      </EuiToolTip>
      {isOpen ? (
        <EuiFlyout
          onClose={() => setIsOpen(false)}
          size='s'
          ownFocus
          aria-labelledby={TITLE_ID}
          data-test-subj='ctiFeedCheckForUpdatesAboutFlyout'
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size='s'>
              <h2 id={TITLE_ID}>
                {i18n.translate(
                  'wazuhCheckUpdates.ctiFeed.checkForUpdatesAbout.title',
                  { defaultMessage: 'About Check for updates' },
                )}
              </h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiText size='s'>
              <p>
                {i18n.translate(
                  'wazuhCheckUpdates.ctiFeed.checkForUpdatesAbout.intro',
                  {
                    defaultMessage:
                      'Check for updates asks the indexer to look for new threat intelligence in Wazuh Cyber Threat Intelligence right away, instead of waiting for its next automatic check.',
                  },
                )}
              </p>
            </EuiText>
            <EuiSpacer size='l' />
            <EuiSteps
              titleSize='xs'
              steps={[
                {
                  title: i18n.translate(
                    'wazuhCheckUpdates.ctiFeed.checkForUpdatesAbout.checkTitle',
                    { defaultMessage: 'Checks for new content' },
                  ),
                  children: (
                    <EuiText size='s'>
                      <p>
                        {i18n.translate(
                          'wazuhCheckUpdates.ctiFeed.checkForUpdatesAbout.checkBody',
                          {
                            defaultMessage:
                              'The indexer asks whether each feed has new content, and saves the time of the check in Last checked.',
                          },
                        )}
                      </p>
                    </EuiText>
                  ),
                },
                {
                  title: i18n.translate(
                    'wazuhCheckUpdates.ctiFeed.checkForUpdatesAbout.updateTitle',
                    { defaultMessage: 'Updates what changed' },
                  ),
                  children: (
                    <EuiText size='s'>
                      <p>
                        {i18n.translate(
                          'wazuhCheckUpdates.ctiFeed.checkForUpdatesAbout.updateBody',
                          {
                            defaultMessage:
                              'Each feed with new content is updated, and its Last updated time changes. Feeds without new content are left as they are, so a check that finds nothing only changes Last checked.',
                          },
                        )}
                      </p>
                    </EuiText>
                  ),
                },
              ]}
            />
            <EuiTitle size='xs'>
              <h3>
                {i18n.translate(
                  'wazuhCheckUpdates.ctiFeed.checkForUpdatesAbout.goodToKnowTitle',
                  { defaultMessage: 'Good to know' },
                )}
              </h3>
            </EuiTitle>
            <EuiSpacer size='s' />
            <EuiText size='s'>
              <ul>
                <li>
                  {i18n.translate(
                    'wazuhCheckUpdates.ctiFeed.checkForUpdatesAbout.automatic',
                    {
                      defaultMessage:
                        'The indexer also checks on its own, every hour by default.',
                    },
                  )}
                </li>
                <li>
                  {i18n.translate(
                    'wazuhCheckUpdates.ctiFeed.checkForUpdatesAbout.background',
                    {
                      defaultMessage:
                        'Updates run in the background and can take a few minutes. Detection keeps using the current content until they finish. Refresh Feed sync to follow them.',
                    },
                  )}
                </li>
              </ul>
            </EuiText>
          </EuiFlyoutBody>
        </EuiFlyout>
      ) : null}
    </>
  );
};
