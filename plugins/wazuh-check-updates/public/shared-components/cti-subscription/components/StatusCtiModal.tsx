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
  setIsActive,
  isActive,
}) => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const handleCheckStatus = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsActive(CtiStatus.SUCCESS);
    }, 2000);
  };

  return (
    <EuiModal onClose={handleStatusModalToggle}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <EuiTitle>
            <FormattedMessage
              id='wazuhCheckUpdates.ctiSubscription.statusModalTitle'
              defaultMessage='CTI Subscription Status'
            />
          </EuiTitle>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiText>
          <FormattedMessage
            id='wazuhCheckUpdates.ctiSubscription.statusModalBody'
            defaultMessage='To continue, please complete the form on the page that opened. There you can finish the process or check the status of your request.'
          />
        </EuiText>
        <EuiSpacer size='m' />
        <EuiText>
          <FormattedMessage
            id='wazuhCheckUpdates.ctiSubscription.statusModalBodyLink'
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
              id='wazuhCheckUpdates.ctiSubscription.statusSubscription'
              defaultMessage='Subscription status:'
            />
          </EuiDescriptionListTitle>
          <EuiDescriptionListDescription>
            {!isLoading ? (
              isActive !== CtiStatus.INACTIVE ? (
                <EuiBadge color='success'>
                  <FormattedMessage
                    id='wazuhCheckUpdates.ctiSubscription.statusActive'
                    defaultMessage='Active'
                  />
                </EuiBadge>
              ) : (
                <EuiBadge color='warning'>
                  <FormattedMessage
                    id='wazuhCheckUpdates.ctiSubscription.statusInactive'
                    defaultMessage='Pending'
                  />
                </EuiBadge>
              )
            ) : (
              <EuiLoadingSpinner size='m' />
            )}
          </EuiDescriptionListDescription>
        </EuiDescriptionList>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButton onClick={handleCheckStatus}>Check status</EuiButton>
        <EuiButton onClick={handleStatusModalToggle} fill>
          <FormattedMessage
            id='wazuhCheckUpdates.ctiSubscription.statusModalDone'
            defaultMessage='Finish process'
          />
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
