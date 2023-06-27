import { EuiStepStatus } from '@elastic/eui';
import { UseFormReturn } from '../../../components/common/form/types';

export const showCommandsSections = (
  formFields: UseFormReturn['fields'],
): boolean => {
  if (
    !formFields.operatingSystemSelection.value ||
    formFields.serverAddress.value === '' ||
    formFields.serverAddress.error ||
    fieldsHaveErrors(['agentGroups', 'agentName'], formFields)
  ) {
    return false;
  } else {
    return true;
  }
};

/******** Form Steps status getters ********/

export type tFormStepsStatus = EuiStepStatus | 'current' | 'disabled' | '';

const fieldsHaveErrors = (
  fieldsToCheck: string[],
  formFields: UseFormReturn['fields'],
) => {
  if (!fieldsToCheck) {
    return true;
  }
  // check if the fieldsToCheck array NOT exists in formFields and get the field doesn't exists
  if (!fieldsToCheck.every(key => formFields[key])) {
    return true;
  }

  const haveError = fieldsToCheck.some(key => {
    return formFields[key]?.error && formFields[key].value !== '';
  });
  return haveError;
};

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
): tFormStepsStatus => {
  // when previous step are not complete
  if (
    !formFields.operatingSystemSelection.value ||
    formFields.operatingSystemSelection.error ||
    !formFields.serverAddress.value ||
    formFields.serverAddress.error
  ) {
    return 'disabled';
  } else if (fieldsHaveErrors(['agentGroups', 'agentName'], formFields)) {
    return 'current';
  } else {
    return 'complete';
  }
};
