import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiButtonEmpty,
  EuiCallOut,
  EuiCode,
  EuiCopy,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { CtiDeviceAuthorization } from '../types';

type Props = {
  deviceAuth: CtiDeviceAuthorization;
};

export const CtiDeviceAuthLinks: React.FC<Props> = ({ deviceAuth }) => (
  <EuiCallOut
    title={
      <FormattedMessage
        id='wazuhCheckUpdates.ctiRegistration.deviceAuthTitle'
        defaultMessage='Your user code and activation link'
      />
    }
    color='primary'
    iconType='globe'
  >
    <EuiText size='s'>
      <FormattedMessage
        id='wazuhCheckUpdates.ctiRegistration.userCodeLabel'
        defaultMessage='User code:'
      />
    </EuiText>
    <EuiSpacer size='xs' />
    <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false} wrap>
      <EuiFlexItem grow={false}>
        <EuiCode
          className='ctiDeviceUserCode'
          data-test-subj='ctiDeviceUserCode'
        >
          {deviceAuth.user_code}
        </EuiCode>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiCopy textToCopy={deviceAuth.user_code}>
          {(copy: () => void) => (
            <EuiButtonEmpty
              size='xs'
              iconType='copyClipboard'
              onClick={copy}
              data-test-subj='ctiCopyUserCode'
            >
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.copyUserCode'
                defaultMessage='Copy user code'
              />
            </EuiButtonEmpty>
          )}
        </EuiCopy>
      </EuiFlexItem>
    </EuiFlexGroup>
    <EuiSpacer size='m' />
    <EuiText size='s'>
      <FormattedMessage
        id='wazuhCheckUpdates.ctiRegistration.verificationLinkLabel'
        defaultMessage='Activation link:'
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
            defaultMessage='Copy activation link'
          />
        </EuiButtonEmpty>
      )}
    </EuiCopy>
  </EuiCallOut>
);
