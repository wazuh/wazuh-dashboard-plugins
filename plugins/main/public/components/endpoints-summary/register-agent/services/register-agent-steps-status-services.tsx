import { EuiStepStatus } from '@elastic/eui';
import { UseFormReturn } from '../../../components/common/form/types';
import {
  FormStepsDependencies,
  RegisterAgentFormStatusManager,
} from './form-status-manager';
import { endpointsSummaryI18n } from '../../i18n';

const dw = endpointsSummaryI18n.deployWizard;

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
  operatingSystemSelection = 'operatingSystemSelection',
  serverAddress = 'serverAddress',
}

const stepLabelMap: Record<tFormStepsLabel, string> = {
  [tFormStepsLabel.operatingSystemSelection]: dw.stepFieldOperatingSystem,
  [tFormStepsLabel.serverAddress]: dw.stepFieldServerAddress,
};

export const getIncompleteSteps = (
  formFields: UseFormReturn['fields'],
): string[] => {
  const steps: FormStepsDependencies = {
    operatingSystemSelection: ['operatingSystemSelection'],
    serverAddress: ['serverAddress'],
  };
  const statusManager = new RegisterAgentFormStatusManager(formFields, steps);
  return statusManager.getIncompleteSteps().map(field => {
    return stepLabelMap[field as tFormStepsLabel] || field;
  });
};

export enum tFormFieldsLabel {
  agentName = 'agentName',
  agentGroups = 'agentGroups',
  serverAddress = 'serverAddress',
}

const fieldLabelMap: Record<tFormFieldsLabel, string> = {
  [tFormFieldsLabel.agentName]: dw.fieldAgentName,
  [tFormFieldsLabel.agentGroups]: dw.fieldAgentGroups,
  [tFormFieldsLabel.serverAddress]: dw.fieldServerAddress,
};

export const getInvalidFields = (
  formFields: UseFormReturn['fields'],
): string[] => {
  const statusManager = new RegisterAgentFormStatusManager(formFields);

  return statusManager.getInvalidFields().map(field => {
    return fieldLabelMap[field as tFormFieldsLabel] || field;
  });
};
