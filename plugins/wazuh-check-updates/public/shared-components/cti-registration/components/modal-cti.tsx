import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCode,
  EuiCopy,
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
import { LinkCtiProps } from '../types';
import { getCore } from '../../../plugin-services';
import { routes } from '../../../../common/constants';

type DeviceAuthorizationDisplay = {
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
};

export const ModalCti: React.FC<LinkCtiProps> = ({
  handleModalToggle,
  handleStatusModalToggle,
}) => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deviceAuth, setDeviceAuth] =
    React.useState<DeviceAuthorizationDisplay | null>(null);

  const handleStartRegistration = async () => {
    setError(null);
    setLoading(true);
    try {
      /* Device authorization: server proxies to CTI Console (Imposter in dev).
       * See docker/imposter/cti/README.md — POST /api/v1/platform/environments/token */
      /* eslint-disable camelcase -- POST body/response match OAuth device authorization field names */
      const ctiResponse = await getCore().http.post<{
        user_code?: string;
        verification_uri?: string;
        verification_uri_complete?: string;
      }>(routes.token, {
        body: JSON.stringify({}),
      });

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
    } catch {
      setLoading(false);
      setError(
        'There was an error connecting to the CTI service. Please try again later.',
      );
    }
  };

  const handleContinueToStatus = () => {
    handleStatusModalToggle?.();
    handleModalToggle();
  };

  const handleOpenActivationPage = () => {
    if (deviceAuth?.verification_uri_complete) {
      window.open(deviceAuth.verification_uri_complete, 'wazuh_cti');
    }
  };

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
            <EuiCallOut
              title={
                <FormattedMessage
                  id='wazuhCheckUpdates.ctiRegistration.deviceAuthTitle'
                  defaultMessage='Complete registration in your browser'
                />
              }
              color='primary'
              iconType='globe'
            >
              <EuiText size='s'>
                <FormattedMessage
                  id='wazuhCheckUpdates.ctiRegistration.userCodeLabel'
                  defaultMessage='Your verification code:'
                />
              </EuiText>
              <EuiSpacer size='xs' />
              <EuiCode data-test-subj='ctiDeviceUserCode'>
                {deviceAuth.user_code}
              </EuiCode>
              <EuiSpacer size='m' />
              <EuiText size='s'>
                <FormattedMessage
                  id='wazuhCheckUpdates.ctiRegistration.verificationLinkLabel'
                  defaultMessage='Activation page:'
                />{' '}
                <EuiLink
                  href={deviceAuth.verification_uri_complete}
                  target='_blank'
                  rel='noopener noreferrer'
                  data-test-subj='ctiDeviceVerificationLink'
                >
                  {deviceAuth.verification_uri}
                </EuiLink>
              </EuiText>
              <EuiSpacer size='s' />
              <EuiText size='xs' color='subdued' style={{ wordBreak: 'break-all' }}>
                {deviceAuth.verification_uri_complete}
              </EuiText>
              <EuiSpacer size='s' />
              <EuiCopy textToCopy={deviceAuth.verification_uri_complete}>
                {(copy: () => void) => (
                  <EuiButtonEmpty
                    size='xs'
                    iconType='copyClipboard'
                    onClick={copy}
                    data-test-subj='ctiCopyVerificationUrl'
                  >
                    <FormattedMessage
                      id='wazuhCheckUpdates.ctiRegistration.copyActivationUrl'
                      defaultMessage='Copy activation URL'
                    />
                  </EuiButtonEmpty>
                )}
              </EuiCopy>
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
            <EuiButton onClick={handleContinueToStatus} fill>
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.continueToStatus'
                defaultMessage='Continue to status'
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
