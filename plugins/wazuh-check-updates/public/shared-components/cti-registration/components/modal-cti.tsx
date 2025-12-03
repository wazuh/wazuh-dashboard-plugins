import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiLink,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiText,
  EuiTitle,
  EuiCallOut,
} from '@elastic/eui';
import { LinkCtiProps } from '../types';
import { getCore } from '../../../plugin-services';
import { routes } from '../../../../common/constants';
import { Cookies } from 'react-cookie';

export const ModalCti: React.FC = ({
  handleModalToggle,
  handleStatusModalToggle,
}: LinkCtiProps) => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleButtonClick = async () => {
    setLoading(true);
    try {
      const cookie = new Cookies();
      const currentApiId = JSON.parse(decodeURI(cookie.get('currentApi')))?.id;

      const ctiResponse = await getCore().http.post(routes.token, {
        body: JSON.stringify({
          currentApiId: currentApiId,
        }),
      });

      setLoading(false);
      window.open(ctiResponse.verification_uri_complete, 'wazuh_cti');
      handleStatusModalToggle?.();
      handleModalToggle();
    } catch (err) {
      setLoading(false);
      setError(
        'There was an error connecting to the CTI service. Please try again later.',
      );
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
            style={{ marginBottom: '16px' }}
          >
            <FormattedMessage
              id='wazuhCheckUpdates.ctiRegistration.errorMessage'
              defaultMessage={error}
            />
          </EuiCallOut>
        )}
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={handleModalToggle}>
          <FormattedMessage
            id='wazuhCheckUpdates.ctiRegistration.modalButtonCancel'
            defaultMessage='Cancel'
          />
        </EuiButtonEmpty>
        <EuiButton isLoading={loading} onClick={handleButtonClick} fill>
          <FormattedMessage
            id='wazuhCheckUpdates.ctiRegistration.modalButtonRegister'
            defaultMessage='Yes, I want to register'
          />
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
