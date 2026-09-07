import {
  EnhancedFieldConfiguration,
  UseFormReturn,
} from '../../../components/common/form/types';
import { getInvalidFields } from './register-agent-steps-status-services';

const defaultFormFieldData: EnhancedFieldConfiguration = {
  changed: true,
  value: '',
  error: null,
  currentValue: '',
  initialValue: '',
  type: 'text',
  onChange: () => {},
  setInputRef: () => {},
  inputRef: null,
};

const buildFormFields = ({
  sslVerification,
  managerCaError,
  agentNameError,
}: {
  sslVerification: boolean;
  managerCaError?: string | null;
  agentNameError?: string | null;
}): UseFormReturn['fields'] => ({
  agentName: {
    ...defaultFormFieldData,
    value: 'agent1',
    error: agentNameError ?? null,
  },
  sslVerification: {
    ...defaultFormFieldData,
    type: 'switch',
    value: sslVerification,
    error: null,
  },
  managerCa: {
    ...defaultFormFieldData,
    value: "/etc/ca's.pem",
    error: managerCaError ?? null,
  },
});

describe('getInvalidFields', () => {
  it('reports an invalid CA path while verification is enabled', () => {
    const result = getInvalidFields(
      buildFormFields({
        sslVerification: true,
        managerCaError: 'The character "\'" is not valid in a file path.',
      }),
    );
    expect(result).toEqual(['manager CA file path']);
  });

  /* The CA input is not rendered while verification is off, so an error on it
  cannot be seen or corrected. Reporting it would hide the commands with no way
  for the user to recover. */
  it('ignores an invalid CA path while verification is disabled', () => {
    const result = getInvalidFields(
      buildFormFields({
        sslVerification: false,
        managerCaError: 'The character "\'" is not valid in a file path.',
      }),
    );
    expect(result).toEqual([]);
  });

  it('keeps reporting other invalid fields while verification is disabled', () => {
    const result = getInvalidFields(
      buildFormFields({
        sslVerification: false,
        managerCaError: 'The character "\'" is not valid in a file path.',
        agentNameError: 'The minimum length is 2 characters.',
      }),
    );
    expect(result).toEqual(['agent name']);
  });

  it('reports nothing when every field is valid', () => {
    const result = getInvalidFields(buildFormFields({ sslVerification: true }));
    expect(result).toEqual([]);
  });
});
