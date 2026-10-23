import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiButton } from '@elastic/eui';
import { getCore } from '../../plugin-services';
import { requestCtiContentUpdate } from '../../services/cti-feed';

export interface CheckForUpdatesButtonProps {
  /** Runs after a successful request; the button waits for it to settle. */
  onRequested: () => void | Promise<void>;
  /** Filled only where checking is the main action, not a secondary one. */
  fill?: boolean;
  dataTestSubj?: string;
}

export const CheckForUpdatesButton: React.FC<CheckForUpdatesButtonProps> = ({
  onRequested,
  fill = false,
  dataTestSubj = 'ctiFeedCheckForUpdatesButton',
}) => {
  const [requesting, setRequesting] = useState(false);

  const handleClick = async () => {
    setRequesting(true);
    const { toasts } = getCore().notifications;
    try {
      await requestCtiContentUpdate();
      toasts.addSuccess({
        title: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.checkForUpdatesButton.successToastTitle',
          { defaultMessage: 'Checking for updates' },
        ),
        text: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.checkForUpdatesButton.successToastText',
          {
            defaultMessage:
              'The indexer is checking Wazuh CTI for new content. New content can take a few minutes to sync: refresh the feed sync to see it.',
          },
        ),
        toastLifeTimeMs: 5000,
      });
      await onRequested();
    } catch (error) {
      toasts.addError(error as Error, {
        title: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.checkForUpdatesButton.errorToastTitle',
          { defaultMessage: 'Could not check for updates' },
        ),
      });
    } finally {
      setRequesting(false);
    }
  };

  return (
    <EuiButton
      fill={fill}
      iconType='refresh'
      isLoading={requesting}
      onClick={handleClick}
      data-test-subj={dataTestSubj}
    >
      {i18n.translate('wazuhCheckUpdates.ctiFeed.checkForUpdatesButton.label', {
        defaultMessage: 'Check for updates',
      })}
    </EuiButton>
  );
};
