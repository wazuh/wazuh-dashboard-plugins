import React, { Fragment, useEffect, useState } from 'react';
import { EuiCallOut, EuiLink, EuiSteps } from '@elastic/eui';
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
import { UseFormReturn } from '../../components/form/types';
import CommandOutput from '../../components/command-output/command-output';
import ServerAddress from '../../components/server-address/server-address';
import OptionalsInputs from '../../components/optionals-inputs/optionals-inputs';
import {
  getAgentCommandsStepStatus,
  tFormStepsStatus,
  getOSSelectorStepStatus,
  getServerAddressStepStatus,
  getOptionalParameterStepStatus,
  showCommandsSections,
  getPasswordStepStatus,
  getIncompleteSteps,
  getInvalidFields,
  tFormFieldsLabel,
  tFormStepsLabel,
} from '../../services/register-agent-steps-status-services';
import { webDocumentationLink } from '../../services/web-documentation-link';
import OsCommandWarning from '../../components/command-output/os-warning';

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
  const [missingStepsName, setMissingStepsName] = useState<tFormStepsLabel[]>(
    [],
  );
  const [invalidFieldsName, setInvalidFieldsName] = useState<
    tFormFieldsLabel[]
  >([]);
  const [registerAgentFormValues, setRegisterAgentFormValues] =
    useState<IParseRegisterFormValues>(initialParsedFormValues);
  const FORM_MESSAGE_CONJUNTION = ' and ';

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
    setMissingStepsName(getIncompleteSteps(form.fields) || []);
    setInvalidFieldsName(getInvalidFields(form.fields) || []);
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

    setOptionalParams(
      { ...registerAgentFormValues.optionalParams },
      registerAgentFormValues.operatingSystem as tOperatingSystem,
    );
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
      title: 'Select the package to download and install on your system:',
      children: osCard,
      status: getOSSelectorStepStatus(form.fields),
    },
    {
      title: 'Server address:',
      children: <ServerAddress formField={form.fields.serverAddress} />,
      status: getServerAddressStepStatus(form.fields),
    },
    ...(needsPassword && !wazuhPassword
      ? [
          {
            title: 'Password',
            children: (
              <EuiCallOut
                color='warning'
                title={
                  <span>
                    The password is required but wasn't defined. Please check
                    our{' '}
                    <EuiLink
                      target='_blank'
                      href={webDocumentationLink(
                        'user-manual/agent-enrollment/security-options/using-password-authentication.html',
                      )}
                      rel='noopener noreferrer'
                    >
                      documentation
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
      title: 'Optional settings:',
      children: <OptionalsInputs formFields={form.fields} />,
      status: getOptionalParameterStepStatus(
        form.fields,
        installCommandWasCopied,
      ),
    },
    {
      title: 'Run the following commands to download and install the agent:',
      children: (
        <>
          {missingStepsName?.length ? (
            <EuiCallOut
              color='warning'
              title={`Please select the ${missingStepsName?.join(
                FORM_MESSAGE_CONJUNTION,
              )}.`}
              iconType='iInCircle'
            />
          ) : null}
          {invalidFieldsName?.length ? (
            <EuiCallOut
              color='danger'
              title={`There are fields with errors. Please verify them: ${invalidFieldsName?.join(
                FORM_MESSAGE_CONJUNTION,
              )}.`}
              iconType='iInCircle'
              style={{ marginTop: '1rem' }}
            />
          ) : null}
          {!missingStepsName?.length && !invalidFieldsName?.length ? (
            <>
              <CommandOutput
                commandText={installCommand}
                showCommand={showCommandsSections(form.fields)}
                os={registerAgentFormValues.operatingSystem.name}
                onCopy={() => setInstallCommandWasCopied(true)}
                password={registerAgentFormValues.optionalParams.wazuhPassword}
              />
              <OsCommandWarning
                os={registerAgentFormValues.operatingSystem.name}
              />
            </>
          ) : null}
        </>
      ),
      status: installCommandStepStatus,
    },
    {
      title: 'Start the agent:',
      children: (
        <>
          {missingStepsName?.length ? (
            <EuiCallOut
              color='warning'
              title={`Please select the ${missingStepsName?.join(
                FORM_MESSAGE_CONJUNTION,
              )}.`}
              iconType='iInCircle'
            />
          ) : null}
          {invalidFieldsName?.length ? (
            <EuiCallOut
              color='danger'
              title={`There are fields with errors. Please verify them: ${invalidFieldsName?.join(
                FORM_MESSAGE_CONJUNTION,
              )}.`}
              iconType='iInCircle'
              style={{ marginTop: '1rem' }}
            />
          ) : null}
          {!missingStepsName?.length && !invalidFieldsName?.length ? (
            <CommandOutput
              commandText={startCommand}
              showCommand={showCommandsSections(form.fields)}
              os={registerAgentFormValues.operatingSystem.name}
              onCopy={() => setStartCommandWasCopied(true)}
            />
          ) : null}
        </>
      ),
      status: startCommandStepStatus,
    },
  ];

  return <EuiSteps steps={registerAgentFormSteps} />;
};
