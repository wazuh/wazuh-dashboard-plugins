import React, { useEffect, useState } from 'react';
import {
  EuiCallOut,
  EuiLink,
  EuiSteps,
  EuiButton,
  EuiCode,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
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
import EnrollmentTokenInput from '../../components/enrollment-token/enrollment-token';
import { EnrollmentToken } from '../../interfaces/types';
import {
  getAgentCommandsStepStatus,
  tFormStepsStatus,
  getOSSelectorStepStatus,
  getServerAddressStepStatus,
  getOptionalParameterStepStatus,
  showCommandsSections,
  getPasswordStepStatus,
  getEnrollmentTokenStepStatus,
  getIncompleteSteps,
  getInvalidFields,
  tFormFieldsLabel,
  tFormStepsLabel,
} from '../../services/register-agent-steps-status-services';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import OsCommandWarning from '../../components/command-output/os-warning';
import { endpointSummary } from '../../../../../utils/applications';
import { SECTIONS } from '../../../../../sections';
import NavigationService from '../../../../../react-services/navigation-service';

/* The step and field labels are internal keys the status services return; the
names shown in the warning callouts are looked up here. */
const STEP_LABELS: Record<tFormStepsLabel, string> = {
  [tFormStepsLabel.operatingSystemSelection]: i18n.translate(
    'wazuh.endpointsSummary.registerAgentSteps.stepLabels.operatingSystem',
    { defaultMessage: 'operating system' },
  ),
  [tFormStepsLabel.serverAddress]: i18n.translate(
    'wazuh.endpointsSummary.registerAgentSteps.stepLabels.serverAddress',
    { defaultMessage: 'server address' },
  ),
  [tFormStepsLabel.enrollmentToken]: i18n.translate(
    'wazuh.endpointsSummary.registerAgentSteps.stepLabels.enrollmentToken',
    { defaultMessage: 'enrollment token' },
  ),
};

const FIELD_LABELS: Record<tFormFieldsLabel, string> = {
  [tFormFieldsLabel.existingEnrollmentToken]: i18n.translate(
    'wazuh.endpointsSummary.registerAgentSteps.fieldLabels.existingEnrollmentToken',
    { defaultMessage: 'existing enrollment token' },
  ),
  [tFormFieldsLabel.enrollmentTokenTtl]: i18n.translate(
    'wazuh.endpointsSummary.registerAgentSteps.fieldLabels.enrollmentTokenTtl',
    { defaultMessage: 'enrollment token lifetime' },
  ),
  [tFormFieldsLabel.enrollmentTokenMaxUses]: i18n.translate(
    'wazuh.endpointsSummary.registerAgentSteps.fieldLabels.enrollmentTokenMaxUses',
    { defaultMessage: 'enrollment token enrollments' },
  ),
  [tFormFieldsLabel.agentName]: i18n.translate(
    'wazuh.endpointsSummary.registerAgentSteps.fieldLabels.agentName',
    { defaultMessage: 'agent name' },
  ),
  [tFormFieldsLabel.agentGroups]: i18n.translate(
    'wazuh.endpointsSummary.registerAgentSteps.fieldLabels.agentGroups',
    { defaultMessage: 'agent groups' },
  ),
  [tFormFieldsLabel.serverAddress]: i18n.translate(
    'wazuh.endpointsSummary.registerAgentSteps.fieldLabels.serverAddress',
    { defaultMessage: 'server address' },
  ),
  [tFormFieldsLabel.serverPort]: i18n.translate(
    'wazuh.endpointsSummary.registerAgentSteps.fieldLabels.serverPort',
    { defaultMessage: 'server port' },
  ),
  [tFormFieldsLabel.serverPath]: i18n.translate(
    'wazuh.endpointsSummary.registerAgentSteps.fieldLabels.serverPath',
    { defaultMessage: 'server path prefix' },
  ),
  [tFormFieldsLabel.managerCa]: i18n.translate(
    'wazuh.endpointsSummary.registerAgentSteps.fieldLabels.managerCa',
    { defaultMessage: 'manager CA file path' },
  ),
};

/* Joins the labels into one list, leaving the conjunction and the word order to
the translation. */
const joinLabels = (labels: string[]): string =>
  labels.reduce((previous, next) =>
    i18n.translate(
      'wazuh.endpointsSummary.registerAgentSteps.labelListConjunction',
      {
        defaultMessage: '{previous} and {next}',
        values: { previous, next },
      },
    ),
  );

interface IStepsProps {
  needsPassword: boolean;
  form: UseFormReturn;
  osCard: React.ReactElement;
  wazuhPassword: string;
  canReadAuthdPassword: boolean;
  canCreateEnrollmentToken: boolean;
  enrollmentToken: EnrollmentToken | null;
  onEnrollmentTokenChange: (enrollmentToken: EnrollmentToken | null) => void;
}

export const Steps = ({
  needsPassword,
  form,
  osCard,
  wazuhPassword,
  canReadAuthdPassword,
  canCreateEnrollmentToken,
  enrollmentToken,
  onEnrollmentTokenChange,
}: IStepsProps) => {
  /* The enrollment token replaces the password: the agent enrolls with the
  credential the token carries, so the password steps are only reached when the
  server cannot mint one for this user. */
  const passwordPermissionMissing =
    !canCreateEnrollmentToken && needsPassword && !canReadAuthdPassword;
  /* Blocks the command steps while the token path is in use and no token has
  been generated yet. */
  const enrollmentTokenIsMissing = canCreateEnrollmentToken && !enrollmentToken;
  const initialParsedFormValues = {
    operatingSystem: {
      name: '',
      architecture: '',
    },
    optionalParams: {
      agentGroups: '',
      agentName: '',
      serverAddress: '',
      wazuhPassword: canCreateEnrollmentToken ? '' : wazuhPassword,
      enrollmentToken: enrollmentToken?.token || '',
      sslVerification: true,
      managerCa: '',
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

  const missingStepsMessage = missingStepsName?.length
    ? i18n.translate(
        'wazuh.endpointsSummary.registerAgentSteps.missingStepsWarning',
        {
          defaultMessage: 'Please select the {steps}.',
          values: {
            steps: joinLabels(
              missingStepsName.map(label => STEP_LABELS[label] ?? label),
            ),
          },
        },
      )
    : '';
  const invalidFieldsMessage = invalidFieldsName?.length
    ? i18n.translate(
        'wazuh.endpointsSummary.registerAgentSteps.invalidFieldsWarning',
        {
          defaultMessage:
            'There are fields with errors. Please verify them: {fields}.',
          values: {
            fields: joinLabels(
              invalidFieldsName.map(label => FIELD_LABELS[label] ?? label),
            ),
          },
        },
      )
    : '';

  useEffect(() => {
    // get form values and parse them divided in OS and optional params
    const registerAgentFormValuesParsed = parseRegisterAgentFormValues(
      getRegisterAgentFormValues(form),
      OPERATING_SYSTEMS_OPTIONS,
      initialParsedFormValues,
    );
    setRegisterAgentFormValues(registerAgentFormValuesParsed);
    setInstallCommandStepStatus(
      getAgentCommandsStepStatus(
        form.fields,
        installCommandWasCopied,
        enrollmentTokenIsMissing,
      ),
    );
    setStartCommandStepStatus(
      getAgentCommandsStepStatus(
        form.fields,
        startCommandWasCopied,
        enrollmentTokenIsMissing,
      ),
    );
    setMissingStepsName(
      getIncompleteSteps(form.fields, enrollmentTokenIsMissing) || [],
    );
    setInvalidFieldsName(getInvalidFields(form.fields) || []);
  }, [form.fields, enrollmentToken]);

  const { installCommand, startCommand, selectOS, setOptionalParams } =
    useRegisterAgentCommands<tOperatingSystem, tOptionalParameters>({
      osDefinitions: osCommandsDefinitions,
      optionalParamsDefinitions: optionalParamsDefinitions,
    });

  // install - start commands step state
  const [installCommandWasCopied, setInstallCommandWasCopied] = useState(false);
  const [installCommandStepStatus, setInstallCommandStepStatus] =
    useState<tFormStepsStatus>(
      getAgentCommandsStepStatus(form.fields, false, enrollmentTokenIsMissing),
    );
  const [startCommandWasCopied, setStartCommandWasCopied] = useState(false);
  const [startCommandStepStatus, setStartCommandStepStatus] =
    useState<tFormStepsStatus>(
      getAgentCommandsStepStatus(form.fields, false, enrollmentTokenIsMissing),
    );

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
      getAgentCommandsStepStatus(
        form.fields,
        installCommandWasCopied,
        enrollmentTokenIsMissing,
      ),
    );
  }, [installCommandWasCopied]);

  useEffect(() => {
    setStartCommandStepStatus(
      getAgentCommandsStepStatus(
        form.fields,
        startCommandWasCopied,
        enrollmentTokenIsMissing,
      ),
    );
  }, [startCommandWasCopied]);

  const passwordStepTitle = i18n.translate(
    'wazuh.endpointsSummary.registerAgentSteps.passwordTitle',
    { defaultMessage: 'Password' },
  );

  const registerAgentFormSteps = [
    {
      title: i18n.translate(
        'wazuh.endpointsSummary.registerAgentSteps.osSelectionTitle',
        {
          defaultMessage:
            'Select the package to download and install on your system:',
        },
      ),
      children: osCard,
      status: getOSSelectorStepStatus(form.fields),
    },
    {
      title: i18n.translate(
        'wazuh.endpointsSummary.registerAgentSteps.serverAddressTitle',
        {
          defaultMessage: 'Server address:',
        },
      ),
      children: (
        <ServerAddress
          formFields={{
            serverAddress: form.fields.serverAddress,
            serverPort: form.fields.serverPort,
            serverPath: form.fields.serverPath,
          }}
        />
      ),
      status: getServerAddressStepStatus(form.fields),
    },
    ...(canCreateEnrollmentToken
      ? [
          {
            title: i18n.translate(
              'wazuh.endpointsSummary.registerAgentSteps.enrollmentTokenTitle',
              {
                defaultMessage: 'Enrollment token:',
              },
            ),
            children: (
              <EnrollmentTokenInput
                formFields={form.fields}
                enrollmentToken={enrollmentToken}
                onEnrollmentTokenChange={onEnrollmentTokenChange}
              />
            ),
            status: getEnrollmentTokenStepStatus(
              form.fields,
              Boolean(enrollmentToken),
            ),
          },
        ]
      : []),
    ...(!canCreateEnrollmentToken && needsPassword && !wazuhPassword
      ? [
          {
            title: passwordStepTitle,
            children: (
              <EuiCallOut
                color='warning'
                title={
                  <span>
                    <FormattedMessage
                      id='wazuh.endpointsSummary.registerAgentSteps.passwordUndefinedWarning'
                      defaultMessage="The password is required but wasn't defined. Please check our {documentationLink}"
                      values={{
                        documentationLink: (
                          <EuiLink
                            target='_blank'
                            href={webDocumentationLink(
                              'user-manual/agent/agent-enrollment/security-options/using-password-authentication.html',
                            )}
                            rel='noopener noreferrer'
                          >
                            {i18n.translate(
                              'wazuh.endpointsSummary.registerAgentSteps.passwordDocumentationLink',
                              { defaultMessage: 'documentation' },
                            )}
                          </EuiLink>
                        ),
                      }}
                    />
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
            title: passwordStepTitle,
            children: (
              <EuiCallOut
                color='warning'
                title={i18n.translate(
                  'wazuh.endpointsSummary.registerAgentSteps.passwordPermissionMissingTitle',
                  {
                    defaultMessage:
                      'Missing permission to read the registration password',
                  },
                )}
                iconType='iInCircle'
                className='warningForAgentName'
              >
                <p>
                  <FormattedMessage
                    id='wazuh.endpointsSummary.registerAgentSteps.passwordPermissionMissingDescription'
                    defaultMessage='Require {permission} permission.'
                    values={{
                      permission: <EuiCode>cluster:update_config</EuiCode>,
                    }}
                  />
                </p>
              </EuiCallOut>
            ),
            status: getPasswordStepStatus(form.fields),
          },
        ]
      : []),
    {
      title: i18n.translate(
        'wazuh.endpointsSummary.registerAgentSteps.optionalSettingsTitle',
        {
          defaultMessage: 'Optional settings:',
        },
      ),
      children: <OptionalsInputs formFields={form.fields} />,
      status: getOptionalParameterStepStatus(
        form.fields,
        installCommandWasCopied,
      ),
    },
    {
      title: i18n.translate(
        'wazuh.endpointsSummary.registerAgentSteps.installCommandTitle',
        {
          defaultMessage:
            'Run the following commands to download and install the agent:',
        },
      ),
      children: passwordPermissionMissing ? (
        <EuiCallOut
          color='warning'
          title={i18n.translate(
            'wazuh.endpointsSummary.registerAgentSteps.installCommandHiddenTitle',
            {
              defaultMessage: 'Deployment commands hidden',
            },
          )}
          iconType='iInCircle'
        >
          <p>
            {i18n.translate(
              'wazuh.endpointsSummary.registerAgentSteps.installCommandHiddenDescription',
              {
                defaultMessage:
                  'Missing permissions to read the manager configuration required to view the deployment commands.',
              },
            )}
          </p>
        </EuiCallOut>
      ) : (
        <>
          {missingStepsName?.length ? (
            <EuiCallOut
              color='warning'
              title={missingStepsMessage}
              iconType='iInCircle'
            />
          ) : null}
          {invalidFieldsName?.length ? (
            <EuiCallOut
              color='danger'
              title={invalidFieldsMessage}
              iconType='iInCircle'
              style={{ marginTop: '1rem' }}
            />
          ) : null}
          {!missingStepsName?.length && !invalidFieldsName?.length ? (
            <>
              <CommandOutput
                commandText={installCommand}
                showCommand={showCommandsSections(
                  form.fields,
                  enrollmentTokenIsMissing,
                )}
                os={registerAgentFormValues.operatingSystem.name}
                onCopy={() => setInstallCommandWasCopied(true)}
                password={registerAgentFormValues.optionalParams.wazuhPassword}
                enrollmentToken={
                  registerAgentFormValues.optionalParams.enrollmentToken
                }
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
      title: i18n.translate(
        'wazuh.endpointsSummary.registerAgentSteps.startCommandTitle',
        {
          defaultMessage: 'Start the agent:',
        },
      ),
      children: passwordPermissionMissing ? (
        <EuiCallOut
          color='warning'
          title={i18n.translate(
            'wazuh.endpointsSummary.registerAgentSteps.startCommandHiddenTitle',
            {
              defaultMessage: 'Start command hidden',
            },
          )}
          iconType='iInCircle'
        >
          <p>
            {i18n.translate(
              'wazuh.endpointsSummary.registerAgentSteps.startCommandHiddenDescription',
              {
                defaultMessage:
                  'Missing permissions to read the manager configuration required to view the start command.',
              },
            )}
          </p>
        </EuiCallOut>
      ) : (
        <>
          {missingStepsName?.length ? (
            <EuiCallOut
              color='warning'
              title={missingStepsMessage}
              iconType='iInCircle'
            />
          ) : null}
          {invalidFieldsName?.length ? (
            <EuiCallOut
              color='danger'
              title={invalidFieldsMessage}
              iconType='iInCircle'
              style={{ marginTop: '1rem' }}
            />
          ) : null}
          {!missingStepsName?.length && !invalidFieldsName?.length ? (
            <CommandOutput
              commandText={startCommand}
              showCommand={showCommandsSections(
                form.fields,
                enrollmentTokenIsMissing,
              )}
              os={registerAgentFormValues.operatingSystem.name}
              onCopy={() => setStartCommandWasCopied(true)}
            />
          ) : null}
        </>
      ),
      status: startCommandStepStatus,
    },
    {
      title: i18n.translate(
        'wazuh.endpointsSummary.registerAgentSteps.verifyConnectionTitle',
        {
          defaultMessage: 'Go to endpoints to verify the agent connection:',
        },
      ),
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
          // This shows the link preview on hover,
          href={NavigationService.getInstance().getUrlForApp(
            endpointSummary.id,
            {
              path: `#/${SECTIONS.AGENTS_PREVIEW}`,
            },
          )}
          aria-label={i18n.translate(
            'wazuh.endpointsSummary.registerAgentSteps.backToAgentListAriaLabel',
            {
              defaultMessage: 'Open {appLabel}',
              values: { appLabel: endpointSummary.breadcrumbLabel },
            },
          )}
        >
          {i18n.translate(
            'wazuh.endpointsSummary.registerAgentSteps.backToAgentList',
            {
              defaultMessage: 'Back to agent list',
            },
          )}
        </EuiButton>
      ),
      status: startCommandStepStatus === 'complete' ? 'current' : 'disabled',
    },
  ];

  return <EuiSteps steps={registerAgentFormSteps} />;
};
