import React, { useEffect, useState } from 'react';
import { EuiCallOut, EuiSteps, EuiSpacer } from '@elastic/eui';
import './steps.scss';
import { FormattedMessage } from '@osd/i18n/react';
import { OPERATING_SYSTEMS_OPTIONS } from '../../utils/enroll-agent-data';
import {
  IParseEnrollFormValues,
  getEnrollAgentFormValues,
  parseEnrollAgentFormValues,
} from '../../services/enroll-agent-services';
import { useEnrollAgentCommands } from '../../hooks/use-enroll-agent-commands';
import {
  osCommandsDefinitions,
  optionalParamsDefinitions,
  TOperatingSystem,
  TOptionalParameters,
} from '../../core/config/os-commands-definitions';
import { UseFormReturn } from '../../components/form/types';
import CommandOutput from '../../components/command-output/command-output';
import ServerAddress from '../../components/server-address/server-address';
import OptionalsInputs from '../../components/optionals-inputs/optionals-inputs';
import { SecurityInputs } from '../../components/security';
import {
  getAgentCommandsStepStatus,
  TFormStepsStatus,
  getOSSelectorStepStatus,
  getServerAddressStepStatus,
  getOptionalParameterStepStatus,
  showCommandsSections,
  getIncompleteSteps,
  getInvalidFields,
  FORM_FIELDS_LABEL,
  FORM_STEPS_LABELS,
  getServerCredentialsStepStatus,
} from '../../services/enroll-agent-steps-status-services';
import OsCommandWarning from '../../components/command-output/os-warning';
import { InputForm } from '../../components/form';

interface IStepsProps {
  form: UseFormReturn;
}

const FORM_MESSAGE_CONJUNTION = ' and ';

export const Steps = ({ form }: IStepsProps) => {
  const initialParsedFormValues = {
    operatingSystem: {
      name: '',
      architecture: '',
    },
    optionalParams: {
      agentName: '',
      serverAddress: '',
    },
  } as IParseEnrollFormValues;
  const [missingStepsName, setMissingStepsName] = useState<FORM_STEPS_LABELS[]>(
    [],
  );
  const [invalidFieldsName, setInvalidFieldsName] = useState<
    FORM_FIELDS_LABEL[]
  >([]);
  const [enrollAgentFormValues, setEnrollAgentFormValues] =
    useState<IParseEnrollFormValues>(initialParsedFormValues);
  const { installCommand, startCommand, selectOS, setOptionalParams } =
    useEnrollAgentCommands<TOperatingSystem, TOptionalParameters>({
      osDefinitions: osCommandsDefinitions,
      optionalParamsDefinitions: optionalParamsDefinitions,
    });
  // install - start commands step state
  const [installCommandWasCopied, setInstallCommandWasCopied] = useState(false);
  const [installCommandStepStatus, setInstallCommandStepStatus] =
    useState<TFormStepsStatus>(getAgentCommandsStepStatus(form.fields, false));
  const [startCommandWasCopied, setStartCommandWasCopied] = useState(false);
  const [startCommandStepStatus, setStartCommandStepStatus] =
    useState<TFormStepsStatus>(getAgentCommandsStepStatus(form.fields, false));

  useEffect(() => {
    // get form values and parse them divided in OS and optional params
    const enrollAgentFormValuesParsed = parseEnrollAgentFormValues(
      getEnrollAgentFormValues(form),
      OPERATING_SYSTEMS_OPTIONS,
      initialParsedFormValues,
    );

    setEnrollAgentFormValues(enrollAgentFormValuesParsed);
    setInstallCommandStepStatus(
      getAgentCommandsStepStatus(form.fields, installCommandWasCopied),
    );
    setStartCommandStepStatus(
      getAgentCommandsStepStatus(form.fields, startCommandWasCopied),
    );
    setMissingStepsName(getIncompleteSteps(form.fields) || []);
    setInvalidFieldsName(getInvalidFields(form.fields) || []);
  }, [form.fields]);

  useEffect(() => {
    if (
      enrollAgentFormValues.operatingSystem.name !== '' &&
      enrollAgentFormValues.operatingSystem.architecture !== ''
    ) {
      selectOS(enrollAgentFormValues.operatingSystem as TOperatingSystem);
    }

    setOptionalParams(
      { ...enrollAgentFormValues.optionalParams },
      enrollAgentFormValues.operatingSystem as TOperatingSystem,
    );
    setInstallCommandWasCopied(false);
    setStartCommandWasCopied(false);
  }, [enrollAgentFormValues]);

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

  const enrollAgentFormSteps = [
    {
      title: 'Select the package to download and install on your system:',
      children: (
        <InputForm {...form.fields.operatingSystemSelection}></InputForm>
      ),
      status: getOSSelectorStepStatus(form.fields),
    },
    {
      title: 'Server address:',
      children: <ServerAddress formField={form.fields.serverAddress} />,
      status: getServerAddressStepStatus(form.fields),
    },
    {
      title: (
        <FormattedMessage
          id='wzFleet.enrollmentAssistant.steps.credentials.title'
          defaultMessage='Server credentials:'
        />
      ),
      children: (
        <SecurityInputs
          username={form.fields.username}
          password={form.fields.password}
        />
      ),
      status: getServerCredentialsStepStatus(form.fields),
    },
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
              {/* TODO: remove the warning and spacer when the packages are publically hosted */}
              <EuiCallOut
                color='warning'
                title='The agent packages are not publically hosted and need to be manually downloaded from the internal resource. This warning should be removed and the command to copy should include how to download the file using some utility from the operating system.'
                iconType='iInCircle'
              />
              <EuiSpacer size='s' />
              <CommandOutput
                commandText={installCommand}
                showCommand={showCommandsSections(form.fields)}
                os={enrollAgentFormValues.operatingSystem.name}
                onCopy={() => setInstallCommandWasCopied(true)}
                password={enrollAgentFormValues.optionalParams.password}
              />
              <OsCommandWarning
                os={enrollAgentFormValues.operatingSystem.name}
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
              os={enrollAgentFormValues.operatingSystem.name}
              onCopy={() => setStartCommandWasCopied(true)}
            />
          ) : null}
        </>
      ),
      status: startCommandStepStatus,
    },
  ];

  return <EuiSteps steps={enrollAgentFormSteps} />;
};
