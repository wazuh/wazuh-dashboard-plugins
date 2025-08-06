import Joi from 'joi';
import { ModelFormData } from './types';
import { modelProviderConfigs } from '../provider-model-config';

// Get valid model providers from config
const validModelProviders = Object.keys(modelProviderConfigs);

export const modelFormSchema = Joi.object<ModelFormData>({
  modelProvider: Joi.string()
    .valid(...validModelProviders)
    .required()
    .messages({
      'any.required': 'Provider is required',
      'any.only': `Provider must be one of: ${validModelProviders.join(', ')}`,
      'string.empty': 'Provider cannot be empty',
    }),

  model: Joi.string().min(1).required().messages({
    'any.required': 'Model is required',
    'string.empty': 'Model cannot be empty',
    'string.min': 'Model must be at least 1 character long',
  }),

  apiUrl: Joi.string()
    .uri({
      scheme: ['http', 'https'],
    })
    .required()
    .messages({
      'any.required': 'API URL is required',
      'string.empty': 'API URL cannot be empty',
      'string.uri': 'API URL must be a valid URL with http or https scheme',
    }),

  apiKey: Joi.string().min(1).required().messages({
    'any.required': 'API key is required',
    'string.empty': 'API key cannot be empty',
    'string.min': 'API key must be at least 1 character long',
  }),
});

// Custom validation function that also checks if model is valid for the selected provider
export const validateModelForm = (data: ModelFormData): ValidationResult => {
  // First, validate with the base schema
  const { error, value } = modelFormSchema.validate(data, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path[0] as keyof ModelFormData,
        message: detail.message,
      })),
      value: null,
    };
  }

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
};

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: keyof ModelFormData;
    message: string;
  }>;
  value: ModelFormData | null;
}
