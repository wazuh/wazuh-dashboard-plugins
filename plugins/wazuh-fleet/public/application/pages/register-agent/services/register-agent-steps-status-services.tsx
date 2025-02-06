import { EuiStepStatus } from '@elastic/eui';
import { UseFormReturn } from '../components/form/types';
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

  const notEmpty = fieldsToCheck.some(
    key => formFields[key]?.value?.length > 0,
  );

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
    !formFields.operatingSystemSelection.value ||
    formFields.serverAddress.value === '' ||
    formFields.serverAddress.error
  ) {
    return false;
  } else if (
    formFields.serverAddress.value === '' &&
    formFields.agentName.value === ''
  ) {
    return true;
  } else if (fieldsHaveErrors(['agentGroups', 'agentName'], formFields)) {
    return false;
  } else {
    return true;
  }
};

/** ****** Form Steps status getters ********/

export type tFormStepsStatus = EuiStepStatus | 'current' | 'disabled' | '';

export const getOSSelectorStepStatus = (
  formFields: UseFormReturn['fields'],
): tFormStepsStatus =>
  formFields.operatingSystemSelection.value ? 'complete' : 'current';

export const getAgentCommandsStepStatus = (
  formFields: UseFormReturn['fields'],
  wasCopied: boolean,
): tFormStepsStatus | 'disabled' => {
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
): tFormStepsStatus => {
  if (
    !formFields.operatingSystemSelection.value ||
    formFields.operatingSystemSelection.error
  ) {
    return 'disabled';
  } else if (
    !formFields.serverAddress.value ||
    formFields.serverAddress.error
  ) {
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
    !formFields.serverAddress.value ||
    formFields.serverAddress.error
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

export const getPasswordStepStatus = (
  formFields: UseFormReturn['fields'],
): tFormStepsStatus => {
  if (
    !formFields.operatingSystemSelection.value ||
    formFields.operatingSystemSelection.error ||
    !formFields.serverAddress.value ||
    formFields.serverAddress.error
  ) {
    return 'disabled';
  } else {
    return 'complete';
  }
};

export enum tFormStepsLabel {
  operatingSystemSelection = 'operating system',
  serverAddress = 'server address',
}

export const getIncompleteSteps = (
  formFields: UseFormReturn['fields'],
): tFormStepsLabel[] => {
  const steps: FormStepsDependencies = {
    operatingSystemSelection: ['operatingSystemSelection'],
    serverAddress: ['serverAddress'],
  };
  const statusManager = new RegisterAgentFormStatusManager(formFields, steps);

  // replace fields array using label names
  return statusManager
    .getIncompleteSteps()
    .map(field => tFormStepsLabel[field] || field);
};

export enum tFormFieldsLabel {
  agentName = 'agent name',
  agentGroups = 'agent groups',
  serverAddress = 'server address',
}

export const getInvalidFields = (
  formFields: UseFormReturn['fields'],
): tFormFieldsLabel[] => {
  const statusManager = new RegisterAgentFormStatusManager(formFields);

  return statusManager
    .getInvalidFields()
    .map(field => tFormFieldsLabel[field] || field);
};
