import React, { useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
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
import { ctiFlowState } from '../../../services/cti-flow-state';
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
  const registrationLost = ctiFlowState.getRegistrationLost();
  // A lost registration is news, not an upsell: it shows until dismissed, once per loss.
  const barHidden = registrationLost
    ? userPreferences.dismissed_cti_registration_lost_at ===
      registrationLost.detected_at
    : Boolean(userPreferences.hide_cti_upsell);
  const shouldShowBar =
    !loading &&
    !isLoadingPreferences &&
    !dismissed &&
    !barHidden &&
    !isRegistered &&
    !modalOpen &&
    !deviceFlowActive &&
    (statusCTI.status === statusCodes.NOT_FOUND ||
      statusCTI.status === statusCodes.REGISTRATION_FAILED);

  const holdsBottomBar =
    !dismissed &&
    !barHidden &&
    !isRegistered &&
    (loading || isLoadingPreferences || modalOpen || shouldShowBar);

  useEffect(() => {
    ctiUpsellBarVisible$.next(holdsBottomBar);
  }, [holdsBottomBar]);

  useEffect(() => () => ctiUpsellBarVisible$.next(false), []);

  const handleDismiss = () => {
    setDismissed(true);
    /* eslint-disable camelcase -- user preferences use snake_case */
    void updateUserPreferences(
      registrationLost
        ? { dismissed_cti_registration_lost_at: registrationLost.detected_at }
        : { hide_cti_upsell: true },
    );
    /* eslint-enable camelcase */
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
            className={`wz-check-updates-bar${
              sideNavDocked ? ' wz-check-updates-bottom-bar' : ''
            }`}
            bodyClassName='wz-check-updates-has-bottom-bar'
            landmarkHeading={i18n.translate(
              'wazuhCheckUpdates.ctiUpsell.landmarkHeading',
              { defaultMessage: 'Wazuh Cloud registration' },
            )}
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
                    <EuiIcon
                      type={registrationLost ? 'alert' : 'globe'}
                      color={registrationLost ? 'warning' : 'ghost'}
                      size='m'
                      aria-hidden
                    />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText color='ghost'>
                      {registrationLost ? (
                        <FormattedMessage
                          id='wazuhCheckUpdates.ctiUpsell.lostBarMessage'
                          defaultMessage='This instance is no longer registered with Wazuh Cloud. It was on the {planName} plan and now gets the Open feed.'
                          values={{ planName: registrationLost.last_plan }}
                        />
                      ) : (
                        <FormattedMessage
                          id='wazuhCheckUpdates.ctiUpsell.barMessage'
                          defaultMessage='Connect your Wazuh environment to the Wazuh Console and unlock Cyber Threat Intelligence.'
                        />
                      )}
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
                      {registrationLost ? (
                        <FormattedMessage
                          id='wazuhCheckUpdates.ctiUpsell.lostDismissButton'
                          defaultMessage='Dismiss'
                        />
                      ) : (
                        <FormattedMessage
                          id='wazuhCheckUpdates.ctiUpsell.dismissButton'
                          defaultMessage="Don't show again"
                        />
                      )}
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
                      {registrationLost ? (
                        <FormattedMessage
                          id='wazuhCheckUpdates.ctiUpsell.registerAgainButton'
                          defaultMessage='Register again'
                        />
                      ) : (
                        <FormattedMessage
                          id='wazuhCheckUpdates.ctiUpsell.registerButton'
                          defaultMessage='Register now'
                        />
                      )}
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
