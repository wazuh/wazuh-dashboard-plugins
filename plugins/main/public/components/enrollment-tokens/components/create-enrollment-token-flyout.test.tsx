import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { CreateEnrollmentTokenFlyout } from './create-enrollment-token-flyout';
import { createEnrollmentToken } from '../../../services/enrollment-tokens';

type AppConfigState = { appConfig: { data: Record<string, string> } };

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: AppConfigState) => unknown) =>
    selector({ appConfig: { data: {} } }),
}));

jest.mock('../../../kibana-services', () => ({
  getWazuhCorePlugin: () => ({
    SettingsValidator: {
      serverEndpointAddress: () => undefined,
      serverEndpointPort: () => undefined,
      serverEndpointPathPrefix: () => undefined,
    },
  }),
}));

jest.mock('../../../react-services/time-service', () => ({
  formatUIDate: (date: string) => date,
}));

jest.mock('../../../services/enrollment-tokens', () => ({
  createEnrollmentToken: jest.fn(),
  validateEnrollmentTokenTtl: () => undefined,
  validateEnrollmentTokenMaxUses: () => undefined,
}));

const createToken = createEnrollmentToken as jest.Mock;

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

const fillAddress = () =>
  fireEvent.change(screen.getByPlaceholderText('wazuh-manager.example.com'), {
    target: { value: 'manager.example.com' },
  });

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
  createToken.mockReset();
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
      expect(
        screen.getByPlaceholderText('wazuh-manager.example.com'),
      ).toHaveValue('manager.example.com');
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
