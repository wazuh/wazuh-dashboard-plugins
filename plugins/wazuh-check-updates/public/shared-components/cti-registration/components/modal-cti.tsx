import React, { useEffect } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiHealth,
  EuiLink,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { LinkCtiProps, CtiDeviceAuthorization } from '../types';
import { getCore } from '../../../plugin-services';
import { ctiFlowState } from '../../../services/cti-flow-state';
import { routes, statusCodes } from '../../../../common/constants';
import { statusData } from '../../../../common/cti-status-config';
import { CtiDeviceAuthLinks } from './cti-device-auth-links';

function statusRowForCode(status: number) {
  const entry =
    status in statusData
      ? statusData[status as keyof typeof statusData]
      : statusData[statusCodes.NOT_FOUND];
  return entry;
}

export const ModalCti: React.FC<LinkCtiProps> = ({
  handleModalToggle,
  statusCTI,
  refetchStatus,
  statusCheckLoading = false,
}) => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] =
    React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deviceAuth, setDeviceAuth] =
    React.useState<CtiDeviceAuthorization | null>(null);

  useEffect(() => {
    refetchStatus();
  }, [refetchStatus]);

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
      }>(routes.token, {
        body: JSON.stringify({}),
      });

      if (
        typeof ctiResponse.device_code === 'string' &&
        ctiResponse.device_code.length > 0
      ) {
        ctiFlowState.setDeviceCode(ctiResponse.device_code);
      }

      const verificationUri =
        ctiResponse.verification_uri ?? ctiResponse.verification_uri_complete ?? '';
      const userCode = ctiResponse.user_code ?? '';
      const verificationUriComplete =
        ctiResponse.verification_uri_complete ??
        (verificationUri && userCode
          ? `${verificationUri}${
              verificationUri.includes('?') ? '&' : '?'
            }user_code=${encodeURIComponent(userCode)}`
          : '');

      setDeviceAuth({
        user_code: userCode,
        verification_uri: verificationUri || verificationUriComplete,
        verification_uri_complete: verificationUriComplete,
      });
      /* eslint-enable camelcase */
      setLoading(false);

      if (verificationUriComplete) {
        window.open(verificationUriComplete, 'wazuh_cti');
      }

      await refetchStatus();
    } catch {
      setLoading(false);
      setError(
        'There was an error connecting to the CTI service. Please try again later.',
      );
    }
  };

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    try {
      await refetchStatus();
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleOpenActivationPage = () => {
    if (deviceAuth?.verification_uri_complete) {
      window.open(deviceAuth.verification_uri_complete, 'wazuh_cti');
    }
  };

  const statusRow = statusRowForCode(statusCTI.status);

  return (
    <EuiModal onClose={handleModalToggle}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <EuiTitle>
            <FormattedMessage
              id='wazuhCheckUpdates.ctiRegistration.modalTitle'
              defaultMessage='Do you want to register to CTI updates?'
            />
          </EuiTitle>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
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
        {deviceAuth && (
          <>
            <EuiSpacer size='m' />
            <CtiDeviceAuthLinks deviceAuth={deviceAuth} />
            <EuiSpacer size='m' />
            <EuiText>
              <EuiHealth
                aria-label={statusRow.onClickAriaLabel}
                color={statusRow.color}
              >
                {statusRow.message()}
              </EuiHealth>
            </EuiText>
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
        {deviceAuth ? (
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
            <EuiButton
              onClick={() => {
                void handleCheckStatus();
              }}
              fill
              isLoading={isCheckingStatus || statusCheckLoading}
            >
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.statusModalCheckStatus'
                defaultMessage='Check status'
              />
            </EuiButton>
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
