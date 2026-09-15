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

/* The link to the Enrollment tokens app resolves its URL through the
navigation service, which has no history to read outside the running app. */
jest.mock('../../../../../react-services/navigation-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getAppURL: (appId: string) => `/app/${appId}`,
    }),
  },
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

/* The id generator is stubbed in this environment, so every control shares one
`aria-labelledby` target and an accessible-name query cannot tell them apart.
The switches are reached through their visible label instead. */
const switchFor = (label: string) =>
  screen
    .getByText(label)
    .closest('.euiSwitch')
    ?.querySelector('button[role="switch"]') as HTMLElement;

const embedCaSwitch = () => switchFor('Carry the CA certificate in the token');
const noCredentialSwitch = () =>
  switchFor('Mint the token without a credential');

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

describe('EnrollmentTokenInput token flags', () => {
  it('folds the switches away with the rest of the advanced options', () => {
    renderInput({ collapsed: true });
    expect(
      screen.queryByText('Carry the CA certificate in the token'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Mint the token without a credential'),
    ).not.toBeInTheDocument();
  });

  it('offers both off, which is what the manager defaults to', () => {
    renderInput();
    expect(embedCaSwitch()).not.toBeChecked();
    expect(noCredentialSwitch()).not.toBeChecked();
  });

  it('mints with both flags off when neither switch was touched', async () => {
    createToken.mockResolvedValue({
      token: 'abc',
      id: 'id-1',
      address: 'manager.example.com',
      expires: '2026-10-09T05:12:40+00:00',
    });
    renderInput();

    fireEvent.click(generateButton());

    await waitFor(() => expect(createToken).toHaveBeenCalled());
    expect(createToken).toHaveBeenCalledWith(
      expect.objectContaining({ embedCa: false, noCredential: false }),
    );
  });

  it.each([
    ['Carry the CA certificate in the token', 'embedCa'],
    ['Mint the token without a credential', 'noCredential'],
  ])('sends %s with the mint request', async (label, flag) => {
    createToken.mockResolvedValue({
      token: 'abc',
      id: 'id-1',
      address: 'manager.example.com',
      expires: '2026-10-09T05:12:40+00:00',
    });
    renderInput();

    fireEvent.click(switchFor(label));
    expect(switchFor(label)).toBeChecked();
    fireEvent.click(generateButton());

    await waitFor(() => expect(createToken).toHaveBeenCalled());
    expect(createToken).toHaveBeenCalledWith(
      expect.objectContaining({ [flag]: true }),
    );
  });

  /* They parameterize a mint request like the fields beside them, so they take
  the same side of the either/or as the rest of the generate path. */
  it('claims the mint path, disabling the reuse field', () => {
    renderInput();
    fireEvent.click(embedCaSwitch());
    expect(existingTokenInput()).toBeDisabled();
  });

  it('is disabled while a stored token is being reused', () => {
    renderInput({
      formFields: { existingEnrollmentToken: field('eyJ2ZXIiOjEs') },
    });
    expect(embedCaSwitch()).toBeDisabled();
    expect(noCredentialSwitch()).toBeDisabled();
  });
});

describe('EnrollmentTokenInput', () => {
  /* Leaving the wizard would discard a token generated here, which is the one
  value it cannot show again, so the link opens the app in its own tab rather
  than navigating in place. */
  it('links to the Enrollment tokens app in a new tab', () => {
    renderInput();

    const link = screen.getByRole('link', {
      name: /Manage the minted tokens/,
    });

    expect(link).toHaveAttribute('href', '/app/enrollment-tokens');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

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

  /* The token authenticates the enrollment: it is handed over through the
  clipboard, never rendered where it can be read off the screen. */
  it('hands the generated token over through the clipboard without showing it', () => {
    const execCommand = jest.fn().mockReturnValue(true);
    (document as unknown as { execCommand: unknown }).execCommand = execCommand;
    renderInput({
      enrollmentToken: {
        source: 'generated',
        token: 'eyJ2ZXIiOjEs',
        id: 'i',
        address: 'a',
        expires: 'e',
      },
    });
    expect(screen.queryByText(/eyJ2ZXIiOjEs/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Copy token/ }));
    expect(execCommand).toHaveBeenCalledWith('copy');
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
