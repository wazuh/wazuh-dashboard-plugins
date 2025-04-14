import React, { useState, useEffect } from 'react';
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
import { SaveValueButtonInput } from '../common/save-input-value';
import { getEnrollAgentManagement } from '../../../../../plugin-services';

export const CommunicationsAPIUrlInput = (props: {
  formField: EnhancedFieldConfiguration;
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const onClickButtonPopoverOpen = () =>
    setIsPopoverOpen(isPopoverServerAddress => !isPopoverServerAddress);
  const { formField } = props;
  const [defaultValue, setDefaultValue] = useState(
    formField?.initialValue ?? '',
  );

  const saveValue = async () => {
    await getEnrollAgentManagement().setCommunicationsURL(formField.value);
  };

  // TODO: this retrieves the value and redefines the form field value, but this should be obtained before defining the form and set this as the initial value
  useEffect(() => {
    async function fetchValueFromConfiguration() {
      const userValue = await getEnrollAgentManagement().getCommunicationsURL();

      if (userValue) {
        setDefaultValue(userValue);
        formField.onChange({
          // simulate the input text interface expected by the onChange method
          target: {
            value: userValue,
          },
        });
      }
    }

    fetchValueFromConfiguration();
  }, []);

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
                <span className='enrollment-agent-form-input-label'>
                  <FormattedMessage
                    id='wzFleet.enrollmentAssistant.steps.optionals.commsAPI.description'
                    defaultMessage='Define the communications API'
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
                      id='wzFleet.enrollmentAssistant.steps.optionals.commsAPI.learn'
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
                        id='wzFleet.enrollmentAssistant.steps.optionals.commsAPI.learnAbout'
                        defaultMessage='Communications API url.'
                      />
                    </EuiLink>
                  </span>
                </EuiPopover>
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        }
        fullWidth={true}
        placeholder='https://comms-api:27000'
        postInput={
          <SaveValueButtonInput
            tooltilProps={{
              content:
                !formField.value || !!formField.error ? (
                  <FormattedMessage
                    id='wzFleet.enrollmentAssistant.steps.optionals.commsAPI.rememberValue.noValueOrError'
                    defaultMessage='No defined value or there is some error'
                  />
                ) : (
                  <FormattedMessage
                    id='wzFleet.enrollmentAssistant.steps.optionals.commsAPI.rememberValue.setValue'
                    defaultMessage='Save the {setting} setting'
                    values={{
                      setting: getEnrollAgentManagement().commsURLSettingName,
                    }}
                  />
                ),
            }}
            buttonLabel={i18n.translate(
              'wzFleet.enrollmentAssistant.steps.optionals.commsAPI.rememberValue',
              {
                defaultMessage: 'Remember value',
              },
            )}
            formField={formField}
            onClick={saveValue}
            defaultValue={defaultValue}
            setDefaultValue={setDefaultValue}
          />
        }
      />
    </>
  );
};
