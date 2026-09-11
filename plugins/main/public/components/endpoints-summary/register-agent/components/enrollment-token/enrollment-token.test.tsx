import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import EnrollmentTokenInput from './enrollment-token';
import { createEnrollmentToken } from '../../../../../services/enrollment-tokens';
import {
  EnhancedFieldConfiguration,
  UseFormReturn,
} from '../../../../common/form/types';
import { EnrollmentToken } from '../../interfaces/types';

/* register-agent-data reads the theme from the UI settings when it is imported,
which the wizard's data module is pulled in by the component under test. */
jest.mock('../../../../../kibana-services', () => ({
  ...(jest.requireActual('../../../../../kibana-services') as object),
  getUiSettings: jest.fn().mockReturnValue({ get: () => false }),
}));

jest.mock('../../../../../services/enrollment-tokens', () => ({
  createEnrollmentToken: jest.fn(),
}));

const createToken = createEnrollmentToken as jest.Mock;

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

const field = (
  value = '',
  error: string | null = null,
): EnhancedFieldConfiguration => ({
  ...defaultFormFieldData,
  value,
  currentValue: value,
  error,
});

const buildFormFields = (
  overrides: Partial<UseFormReturn['fields']> = {},
): UseFormReturn['fields'] => ({
  serverAddress: field('manager.example.com'),
  serverPort: field(''),
  serverPath: field(''),
  existingEnrollmentToken: field(''),
  enrollmentTokenTtl: field(''),
  enrollmentTokenMaxUses: { ...field(''), type: 'number' },
  enrollmentTokenDescription: field(''),
  ...overrides,
});

/* Queried by role: the step description mentions "advanced options" too, so a
text query would match the paragraph as well as the link. */
const advancedOptionsToggle = () =>
  screen.getByRole('button', { name: /advanced options/ });

/* The inputs live behind the advanced options link, so a test that is about
one of them has to open the section first. `collapsed` keeps it shut for the
tests that are about the folded state itself. */
interface RenderOptions {
  formFields?: Partial<UseFormReturn['fields']>;
  enrollmentToken?: EnrollmentToken | null;
  collapsed?: boolean;
}

const renderInput = (props: RenderOptions = {}) => {
  const onEnrollmentTokenChange = jest.fn();
  const utils = render(
    <EnrollmentTokenInput
      formFields={buildFormFields(props.formFields)}
      enrollmentToken={props.enrollmentToken ?? null}
      onEnrollmentTokenChange={onEnrollmentTokenChange}
    />,
  );
  if (!props.collapsed && screen.queryByText('View advanced options')) {
    fireEvent.click(advancedOptionsToggle());
  }
  return { ...utils, onEnrollmentTokenChange };
};

const existingTokenInput = () =>
  screen.getByPlaceholderText('Paste a stored enrollment token');
const lifetimeInput = () => screen.getByPlaceholderText('30d');
const enrollmentsInput = () => screen.getByPlaceholderText('Unlimited');
const descriptionInput = () =>
  screen.getByPlaceholderText('What this token is for');
const generateButton = () => screen.getByRole('button', { name: /Generate/ });

beforeEach(() => {
  createToken.mockReset();
});

describe('EnrollmentTokenInput advanced options', () => {
  it('keeps every input folded away until the operator asks for them', () => {
    renderInput({ collapsed: true });
    expect(
      screen.queryByPlaceholderText('Paste a stored enrollment token'),
    ).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('30d')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Unlimited')).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('What this token is for'),
    ).not.toBeInTheDocument();
    /* The step is still completable while folded: that is the point of it. */
    expect(generateButton()).toBeEnabled();
  });

  it('reveals them when the link is clicked', () => {
    renderInput({ collapsed: true });
    fireEvent.click(advancedOptionsToggle());
    expect(existingTokenInput()).toBeInTheDocument();
    expect(lifetimeInput()).toBeInTheDocument();
    expect(enrollmentsInput()).toBeInTheDocument();
    expect(descriptionInput()).toBeInTheDocument();
  });

  /* A value already in one of them is in effect, so it must not sit behind a
  link the operator has no reason to click. */
  it('starts open when a field already carries a value', () => {
    renderInput({
      collapsed: true,
      formFields: { enrollmentTokenTtl: field('12h') },
    });
    expect(lifetimeInput()).toBeInTheDocument();
  });

  /* An error that cannot be seen cannot be corrected, and the deployment
  commands stay blocked until it is. */
  it('starts open when a field is in error', () => {
    renderInput({
      collapsed: true,
      formFields: {
        existingEnrollmentToken: field(
          '',
          'The token must not contain spaces or line breaks.',
        ),
      },
    });
    expect(existingTokenInput()).toBeInTheDocument();
  });
});

