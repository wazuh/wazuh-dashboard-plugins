import React, { useState, useEffect } from 'react';
import {
  EuiForm,
  EuiFormRow,
  EuiSelect,
  EuiFieldText,
  EuiSpacer,
} from '@elastic/eui';
import { ProviderModelConfig } from '../provider-model-config';
import { ModelFormData } from './types';

interface ModelFormProps {
  onChange?: (data: ModelFormData) => void;
  onValidationChange?: (isValid: boolean) => void;
  disabled?: boolean;
  modelConfig?: ProviderModelConfig[];
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

const mapModelProvidersToOptions = (models: ProviderModelConfig[]) => {
  return models.map(model => ({
    value: model.model_provider,
    text: model.model_provider,
  }));
};

export const ModelForm = ({
  onChange,
  onValidationChange,
  disabled = false,
  modelConfig = [],
}: ModelFormProps) => {
  const [formData, setFormData] = useState<ModelFormData>({
    name: '',
    model: '',
    apiUrl: '',
    apiKey: '',
  });

  const [modelsOptions, setModelsOptions] = useState(
    retrieveModelsFromProvider('', modelConfig),
  );

  useEffect(() => {
    if (onChange) {
      onChange(formData);
    }
  }, [formData, onChange]);

  useEffect(() => {
    const isValid =
      formData.name && formData.model && formData.apiUrl && formData.apiKey;
    if (onValidationChange) {
      onValidationChange(!!isValid);
    }
  }, [formData, onValidationChange]);

  const handleModelProviderChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newName = e.target.value;
    const newModelOptions = retrieveModelsFromProvider(newName, modelConfig);
    setModelsOptions(newModelOptions);

    setFormData(prev => ({
      ...prev,
      name: newName,
      model: '', // Reset a model when the name changes
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
          options={mapModelProvidersToOptions(modelConfig)}
          value={formData.name}
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
          disabled={!formData.name || disabled}
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
