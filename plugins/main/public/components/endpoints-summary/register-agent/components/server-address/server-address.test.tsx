import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import ServerAddressInput from './server-address';
import { useForm } from '../../../../common/form/hooks';
import { FormConfiguration } from '../../../../common/form/types';
import { AddressComboBox } from '../../../../enrollment-tokens/components/address-combo-box';
import { getListenerCertificateNames } from '../../../../../services/enrollment-tokens';

jest.mock('../../../../../kibana-services', () => ({
  getUiSettings: () => ({ get: jest.fn(), set: jest.fn() }),
}));

jest.mock(
  '../../../../../react-services/error-management/error-handler/error-handler',
  () => ({ ErrorHandler: { handleError: jest.fn() } }),
);

jest.mock('../../../../../services/enrollment-tokens', () => ({
  getListenerCertificateNames: jest.fn(),
}));

const getNames = getListenerCertificateNames as jest.Mock;

/* The address field is configured as the deploy wizard configures it. */
const fieldsConfiguration: FormConfiguration = {
  serverAddress: {
    type: 'custom',
    initialValue: '',
    component: props => (
      <AddressComboBox {...props} data-test-subj='registerAgentServerAddress' />
    ),
  },
  serverPort: { type: 'text', initialValue: '' },
  serverPath: { type: 'text', initialValue: '' },
};

let currentAddress: unknown;

const Harness = () => {
  const { fields } = useForm(fieldsConfiguration);
  currentAddress = fields.serverAddress.value;

  return (
    <ServerAddressInput
      formFields={{
        serverAddress: fields.serverAddress,
        serverPort: fields.serverPort,
        serverPath: fields.serverPath,
      }}
    />
  );
};

const addressInput = () =>
  document.querySelector(
    '[data-test-subj="registerAgentServerAddress"] input',
  ) as HTMLElement;

beforeEach(() => {
  currentAddress = undefined;
  getNames.mockReset();
});

describe('ServerAddressInput', () => {
  it('offers the names in the listener certificate as the address', async () => {
    getNames.mockResolvedValue(['manager.example.com', '10.0.0.2']);
    render(<Harness />);
    await waitFor(() => expect(getNames).toHaveBeenCalled());

    fireEvent.focus(addressInput());
    fireEvent.click(await screen.findByText('manager.example.com'));

    expect(currentAddress).toBe('manager.example.com');
  });

  it('takes a typed address that is not in the certificate', async () => {
    getNames.mockResolvedValue(['manager.example.com']);
    render(<Harness />);
    await waitFor(() => expect(getNames).toHaveBeenCalled());

    fireEvent.change(addressInput(), { target: { value: ' 192.168.1.5 ' } });
    fireEvent.keyDown(addressInput(), { key: 'Enter' });

    expect(currentAddress).toBe('192.168.1.5');
  });

  it('still takes a typed address when the names cannot be read', async () => {
    getNames.mockRejectedValue(new Error('403 Forbidden'));
    render(<Harness />);
    await waitFor(() => expect(getNames).toHaveBeenCalled());

    fireEvent.change(addressInput(), { target: { value: 'manager.local' } });
    fireEvent.keyDown(addressInput(), { key: 'Enter' });

    expect(currentAddress).toBe('manager.local');
  });
});
