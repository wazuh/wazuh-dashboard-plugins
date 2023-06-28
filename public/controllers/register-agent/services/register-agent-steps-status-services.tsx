import { EuiStepStatus } from '@elastic/eui';
import { UseFormReturn } from '../../../components/common/form/types';

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
