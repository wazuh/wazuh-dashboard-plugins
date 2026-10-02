import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiPopover,
  EuiButtonEmpty,
  EuiSwitch,
  EuiLink,
  EuiSpacer,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React, { Fragment, useEffect, useState } from 'react';
import { SERVER_ADDRESS_TEXTS } from '../../utils/register-agent-data';
import { EnhancedFieldConfiguration } from '../../../../common/form/types';
import { InputForm } from '../../../../common/form';
import AdvancedOptions from '../advanced-options/advanced-options';
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
    <FormattedMessage
      id='wazuh.endpointsSummary.serverAddress.learnAbout'
      defaultMessage='Learn about {documentationLink}'
      values={{
        documentationLink: (
          <EuiLink
            href={webDocumentationLink(
              'user-manual/agent/agent-enrollment/enrollment-methods/via-agent-configuration/index.html',
              PLUGIN_VERSION_SHORT,
            )}
            target='_blank'
            rel='noopener noreferrer'
          >
            {i18n.translate(
              'wazuh.endpointsSummary.serverAddress.documentationLink',
              { defaultMessage: 'Server address.' },
            )}
          </EuiLink>
        ),
      }}
    />
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
        title: i18n.translate(
          'wazuh.endpointsSummary.serverAddress.saveErrorTitle',
          { defaultMessage: 'Error saving the server endpoint configuration' },
        ),
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
                    <span className='registerAgentLabels'>
                      {i18n.translate(
                        'wazuh.endpointsSummary.serverAddress.addressLabel',
                        { defaultMessage: 'Server address' },
                      )}
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
            fullWidth={false}
            placeholder={i18n.translate(
              'wazuh.endpointsSummary.serverAddress.addressPlaceholder',
              { defaultMessage: 'IP address or FQDN' },
            )}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='m' />
      {/* The port and the path prefix are optional and rarely changed, so they
      are folded away and the step is just the address until the operator asks
      for them. */}
      <AdvancedOptions fields={[serverPort, serverPath]}>
        <EuiFlexGroup wrap>
          <EuiFlexItem grow={true} className='registerAgentFormColumn'>
            <InputForm
              {...serverPort}
              label={
                <span className='registerAgentLabels'>
                  <FormattedMessage
                    id='wazuh.endpointsSummary.serverAddress.portLabel'
                    defaultMessage='Port - {optional}'
                    values={{
                      optional: (
                        <em>
                          {i18n.translate(
                            'wazuh.endpointsSummary.serverAddress.portOptional',
                            { defaultMessage: 'optional' },
                          )}
                        </em>
                      ),
                    }}
                  />
                </span>
              }
              footer={
                <EndpointDefaultHint>
                  {i18n.translate(
                    'wazuh.endpointsSummary.serverAddress.portDefaultHint',
                    {
                      defaultMessage:
                        'If left empty, {defaultPort} default will be used',
                      values: { defaultPort: AGENT_ENDPOINT_DEFAULT_PORT },
                    },
                  )}
                </EndpointDefaultHint>
              }
              fullWidth={false}
              placeholder={AGENT_ENDPOINT_DEFAULT_PORT}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={true} className='registerAgentFormColumn'>
            <InputForm
              {...serverPath}
              label={
                <span className='registerAgentLabels'>
                  <FormattedMessage
                    id='wazuh.endpointsSummary.serverAddress.pathLabel'
                    defaultMessage='Path prefix - {optional}'
                    values={{
                      optional: (
                        <em>
                          {i18n.translate(
                            'wazuh.endpointsSummary.serverAddress.pathOptional',
                            { defaultMessage: 'optional' },
                          )}
                        </em>
                      ),
                    }}
                  />
                </span>
              }
              footer={
                <EndpointDefaultHint>
                  {i18n.translate(
                    'wazuh.endpointsSummary.serverAddress.pathDefaultHint',
                    {
                      defaultMessage:
                        'If left empty, {defaultPath} default will be used',
                      values: { defaultPath: AGENT_ENDPOINT_DEFAULT_PATH },
                    },
                  )}
                </EndpointDefaultHint>
              }
              fullWidth={false}
              placeholder={AGENT_ENDPOINT_DEFAULT_PATH}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </AdvancedOptions>
      <EuiSpacer size='s' />
      <EuiFlexGroup wrap>
        <EuiFlexItem grow={false}>
          <EuiSwitch
            disabled={rememberToggleIsDisabled()}
            label={i18n.translate(
              'wazuh.endpointsSummary.serverAddress.rememberEndpoint',
              { defaultMessage: 'Remember address, port, and path prefix' },
            )}
            checked={rememberServerAddress}
            onChange={e => handleToggleRememberAddress(e)}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  );
};

export default ServerAddressInput;
