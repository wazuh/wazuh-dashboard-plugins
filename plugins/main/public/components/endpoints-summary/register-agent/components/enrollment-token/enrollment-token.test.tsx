import React, { useState } from 'react';
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

const MINTED = {
  token: 'abc',
  id: 'id-1',
  address: 'manager.example.com',
  expires: '2026-10-09T05:12:40+00:00',
};

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

/* A field whose `onChange` can be asserted on, for the tests about what a tab
change does to the values left behind on the tab being closed. */
const watchedField = (value = '', error: string | null = null) => ({
  ...field(value, error),
  onChange: jest.fn(),
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

const generateTab = () =>
  screen.getByRole('tab', { name: 'Generate a new token' });
const existingTab = () =>
  screen.getByRole('tab', { name: 'Use an existing token' });

/* The step hands its token up to the wizard, which hands it back as a prop and
decides from it what the deployment commands are built with. Holding that state
here rather than passing a bare mock is what makes a tab change observable: the
token committed on the tab being left has to come back as `null`. */
const Harness = ({
  formFields,
  initialToken,
  onTokenChange,
}: {
  formFields: UseFormReturn['fields'];
  initialToken: EnrollmentToken | null;
  onTokenChange: (token: EnrollmentToken | null) => void;
}) => {
  const [token, setToken] = useState<EnrollmentToken | null>(initialToken);
  return (
    <EnrollmentTokenInput
      formFields={formFields}
      enrollmentToken={token}
      onEnrollmentTokenChange={next => {
        setToken(next);
        onTokenChange(next);
      }}
    />
  );
};

/* The mint inputs live behind the advanced options link, so a test that is
about one of them has to open the section first. `collapsed` keeps it shut for
the tests that are about the folded state itself. */
interface RenderOptions {
  formFields?: Partial<UseFormReturn['fields']>;
  enrollmentToken?: EnrollmentToken | null;
  collapsed?: boolean;
}

const renderInput = (props: RenderOptions = {}) => {
  const onEnrollmentTokenChange = jest.fn();
  const utils = render(
    <Harness
      formFields={buildFormFields(props.formFields)}
      initialToken={props.enrollmentToken ?? null}
      onTokenChange={onEnrollmentTokenChange}
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

/* A token is either minted here or reused from an earlier deployment. Reading
one tab at a time is what keeps the step short, and it replaces the pair of
inputs that used to sit on screen together with whichever one was not in use
disabled. */
describe('EnrollmentTokenInput token source tabs', () => {
  it('opens on the generate tab, with the reuse field off screen', () => {
    renderInput();
    expect(generateTab()).toHaveAttribute('aria-selected', 'true');
    expect(lifetimeInput()).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Paste a stored enrollment token'),
    ).not.toBeInTheDocument();
  });

  it('shows only the reuse field on the other tab', () => {
    renderInput();
    fireEvent.click(existingTab());

    expect(existingTokenInput()).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('30d')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Unlimited')).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('What this token is for'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Carry the CA certificate in the token'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Generate/ }),
    ).not.toBeInTheDocument();
  });

  /* A token already in the field is in effect, so it must not sit behind a tab
  the operator has no reason to open. */
  it('opens on the reuse tab when a token is already in the field', () => {
    renderInput({
      formFields: { existingEnrollmentToken: field('eyJ2ZXIiOjEs') },
    });
    expect(existingTab()).toHaveAttribute('aria-selected', 'true');
    expect(existingTokenInput()).toBeInTheDocument();
  });

  /* An error that cannot be seen cannot be corrected. */
  it('opens on the reuse tab when that field is in error', () => {
    renderInput({
      formFields: {
        existingEnrollmentToken: field(
          "ey'JzZXIi",
          'The character "\'" is not valid in an enrollment token.',
        ),
      },
    });
    expect(existingTab()).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps what was typed on the tab being left', () => {
    const existing = watchedField('eyJ2ZXIiOjEs');
    renderInput({ formFields: { existingEnrollmentToken: existing } });

    fireEvent.click(generateTab());
    expect(existing.onChange).not.toHaveBeenCalled();
  });

  /* The wizard withholds the deployment commands while any field is in error
  and names the field in a banner, so an error left on an input that is no
  longer rendered would block the wizard from somewhere nobody can reach. */
  it('clears a value that does not validate on the way out', () => {
    const existing = watchedField(
      "ey'JzZXIi",
      'The character "\'" is not valid in an enrollment token.',
    );
    renderInput({ formFields: { existingEnrollmentToken: existing } });

    fireEvent.click(generateTab());
    expect(existing.onChange).toHaveBeenCalledWith({ target: { value: '' } });
  });

  it('clears a mint field that does not validate on the way out', () => {
    const ttl = watchedField('banana', 'Use a number of seconds, or 30d.');
    const description = watchedField('Laptops');
    renderInput({
      formFields: {
        enrollmentTokenTtl: ttl,
        enrollmentTokenDescription: description,
      },
    });

    fireEvent.click(existingTab());
    expect(ttl.onChange).toHaveBeenCalledWith({ target: { value: '' } });
    /* Only the broken one: the rest of the tab is work worth coming back to. */
    expect(description.onChange).not.toHaveBeenCalled();
  });

  /* The open tab owns the token the deployment command is built from. */
  it('drops the token committed on the tab being left', () => {
    const { onEnrollmentTokenChange } = renderInput({
      enrollmentToken: { source: 'generated', ...MINTED },
    });
    onEnrollmentTokenChange.mockClear();

    fireEvent.click(existingTab());
    expect(onEnrollmentTokenChange).toHaveBeenCalledWith(null);
  });

  /* The server returns the token text once, so coming back to the tab must not
  cost the operator a second mint. */
  it('puts the token it minted back when the tab comes back', async () => {
    createToken.mockResolvedValue(MINTED);
    const { onEnrollmentTokenChange } = renderInput();

    fireEvent.click(generateButton());
    await waitFor(() =>
      expect(screen.getByText(/Token successfully generated/)).toBeVisible(),
    );

    fireEvent.click(existingTab());
    expect(onEnrollmentTokenChange).toHaveBeenLastCalledWith(null);

    fireEvent.click(generateTab());
    expect(onEnrollmentTokenChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ source: 'generated', token: 'abc' }),
    );
    expect(screen.getByText(/Token successfully generated/)).toBeVisible();
  });
});

describe('EnrollmentTokenInput advanced options', () => {
  it('keeps the mint inputs folded away until the operator asks for them', () => {
    renderInput({ collapsed: true });
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
        enrollmentTokenTtl: field('banana', 'Use a number of seconds, or 30d.'),
      },
    });
    expect(lifetimeInput()).toBeInTheDocument();
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
    createToken.mockResolvedValue(MINTED);
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
    createToken.mockResolvedValue(MINTED);
    renderInput();

    fireEvent.click(switchFor(label));
    expect(switchFor(label)).toBeChecked();
    fireEvent.click(generateButton());

    await waitFor(() => expect(createToken).toHaveBeenCalled());
    expect(createToken).toHaveBeenCalledWith(
      expect.objectContaining({ [flag]: true }),
    );
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

  /* The token authenticates the enrollment: it is handed over through the
  clipboard, never rendered where it can be read off the screen. */
  it('hands the generated token over through the clipboard without showing it', () => {
    const execCommand = jest.fn().mockReturnValue(true);
    (document as unknown as { execCommand: unknown }).execCommand = execCommand;
    renderInput({
      enrollmentToken: {
        source: 'generated',
        ...MINTED,
        token: 'eyJ2ZXIiOjEs',
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
    createToken.mockResolvedValue(MINTED);
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
