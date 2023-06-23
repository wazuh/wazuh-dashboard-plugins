import React, { Fragment, useEffect, useState } from 'react';
import { EuiSteps, EuiTitle } from '@elastic/eui';
import './steps.scss';
import { OPERATING_SYSTEMS_OPTIONS } from '../../utils/register-agent-data';
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
} from '../../core/config/os-commands-definitions';
import { UseFormReturn } from '../../../../components/common/form/types';
import CommandOutput from '../../components/command-output/command-output';
import ServerAddressTitle from '../../components/server-address/server-address-title';
import ServerAddressInput from '../../components/server-address/server-address-input';
import OptionalsInputs from '../../components/optionals-inputs/optionals-inputs';

interface IStepsProps {
  needsPassword: boolean;
  hideTextPassword: boolean;
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
  form,
  osCard,
  connection,
  wazuhPassword,
}: IStepsProps) => {
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
        wazuhPassword,
      },
    });

  useEffect(() => {
    // get form values and parse them divided in OS and optional params
    const registerAgentFormValuesParsed = parseRegisterAgentFormValues(
      getRegisterAgentFormValues(form),
      OPERATING_SYSTEMS_OPTIONS,
    );
    setRegisterAgentFormValues(registerAgentFormValuesParsed);
  }, [form.fields]);

  const { installCommand, startCommand, selectOS, setOptionalParams } =
    useRegisterAgentCommands<tOperatingSystem, tOptionalParameters>({
      osDefinitions: osCommandsDefinitions,
      optionalParamsDefinitions: optionalParamsDefinitions,
    });

  useEffect(() => {
    if (
      registerAgentFormValues.operatingSystem.name !== '' &&
      registerAgentFormValues.operatingSystem.architecture !== ''
    ) {
      selectOS(registerAgentFormValues.operatingSystem as tOperatingSystem);
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
      title: <ServerAddressTitle />,
      children: <ServerAddressInput formField={form.fields.serverAddress} />,
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
      children: <OptionalsInputs formFields={form.fields} />,
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
        <CommandOutput
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
        <CommandOutput
          commandText={startCommand}
          showCommand={showCommandsSections(form.fields)}
        />
      ),
      status: showCommandsSections(form.fields) ? 'current' : 'disabled',
    },
  ];

  return <EuiSteps steps={firstSetOfSteps} />;
};
