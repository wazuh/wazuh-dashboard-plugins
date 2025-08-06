import React, { useState, useEffect } from 'react';
import {
  EuiForm,
  EuiFormRow,
  EuiSelect,
  EuiFieldText,
  EuiSpacer,
} from '@elastic/eui';
import {
  modelProviderConfigs,
  ProviderModelConfig,
} from '../provider-model-config';
import { ModelFormData } from './types';
import { mapToOptions } from './utils/map-to-options';

interface ModelFormProps {
  onChange?: (data: ModelFormData) => void;
  onValidationChange?: (isValid: boolean) => void;
  disabled?: boolean;
}

const retrieveModelsFromProvider = (
  selected_model_provider: string,
  models: ProviderModelConfig[],
) => {
  const model = models.find(m => m.model_provider === selected_model_provider);
  return model
    ? model.models.map(model => ({ value: model, text: model }))
    : [];
};

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

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, model: e.target.value }));
  };

  const handleApiUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, apiUrl: e.target.value }));
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, apiKey: e.target.value }));
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
          onChange={handleModelChange}
          hasNoInitialSelection
          disabled={!formData.modelProvider || disabled}
        />
      </EuiFormRow>

      <EuiSpacer size='m' />

      <EuiFormRow label='API URL' fullWidth>
        <EuiFieldText
          fullWidth
          value={formData.apiUrl}
          onChange={handleApiUrlChange}
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
          onChange={handleApiKeyChange}
          placeholder='Enter API key'
          disabled={disabled}
        />
      </EuiFormRow>
    </EuiForm>
  );
};
