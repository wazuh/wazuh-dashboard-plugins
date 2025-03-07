import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { EnhancedFieldConfiguration } from '../form/types';
import { UsernameInput } from './username-input';
import { PasswordInput } from './password-input';

export const SecurityInputs = (props: {
  username: EnhancedFieldConfiguration;
  password: EnhancedFieldConfiguration;
}) => (
  <>
    <EuiFlexGroup gutterSize='s' wrap>
      <EuiFlexItem>
        <EuiText className='stepSubtitleServerAddress'>
          <FormattedMessage
            id='wzFleet.enrollmentAssistant.steps.credentials.description'
            defaultMessage='Define the server API credentials.'
          />
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
    <EuiFlexGroup wrap>
      <EuiFlexItem grow={false}>
        <UsernameInput formField={props.username} />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <PasswordInput formField={props.password} />
      </EuiFlexItem>
    </EuiFlexGroup>
  </>
);
