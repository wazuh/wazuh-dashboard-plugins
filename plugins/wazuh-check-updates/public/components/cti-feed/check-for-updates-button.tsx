import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiButton, EuiToolTip } from '@elastic/eui';
import { getCore } from '../../plugin-services';
import { requestCtiContentUpdate } from '../../services/cti-feed';
import { withHttpErrorBodyMessage } from '../../../common/http-error';

export interface CheckForUpdatesButtonProps {
  /** Runs after a successful request; the button waits for it to settle. */
  onRequested: () => void | Promise<void>;
  /** Filled only where checking is the main action, not a secondary one. */
  fill?: boolean;
  dataTestSubj?: string;
  /**
   * A feed is syncing (a check, or the content update a registration or plan change
   * starts): the indexer would reject another check, so the button waits for it.
   */
  updateInProgress?: boolean;
}

/** The indexer answers 409 while a content update is already running. */
function isUpdateAlreadyRunning(error: unknown): boolean {
  const { response, body } = (error ?? {}) as {
    response?: { status?: number };
    body?: { statusCode?: number };
  };
  return response?.status === 409 || body?.statusCode === 409;
}

export const CheckForUpdatesButton: React.FC<CheckForUpdatesButtonProps> = ({
  onRequested,
  fill = false,
  dataTestSubj = 'ctiFeedCheckForUpdatesButton',
  updateInProgress = false,
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
      toasts.addError(withHttpErrorBodyMessage(error), {
        title: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.checkForUpdatesButton.errorToastTitle',
          { defaultMessage: 'Could not check for updates' },
        ),
      });
      // Read the sync state, so the running update shows and the button waits for it.
      if (isUpdateAlreadyRunning(error)) {
        await onRequested();
      }
    } finally {
      setRequesting(false);
    }
  };

  const button = (
    <EuiButton
      fill={fill}
      iconType='refresh'
      isLoading={requesting}
      isDisabled={updateInProgress && !requesting}
      onClick={handleClick}
      data-test-subj={dataTestSubj}
    >
      {i18n.translate('wazuhCheckUpdates.ctiFeed.checkForUpdatesButton.label', {
        defaultMessage: 'Check for updates',
      })}
    </EuiButton>
  );

  if (!updateInProgress || requesting) {
    return button;
  }

  return (
    // On the left, so it does not cover the last check time under the button.
    <EuiToolTip
      position='left'
      content={i18n.translate(
        'wazuhCheckUpdates.ctiFeed.checkForUpdatesButton.updateInProgressTooltip',
        {
          defaultMessage:
            'A content update is in progress. Check for updates again once the feeds finish syncing.',
        },
      )}
      data-test-subj={`${dataTestSubj}InProgressTooltip`}
    >
      {button}
    </EuiToolTip>
  );
};
