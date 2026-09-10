import { EuiStepStatus } from '@elastic/eui';
import { UseFormReturn } from '../../../components/common/form/types';
import {
  FormStepsDependencies,
  RegisterAgentFormStatusManager,
} from './form-status-manager';

const fieldsHaveErrors = (
  fieldsToCheck: string[],
  formFields: UseFormReturn['fields'],
) => {
  if (!fieldsToCheck) {
    return true;
  }
  // check if the fieldsToCheck array NOT exists in formFields and get the field doesn't exists
  if (!fieldsToCheck.every(key => formFields[key])) {
    throw Error('fields to check are not defined in formFields');
  }

  const haveError = fieldsToCheck.some(key => {
    return formFields[key]?.error;
  });
  return haveError;
};

const fieldsAreEmpty = (
  fieldsToCheck: string[],
  formFields: UseFormReturn['fields'],
) => {
  if (!fieldsToCheck) {
    return true;
  }
  // check if the fieldsToCheck array NOT exists in formFields and get the field doesn't exists
  if (!fieldsToCheck.every(key => formFields[key])) {
    throw Error('fields to check are not defined in formFields');
  }

  const notEmpty = fieldsToCheck.some(key => {
    return formFields[key]?.value?.length > 0;
  });
  return !notEmpty;
};

const anyFieldIsComplete = (
  fieldsToCheck: string[],
  formFields: UseFormReturn['fields'],
) => {
  if (!fieldsToCheck) {
    return true;
  }
  // check if the fieldsToCheck array NOT exists in formFields and get the field doesn't exists
  if (!fieldsToCheck.every(key => formFields[key])) {
    throw Error('fields to check are not defined in formFields');
  }

  if (fieldsHaveErrors(fieldsToCheck, formFields)) {
    return false;
  }

  if (fieldsAreEmpty(fieldsToCheck, formFields)) {
    return false;
  }

  return true;
};

/* The server address step now collects the whole endpoint. The port and the
path prefix are optional -- left empty the agent applies its own default -- so
only an invalid value blocks the step, never an empty one. */
const ENDPOINT_FIELDS = ['serverAddress', 'serverPort', 'serverPath'];

const serverEndpointIsIncomplete = (
  formFields: UseFormReturn['fields'],
): boolean =>
  !formFields.serverAddress.value ||
  ENDPOINT_FIELDS.some(key => Boolean(formFields[key]?.error));

/* The wizard mints an enrollment token and installs the agent with it, so
until the operator generates one there is no command to show. The flag is false
whenever the token path is not in use -- the operator lacks
`enrollment_token:create`, or the manager does not know the action -- and the
wizard falls back to the enrollment password. */
export const showCommandsSections = (
  formFields: UseFormReturn['fields'],
  enrollmentTokenIsMissing: boolean = false,
): boolean => {
  if (enrollmentTokenIsMissing) {
    return false;
  }
  if (
    !formFields.operatingSystemSelection.value ||
    serverEndpointIsIncomplete(formFields)
  ) {
    return false;
  } else if (
    formFields.serverAddress.value === '' &&
    formFields.agentName.value === ''
  ) {
    return true;
  } else if (!fieldsHaveErrors(['agentGroups', 'agentName'], formFields)) {
    return true;
  } else {
    return false;
  }
};

/******** Form Steps status getters ********/

export type tFormStepsStatus = EuiStepStatus | 'current' | 'disabled' | '';

export const getOSSelectorStepStatus = (
  formFields: UseFormReturn['fields'],
): tFormStepsStatus => {
  return formFields.operatingSystemSelection.value ? 'complete' : 'current';
};

export const getAgentCommandsStepStatus = (
  formFields: UseFormReturn['fields'],
  wasCopied: boolean,
  enrollmentTokenIsMissing: boolean = false,
): tFormStepsStatus | 'disabled' => {
  if (!showCommandsSections(formFields, enrollmentTokenIsMissing)) {
    return 'disabled';
  } else if (wasCopied) {
    return 'complete';
  } else {
    return 'current';
  }
};

export const getServerAddressStepStatus = (
  formFields: UseFormReturn['fields'],
): tFormStepsStatus => {
  if (
    !formFields.operatingSystemSelection.value ||
    formFields.operatingSystemSelection.error
  ) {
    return 'disabled';
  } else if (serverEndpointIsIncomplete(formFields)) {
    return 'current';
  } else {
    return 'complete';
  }
};

