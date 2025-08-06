import { schema } from '@osd/config-schema';
import { ModelFormData } from './types';
import { modelProviderConfigs } from '../provider-model-config';

// Get valid model providers from config
const validModelProviders = Object.keys(modelProviderConfigs);

export const modelFormSchema = schema.object({
  modelProvider: schema.string({
    validate: (value: string) => {
      if (!validModelProviders.includes(value)) {
        return `Provider must be one of: ${validModelProviders.join(', ')}`;
      }
    },
  }),

  model: schema.string({ minLength: 1 }),

  apiUrl: schema.uri({ scheme: ['http', 'https'] }),

  apiKey: schema.string({ minLength: 1 }),
});

// Custom validation function that also checks if model is valid for the selected provider
export const validateModelForm = (data: ModelFormData): ValidationResult => {
  try {
    // First, validate with the base schema
    const value = modelFormSchema.validate(data);

    // Additional validation: check if model is valid for the selected provider
    const selectedProviderConfig = modelProviderConfigs[data.modelProvider];
    if (
      selectedProviderConfig &&
      !selectedProviderConfig.models.includes(data.model)
    ) {
      return {
        isValid: false,
        errors: [
          {
            field: 'model' as keyof ModelFormData,
            message: `Model "${data.model}" is not available for provider "${data.modelProvider}"`,
          },
        ],
        value: null,
      };
    }

    // Additional validation: check if API URL matches provider's regex pattern
    if (selectedProviderConfig?.default_endpoint_regex) {
      const regex = new RegExp(selectedProviderConfig.default_endpoint_regex);
      const fullUrl = data.apiUrl.startsWith('http')
        ? data.apiUrl
        : `https://${data.apiUrl}`;

      if (!regex.test(fullUrl)) {
        return {
          isValid: false,
          errors: [
            {
              field: 'apiUrl' as keyof ModelFormData,
              message: `API URL does not match the expected pattern for ${data.modelProvider}`,
            },
          ],
          value: null,
        };
      }
    }

    return {
      isValid: true,
      errors: [],
      value: value as ModelFormData,
    };
  } catch (error: any) {
    // Parse validation errors from @osd/config-schema
    const errors: Array<{ field: keyof ModelFormData; message: string }> = [];

    if (error.message) {
      // Extract field path and message from error
      const errorMessage = error.message;

      // Map common error patterns to fields
      if (errorMessage.includes('modelProvider')) {
        errors.push({
          field: 'modelProvider',
          message: `Provider must be one of: ${validModelProviders.join(', ')}`,
        });
      } else if (errorMessage.includes('model')) {
        errors.push({
          field: 'model',
          message: 'Model is required and must be at least 1 character long',
        });
      } else if (errorMessage.includes('apiUrl')) {
        errors.push({
          field: 'apiUrl',
          message: 'API URL must be a valid URL with http or https scheme',
        });
      } else if (errorMessage.includes('apiKey')) {
        errors.push({
          field: 'apiKey',
          message: 'API key is required and must be at least 1 character long',
        });
      } else {
        // Generic error
        errors.push({
          field: 'modelProvider',
          message: errorMessage,
        });
      }
    }

    return {
      isValid: false,
      errors,
      value: null,
    };
  }
};

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: keyof ModelFormData;
    message: string;
  }>;
  value: ModelFormData | null;
}
