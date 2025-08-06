import React, { useState, useEffect } from 'react';
import {
  EuiForm,
  EuiFormRow,
  EuiSelect,
  EuiFieldText,
  EuiSpacer,
} from '@elastic/eui';
import { modelProviderConfigs } from '../provider-model-config';
import { ModelFormData } from './types';
import { mapToOptions } from './utils/map-to-options';
import { validateModelForm, ValidationResult } from './model-form-schema';

interface ModelFormProps {
  onChange?: (data: ModelFormData) => void;
  onValidationChange?: (isValid: boolean) => void;
  onValidationErrors?: (validationResult: ValidationResult) => void;
  disabled?: boolean;
}

const mapModelProvidersToOptions = () => {
  return mapToOptions(Object.keys(modelProviderConfigs), model => model);
};

export const ModelForm = ({
  onChange,
  onValidationChange,
  onValidationErrors,
  disabled = false,
}: ModelFormProps) => {
  const [formData, setFormData] = useState<ModelFormData>({
    modelProvider: '',
    model: '',
    apiUrl: '',
    apiKey: '',
  });

  const [modelsOptions, setModelsOptions] = useState<
    ReturnType<typeof mapToOptions>
  >([]);

  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: false,
    errors: [],
    value: null,
  });

  useEffect(() => {
    if (onChange) {
      onChange(formData);
    }
  }, [formData, onChange]);

  useEffect(() => {
    // Use Joi schema validation instead of simple boolean checks
    const validation = validateModelForm(formData);
    setValidationResult(validation);

    if (onValidationChange) {
      onValidationChange(validation.isValid);
    }

    if (onValidationErrors) {
      onValidationErrors(validation);
    }
  }, [formData, onValidationChange, onValidationErrors]);

  const handleModelProviderChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newModelProvider = e.target.value;
    setModelsOptions(
      mapToOptions(
        modelProviderConfigs[newModelProvider]?.models || [],
        model => model,
      ),
    );

    setFormData(prev => ({
      ...prev,
      modelProvider: newModelProvider,
      model: modelProviderConfigs[newModelProvider].default_model || '',
      apiUrl: modelProviderConfigs[newModelProvider].default_endpoint || '',
    }));
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, model: e.target.value }));
  };

  const handleApiUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, apiUrl: e.target.value }));
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, apiKey: e.target.value }));
  };

  // Helper function to get error message for a specific field
  const getFieldError = (
    fieldName: keyof ModelFormData,
  ): string | undefined => {
    const error = validationResult.errors.find(err => err.field === fieldName);
    return error?.message;
  };

  // Helper function to check if a field has an error
  const hasFieldError = (fieldName: keyof ModelFormData): boolean => {
    return validationResult.errors.some(err => err.field === fieldName);
  };

  return (
    <EuiForm>
      <EuiFormRow
        label='Provider'
        fullWidth
        error={getFieldError('modelProvider')}
        isInvalid={hasFieldError('modelProvider')}
      >
        <EuiSelect
          fullWidth
          options={mapModelProvidersToOptions()}
          value={formData.modelProvider}
          onChange={handleModelProviderChange}
          hasNoInitialSelection
          disabled={disabled}
          isInvalid={hasFieldError('modelProvider')}
        />
      </EuiFormRow>

      <EuiSpacer size='m' />

      <EuiFormRow
        label='Model'
        fullWidth
        error={getFieldError('model')}
        isInvalid={hasFieldError('model')}
      >
        <EuiSelect
          fullWidth
          options={modelsOptions}
          value={formData.model}
          onChange={handleModelChange}
          hasNoInitialSelection
          disabled={!formData.modelProvider || disabled}
          isInvalid={hasFieldError('model')}
        />
      </EuiFormRow>

      <EuiSpacer size='m' />

      <EuiFormRow
        label='API URL'
        fullWidth
        error={getFieldError('apiUrl')}
        isInvalid={hasFieldError('apiUrl')}
      >
        <EuiFieldText
          fullWidth
          value={formData.apiUrl}
          onChange={handleApiUrlChange}
          placeholder='Enter API URL'
          disabled={disabled}
          isInvalid={hasFieldError('apiUrl')}
        />
      </EuiFormRow>

      <EuiSpacer size='m' />

      <EuiFormRow
        label='API key'
        fullWidth
        error={getFieldError('apiKey')}
        isInvalid={hasFieldError('apiKey')}
      >
        <EuiFieldText
          fullWidth
          type='password'
          value={formData.apiKey}
          onChange={handleApiKeyChange}
          placeholder='Enter API key'
          disabled={disabled}
          isInvalid={hasFieldError('apiKey')}
        />
      </EuiFormRow>
    </EuiForm>
  );
};
