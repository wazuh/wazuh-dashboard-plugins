import React, { useEffect } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiIcon,
  EuiLink,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiProgress,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { LinkCtiProps, CtiDeviceAuthorization } from '../types';
import { getCore } from '../../../plugin-services';
import { ctiFlowState } from '../../../services/cti-flow-state';
import {
  CTI_DEFAULT_DEVICE_CODE_EXPIRES_IN_SEC,
  CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC,
  routes,
  statusCodes,
} from '../../../../common/constants';
import { CtiDeviceAuthLinks } from './cti-device-auth-links';

export const ModalCti: React.FC<LinkCtiProps> = ({
  handleModalToggle,
  statusCTI,
  refetchStatus,
  onDeviceFlowStarted,
}) => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deviceAuth, setDeviceAuth] =
    React.useState<CtiDeviceAuthorization | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refetchStatus();
      if (cancelled) {
        return;
      }
      setDeviceAuth(ctiFlowState.getDeviceAuthLinks());
    })();
    return () => {
      cancelled = true;
    };
  }, [refetchStatus]);

  useEffect(() => {
    if (statusCTI.status === statusCodes.SUCCESS) {
      setDeviceAuth(null);
    }
    if (statusCTI.status === statusCodes.REGISTRATION_FAILED) {
      setDeviceAuth(null);
    }
  }, [statusCTI.status]);

  const handleStartRegistration = async () => {
    setError(null);
    setLoading(true);
    try {
      /* eslint-disable camelcase -- POST body/response match OAuth device authorization field names */
      const ctiResponse = await getCore().http.post<{
        device_code?: string;
        user_code?: string;
        verification_uri?: string;
        verification_uri_complete?: string;
        interval?: number;
        expires_in?: number;
      }>(routes.token, {
        body: JSON.stringify({}),
      });

      if (
        typeof ctiResponse.device_code === 'string' &&
        ctiResponse.device_code.length > 0
      ) {
        ctiFlowState.setDeviceCode(ctiResponse.device_code);
      }

      const rawInterval = ctiResponse.interval;
      const intervalSec =
        typeof rawInterval === 'number' && rawInterval > 0
          ? rawInterval
          : CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC;
      ctiFlowState.setPollIntervalSec(intervalSec);

      const rawExpires = ctiResponse.expires_in;
      const expiresInSec =
        typeof rawExpires === 'number' && rawExpires > 0
          ? rawExpires
          : CTI_DEFAULT_DEVICE_CODE_EXPIRES_IN_SEC;
      ctiFlowState.setDeviceAuthExpiry(expiresInSec);

      const verificationUri =
        ctiResponse.verification_uri ??
        ctiResponse.verification_uri_complete ??
        '';
      const userCode = ctiResponse.user_code ?? '';
      const verificationUriComplete =
        ctiResponse.verification_uri_complete ??
        (verificationUri && userCode
          ? `${verificationUri}${
              verificationUri.includes('?') ? '&' : '?'
            }user_code=${encodeURIComponent(userCode)}`
          : '');

      const links: CtiDeviceAuthorization = {
        user_code: userCode,
        verification_uri: verificationUri || verificationUriComplete,
        verification_uri_complete: verificationUriComplete,
      };
      setDeviceAuth(links);
      ctiFlowState.setDeviceAuthLinks(links);
      /* eslint-enable camelcase */
      setLoading(false);

      if (verificationUriComplete) {
        window.open(verificationUriComplete, 'wazuh_cti');
      }

      onDeviceFlowStarted?.();
    } catch {
      setLoading(false);
      setError(
        'There was an error connecting to the CTI service. Please try again later.',
      );
    }
  };

  const handleOpenActivationPage = () => {
    if (deviceAuth?.verification_uri_complete) {
      window.open(deviceAuth.verification_uri_complete, 'wazuh_cti');
    }
  };

  const showInProgress =
    Boolean(deviceAuth) &&
    statusCTI.status === statusCodes.NOT_FOUND &&
    !ctiFlowState.isRegistrationComplete();

  const showSuccess = statusCTI.status === statusCodes.SUCCESS;

  const showRegistrationFailed =
    statusCTI.status === statusCodes.REGISTRATION_FAILED;

  const showRegistrationIntro =
    !showSuccess && !showRegistrationFailed && !deviceAuth;

  return (
    <EuiModal onClose={handleModalToggle}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <EuiTitle>
            {showSuccess ? (
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.modalTitleSuccess'
                defaultMessage='CTI updates registration'
              />
            ) : showRegistrationFailed ? (
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.modalTitleFailed'
                defaultMessage='CTI registration'
              />
            ) : deviceAuth ? (
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.modalTitleInProgress'
                defaultMessage='Registration in progress'
              />
            ) : (
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.modalTitle'
                defaultMessage='Do you want to register to CTI updates?'
              />
            )}
          </EuiTitle>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        {showRegistrationIntro ? (
          <EuiText>
            <FormattedMessage
              id='wazuhCheckUpdates.ctiRegistration.modalBodyAdditional'
              defaultMessage='If you register, you will receive updates about CTI changes and improvements. For more information, visit our {documentationCTIWazuh}.'
              values={{
                documentationCTIWazuh: (
                  <EuiLink
                    href='https://cti.wazuh.com/vulnerabilities/cves'
                    target='_blank'
                  >
                    <FormattedMessage
                      id='wazuhCheckUpdates.ctiRegistration.modalBodyAdditionalLink'
                      defaultMessage='documentation'
                    />
                  </EuiLink>
                ),
              }}
            />
          </EuiText>
        ) : null}
        {deviceAuth && !showSuccess && !showRegistrationFailed && (
          <>
            <EuiSpacer size='m' />
            <CtiDeviceAuthLinks deviceAuth={deviceAuth} />
          </>
        )}
        {showInProgress && (
          <>
            <EuiSpacer size='m' />
            <EuiText size='s' color='subdued' data-test-subj='ctiRegistrationInProgress'>
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.inProgress'
                defaultMessage='Registration in progress'
              />
            </EuiText>
            <EuiSpacer size='xs' />
            <div className='ctiRegistrationModalProgress'>
              <EuiProgress size='xs' color='primary' />
            </div>
          </>
        )}
        {showSuccess && (
          <>
            <EuiSpacer size='m' />
            <EuiText color='success' data-test-subj='ctiRegistrationSuccess'>
              <EuiIcon
                type='checkInCircleFilled'
                color='success'
                style={{ marginRight: 8 }}
              />
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.success'
                defaultMessage='Registration successful'
              />
            </EuiText>
            {statusCTI.message ? (
              <>
                <EuiSpacer size='s' />
                <EuiText
                  size='s'
                  color='subdued'
                  data-test-subj='ctiRegistrationSuccessDetail'
                >
                  {statusCTI.message}
                </EuiText>
              </>
            ) : null}
          </>
        )}
        {showRegistrationFailed && (
          <>
            <EuiSpacer size='m' />
            <EuiCallOut
              title={
                <FormattedMessage
                  id='wazuhCheckUpdates.ctiRegistration.failedTitle'
                  defaultMessage='Registration could not be completed'
                />
              }
              color='danger'
              iconType='alert'
            >
              {statusCTI.message ? (
                <EuiText size='s'>{statusCTI.message}</EuiText>
              ) : null}
            </EuiCallOut>
          </>
        )}
        {error && (
          <EuiCallOut
            title={
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.errorTitle'
                defaultMessage='Registration Error'
              />
            }
            color='danger'
            iconType='alert'
            style={{ marginTop: deviceAuth ? 16 : 0, marginBottom: '16px' }}
          >
            <FormattedMessage
              id='wazuhCheckUpdates.ctiRegistration.errorMessage'
              defaultMessage={error}
            />
          </EuiCallOut>
        )}
      </EuiModalBody>

      <EuiModalFooter>
        {showSuccess || showRegistrationFailed ? (
          <EuiButtonEmpty onClick={handleModalToggle}>
            <FormattedMessage
              id='wazuhCheckUpdates.ctiRegistration.modalButtonClose'
              defaultMessage='Close'
            />
          </EuiButtonEmpty>
        ) : deviceAuth ? (
          <>
            <EuiButtonEmpty onClick={handleModalToggle}>
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.modalButtonClose'
                defaultMessage='Close'
              />
            </EuiButtonEmpty>
            <EuiButtonEmpty onClick={handleOpenActivationPage}>
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.openActivationAgain'
                defaultMessage='Open activation page'
              />
            </EuiButtonEmpty>
          </>
        ) : (
          <>
            <EuiButtonEmpty onClick={handleModalToggle}>
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.modalButtonCancel'
                defaultMessage='Cancel'
              />
            </EuiButtonEmpty>
            <EuiButton
              isLoading={loading}
              onClick={handleStartRegistration}
              fill
            >
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.modalButtonRegister'
                defaultMessage='Yes, I want to register'
              />
            </EuiButton>
          </>
        )}
      </EuiModalFooter>
    </EuiModal>
  );
};