describe('EnrollmentTokenInput', () => {
  it('offers both paths when nothing has been filled in', () => {
    renderInput();
    expect(existingTokenInput()).toBeEnabled();
    expect(lifetimeInput()).toBeEnabled();
    expect(enrollmentsInput()).toBeEnabled();
    expect(descriptionInput()).toBeEnabled();
  });

  /* The two paths exclude each other: a token is either reused or minted, and
  the mint request is not made at all once a stored token is in the field. */
  it('disables the mint fields while a stored token is being reused', () => {
    renderInput({
      formFields: { existingEnrollmentToken: field('eyJ2ZXIiOjEs') },
    });
    expect(lifetimeInput()).toBeDisabled();
    expect(enrollmentsInput()).toBeDisabled();
    expect(descriptionInput()).toBeDisabled();
    expect(generateButton()).toBeDisabled();
  });

  it.each([
    ['enrollmentTokenTtl', '12h'],
    ['enrollmentTokenMaxUses', '50'],
    ['enrollmentTokenDescription', 'Laptops'],
  ])('disables the reuse field once %s is filled', (name, value) => {
    renderInput({
      formFields: {
        [name]: {
          ...field(value),
          type: name.includes('MaxUses') ? 'number' : 'text',
        },
      },
    });
    expect(existingTokenInput()).toBeDisabled();
  });

  /* Deciding exclusivity on the minted token as well would leave an operator
  who generated one with no way back to the reuse field. */
  it('keeps the reuse field open after a token was generated', () => {
    renderInput({
      enrollmentToken: {
        source: 'generated',
        token: 'abc',
        id: 'i',
        address: 'a',
        expires: 'e',
      },
    });
    expect(existingTokenInput()).toBeEnabled();
  });

  it('takes a readable stored token as the token to deploy with', () => {
    const { onEnrollmentTokenChange } = renderInput({
      formFields: { existingEnrollmentToken: field('  eyJ2ZXIiOjEs  ') },
    });
    expect(onEnrollmentTokenChange).toHaveBeenCalledWith({
      source: 'existing',
      token: 'eyJ2ZXIiOjEs',
    });
  });

  it('does not deploy with a stored token the form rejected', () => {
    const { onEnrollmentTokenChange } = renderInput({
      formFields: {
        existingEnrollmentToken: field(
          "ey'JzZXIi",
          'The character "\'" is not valid in an enrollment token.',
        ),
      },
    });
    expect(onEnrollmentTokenChange).not.toHaveBeenCalled();
  });

  it('drops a stored token that was cleared', () => {
    const { onEnrollmentTokenChange } = renderInput({
      enrollmentToken: { source: 'existing', token: 'eyJ2ZXIiOjEs' },
    });
    expect(onEnrollmentTokenChange).toHaveBeenCalledWith(null);
  });

  it('sends the description with the mint request', async () => {
    createToken.mockResolvedValue({
      token: 'abc',
      id: 'id-1',
      address: 'manager.example.com',
      expires: '2026-10-09T05:12:40+00:00',
    });
    const { onEnrollmentTokenChange } = renderInput({
      formFields: {
        enrollmentTokenTtl: field('12h'),
        enrollmentTokenDescription: field('Laptops, Q4 rollout'),
      },
    });

    fireEvent.click(generateButton() as HTMLElement);

    await waitFor(() => {
      expect(createToken).toHaveBeenCalledWith(
        expect.objectContaining({
          address: 'manager.example.com',
          ttl: '12h',
          description: 'Laptops, Q4 rollout',
        }),
      );
    });
    expect(onEnrollmentTokenChange).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'generated', token: 'abc' }),
    );
  });
});
