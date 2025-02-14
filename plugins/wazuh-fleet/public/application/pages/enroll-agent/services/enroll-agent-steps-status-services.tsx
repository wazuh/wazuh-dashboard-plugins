import { EuiStepStatus } from '@elastic/eui';
import { UseFormReturn } from '../components/form/types';
import {
  FormStepsDependencies,
  EnrollAgentFormStatusManager,
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
    throw new Error('fields to check are not defined in formFields');
  }

  const haveError = fieldsToCheck.some(key => formFields[key]?.error);

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
    throw new Error('fields to check are not defined in formFields');
  }

  const someFieldisEmptyValue = fieldsToCheck.some(
    key => formFields[key]?.value?.length === 0,
  );

  return someFieldisEmptyValue;
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
    throw new Error('fields to check are not defined in formFields');
  }

  if (fieldsHaveErrors(fieldsToCheck, formFields)) {
    return false;
  }

  if (fieldsAreEmpty(fieldsToCheck, formFields)) {
    return false;
  }

  return true;
};

export const showCommandsSections = (
  formFields: UseFormReturn['fields'],
): boolean => {
  if (
    fieldsAreEmpty(
      // required fields
      ['operatingSystemSelection', 'serverAddress', 'username', 'password'],
      formFields,
    ) ||
    fieldsHaveErrors(
      // check for errors
      [
        'operatingSystemSelection',
        'serverAddress',
        'username',
        'password',
        'agentName',
        'verificationMode',
        'enrollmentKey',
      ],
      formFields,
    )
  ) {
    return false;
  }

  return true;
};

/** ****** Form Steps status getters ********/

export type TFormStepsStatus = EuiStepStatus | 'current' | 'disabled' | '';

export const getOSSelectorStepStatus = (
  formFields: UseFormReturn['fields'],
): TFormStepsStatus =>
  formFields.operatingSystemSelection.value ? 'complete' : 'current';

export const getAgentCommandsStepStatus = (
  formFields: UseFormReturn['fields'],
  wasCopied: boolean,
): TFormStepsStatus | 'disabled' => {
  if (!showCommandsSections(formFields)) {
    return 'disabled';
  } else if (showCommandsSections(formFields) && wasCopied) {
    return 'complete';
  } else {
    return 'current';
  }
};

export const getServerAddressStepStatus = (
  formFields: UseFormReturn['fields'],
): TFormStepsStatus => {
  if (
    fieldsAreEmpty(
      // required fields
      ['operatingSystemSelection'],
      formFields,
    ) ||
    fieldsHaveErrors(
      // check for errors
      ['operatingSystemSelection'],
      formFields,
    )
  ) {
    return 'disabled';
  } else if (
    fieldsAreEmpty(
      // required fields
      ['serverAddress'],
      formFields,
    ) ||
    fieldsHaveErrors(
      // check for errors
      ['serverAddress'],
      formFields,
    )
  ) {
    return 'current';
  } else {
    return 'complete';
  }
};

export const getServerCredentialsStepStatus = (
  formFields: UseFormReturn['fields'],
): TFormStepsStatus => {
  if (
    fieldsAreEmpty(
      // required fields
      ['operatingSystemSelection', 'serverAddress'],
      formFields,
    ) ||
    fieldsHaveErrors(
      // check for errors
      ['operatingSystemSelection', 'serverAddress'],
      formFields,
    )
  ) {
    return 'disabled';
  } else if (
    fieldsAreEmpty(
      // required fields
      ['username', 'password'],
      formFields,
    ) ||
    fieldsHaveErrors(
      // check for errors
      ['username', 'password'],
      formFields,
    )
  ) {
    return 'current';
  } else {
    return 'complete';
  }
};

export const getOptionalParameterStepStatus = (
  formFields: UseFormReturn['fields'],
  installCommandWasCopied: boolean,
): TFormStepsStatus => {
  // when previous step are not complete
  if (
    fieldsAreEmpty(
      // required fields
      ['operatingSystemSelection', 'serverAddress', 'username', 'password'],
      formFields,
    ) ||
    fieldsHaveErrors(
      // check for errors
      ['operatingSystemSelection', 'serverAddress', 'username', 'password'],
      formFields,
    )
  ) {
    return 'disabled';
  } else if (
    installCommandWasCopied ||
    anyFieldIsComplete(
      ['agentName', 'verificationMode', 'enrollmentKey'],
      formFields,
    )
  ) {
    return 'complete';
  } else {
    return 'current';
  }
};

export enum FORM_STEPS_LABELS {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  operatingSystemSelection = 'operating system',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  serverAddress = 'server address',
}

export const getIncompleteSteps = (
  formFields: UseFormReturn['fields'],
): FORM_STEPS_LABELS[] => {
  const steps: FormStepsDependencies = {
    operatingSystemSelection: ['operatingSystemSelection'],
    serverAddress: ['serverAddress'],
    username: ['username'],
    password: ['password'],
  };
  const statusManager = new EnrollAgentFormStatusManager(formFields, steps);

  // replace fields array using label names
  return statusManager
    .getIncompleteSteps()
    .map(field => FORM_STEPS_LABELS[field] || field);
};

export enum FORM_FIELDS_LABEL {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  agentName = 'agent name',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  username = 'username',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  password = 'password',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  enrollmentKey = 'enrollment key',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  serverAddress = 'server address',
}

export const getInvalidFields = (
  formFields: UseFormReturn['fields'],
): FORM_FIELDS_LABEL[] => {
  const statusManager = new EnrollAgentFormStatusManager(formFields);

  return statusManager
    .getInvalidFields()
    .map(field => FORM_FIELDS_LABEL[field] || field);
};
