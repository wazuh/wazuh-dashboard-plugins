
import React, { Component, Fragment, useEffect, useState } from 'react';
import {
  EuiSteps,
  EuiText,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCallOut,
  EuiPopover,
  EuiButtonEmpty,
  EuiLink,
} from '@elastic/eui';
import { InputForm } from '../../../../components/common/form';
import './steps.scss';
import {
  REGISTER_AGENT_DATA_STEP_ONE,
  REGISTER_AGENT_DATA_STEP_THREE,
  REGISTER_AGENT_DATA_STEP_TWO,
} from '../../utils/register-agent-data';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';
import { PLUGIN_VERSION_SHORT } from '../../../../../common/constants';
import {
  IParseRegisterFormValues,
  getRegisterAgentFormValues,
  parseRegisterAgentFormValues,
  showCommandsSections,
} from '../../services/register-agent-services';
import { useRegisterAgentCommands } from '../../hooks/use-register-agent-commands';
import {
  osCommandsDefinitions,
  optionalParamsDefinitions,
  tOperatingSystem,
  tOptionalParameters,
} from '../../config/os-commands-definitions';
import { UseFormReturn } from '../../../../components/common/form/types';
import CommandShower from '../../components/command-shower';

const popoverServerAddress = (
  <span>
    Learn about{' '}
    <EuiLink
      href={webDocumentationLink(
        'user-manual/reference/ossec-conf/client.html#groups',
        PLUGIN_VERSION_SHORT,
      )}
      target='_blank'
      rel='noopener noreferrer'
    >
      Server address.
    </EuiLink>
  </span>
);

const popoverAgentName = (
  <span>
    Learn about{' '}
    <EuiLink
      href={webDocumentationLink(
        'user-manual/reference/ossec-conf/client.html#enrollment-agent-name',
        PLUGIN_VERSION_SHORT,
      )}
      target='_blank'
      rel='noopener noreferrer'
    >
      Assigning an agent name.
    </EuiLink>
  </span>
);

const warningForAgentName =
  'The agent name must be unique. It can’t be changed once the agent has been enrolled.';

interface IStepsProps {
  needsPassword: boolean;
  hideTextPassword: boolean;
  agentGroup: React.ReactElement;
  form: UseFormReturn;
  osCard: React.ReactElement;
  connection: {
    isUDP: boolean;
    isSecure: boolean;
  };
  wazuhPassword: string;
}

