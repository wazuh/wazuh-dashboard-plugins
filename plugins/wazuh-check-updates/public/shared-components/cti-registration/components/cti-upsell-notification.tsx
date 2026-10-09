import React, { useEffect, useState } from 'react';
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
import { ctiUpsellBarVisible$ } from '../../../services/cti-upsell-bar-state';
import { getWazuhCore } from '../../../plugin-services';
import { useUserPreferences } from '../../../hooks';

export const CtiUpsellNotification = () => {
  const [dismissed, setDismissed] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [deviceFlowNonce, setDeviceFlowNonce] = useState(0);

  const sideNavDocked = getWazuhCore().hooks.useDockedSideNav();
  const { statusCTI, loading, deviceFlowActive, modalOpen, refetchStatus } =
    useCtiStatus(deviceFlowNonce);
  const {
    userPreferences,
    isLoading: isLoadingPreferences,
    updateUserPreferences,
  } = useUserPreferences();

  const isRegistered = statusCTI.status === statusCodes.SUCCESS;
  const shouldShowBar =
    !loading &&
    !isLoadingPreferences &&
    !dismissed &&
    !userPreferences.hide_cti_upsell &&
    !isRegistered &&
    !modalOpen &&
    !deviceFlowActive &&
    (statusCTI.status === statusCodes.NOT_FOUND ||
      statusCTI.status === statusCodes.REGISTRATION_FAILED);

  const holdsBottomBar =
    !dismissed &&
    !userPreferences.hide_cti_upsell &&
    !isRegistered &&
    (loading || isLoadingPreferences || modalOpen || shouldShowBar);

  useEffect(() => {
    ctiUpsellBarVisible$.next(holdsBottomBar);
  }, [holdsBottomBar]);

  useEffect(() => () => ctiUpsellBarVisible$.next(false), []);

  const handleDismiss = () => {
    setDismissed(true);
    void updateUserPreferences({ hide_cti_upsell: true });
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
                <EuiFlexGroup
                  gutterSize='s'
                  alignItems='center'
                  responsive={false}
                >
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
                <EuiFlexGroup
                  gutterSize='m'
                  alignItems='center'
                  responsive={false}
                >
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
