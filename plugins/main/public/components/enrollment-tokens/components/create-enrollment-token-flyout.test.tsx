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

const renderFlyout = () =>
  render(<CreateEnrollmentTokenFlyout onClose={jest.fn()} />);

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
  fireEvent.change(screen.getByPlaceholderText('wazuh-manager.example.com'), {
    target: { value: 'manager.example.com' },
  });
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
});
