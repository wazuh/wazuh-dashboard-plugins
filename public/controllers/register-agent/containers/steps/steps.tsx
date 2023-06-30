import React, { Fragment, useEffect, useState } from 'react';
import { EuiCallOut, EuiLink, EuiSteps, EuiTitle } from '@elastic/eui';
import './steps.scss';
import { OPERATING_SYSTEMS_OPTIONS } from '../../utils/register-agent-data';
import {
  IParseRegisterFormValues,
  getRegisterAgentFormValues,
  parseRegisterAgentFormValues,
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
import {
  getAgentCommandsStepStatus,
  tFormStepsStatus,
  getOSSelectorStepStatus,
  getServerAddressStepStatus,
  getOptionalParameterStepStatus,
  showCommandsSections,
  getPasswordStepStatus,
} from '../../services/register-agent-steps-status-services';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';

interface IStepsProps {
  needsPassword: boolean;
  form: UseFormReturn;
  osCard: React.ReactElement;
  connection: {
    isUDP: boolean;
  };
  wazuhPassword: string;
}

export const Steps = ({
  needsPassword,
  form,
  osCard,
  connection,
  wazuhPassword,
}: IStepsProps) => {
  const initialParsedFormValues = {
    operatingSystem: {
      name: '',
      architecture: '',
    },
    optionalParams: {
      agentGroups: '',
      agentName: '',
      serverAddress: '',
      wazuhPassword,
      protocol: connection.isUDP ? 'UDP' : '',
    },
  } as IParseRegisterFormValues;
  const [registerAgentFormValues, setRegisterAgentFormValues] =
    useState<IParseRegisterFormValues>(initialParsedFormValues);

  useEffect(() => {
    // get form values and parse them divided in OS and optional params
    const registerAgentFormValuesParsed = parseRegisterAgentFormValues(
      getRegisterAgentFormValues(form),
      OPERATING_SYSTEMS_OPTIONS,
      initialParsedFormValues,
    );
    setRegisterAgentFormValues(registerAgentFormValuesParsed);
    setInstallCommandStepStatus(
      getAgentCommandsStepStatus(form.fields, installCommandWasCopied),
    );
    setStartCommandStepStatus(
      getAgentCommandsStepStatus(form.fields, startCommandWasCopied),
    );
  }, [form.fields]);

  const { installCommand, startCommand, selectOS, setOptionalParams } =
    useRegisterAgentCommands<tOperatingSystem, tOptionalParameters>({
      osDefinitions: osCommandsDefinitions,
      optionalParamsDefinitions: optionalParamsDefinitions,
    });

  // install - start commands step state
  const [installCommandWasCopied, setInstallCommandWasCopied] = useState(false);
  const [installCommandStepStatus, setInstallCommandStepStatus] =
    useState<tFormStepsStatus>(getAgentCommandsStepStatus(form.fields, false));
  const [startCommandWasCopied, setStartCommandWasCopied] = useState(false);
  const [startCommandStepStatus, setStartCommandStepStatus] =
    useState<tFormStepsStatus>(getAgentCommandsStepStatus(form.fields, false));

  useEffect(() => {
    if (
      registerAgentFormValues.operatingSystem.name !== '' &&
      registerAgentFormValues.operatingSystem.architecture !== ''
    ) {
      selectOS(registerAgentFormValues.operatingSystem as tOperatingSystem);
    }
    setOptionalParams({ ...registerAgentFormValues.optionalParams });
    setInstallCommandWasCopied(false);
    setStartCommandWasCopied(false);
  }, [registerAgentFormValues]);

  useEffect(() => {
    setInstallCommandStepStatus(
      getAgentCommandsStepStatus(form.fields, installCommandWasCopied),
    );
  }, [installCommandWasCopied]);

  useEffect(() => {
    setStartCommandStepStatus(
      getAgentCommandsStepStatus(form.fields, startCommandWasCopied),
    );
  }, [startCommandWasCopied]);

  const registerAgentFormSteps = [
    {
      title: (
        <span className='stepTitle'>
          Select the package to download and install on your system:
        </span>
      ),
      children: osCard,
      status: getOSSelectorStepStatus(form.fields),
    },
    {
      title: <ServerAddressTitle />,
      children: <ServerAddressInput formField={form.fields.serverAddress} />,
      status: getServerAddressStepStatus(form.fields),
    },
    ...(needsPassword && !wazuhPassword
      ? [
          {
            title: <span className='stepTitle'>Wazuh password</span>,
            children: (
              <EuiCallOut
                color='warning'
                title={
                  <span>
                    The Wazuh password is required but wasn't defined. Please check our{' '}
                    <EuiLink
                      target='_blank'
                      href={webDocumentationLink(
                        'user-manual/agent-enrollment/security-options/using-password-authentication.html',
                      )}
                      rel='noopener noreferrer'
                    >
                      steps
                    </EuiLink>
                  </span>
                }
                iconType='iInCircle'
                className='warningForAgentName'
              />
            ),
            status: getPasswordStepStatus(form.fields),
          },
        ]
      : []),
    {
      title: <span className='stepTitle'>Optional settings</span>,
      children: <OptionalsInputs formFields={form.fields} />,
      status: getOptionalParameterStepStatus(
        form.fields,
        installCommandWasCopied,
      ),
    },
    {
      title: (
        <span className='stepTitle'>
          Run the following commands to download and install the Wazuh agent:
        </span>
      ),
      children: (
        <CommandOutput
          commandText={installCommand}
          showCommand={showCommandsSections(form.fields)}
          os={registerAgentFormValues.operatingSystem.name}
          onCopy={() => setInstallCommandWasCopied(true)}
          password={registerAgentFormValues.optionalParams.wazuhPassword}
        />
      ),
      status: installCommandStepStatus,
    },
    {
      title: <span className='stepTitle'>Start the Wazuh agent:</span>,
      children: (
        <CommandOutput
          commandText={startCommand}
          showCommand={showCommandsSections(form.fields)}
          os={registerAgentFormValues.operatingSystem.name}
          onCopy={() => setStartCommandWasCopied(true)}
        />
      ),
      status: startCommandStepStatus,
    },
  ];

  return <EuiSteps steps={registerAgentFormSteps} />;
};
