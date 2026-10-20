import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { useCtiStatus } from '../hooks/useCtiStatus';
import { statusCodes } from '../../../../common/constants';
import {
  CTI_FEED_APP_ID,
  CtiFeedLocationState,
} from '../../../../common/cti-feed';
import { getCore } from '../../../plugin-services';
import { ctiUpsellBarVisible$ } from '../../../services/cti-upsell-bar-state';
import { useUserPreferences } from '../../../hooks';

export const CtiUpsellNotification = () => {
  const [dismissed, setDismissed] = useState(false);

  const { statusCTI, loading, deviceFlowActive, modalOpen } = useCtiStatus();
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

  // Registration lives in the CTI feed app, which opens its modal on arrival.
  const handleOpenRegister = () => {
    const state: CtiFeedLocationState = { openRegistration: true };
    void getCore().application.navigateToApp(CTI_FEED_APP_ID, { state });
  };

  return (
    <I18nProvider>
      <>
        {/* Sticky in the app wrapper, as OSD does: the bar takes its own space
            instead of padding the body, so views that fit do not scroll. */}
        {shouldShowBar &&
          createPortal(
            <EuiBottomBar
              position='sticky'
              className='wz-check-updates-bar'
              landmarkHeading={i18n.translate(
                'wazuhCheckUpdates.ctiUpsell.landmarkHeading',
                {
                  defaultMessage:
                    'Wazuh Cyber Threat Intelligence registration',
                },
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
                        type='globe'
                        color='ghost'
                        size='m'
                        aria-hidden
                      />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText color='ghost'>
                        <FormattedMessage
                          id='wazuhCheckUpdates.ctiUpsell.barMessage'
                          defaultMessage='The open source Cyber Threat Intelligence feed is already included. Connect to the Wazuh Console to add the Pro feed.'
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
            </EuiBottomBar>,
            document.getElementById('app-wrapper') ?? document.body,
          )}
      </>
    </I18nProvider>
  );
};
