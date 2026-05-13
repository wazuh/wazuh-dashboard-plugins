import React, { useState } from 'react';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import {
  EuiBottomBar,
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiText,
} from '@elastic/eui';
import { ModalCti } from './modal-cti';
import { useCtiStatus } from '../hooks/useCtiStatus';
import { statusCodes } from '../../../../common/constants';
import { ctiFlowState } from '../../../services/cti-flow-state';
import { getWazuhCore } from '../../../plugin-services';

const UPSELL_DISMISSED_KEY = 'wazuh.cti.upsell.dismissed';

const isDismissed = (): boolean => {
  try {
    return localStorage.getItem(UPSELL_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
};

const persistDismiss = (): void => {
  try {
    localStorage.setItem(UPSELL_DISMISSED_KEY, 'true');
  } catch {
    // ignore storage errors
  }
};

export const CtiUpsellNotification = () => {
  const [dismissed, setDismissed] = useState<boolean>(isDismissed);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [deviceFlowNonce, setDeviceFlowNonce] = useState(0);

  const sideNavDocked = getWazuhCore().hooks.useDockedSideNav();
  const { statusCTI, loading, refetchStatus } = useCtiStatus(deviceFlowNonce);

  const isRegistered = statusCTI.status === statusCodes.SUCCESS;
  const deviceFlowActive =
    Boolean(ctiFlowState.getDeviceCode()) &&
    !ctiFlowState.isRegistrationComplete();

  const shouldShowBar =
    !loading &&
    !dismissed &&
    !isRegistered &&
    !isRegisterModalOpen &&
    !deviceFlowActive &&
    (statusCTI.status === statusCodes.NOT_FOUND ||
      statusCTI.status === statusCodes.REGISTRATION_FAILED);

  const handleDismiss = () => {
    persistDismiss();
    setDismissed(true);
  };

  const handleOpenRegister = () => {
    setIsRegisterModalOpen(true);
  };

  const handleCloseRegister = () => {
    setIsRegisterModalOpen(false);
    void refetchStatus();
  };

  return (
    <I18nProvider>
      <>
        {shouldShowBar && (
          <EuiBottomBar
            className={sideNavDocked ? 'wz-check-updates-bottom-bar' : ''}
            data-test-subj='ctiUpsellBar'
          >
            <EuiFlexGroup
              justifyContent='spaceBetween'
              alignItems='center'
              gutterSize='m'
            >
              <EuiFlexItem grow={false}>
                <EuiFlexGroup gutterSize='s' alignItems='center' responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiIcon type='globe' color='ghost' size='m' aria-hidden />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText color='ghost'>
                      <FormattedMessage
                        id='wazuhCheckUpdates.ctiUpsell.barMessage'
                        defaultMessage='Connect your Wazuh environment to the Wazuh Console and unlock Cyber Threat Intelligence.'
                      />
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiFlexGroup gutterSize='m' alignItems='center' responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      color='ghost'
                      size='s'
                      onClick={handleDismiss}
                      data-test-subj='ctiUpsellDismissButton'
                    >
                      <FormattedMessage
                        id='wazuhCheckUpdates.ctiUpsell.dismissButton'
                        defaultMessage="Don't show again"
                      />
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      fill
                      size='s'
                      iconType='globe'
                      onClick={handleOpenRegister}
                      data-test-subj='ctiUpsellRegisterButton'
                    >
                      <FormattedMessage
                        id='wazuhCheckUpdates.ctiUpsell.registerButton'
                        defaultMessage='Register now'
                      />
                    </EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiBottomBar>
        )}

        {isRegisterModalOpen && (
          <ModalCti
            handleModalToggle={handleCloseRegister}
            statusCTI={statusCTI}
            refetchStatus={refetchStatus}
            onDeviceFlowStarted={() => setDeviceFlowNonce(n => n + 1)}
          />
        )}
      </>
    </I18nProvider>
  );
};
