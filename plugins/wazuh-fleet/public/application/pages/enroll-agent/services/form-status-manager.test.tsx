import {
  EnhancedFieldConfiguration,
  UseFormReturn,
} from '../../../components/common/form/types';
import {
  FormStepsDependencies,
  EnrollAgentFormStatusManager,
} from './form-status-manager';

const defaultFormFieldData: EnhancedFieldConfiguration = {
  changed: true,
  value: 'value1',
  error: '',
  currentValue: '',
  initialValue: '',
  type: 'text',
  onChange: () => {
    console.log('onChange');
  },
  setInputRef: () => {
    console.log('setInputRef');
  },
  inputRef: null,
};
const formFieldsDefault: UseFormReturn['fields'] = {
  field1: {
    ...defaultFormFieldData,
    value: '',
    error: null,
  },
  field2: {
    ...defaultFormFieldData,
    value: '',
    error: 'error message',
  },
  field3: {
    ...defaultFormFieldData,
    value: 'value valid',
    error: null,
  },
};

describe('EnrollAgentFormStatusManager', () => {
  it('should create a instance', () => {
    const enrollAgentFormStatusManager = new EnrollAgentFormStatusManager(
      formFieldsDefault,
    );

    expect(enrollAgentFormStatusManager).toBeDefined();
  });

  it('should return the form status', () => {
    const enrollAgentFormStatusManager = new EnrollAgentFormStatusManager(
      formFieldsDefault,
    );
    const formStatus = enrollAgentFormStatusManager.getFormStatus();

    expect(formStatus).toEqual({
      field1: 'empty',
      field2: 'invalid',
      field3: 'complete',
    });
  });

  it('should return the field status', () => {
    const enrollAgentFormStatusManager = new EnrollAgentFormStatusManager(
      formFieldsDefault,
    );
    const fieldStatus = enrollAgentFormStatusManager.getFieldStatus('field1');

    expect(fieldStatus).toEqual('empty');
  });

  it('should return error if fieldname not found', () => {
    const enrollAgentFormStatusManager = new EnrollAgentFormStatusManager(
      formFieldsDefault,
    );

    expect(() =>
      enrollAgentFormStatusManager.getFieldStatus('field4'),
    ).toThrowError('Fieldname not found');
  });

  it('should return a INVALID when the step have an error', () => {
    const formSteps: FormStepsDependencies = {
      step1: ['field1', 'field2'],
      step2: ['field3'],
    };
    const enrollAgentFormStatusManager = new EnrollAgentFormStatusManager(
      formFieldsDefault,
      formSteps,
    );

    expect(enrollAgentFormStatusManager).toBeDefined();
    expect(enrollAgentFormStatusManager.getStepStatus('step1')).toEqual(
      'invalid',
    );
  });

  it('should return COMPLETE when the step have no errors and is not empty', () => {
    const formSteps: FormStepsDependencies = {
      step1: ['field1', 'field2'],
      step2: ['field3'],
    };
    const enrollAgentFormStatusManager = new EnrollAgentFormStatusManager(
      formFieldsDefault,
      formSteps,
    );

    expect(enrollAgentFormStatusManager).toBeDefined();
    expect(enrollAgentFormStatusManager.getStepStatus('step2')).toEqual(
      'complete',
    );
  });

  it('should return EMPTY when the step all fields empty', () => {
    const formSteps: FormStepsDependencies = {
      step1: ['field1'],
      step2: ['field2', 'field3'],
    };
    const enrollAgentFormStatusManager = new EnrollAgentFormStatusManager(
      formFieldsDefault,
      formSteps,
    );

    expect(enrollAgentFormStatusManager).toBeDefined();
    expect(enrollAgentFormStatusManager.getStepStatus('step1')).toEqual(
      'empty',
    );
  });

  it('should return all the steps status', () => {
    const formSteps: FormStepsDependencies = {
      step1: ['field1'],
      step2: ['field2', 'field3'],
      step3: ['field3'],
    };
    const enrollAgentFormStatusManager = new EnrollAgentFormStatusManager(
      formFieldsDefault,
      formSteps,
    );

    expect(enrollAgentFormStatusManager).toBeDefined();
    expect(enrollAgentFormStatusManager.getFormStepsStatus()).toEqual({
      step1: 'empty',
      step2: 'invalid',
      step3: 'complete',
    });
  });
});
