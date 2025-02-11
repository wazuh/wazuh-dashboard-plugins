import React, { useState } from 'react';
import {
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiPopover,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { InputForm } from '../form';
import { webDocumentationLink } from '../../services/web-documentation-link';
import { EnhancedFieldConfiguration } from '../form/types';

export const UsernameInput = (props: {
  formField: EnhancedFieldConfiguration;
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const onClickButtonPopoverOpen = () =>
    setIsPopoverOpen(isPopoverServerAddress => !isPopoverServerAddress);
  const { formField } = props;

  return (
    <>
      <InputForm
        {...formField}
        label={
          <>
            <EuiFlexGroup
              alignItems='center'
              direction='row'
              responsive={false}
              gutterSize='s'
            >
              <EuiFlexItem grow={false}>
                <span className='registerAgentLabels'>
                  <FormattedMessage
                    id='wzFleet.enrollmentAssistant.steps.credentials.username.description'
                    defaultMessage='Define the server API username'
                  />
                </span>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiPopover
                  button={
                    <EuiButtonEmpty
                      iconType='questionInCircle'
                      iconSide='left'
                      onClick={onClickButtonPopoverOpen}
                      style={{
                        flexDirection: 'row',
                        fontStyle: 'normal',
                        fontWeight: 700,
                      }}
                    ></EuiButtonEmpty>
                  }
                  isOpen={isPopoverOpen}
                  closePopover={onClickButtonPopoverOpen}
                  anchorPosition='rightCenter'
                >
                  <span>
                    <FormattedMessage
                      id='wzFleet.enrollmentAssistant.steps.credentials.username.learn'
                      defaultMessage='Learn about '
                    />
                    <EuiLink
                      href={webDocumentationLink(
                        'user-manual/reference/ossec-conf/client.html#manager-address', // TODO: adapt to new link
                      )}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <FormattedMessage
                        id='wzFleet.enrollmentAssistant.steps.credentials.username.learnAbout'
                        defaultMessage='Server API username.'
                      />
                    </EuiLink>
                  </span>
                </EuiPopover>
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        }
        fullWidth={false}
        placeholder={i18n.translate(
          'wzFleet.enrollmentAssistant.steps.credentials.username.placeholder',
          {
            defaultMessage: 'Server API username',
          },
        )}
      />
    </>
  );
};
