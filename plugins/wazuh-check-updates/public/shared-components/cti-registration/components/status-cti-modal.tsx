import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiBadge,
  EuiButton,
  EuiDescriptionList,
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiLink,
  EuiLoadingSpinner,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { CtiStatus, StatusCtiModalProps } from '../types';

export const StatusCtiModal: React.FC<StatusCtiModalProps> = ({
  handleStatusModalToggle,
  checkCtiStatus,
  isActive,
}) => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true);
      await checkCtiStatus();
      setIsLoading(false);
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
              defaultMessage='CTI Registration Status'
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
        <EuiSpacer size='m' />
        <EuiDescriptionList
          type='column'
          align='center'
          descriptionProps={{
            style: { textAlign: 'right' },
          }}
        >
          <EuiDescriptionListTitle>
            <FormattedMessage
              id='wazuhCheckUpdates.ctiRegistration.statusRegistration'
              defaultMessage='Registration status:'
            />
          </EuiDescriptionListTitle>
          <EuiDescriptionListDescription>
            {!isLoading ? (
              <EuiBadge
                color={isActive === CtiStatus.ACTIVE ? 'success' : 'warning'}
              >
                <FormattedMessage
                  id='wazuhCheckUpdates.ctiRegistration.statusActive'
                  defaultMessage='{status}'
                  values={{ status: isActive }}
                />
              </EuiBadge>
            ) : (
              <EuiLoadingSpinner size='m' />
            )}
          </EuiDescriptionListDescription>
        </EuiDescriptionList>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButton onClick={handleStatusModalToggle} fill>
          <FormattedMessage
            id='wazuhCheckUpdates.ctiRegistration.statusModalDone'
            defaultMessage='Finish process'
          />
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
