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
    setTimeout(() => {
      setLoading(false);
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
              id='wazuhCheckUpdates.ctiSubscription.modalTitle'
              defaultMessage='Do you want to subscribe to CTI updates?'
            />
          </EuiTitle>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiText>
          <FormattedMessage
            id='wazuhCheckUpdates.ctiSubscription.modalBodyAdditional'
            defaultMessage='If you subscribe, you will receive updates about CTI changes and improvements. For more information, visit our {documentationCTIWazuh}.'
            values={{
              documentationCTIWazuh: (
                <EuiLink
                  href='https://cti.wazuh.com/vulnerabilities/cves'
                  target='_blank'
                >
                  <FormattedMessage
                    id='wazuhCheckUpdates.ctiSubscription.modalBodyAdditionalLink'
                    defaultMessage='documentation'
                  />
                </EuiLink>
              ),
            }}
          />
        </EuiText>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={handleModalToggle}>Cancel</EuiButtonEmpty>
        <EuiButton isLoading={loading} onClick={handleButtonClick} fill>
          Yes, I want to subscribe
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