export const Steps = ({
  needsPassword,
  hideTextPassword,
  agentGroup,
  form,
  osCard,
  connection,
  wazuhPassword,
}: IStepsProps) => {
  const [isPopoverServerAddress, setIsPopoverServerAddress] = useState(false);
  const [isPopoverAgentName, setIsPopoverAgentName] = useState(false);

  const onButtonServerAddress = () =>
    setIsPopoverServerAddress(
      isPopoverServerAddress => !isPopoverServerAddress,
    );
  const closeServerAddress = () => setIsPopoverServerAddress(false);

  const onButtonAgentName = () =>
    setIsPopoverAgentName(isPopoverAgentName => !isPopoverAgentName);
  const closeAgentName = () => setIsPopoverAgentName(false);

  const [registerAgentFormValues, setRegisterAgentFormValues] =
    useState<IParseRegisterFormValues>({
      operatingSystem: {
        name: '',
        architecture: '',
      },
      optionalParams: {
        agentGroups: '',
        agentName: '',
        serverAddress: '',
        wazuhPassword: '',
      },
    });

  useEffect(() => {
    // get form values and parse them divided in OS and optional params
    setRegisterAgentFormValues(
      parseRegisterAgentFormValues(
        getRegisterAgentFormValues(form),
        REGISTER_AGENT_DATA_STEP_ONE,
      ),
    );
  }, [form.fields]);

  const { installCommand, startCommand, selectOS, setOptionalParams } =
    useRegisterAgentCommands<tOperatingSystem, tOptionalParameters>({
      osDefinitions: osCommandsDefinitions,
      optionalParamsDefinitions: optionalParamsDefinitions,
    });

  useEffect(() => {
    if (registerAgentFormValues.operatingSystem.name !== '' && registerAgentFormValues.operatingSystem.architecture !== '') {
      selectOS(registerAgentFormValues.operatingSystem);
    }

    setOptionalParams(registerAgentFormValues.optionalParams);
  }, [registerAgentFormValues]);

  const firstSetOfSteps = [
    {
      title: (
        <EuiTitle className='stepTitle'>
          <p>Select the package to download and install on your system:</p>
        </EuiTitle>
      ),
      children: osCard,
      status: form.fields.operatingSystemSelection.value
        ? 'complete'
        : 'current',
    },
    {
      title: (
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiPopover
              button={
                <EuiButtonEmpty
                  iconType='questionInCircle'
                  iconSide='right'
                  onClick={onButtonServerAddress}
                  className='stepTitle'
                >
                  Server address
                </EuiButtonEmpty>
              }
              isOpen={isPopoverServerAddress}
              closePopover={closeServerAddress}
              anchorPosition='rightCenter'
            >
              {popoverServerAddress}
            </EuiPopover>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
      children: (
        <Fragment>
          <EuiFlexGroup gutterSize='s' wrap>
            {REGISTER_AGENT_DATA_STEP_TWO.map((data, index) => (
              <EuiFlexItem key={index}>
                <EuiText className='stepSubtitleServerAddress'>
                  {data.subtitle}
                </EuiText>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
          <InputForm
            {...form.fields.serverAddress}
            label={<></>}
            fullWidth={false}
            placeholder='Server address'
          />
        </Fragment>
      ),
      status: !form.fields.operatingSystemSelection.value
        ? 'disabled'
        : !form.fields.serverAddress.value &&
          form.fields.operatingSystemSelection.value
        ? 'current'
        : form.fields.operatingSystemSelection.value &&
          form.fields.serverAddress.value
        ? 'complete'
        : '',
    },
    ...(!(!needsPassword || hideTextPassword)
      ? [
          {
            title: (
              <EuiTitle className='stepTitle'>
                <p>Wazuh password</p>
              </EuiTitle>
            ),
            children: (
              <Fragment>
                {
                  'No ha establecido una contraseña. Se le asigno una por defecto'
                }
              </Fragment>
            ),
          },
        ]
      : []),
    {
      title: (
        <EuiTitle className='stepTitle'>
          <p>Optional settings</p>
        </EuiTitle>
      ),
      children: (
        <Fragment>
          <EuiFlexGroup gutterSize='s' wrap>
            {REGISTER_AGENT_DATA_STEP_THREE.map((data, index) => (
              <EuiFlexItem key={index}>
                <EuiText className='stepSubtitle'>{data.subtitle}</EuiText>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
          <InputForm
            {...form.fields.agentName}
            fullWidth={false}
            label={
              <>
                <EuiFlexGroup>
                  <EuiFlexItem grow={false}>
                    <EuiPopover
                      button={
                        <EuiButtonEmpty
                          iconType='questionInCircle'
                          iconSide='right'
                          onClick={onButtonAgentName}
                          style={{
                            flexDirection: 'row',
                            fontStyle: 'normal',
                            fontWeight: 700,
                            fontSize: '12px',
                            lineHeight: '20px',
                            color: '#343741',
                          }}
                        >
                          Assign an agent name
                        </EuiButtonEmpty>
                      }
                      isOpen={isPopoverAgentName}
                      closePopover={closeAgentName}
                      anchorPosition='rightCenter'
                    >
                      {popoverAgentName}
                    </EuiPopover>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </>
            }
            placeholder='Agent name'
          />
          <EuiCallOut
            color='warning'
            title={warningForAgentName}
            iconType='iInCircle'
            className='warningForAgentName'
          />
          {agentGroup}
        </Fragment>
      ),
      status:
        !form.fields.operatingSystemSelection.value ||
        !form.fields.serverAddress.value
          ? 'disabled'
          : form.fields.serverAddress.value !== ''
          ? 'current'
          : form.fields.agentGroups.value.length > 0
          ? 'complete'
          : '',
    },
    {
      title: (
        <EuiTitle className='stepTitle'>
          <p>
            Run the following commands to download and install the Wazuh Agent:
          </p>
        </EuiTitle>
      ),
      children: (
        <CommandShower
          commandText={installCommand}
          showCommand={showCommandsSections(form.fields)}
        />
      ),
      status: showCommandsSections(form.fields) ? 'current' : 'disabled',
    },
    {
      title: (
        <EuiTitle className='stepTitle'>
          <p>Start the Wazuh agent:</p>
        </EuiTitle>
      ),
      children: (
        <CommandShower
          commandText={startCommand}
          showCommand={showCommandsSections(form.fields)}
        />
      ),
      status: showCommandsSections(form.fields) ? 'current' : 'disabled',
    },
  ];

  return <EuiSteps steps={firstSetOfSteps} />;
};
