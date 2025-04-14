import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiPopover,
  EuiButtonEmpty,
  EuiLink,
} from '@elastic/eui';
import React, { useState, useEffect } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { SERVER_ADDRESS_TEXTS } from '../../utils/enroll-agent-data';
import { EnhancedFieldConfiguration } from '../form/types';
import { InputForm } from '../form';
import { webDocumentationLink } from '../../services/web-documentation-link';
import { PLUGIN_VERSION_SHORT } from '../../../../../../common/constants';
import '../inputs/styles.scss';
import { getEnrollAgentManagement } from '../../../../../plugin-services';
import { SaveValueButtonInput } from '../common/save-input-value';

interface ServerAddressInputProps {
  formField: EnhancedFieldConfiguration;
}

const popoverServerAddress = (
  <span>
    Learn about{' '}
    <EuiLink
      href={webDocumentationLink(
        'user-manual/reference/ossec-conf/client.html#manager-address',
        PLUGIN_VERSION_SHORT,
      )}
      target='_blank'
      rel='noopener noreferrer'
    >
      Server address.
    </EuiLink>
  </span>
);

const ServerAddressInput = (props: ServerAddressInputProps) => {
  const { formField } = props;
  const [isPopoverServerAddress, setIsPopoverServerAddress] = useState(false);
  const onButtonServerAddress = () =>
    setIsPopoverServerAddress(
      isPopoverServerAddress => !isPopoverServerAddress,
    );
  const closeServerAddress = () => setIsPopoverServerAddress(false);
  const [defaultValue, setDefaultValue] = useState(
    formField?.initialValue ?? '',
  );

  const saveValue = async () => {
    await getEnrollAgentManagement().setServerURL(formField.value);
  };

  // TODO: this retrieves the value and redefines the form field value, but this should be obtained before defining the form and set this as the initial value
  useEffect(() => {
    async function fetchValueFromConfiguration() {
      const userValue = await getEnrollAgentManagement().getServerURL();

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
      <EuiFlexGroup gutterSize='s' wrap>
        {SERVER_ADDRESS_TEXTS.map((data, index) => (
          <EuiFlexItem key={index}>
            <EuiText className='stepSubtitleServerAddress'>
              {data.subtitle}
            </EuiText>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
      <EuiFlexGroup wrap>
        <EuiFlexItem grow={true}>
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
                        id='wzFleet.enrollmentAssistant.steps.serverAddress.serverAddress.description'
                        defaultMessage='Assign a server address'
                      />
                    </span>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiPopover
                      button={
                        <EuiButtonEmpty
                          iconType='questionInCircle'
                          iconSide='left'
                          onClick={onButtonServerAddress}
                          style={{
                            flexDirection: 'row',
                            fontStyle: 'normal',
                            fontWeight: 700,
                          }}
                        ></EuiButtonEmpty>
                      }
                      isOpen={isPopoverServerAddress}
                      closePopover={closeServerAddress}
                      anchorPosition='rightCenter'
                    >
                      {popoverServerAddress}
                    </EuiPopover>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </>
            }
            fullWidth={true}
            placeholder='https://server-address:55000'
            postInput={
              <SaveValueButtonInput
                tooltilProps={{
                  content:
                    !formField.value || !!formField.error ? (
                      <FormattedMessage
                        id='wzFleet.enrollmentAssistant.steps.serverAddress.serverAddress.rememberValue.noValueOrError'
                        defaultMessage='No defined value or there is some error'
                      />
                    ) : (
                      <FormattedMessage
                        id='wzFleet.enrollmentAssistant.steps.serverAddress.serverAddress.rememberValue.setValue'
                        defaultMessage='Save the {setting} setting'
                        values={{
                          setting:
                            getEnrollAgentManagement().serverURLSettingName,
                        }}
                      />
                    ),
                }}
                buttonLabel={i18n.translate(
                  'wzFleet.enrollmentAssistant.steps.serverAddress.serverAddress.rememberValue',
                  {
                    defaultMessage: 'Remember server address',
                  },
                )}
                formField={formField}
                onClick={saveValue}
                defaultValue={defaultValue}
                setDefaultValue={setDefaultValue}
              />
            }
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};

export default ServerAddressInput;
