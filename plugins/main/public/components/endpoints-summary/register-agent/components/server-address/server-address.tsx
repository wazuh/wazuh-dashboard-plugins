import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiPopover,
  EuiButtonEmpty,
  EuiSwitch,
  EuiLink,
} from '@elastic/eui';
import React, { Fragment, useEffect, useState } from 'react';
import { SERVER_ADDRESS_TEXTS } from '../../utils/register-agent-data';
import { EnhancedFieldConfiguration } from '../../../../common/form/types';
import { InputForm } from '../../../../common/form';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import { PLUGIN_VERSION_SHORT } from '../../../../../../common/constants';
import {
  AGENT_ENDPOINT_DEFAULT_PATH,
  AGENT_ENDPOINT_DEFAULT_PORT,
} from '../../../../../../common/services/agent-endpoint';
import '../group-input/group-input.scss';
import { ErrorHandler } from '../../../../../react-services/error-management/error-handler/error-handler';
import { getUiSettings } from '../../../../../kibana-services';

interface ServerAddressInputProps {
  formFields: {
    serverAddress: EnhancedFieldConfiguration;
    serverPort: EnhancedFieldConfiguration;
    serverPath: EnhancedFieldConfiguration;
  };
}

/* The agent takes the address, the port and the path prefix as a single
endpoint, but the wizard asks for them separately so each keeps the validation
that fits it -- a combined string could no longer be checked as a hostname. The
generated command joins them back together. */
const SERVER_ADDRESS_SETTINGS = [
  { field: 'serverAddress', setting: 'enrollment.dns' },
  { field: 'serverPort', setting: 'enrollment.port' },
  { field: 'serverPath', setting: 'enrollment.path' },
] as const;

/* `InputForm` forwards unknown props to the input itself, so the hint is
rendered through its footer rather than the form row's `helpText`. */
const EndpointDefaultHint = ({ children }: { children: React.ReactNode }) => (
  <EuiText size='xs' color='subdued'>
    {children}
  </EuiText>
);

const popoverServerAddress = (
  <span>
    Learn about{' '}
    <EuiLink
      href={webDocumentationLink(
        'user-manual/reference/ossec-conf/client.html#manager-endpoint',
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
  const { formFields } = props;
  const { serverAddress, serverPort, serverPath } = formFields;
  const [isPopoverServerAddress, setIsPopoverServerAddress] = useState(false);
  const onButtonServerAddress = () =>
    setIsPopoverServerAddress(
      isPopoverServerAddress => !isPopoverServerAddress,
    );
  const closeServerAddress = () => setIsPopoverServerAddress(false);
  const [rememberServerAddress, setRememberServerAddress] = useState(false);
  /* What was last saved, so returning to the wizard shows the switch already
  on for the endpoint it is prefilled with. */
  const [savedEndpoint, setSavedEndpoint] = useState(() =>
    SERVER_ADDRESS_SETTINGS.map(
      ({ field }) => formFields[field]?.initialValue ?? '',
    ),
  );

  const currentEndpoint = SERVER_ADDRESS_SETTINGS.map(
    ({ field }) => formFields[field].value,
  );

  const saveServerAddress = async () => {
    try {
      // WORKAROUND: this could be done through the getWazuhCorePlugin().configuration but it requires the addition of a setter method
      /* The three are saved together: a remembered address whose port or
      prefix was dropped would prefill an endpoint the operator never used. */
      await Promise.all(
        SERVER_ADDRESS_SETTINGS.map(({ field, setting }) =>
          getUiSettings().set(setting, formFields[field].value),
        ),
      );
    } catch (error) {
      ErrorHandler.handleError(error, {
        message: error.message,
        title: 'Error saving the server endpoint configuration',
      });
      setRememberServerAddress(false);
    }
  };

  const handleToggleRememberAddress = async event => {
    setRememberServerAddress(event.target.checked);
    if (event.target.checked) {
      await saveServerAddress();
      setSavedEndpoint(currentEndpoint);
    }
  };

  const rememberToggleIsDisabled = () =>
    !serverAddress.value ||
    SERVER_ADDRESS_SETTINGS.some(({ field }) => !!formFields[field].error);

  useEffect(() => {
    setRememberServerAddress(
      [serverAddress.value, serverPort.value, serverPath.value].every(
        (value, index) => value === savedEndpoint[index],
      ),
    );
  }, [serverAddress.value, serverPort.value, serverPath.value, savedEndpoint]);

  return (
    <Fragment>
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
            {...serverAddress}
            label={
              <>
                <EuiFlexGroup
                  alignItems='center'
                  direction='row'
                  responsive={false}
                  gutterSize='s'
                >
                  <EuiFlexItem grow={false}>
                    <span className='registerAgentLabels'>Server address</span>
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
            fullWidth={false}
            placeholder='IP address or FQDN'
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup wrap>
        <EuiFlexItem grow={true}>
          <InputForm
            {...serverPort}
            label={<span className='registerAgentLabels'>Port - Optional</span>}
            footer={
              <EndpointDefaultHint>
                {`Leave empty to use ${AGENT_ENDPOINT_DEFAULT_PORT}`}
              </EndpointDefaultHint>
            }
            fullWidth={false}
            placeholder={AGENT_ENDPOINT_DEFAULT_PORT}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={true}>
          <InputForm
            {...serverPath}
            label={
              <span className='registerAgentLabels'>
                Path prefix - Optional
              </span>
            }
            footer={
              <EndpointDefaultHint>
                {`Leave empty to use ${AGENT_ENDPOINT_DEFAULT_PATH}`}
              </EndpointDefaultHint>
            }
            fullWidth={false}
            placeholder={AGENT_ENDPOINT_DEFAULT_PATH}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup wrap>
        <EuiFlexItem grow={false}>
          <EuiSwitch
            disabled={rememberToggleIsDisabled()}
            label='Remember address, port, and path prefix'
            checked={rememberServerAddress}
            onChange={e => handleToggleRememberAddress(e)}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  );
};

export default ServerAddressInput;
