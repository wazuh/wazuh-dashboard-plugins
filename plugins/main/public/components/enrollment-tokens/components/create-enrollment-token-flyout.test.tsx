import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { CreateEnrollmentTokenFlyout } from './create-enrollment-token-flyout';
import {
  createEnrollmentToken,
  getListenerCertificateNames,
} from '../../../services/enrollment-tokens';

type AppConfigState = { appConfig: { data: Record<string, string> } };

/* The plugin settings the flyout reads its defaults from. Reset before each
test so only the tests that set them see prefilled fields. */
let mockAppConfig: Record<string, string> = {};
let mockAddressError: (value: string) => string | undefined = () => undefined;

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: AppConfigState) => unknown) =>
    selector({ appConfig: { data: mockAppConfig } }),
}));

jest.mock('../../../kibana-services', () => ({
  getWazuhCorePlugin: () => ({
    SettingsValidator: {
      serverEndpointAddress: (value: string) => mockAddressError(value),
      serverEndpointPort: () => undefined,
      serverEndpointPathPrefix: () => undefined,
    },
  }),
}));

jest.mock('../../../react-services/time-service', () => ({
  formatUIDate: (date: string) => date,
}));

jest.mock('../../../services/enrollment-tokens', () => ({
  ...jest.requireActual('../../../services/enrollment-tokens/constants'),
  createEnrollmentToken: jest.fn(),
  getListenerCertificateNames: jest.fn(),
  validateEnrollmentTokenDescription: () => undefined,
  validateEnrollmentTokenTtl: () => undefined,
  validateEnrollmentTokenMaxUses: () => undefined,
}));

const createToken = createEnrollmentToken as jest.Mock;
const getNames = getListenerCertificateNames as jest.Mock;

const renderFlyout = (onClose: jest.Mock = jest.fn()) => {
  render(<CreateEnrollmentTokenFlyout onClose={onClose} />);
  return onClose;
};

const closeFlyout = () =>
  fireEvent.click(
    document.querySelector(
      '[data-test-subj="euiFlyoutCloseButton"]',
    ) as HTMLElement,
  );

const cancel = () =>
  fireEvent.click(screen.getByText('Cancel').closest('button') as HTMLElement);

const addressInput = () =>
  document.querySelector(
    '[data-test-subj="enrollmentTokenAddress"] input',
  ) as HTMLElement;

const addressValue = () =>
  document.querySelector(
    '[data-test-subj="enrollmentTokenAddress"] .euiComboBoxPill',
  )?.textContent ?? '';

const typeAddress = (address: string) => {
  fireEvent.change(addressInput(), { target: { value: address } });
  fireEvent.keyDown(addressInput(), { key: 'Enter' });
};

const fillAddress = () => typeAddress('manager.example.com');

const confirmationIsOpen = () =>
  screen.queryByText('Unsubmitted changes') !== null;

/* The id generator is stubbed in this environment, so every control ends up
with the same `aria-labelledby` target and an accessible-name query cannot tell
them apart. The switches are reached through their visible label instead. */
const switchFor = (label: string) =>
  screen
    .getByText(label)
    .closest('.euiSwitch')
    ?.querySelector('button[role="switch"]') as HTMLElement;

const embedCaSwitch = () => switchFor('Carry the CA certificate in the token');
const noCredentialSwitch = () =>
  switchFor('Mint the token without a credential');

const mint = async () => {
  fillAddress();
  fireEvent.click(screen.getByText('Create').closest('button') as HTMLElement);
  await waitFor(() => expect(createToken).toHaveBeenCalled());
  return createToken.mock.calls[0][0];
};

beforeEach(() => {
  mockAppConfig = {};
  mockAddressError = () => undefined;
  createToken.mockReset();
  getNames.mockReset();
  getNames.mockResolvedValue([]);
  createToken.mockResolvedValue({
    token: 'abc',
    id: 'id-1',
    address: 'manager.example.com',
    expires: '2026-10-09T05:12:40+00:00',
  });
});

