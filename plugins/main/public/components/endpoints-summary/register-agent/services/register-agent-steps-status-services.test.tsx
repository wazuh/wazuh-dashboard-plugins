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
  agentNameError,
}: {
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
    value: true,
    error: null,
  },
});

describe('getInvalidFields', () => {
  it('reports an invalid field by its label', () => {
    const result = getInvalidFields(
      buildFormFields({
        agentNameError: 'The minimum length is 2 characters.',
      }),
    );
    expect(result).toEqual(['agent name']);
  });

  it('reports nothing when every field is valid', () => {
    const result = getInvalidFields(buildFormFields({}));
    expect(result).toEqual([]);
  });
});

const buildTokenStepFields = ({
  existingEnrollmentToken,
  ttlError,
}: {
  existingEnrollmentToken: string;
  ttlError?: string | null;
}): UseFormReturn['fields'] => ({
  sslVerification: {
    ...defaultFormFieldData,
    type: 'switch',
    value: true,
    error: null,
  },
  existingEnrollmentToken: {
    ...defaultFormFieldData,
    value: existingEnrollmentToken,
    error: null,
  },
  enrollmentTokenTtl: {
    ...defaultFormFieldData,
    value: '12hours',
    error: ttlError ?? null,
  },
});

describe('getInvalidFields on the enrollment token step', () => {
  const ttlError =
    'The lifetime must be a number of seconds, or a number followed by "d", "h", "m" or "s". For example: 30d, 12h, 3600.';

  it('reports an invalid lifetime while a token is being generated', () => {
    const result = getInvalidFields(
      buildTokenStepFields({ existingEnrollmentToken: '', ttlError }),
    );
    expect(result).toEqual(['enrollment token lifetime']);
  });

  /* Reusing a stored token makes no mint request and disables the fields that
  would parameterize one, so an error left on them cannot be corrected.
  Reporting it would hide the commands with no way for the user to recover. */
  it('ignores an invalid lifetime while a stored token is reused', () => {
    const result = getInvalidFields(
      buildTokenStepFields({
        existingEnrollmentToken: 'eyJ2ZXIiOjEs',
        ttlError,
      }),
    );
    expect(result).toEqual([]);
  });
});
