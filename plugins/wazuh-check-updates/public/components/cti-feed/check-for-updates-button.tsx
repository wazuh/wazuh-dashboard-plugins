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
  /**
   * An update is known to be running: the check was accepted, or the indexer answered
   * that one was already in progress. The page then treats it as in progress before
   * any feed shows it syncing.
   */
  onUpdateRunning?: () => void;
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
  onUpdateRunning,
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
              'The indexer is checking Wazuh CTI for new content. New content can take a few minutes to sync; Feed sync shows its progress.',
          },
        ),
        toastLifeTimeMs: 5000,
      });
      onUpdateRunning?.();
      await onRequested();
    } catch (error) {
      // Not a failure: the update this click asked for is already running. Show it as
      // running, as if the page had seen it start, instead of an error.
      if (isUpdateAlreadyRunning(error)) {
        onUpdateRunning?.();
        await onRequested();
        return;
      }
      toasts.addError(withHttpErrorBodyMessage(error), {
        title: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.checkForUpdatesButton.errorToastTitle',
          { defaultMessage: 'Could not check for updates' },
        ),
      });
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
