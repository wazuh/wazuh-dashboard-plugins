import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiPopover,
  EuiButtonEmpty,
  EuiLink,
  EuiSpacer,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React, { Fragment, useState } from 'react';
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
import { RememberServerEndpointSwitch } from '../../../../common/remember-server-endpoint';

interface ServerAddressInputProps {
  formFields: {
    serverAddress: EnhancedFieldConfiguration;
    serverPort: EnhancedFieldConfiguration;
    serverPath: EnhancedFieldConfiguration;
  };
}

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
            footer={
              <EndpointDefaultHint>
                {i18n.translate(
                  'wazuh.endpointsSummary.serverAddress.addressHint',
                  {
                    defaultMessage:
                      'Pick one of the names in the manager listener certificate, or type another.',
                  },
                )}
              </EndpointDefaultHint>
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
          <RememberServerEndpointSwitch
            address={serverAddress}
            port={serverPort}
            path={serverPath}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  );
};

export default ServerAddressInput;
