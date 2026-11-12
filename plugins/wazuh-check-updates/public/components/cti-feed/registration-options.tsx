import React, { useCallback, useState } from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiButtonIcon,
  EuiCallOut,
  EuiConfirmModal,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiIcon,
  EuiLink,
  EuiPopover,
  EuiSpacer,
  EuiText,
  EuiTextColor,
  EuiToolTip,
} from '@elastic/eui';
import { WAZUH_CTI_CONSOLE_HREF } from '../../../common/constants';
import { getHttpErrorMessage } from '../../../common/http-error';
import { clearCtiRegistration } from '../../services/cti-registration-status';
import { getCore } from '../../plugin-services';

const OPTIONS_LABEL = i18n.translate(
  'wazuhCheckUpdates.ctiFeed.subscription.options.ariaLabel',
  { defaultMessage: 'Registration options' },
);

const CLEAR_ACTION_LABEL = i18n.translate(
  'wazuhCheckUpdates.ctiFeed.subscription.options.clearLocalRegistration',
  { defaultMessage: 'Clear local registration' },
);

export interface ClearRegistrationModalProps {
  onCancel: () => void;
  /** Called once the indexer no longer holds the registration. */
  onCleared: () => void;
}

/**
 * Confirms clearing the registration stored in the indexer, and says what it does not
 * do: the environment stays registered in the CTI console.
 */
export const ClearRegistrationModal: React.FC<ClearRegistrationModalProps> = ({
  onCancel,
  onCleared,
}) => {
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConfirm = useCallback(async () => {
    setClearing(true);
    setError(null);
    try {
      await clearCtiRegistration();
    } catch (requestError) {
      setError(
        getHttpErrorMessage(requestError) ??
          i18n.translate(
            'wazuhCheckUpdates.ctiFeed.subscription.clearModal.error',
            { defaultMessage: 'The local registration could not be cleared.' },
          ),
      );
      setClearing(false);
      return;
    }
    getCore().notifications.toasts.addSuccess(
      i18n.translate(
        'wazuhCheckUpdates.ctiFeed.subscription.clearModal.success',
        { defaultMessage: 'The local registration was cleared.' },
      ),
    );
    onCleared();
  }, [onCleared]);

  return (
    <EuiConfirmModal
      title={i18n.translate(
        'wazuhCheckUpdates.ctiFeed.subscription.clearModal.title',
        { defaultMessage: 'Clear the local registration?' },
      )}
      onCancel={onCancel}
      onConfirm={onConfirm}
      cancelButtonText={i18n.translate(
        'wazuhCheckUpdates.ctiFeed.subscription.clearModal.cancel',
        { defaultMessage: 'Cancel' },
      )}
      confirmButtonText={CLEAR_ACTION_LABEL}
      buttonColor='danger'
      defaultFocusedButton='cancel'
      isLoading={clearing}
      data-test-subj='ctiFeedClearRegistrationModal'
    >
      <EuiText size='s'>
        <p>
          {i18n.translate(
            'wazuhCheckUpdates.ctiFeed.subscription.clearModal.body',
            {
              defaultMessage:
                'This removes the CTI credentials stored in the indexer. This environment stops receiving the Professional feed and switches to the free Open feed on the next sync. Content already here stays until that sync.',
            },
          )}
        </p>
      </EuiText>
      <EuiSpacer size='m' />
      <EuiCallOut
        color='warning'
        iconType='alert'
        size='s'
        title={i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.clearModal.warningTitle',
          {
            defaultMessage:
              'This does not unregister the environment from the CTI console',
          },
        )}
        data-test-subj='ctiFeedClearRegistrationWarning'
      >
        <p>
          {i18n.translate(
            'wazuhCheckUpdates.ctiFeed.subscription.clearModal.warningConsole',
            {
              defaultMessage:
                'Its deployment, and any subscription assigned to it, stay in the CTI console.',
            },
          )}
        </p>
        <p>
          <FormattedMessage
            id='wazuhCheckUpdates.ctiFeed.subscription.clearModal.warningChanges'
            defaultMessage='Any change to the CTI console registration or to the plan must be made in the CTI console: {consoleLink}.'
            values={{
              consoleLink: (
                <EuiLink
                  href={WAZUH_CTI_CONSOLE_HREF}
                  target='_blank'
                  rel='noopener noreferrer'
                  external
                  data-test-subj='ctiFeedClearRegistrationConsoleLink'
                >
                  <FormattedMessage
                    id='wazuhCheckUpdates.ctiFeed.subscription.clearModal.consoleLink'
                    defaultMessage='Open the CTI console'
                  />
                </EuiLink>
              ),
            }}
          />
        </p>
        <p>
          {i18n.translate(
            'wazuhCheckUpdates.ctiFeed.subscription.clearModal.warningRegisterAgain',
            {
              defaultMessage:
                'To register this environment again, first delete its deployment in the CTI console. Until then the console answers that the environment already exists.',
            },
          )}
        </p>
      </EuiCallOut>
      {error ? (
        <>
          <EuiSpacer size='m' />
          <EuiCallOut
            color='danger'
            iconType='alert'
            size='s'
            title={error}
            data-test-subj='ctiFeedClearRegistrationError'
          />
        </>
      ) : null}
    </EuiConfirmModal>
  );
};

export interface RegistrationOptionsProps {
  /** Called once the local registration was cleared, to refresh the page. */
  onCleared: () => void;
}

/**
 * Menu in the corner of the Subscription card. Its only action clears the registration
 * stored in the indexer, after a confirmation.
 */
export const RegistrationOptions: React.FC<RegistrationOptionsProps> = ({
  onCleared,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const openModal = useCallback(() => {
    setIsMenuOpen(false);
    setIsModalOpen(true);
  }, []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);
  const handleCleared = useCallback(() => {
    setIsModalOpen(false);
    onCleared();
  }, [onCleared]);

  return (
    <>
      <EuiPopover
        button={
          <EuiToolTip content={OPTIONS_LABEL}>
            <EuiButtonIcon
              iconType='boxesVertical'
              onClick={() => setIsMenuOpen(open => !open)}
              aria-label={OPTIONS_LABEL}
              data-test-subj='ctiFeedRegistrationOptions'
            />
          </EuiToolTip>
        }
        isOpen={isMenuOpen}
        closePopover={closeMenu}
        panelPaddingSize='none'
        anchorPosition='downRight'
      >
        <EuiContextMenuPanel
          size='s'
          items={[
            <EuiContextMenuItem
              key='clearLocalRegistration'
              icon={<EuiIcon type='trash' color='danger' />}
              onClick={openModal}
              data-test-subj='ctiFeedClearRegistrationAction'
            >
              <EuiTextColor color='danger'>{CLEAR_ACTION_LABEL}</EuiTextColor>
            </EuiContextMenuItem>,
          ]}
        />
      </EuiPopover>
      {isModalOpen ? (
        <ClearRegistrationModal
          onCancel={closeModal}
          onCleared={handleCleared}
        />
      ) : null}
    </>
  );
};
