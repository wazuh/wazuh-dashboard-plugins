import React, { useEffect, useState } from 'react';
import {
  EuiCallOut,
  EuiLink,
  EuiSteps,
  EuiButton,
} from '@elastic/eui';
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
import { UseFormReturn } from '../../../../common/form/types';
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
} from '../../services/register-agent-steps-status-services';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import OsCommandWarning from '../../components/command-output/os-warning';
import { endpointSummary } from '../../../../../utils/applications';
import { SECTIONS } from '../../../../../sections';
import NavigationService from '../../../../../react-services/navigation-service';
import { endpointsSummaryI18n } from '../../../i18n';

const dw = endpointsSummaryI18n.deployWizard;

interface IStepsProps {
  needsPassword: boolean;
  form: UseFormReturn;
  osCard: React.ReactElement;
  connection: {
    isUDP: boolean;
  };
  wazuhPassword: string;
  canReadAuthdPassword: boolean;
}

export const Steps = ({
  needsPassword,
  form,
  osCard,
  connection,
  wazuhPassword,
  canReadAuthdPassword,
}: IStepsProps) => {
  const passwordPermissionMissing = needsPassword && !canReadAuthdPassword;
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
  const [missingStepsName, setMissingStepsName] = useState<string[]>([]);
  const [invalidFieldsName, setInvalidFieldsName] = useState<string[]>([]);
  const [registerAgentFormValues, setRegisterAgentFormValues] =
    useState<IParseRegisterFormValues>(initialParsedFormValues);

  const FORM_MESSAGE_CONJUNCTION = dw.stepConjunction;

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
      title: dw.stepSelectPackage,
      children: osCard,
      status: getOSSelectorStepStatus(form.fields),
    },
    {
      title: dw.stepServerAddressTitle,
      children: <ServerAddress formField={form.fields.serverAddress} />,
      status: getServerAddressStepStatus(form.fields),
    },
    ...(needsPassword && !wazuhPassword
      ? [
          {
            title: dw.stepPassword,
            children: (
              <EuiCallOut
                color='warning'
                title={
                  <span>
                    {dw.passwordRequiredPrefix}{' '}
                    <EuiLink
                      target='_blank'
                      href={webDocumentationLink(
                        'user-manual/agent/agent-enrollment/security-options/using-password-authentication.html',
                      )}
                      rel='noopener noreferrer'
                    >
                      {dw.documentation}
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
    ...(passwordPermissionMissing
      ? [
          {
            title: dw.stepPassword,
            children: (
              <EuiCallOut
                color='warning'
                title={dw.missingPasswordPermissionTitle}
                iconType='iInCircle'
                className='warningForAgentName'
              >
                <p>
                  {dw.missingPasswordPermissionBody('cluster:update_config')}
                </p>
              </EuiCallOut>
            ),
            status: getPasswordStepStatus(form.fields),
          },
        ]
      : []),
    {
      title: dw.stepOptionalSettingsTitle,
      children: <OptionalsInputs formFields={form.fields} />,
      status: getOptionalParameterStepStatus(
        form.fields,
        installCommandWasCopied,
      ),
    },
    {
      title: dw.stepInstallCommands,
      children: passwordPermissionMissing ? (
        <EuiCallOut
          color='warning'
          title={dw.deploymentCommandsHiddenTitle}
          iconType='iInCircle'
        >
          <p>{dw.deploymentCommandsHiddenBody}</p>
        </EuiCallOut>
      ) : (
        <>
          {missingStepsName?.length ? (
            <EuiCallOut
              color='warning'
              title={dw.pleaseSelectSteps(
                missingStepsName?.join(FORM_MESSAGE_CONJUNCTION),
              )}
              iconType='iInCircle'
            />
          ) : null}
          {invalidFieldsName?.length ? (
            <EuiCallOut
              color='danger'
              title={dw.fieldsWithErrors(
                invalidFieldsName?.join(FORM_MESSAGE_CONJUNCTION),
              )}
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
      title: dw.stepStartAgent,
      children: passwordPermissionMissing ? (
        <EuiCallOut
          color='warning'
          title={dw.startCommandHiddenTitle}
          iconType='iInCircle'
        >
          <p>{dw.startCommandHiddenBody}</p>
        </EuiCallOut>
      ) : (
        <>
          {missingStepsName?.length ? (
            <EuiCallOut
              color='warning'
              title={dw.pleaseSelectSteps(
                missingStepsName?.join(FORM_MESSAGE_CONJUNCTION),
              )}
              iconType='iInCircle'
            />
          ) : null}
          {invalidFieldsName?.length ? (
            <EuiCallOut
              color='danger'
              title={dw.fieldsWithErrors(
                invalidFieldsName?.join(FORM_MESSAGE_CONJUNCTION),
              )}
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
    {
      title: dw.stepVerifyConnection,
      children: (
        <EuiButton
          color='primary'
          fill
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            NavigationService.getInstance().navigate(
              `/${SECTIONS.AGENTS_PREVIEW}`,
            );
          }}
          href={NavigationService.getInstance().getUrlForApp(
            endpointSummary.id,
            { path: `#/${SECTIONS.AGENTS_PREVIEW}` },
          )}
          aria-label={dw.openBreadcrumb(endpointSummary.breadcrumbLabel)}
        >
          {dw.backToAgentList}
        </EuiButton>
      ),
      status: startCommandStepStatus === 'complete' ? 'current' : 'disabled',
    },
  ];

  return <EuiSteps steps={registerAgentFormSteps} />;
};
