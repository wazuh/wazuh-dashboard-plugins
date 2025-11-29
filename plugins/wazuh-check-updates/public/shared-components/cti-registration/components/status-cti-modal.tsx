import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiButton,
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
import { StatusCtiModalProps } from '../types';

export const StatusCtiModal: React.FC = ({
  handleStatusModalToggle,
  checkCtiStatus,
}: StatusCtiModalProps) => {
  React.useEffect(() => {
    const fetchStatus = async () => {
      await checkCtiStatus();
    };

    fetchStatus();
  }, [checkCtiStatus]);

  return (
    <EuiModal onClose={handleStatusModalToggle}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <EuiTitle>
            <FormattedMessage
              id='wazuhCheckUpdates.ctiRegistration.statusModalTitle'
              defaultMessage='CTI registration status'
            />
          </EuiTitle>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiText>
          <FormattedMessage
            id='wazuhCheckUpdates.ctiRegistration.statusModalBody'
            defaultMessage='To continue, please complete the form on the page that opened. There you can finish the process or check the status of your request.'
          />
        </EuiText>
        <EuiSpacer size='m' />
        <EuiText>
          <FormattedMessage
            id='wazuhCheckUpdates.ctiRegistration.statusModalBodyLink'
            defaultMessage='If no page was opened, you can access the form directly using the following link: {link}'
            values={{
              link: (
                <EuiLink href='https://cti.wazuh.com' target='_blank'>
                  https://cti.wazuh.com
                </EuiLink>
              ),
            }}
          />
        </EuiText>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButton onClick={handleStatusModalToggle} fill>
          <FormattedMessage
            id='wazuhCheckUpdates.ctiRegistration.statusModalDone'
            defaultMessage='Close'
          />
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
