import { UseFormReturn } from '../../../components/common/form/types';

type FieldStatus = 'invalid' | 'empty' | 'complete';
type FormStatus = {
  [key: string]: FieldStatus;
};

type FormFields = UseFormReturn['fields'];
type FormFieldName = keyof FormFields;

export type FormStepsDependencies = {
  [key: string]: FormFieldName[];
};

type FormStepsStatus = {
  [key: string]: FieldStatus;
};

interface FormFieldsStatusManager {
  getFieldStatus: (fieldname: FormFieldName) => FieldStatus;
  getFormStatus: () => FormStatus;
  getStepStatus: (stepName: string) => FieldStatus;
  getFormStepsStatus: () => FormStepsStatus;
}

export class RegisterAgentFormStatusManager implements FormFieldsStatusManager {
  constructor(
    private formFields: FormFields,
    private formSteps?: FormStepsDependencies,
  ) {}

  getFieldStatus = (fieldname: FormFieldName): FieldStatus => {
    const field = this.formFields[fieldname];
    if (!field) {
      throw Error('Fieldname not found');
    }

    if (field.error) {
      return 'invalid';
    }

    if (field.value?.length === 0) {
      return 'empty';
    }

    return 'complete';
  };

  getFormStatus = (): FormStatus => {
    const fieldNames = Object.keys(this.formFields);
    const formStatus: FormStatus | object = {};

    fieldNames.forEach((fieldName: string) => {
      formStatus[fieldName] = this.getFieldStatus(fieldName);
    });

    return formStatus as FormStatus;
  };

  getStepStatus = (stepName: string): FieldStatus => {
    if (!this.formSteps) {
      throw Error('Form steps not defined');
    }
    const stepFields = this.formSteps[stepName];
    if (!stepFields) {
      throw Error('Step name not found');
    }

    const formStepStatus: FormStepsStatus | object = {};
    stepFields.forEach((fieldName: FormFieldName) => {
      formStepStatus[fieldName] = this.getFieldStatus(fieldName);
    });

    const stepStatus = Object.values(formStepStatus);

    // if any is invalid
    if (stepStatus.includes('invalid')) {
      return 'invalid';
    } else if (stepStatus.includes('empty')) {
      // if all are empty
      return 'empty';
    } else {
      // if all are complete
      return 'complete';
    }
  };

  getFormStepsStatus = (): FormStepsStatus => {
    if (!this.formSteps) {
      throw Error('Form steps not defined');
    }

    const formStepsStatus: FormStepsStatus | object = {};
    Object.keys(this.formSteps).forEach((stepName: string) => {
      formStepsStatus[stepName] = this.getStepStatus(stepName);
    });

    return formStepsStatus as FormStepsStatus;
  };

  getIncompleteSteps = (): string[] => {
    const formStepsStatus = this.getFormStepsStatus();
    const notCompleteSteps = Object.entries(formStepsStatus).filter(
      ([ _, status ]) => status === 'empty',
    );
    return notCompleteSteps.map(( [ stepName, _]) => stepName);
  };

  getInvalidFields = (): string[] => {
    const formStatus = this.getFormStatus();
    const invalidFields = Object.entries(formStatus).filter(
      ([ _, status ]) => status === 'invalid',
    );
    return invalidFields.map(([ fieldName, _ ]) => fieldName);
  }
}
