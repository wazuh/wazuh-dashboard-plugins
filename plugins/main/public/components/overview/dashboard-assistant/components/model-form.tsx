import React, { useState, useEffect } from 'react';
import {
  EuiForm,
  EuiFormRow,
  EuiSelect,
  EuiFieldText,
  EuiSpacer,
} from '@elastic/eui';

interface FieldConfig {
  value?: string;
  disabled?: boolean;
}

interface ModelFormConfig {
  name?: FieldConfig;
  version?: FieldConfig;
  apiUrl?: FieldConfig;
  apiKey?: FieldConfig;
}

interface ModelFormData {
  name: string;
  version: string;
  apiUrl: string;
  apiKey: string;
}

interface ModelConfig {
  name: string;
  versions: string[];
}

interface ModelFormProps {
  config?: ModelFormConfig;
  onChange?: (data: ModelFormData) => void;
  onValidationChange?: (isValid: boolean) => void;
  disabled?: boolean;
  modelConfig?: ModelConfig[];
}



const getVersionOptions = (selectedName: string, models: ModelConfig[]) => {
  const model = models.find(m => m.name === selectedName);
  return model ? model.versions.map(version => ({ value: version, text: version })) : [];
};

const getNameOptions = (models: ModelConfig[]) => {
  return models.map(model => ({
    value: model.name,
    text: model.name
  }));
};

export const ModelForm = ({ config = {}, onChange, onValidationChange, disabled = false, modelConfig = [] }: ModelFormProps) => {
  const [formData, setFormData] = useState<ModelFormData>({
    name: config.name?.value || '',
    version: config.version?.value || '',
    apiUrl: config.apiUrl?.value || '',
    apiKey: config.apiKey?.value || '',
  });

  const [versionOptions, setVersionOptions] = useState(getVersionOptions(config.name?.value || '', modelConfig));

  useEffect(() => {
    if (onChange) {
      onChange(formData);
    }
  }, [formData, onChange]);

  useEffect(() => {
    const isValid = formData.name && formData.version && formData.apiUrl && formData.apiKey;
    if (onValidationChange) {
      onValidationChange(!!isValid);
    }
  }, [formData, onValidationChange]);

  const handleNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newName = e.target.value;
    const newVersionOptions = getVersionOptions(newName, modelConfig);
    setVersionOptions(newVersionOptions);
    
    setFormData(prev => ({
      ...prev,
      name: newName,
      version: '' // Reset version when name changes
    }));
  };

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, version: e.target.value }));
  };

  const handleApiUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, apiUrl: e.target.value }));
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, apiKey: e.target.value }));
  };

  return (
    <EuiForm>
      <EuiFormRow label="Name" fullWidth>
        <EuiSelect
          fullWidth
          options={getNameOptions(modelConfig)}
          value={formData.name}
          onChange={handleNameChange}
          hasNoInitialSelection
          disabled={config.name?.disabled || disabled}
        />
      </EuiFormRow>
      
      <EuiSpacer size="m" />
      
      <EuiFormRow label="Version" fullWidth>
        <EuiSelect
          fullWidth
          options={versionOptions}
          value={formData.version}
          onChange={handleVersionChange}
          hasNoInitialSelection
          disabled={!formData.name || config.version?.disabled || disabled}
        />
      </EuiFormRow>
      
      <EuiSpacer size="m" />
      
      <EuiFormRow label="API URL" fullWidth>
        <EuiFieldText
          fullWidth
          value={formData.apiUrl}
          onChange={handleApiUrlChange}
          placeholder="Enter API URL"
          disabled={config.apiUrl?.disabled || disabled}
        />
      </EuiFormRow>
      
      <EuiSpacer size="m" />
      
      <EuiFormRow label="API key" fullWidth>
        <EuiFieldText
          fullWidth
          type="password"
          value={formData.apiKey}
          onChange={handleApiKeyChange}
          placeholder="Enter API key"
          disabled={config.apiKey?.disabled || disabled}
        />
      </EuiFormRow>
    </EuiForm>
  );
};