export const getOptionalParameterStepStatus = (
  formFields: UseFormReturn['fields'],
  installCommandWasCopied: boolean,
): tFormStepsStatus => {
  // when previous step are not complete
  if (
    !formFields.operatingSystemSelection.value ||
    formFields.operatingSystemSelection.error ||
    serverEndpointIsIncomplete(formFields)
  ) {
    return 'disabled';
  } else if (
    installCommandWasCopied ||
    anyFieldIsComplete(['agentName', 'agentGroups'], formFields)
  ) {
    return 'complete';
  } else {
    return 'current';
  }
};

export const getEnrollmentTokenStepStatus = (
  formFields: UseFormReturn['fields'],
  hasEnrollmentToken: boolean,
): tFormStepsStatus => {
  if (
    !formFields.operatingSystemSelection.value ||
    formFields.operatingSystemSelection.error ||
    serverEndpointIsIncomplete(formFields)
  ) {
    return 'disabled';
  }
  return hasEnrollmentToken ? 'complete' : 'current';
};

export const getPasswordStepStatus = (
  formFields: UseFormReturn['fields'],
): tFormStepsStatus => {
  if (
    !formFields.operatingSystemSelection.value ||
    formFields.operatingSystemSelection.error ||
    serverEndpointIsIncomplete(formFields)
  ) {
    return 'disabled';
  } else {
    return 'complete';
  }
};

export enum tFormStepsLabel {
  operatingSystemSelection = 'operating system',
  serverAddress = 'server address',
  enrollmentToken = 'enrollment token',
}

export const getIncompleteSteps = (
  formFields: UseFormReturn['fields'],
  enrollmentTokenIsMissing: boolean = false,
): tFormStepsLabel[] => {
  const steps: FormStepsDependencies = {
    operatingSystemSelection: ['operatingSystemSelection'],
    serverAddress: ['serverAddress'],
  };
  const statusManager = new RegisterAgentFormStatusManager(formFields, steps);
  // replace fields array using label names
  const incompleteSteps = statusManager.getIncompleteSteps().map(field => {
    return tFormStepsLabel[field] || field;
  });

  return enrollmentTokenIsMissing
    ? [...incompleteSteps, tFormStepsLabel.enrollmentToken]
    : incompleteSteps;
};

export enum tFormFieldsLabel {
  existingEnrollmentToken = 'existing enrollment token',
  enrollmentTokenTtl = 'enrollment token lifetime',
  enrollmentTokenMaxUses = 'enrollment token enrollments',
  agentName = 'agent name',
  agentGroups = 'agent groups',
  serverAddress = 'server address',
  serverPort = 'server port',
  serverPath = 'server path prefix',
  managerCa = 'manager CA file path',
}

/* The three fields that parameterize a mint request, none of which is sent when
a stored token is being reused instead. */
const TOKEN_REQUEST_FIELDS = [
  'enrollmentTokenTtl',
  'enrollmentTokenMaxUses',
  'enrollmentTokenDescription',
];

/* Fields the form is still holding a value for but that the wizard is no
longer asking about, because their input is not rendered or is disabled. An
error on them cannot be seen or corrected, so reporting it would block the
commands with no way out. */
const fieldIsNotApplicable = (
  fieldName: string,
  formFields: UseFormReturn['fields'],
  hasEnrollmentToken: boolean,
): boolean => {
  if (
    fieldName === 'managerCa' &&
    (!formFields.sslVerification?.value || hasEnrollmentToken)
  ) {
    return true;
  }
  /* A token the operator already had is being reused, so no mint request is
  made and the fields that would parameterize it are disabled. */
  return (
    TOKEN_REQUEST_FIELDS.includes(fieldName) &&
    String(formFields.existingEnrollmentToken?.value ?? '').trim().length > 0
  );
};

export const getInvalidFields = (
  formFields: UseFormReturn['fields'],
  hasEnrollmentToken: boolean = false,
): tFormFieldsLabel[] => {
  const statusManager = new RegisterAgentFormStatusManager(formFields);

  return statusManager
    .getInvalidFields()
    .filter(
      field => !fieldIsNotApplicable(field, formFields, hasEnrollmentToken),
    )
    .map(field => {
      return tFormFieldsLabel[field] || field;
    });
};
