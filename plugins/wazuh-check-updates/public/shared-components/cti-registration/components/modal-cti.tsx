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
} from '@elastic/eui';
import { LinkCtiProps } from '../types';

export const ModalCti: React.FC<LinkCtiProps> = ({
  handleModalToggle,
  handleStatusModalToggle,
}) => {
  const [loading, setLoading] = React.useState<boolean>(false);

  const handleButtonClick = () => {
    setLoading(true);

    // TODO: Replace with actual API call to start CTI registration
    setTimeout(() => {
      const ctiResponse = {
        device_code: 'test_device_code',
        user_code: 'mock_user_code',
        verification_uri: 'https://cti.wazuh.com',
        verification_uri_complete: 'https://cti.wazuh.com',
        expires_in: 1800,
        interval: 5,
      };

      setLoading(false);
      window.open(ctiResponse.verification_uri_complete, 'wazuh_cti');
      handleStatusModalToggle?.();
      handleModalToggle();
    }, 2000);
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
            id='wazuhCheckUpdates.ctiRegistration.modalButtonSubscribe'
            defaultMessage='Yes, I want to register'
          />
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