describe('CreateEnrollmentTokenFlyout', () => {
  it('offers both flags off, which is what the manager defaults to', () => {
    renderFlyout();
    expect(embedCaSwitch()).not.toBeChecked();
    expect(noCredentialSwitch()).not.toBeChecked();
  });

  it('mints without either flag while both switches are off', async () => {
    renderFlyout();
    const request = await mint();
    expect(request).toEqual(
      expect.objectContaining({ embedCa: false, noCredential: false }),
    );
  });

  /* The CA travels inside the token instead of being fetched from the manager,
  so the flag has to reach the mint request. */
  it('asks for the CA to be embedded once the switch is on', async () => {
    renderFlyout();
    fireEvent.click(embedCaSwitch());
    expect(embedCaSwitch()).toBeChecked();

    const request = await mint();
    expect(request).toEqual(expect.objectContaining({ embedCa: true }));
  });

  /* The minted token is read the way the details flyout reads one, so both
  screens present the same fields the same way. */
  it('stacks the minted values under their labels', async () => {
    renderFlyout();
    await mint();

    const list = document.querySelector('.euiDescriptionList');
    expect(list).toHaveClass('euiDescriptionList--row');
    expect(list).not.toHaveClass('euiDescriptionList--column');
  });

  /* The two flags are independent: embedding the CA says nothing about whether
  the token carries a credential. */
  it('keeps the two flags independent', async () => {
    renderFlyout();
    fireEvent.click(embedCaSwitch());
    expect(noCredentialSwitch()).not.toBeChecked();

    const request = await mint();
    expect(request).toEqual(
      expect.objectContaining({ embedCa: true, noCredential: false }),
    );
  });

  describe('endpoint defaults', () => {
    const portInput = () => screen.getByPlaceholderText('1517');
    const prefixInput = () => screen.getByPlaceholderText('/wazuh-manager/');

    const create = async () => {
      fireEvent.click(
        screen.getByText('Create').closest('button') as HTMLElement,
      );
      await waitFor(() => expect(createToken).toHaveBeenCalled());
      return createToken.mock.calls[0][0];
    };

    /* The deploy wizard reads the same three settings, so a token minted here
    has to point the agent at the same endpoint as one minted there. */
    it('offers the address, port and prefix from the enrollment settings', async () => {
      mockAppConfig = {
        'enrollment.dns': 'manager.example.com',
        'enrollment.port': '443',
        'enrollment.path': '/wazuh-manager/',
      };
      renderFlyout();

      expect(addressValue()).toBe('manager.example.com');
      expect(portInput()).toHaveValue('443');
      expect(prefixInput()).toHaveValue('/wazuh-manager/');

      const request = await create();
      expect(request).toEqual(
        expect.objectContaining({
          address: 'manager.example.com',
          port: '443',
          prefix: '/wazuh-manager/',
        }),
      );
    });

    it('leaves the port and prefix empty while the settings are unset', async () => {
      renderFlyout();

      expect(portInput()).toHaveValue('');
      expect(prefixInput()).toHaveValue('');

      const request = await mint();
      expect(request).toEqual(
        expect.objectContaining({ port: '', prefix: '' }),
      );
    });

    /* Values the form was offered with are not the user's work, so they must
    not count as unsaved changes. */
    it('closes without asking when only the defaults are filled', () => {
      mockAppConfig = {
        'enrollment.dns': 'manager.example.com',
        'enrollment.port': '443',
        'enrollment.path': '/wazuh-manager/',
      };
      const onClose = renderFlyout();

      closeFlyout();
      expect(confirmationIsOpen()).toBe(false);
      expect(onClose).toHaveBeenCalledWith(false);
    });
  });

  describe('address suggestions', () => {
    const createButton = () =>
      screen.getByText('Create').closest('button') as HTMLElement;

    it('suggests the names in the listener certificates', async () => {
      getNames.mockResolvedValue(['manager.example.com', '10.0.0.5']);
      renderFlyout();

      fireEvent.focus(addressInput());

      expect(
        await screen.findByText('manager.example.com'),
      ).toBeInTheDocument();
      expect(screen.getByText('10.0.0.5')).toBeInTheDocument();
    });

    it('mints with the suggestion the user picks', async () => {
      getNames.mockResolvedValue(['manager.example.com', '10.0.0.5']);
      renderFlyout();

      fireEvent.focus(addressInput());
      fireEvent.click(await screen.findByText('10.0.0.5'));
      fireEvent.click(createButton());

      await waitFor(() => expect(createToken).toHaveBeenCalled());
      expect(createToken.mock.calls[0][0]).toEqual(
        expect.objectContaining({ address: '10.0.0.5' }),
      );
    });

    it('accepts a typed address that is not suggested', async () => {
      getNames.mockResolvedValue(['manager.example.com']);
      renderFlyout();
      await waitFor(() => expect(getNames).toHaveBeenCalled());

      typeAddress('other.example.com');
      expect(addressValue()).toBe('other.example.com');

      fireEvent.click(createButton());
      await waitFor(() => expect(createToken).toHaveBeenCalled());
      expect(createToken.mock.calls[0][0]).toEqual(
        expect.objectContaining({ address: 'other.example.com' }),
      );
    });

    it('takes a typed address when the names cannot be loaded', async () => {
      getNames.mockRejectedValue(new Error('403 Forbidden'));
      renderFlyout();
      await waitFor(() => expect(getNames).toHaveBeenCalled());

      const request = await mint();
      expect(request).toEqual(
        expect.objectContaining({ address: 'manager.example.com' }),
      );
      expect(screen.queryByText('403 Forbidden')).not.toBeInTheDocument();
    });

    it('shows a loading state while the names are fetched', () => {
      getNames.mockReturnValue(new Promise(() => {}));
      renderFlyout();

      expect(
        document.querySelector(
          '[data-test-subj="enrollmentTokenAddress"] .euiLoadingSpinner',
        ),
      ).not.toBeNull();
    });

    it('validates the address and blocks the mint while it is invalid', async () => {
      mockAddressError = value =>
        value.includes(' ') ? 'It should be a valid address.' : undefined;
      renderFlyout();
      await waitFor(() => expect(getNames).toHaveBeenCalled());

      typeAddress('bad address');

      expect(
        screen.getByText('It should be a valid address.'),
      ).toBeInTheDocument();
      expect(createButton()).toBeDisabled();
    });
  });

  /* A half-filled form is work that closing the flyout would throw away, and
  the flyout closes on a stray click as readily as on a deliberate one. */
  describe('unsaved changes', () => {
    it('closes without asking while the form is untouched', () => {
      const onClose = renderFlyout();

      closeFlyout();
      expect(confirmationIsOpen()).toBe(false);
      expect(onClose).toHaveBeenCalledWith(false);
    });

    it('asks before discarding a partially filled form', () => {
      const onClose = renderFlyout();
      fillAddress();

      closeFlyout();
      expect(confirmationIsOpen()).toBe(true);
      expect(onClose).not.toHaveBeenCalled();
    });

    /* The switches are held outside the validated form state, so their dirty
    check is a separate one that could be forgotten. */
    it('asks after only a switch was turned on', () => {
      const onClose = renderFlyout();
      fireEvent.click(embedCaSwitch());

      closeFlyout();
      expect(confirmationIsOpen()).toBe(true);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('keeps the form when the confirmation is declined', () => {
      const onClose = renderFlyout();
      fillAddress();
      closeFlyout();

      fireEvent.click(screen.getByText("No, don't do it"));
      expect(confirmationIsOpen()).toBe(false);
      expect(onClose).not.toHaveBeenCalled();
      expect(addressValue()).toBe('manager.example.com');
    });

    it('discards the form once the confirmation is accepted', () => {
      const onClose = renderFlyout();
      fillAddress();
      closeFlyout();

      fireEvent.click(screen.getByText('Yes, do it'));
      expect(confirmationIsOpen()).toBe(false);
      expect(onClose).toHaveBeenCalledWith(false);
    });

    /* The footer button is the deliberate way out, and it leads to the same
    loss as the header X. */
    it('guards the footer Cancel button too', () => {
      const onClose = renderFlyout();
      fillAddress();

      cancel();
      expect(confirmationIsOpen()).toBe(true);
      expect(onClose).not.toHaveBeenCalled();
    });

    /* Once the token is minted the form is gone and the only thing left to do
    is close: prompting there would guard nothing and stand in the way. */
    it('stops asking once the token was minted', async () => {
      const onClose = renderFlyout();
      await mint();

      fireEvent.click(
        screen.getByText('Close').closest('button') as HTMLElement,
      );
      expect(confirmationIsOpen()).toBe(false);
      expect(onClose).toHaveBeenCalledWith(true);
    });
  });
});
