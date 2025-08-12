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

interface ModelFormProps {
  onChange?: (data: ModelFormData) => void;
  onValidationChange?: (isValid: boolean) => void;
  disabled?: boolean;
}

const mapModelProvidersToOptions = () => {
  return mapToOptions(Object.keys(modelProviderConfigs), model => model);
};

export const ModelForm = ({
  onChange,
  onValidationChange,
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

  useEffect(() => {
    if (onChange) {
      onChange(formData);
    }
  }, [formData, onChange]);

  useEffect(() => {
    const isValid =
      formData.modelProvider &&
      formData.model &&
      formData.apiUrl &&
      formData.apiKey;
    if (onValidationChange) {
      onValidationChange(!!isValid);
    }
  }, [formData, onValidationChange]);

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

  const updateFormDataOnChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof typeof formData,
  ) => {
    setFormData(prev => ({ ...prev, [key]: e.target.value }));
  };

  return (
    <EuiForm>
      <EuiFormRow label='Provider' fullWidth>
        <EuiSelect
          fullWidth
          options={mapModelProvidersToOptions()}
          value={formData.modelProvider}
          onChange={handleModelProviderChange}
          hasNoInitialSelection
          disabled={disabled}
        />
      </EuiFormRow>

      <EuiSpacer size='m' />

      <EuiFormRow label='Model' fullWidth>
        <EuiSelect
          fullWidth
          options={modelsOptions}
          value={formData.model}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            updateFormDataOnChange(event, 'model')
          }
          hasNoInitialSelection
          disabled={!formData.modelProvider || disabled}
        />
      </EuiFormRow>

      <EuiSpacer size='m' />

      <EuiFormRow label='API URL' fullWidth>
        <EuiFieldText
          fullWidth
          value={formData.apiUrl}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            updateFormDataOnChange(event, 'apiUrl')
          }
          placeholder='Enter API URL'
          disabled={disabled}
        />
      </EuiFormRow>

      <EuiSpacer size='m' />

      <EuiFormRow label='API key' fullWidth>
        <EuiFieldText
          fullWidth
          type='password'
          value={formData.apiKey}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            updateFormDataOnChange(event, 'apiKey')
          }
          placeholder='Enter API key'
          disabled={disabled}
        />
      </EuiFormRow>
    </EuiForm>
  );
};
