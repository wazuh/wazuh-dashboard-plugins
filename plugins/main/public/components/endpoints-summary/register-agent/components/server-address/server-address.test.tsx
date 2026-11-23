import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import ServerAddressInput from './server-address';
import { useForm } from '../../../../common/form/hooks';
import { FormConfiguration } from '../../../../common/form/types';
import { AddressComboBox } from '../../../../enrollment-tokens/components/address-combo-box';
import { getListenerCertificateNames } from '../../../../../services/enrollment-tokens';

const mockSet = jest.fn();

let mockAppConfig: Record<string, string> = {};

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({ appConfig: { data: mockAppConfig } }),
}));

jest.mock('../../../../../kibana-services', () => ({
  getUiSettings: () => ({
    get: jest.fn(),
    set: (...args: unknown[]) => mockSet(...args),
  }),
}));

jest.mock(
  '../../../../../react-services/error-management/error-handler/error-handler',
  () => ({
    ErrorHandler: { handleError: jest.fn() },
  }),
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

const Harness = ({ names = [] }: { names?: string[] }) => {
  const { fields } = useForm(fieldsConfiguration);
  currentAddress = fields.serverAddress.value;

  return (
    <ServerAddressInput
      formFields={{
        serverAddress: fields.serverAddress,
        serverPort: fields.serverPort,
        serverPath: fields.serverPath,
      }}
      certificateNames={names}
    />
  );
};

const addressInput = () =>
  document.querySelector(
    '[data-test-subj="registerAgentServerAddress"] input',
  ) as HTMLElement;

beforeEach(() => {
  mockAppConfig = {};
  mockSet.mockReset();
  mockSet.mockResolvedValue(true);
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

  it('remembers the typed endpoint as the enrollment settings', async () => {
    getNames.mockResolvedValue([]);
    render(<Harness />);
    await waitFor(() => expect(getNames).toHaveBeenCalled());

    fireEvent.change(addressInput(), { target: { value: 'manager.local' } });
    fireEvent.keyDown(addressInput(), { key: 'Enter' });
    fireEvent.click(
      document.querySelector(
        '[data-test-subj="rememberServerEndpoint"]',
      ) as HTMLElement,
    );

    await waitFor(() =>
      expect(mockSet).toHaveBeenCalledWith('enrollment.dns', 'manager.local'),
    );
    expect(mockSet).toHaveBeenCalledTimes(3);
  });

  describe('wildcard certificate names', () => {
    const notice = () =>
      document.querySelector(
        '[data-test-subj="addressCoveredByWildcardNotice"]',
      );

    it('offers a pattern instead of an option, and puts its suffix in the search box', async () => {
      getNames.mockResolvedValue(['manager.example.com', '*.acme.example']);
      render(<Harness names={['manager.example.com', '*.acme.example']} />);

      fireEvent.click(await screen.findByText('*.acme.example'));

      await waitFor(() =>
        expect((addressInput() as HTMLInputElement).value).toBe(
          '.acme.example',
        ),
      );
      fireEvent.focus(addressInput());
      expect(screen.queryAllByText('*.acme.example')).toHaveLength(1);
    });

    it('says the typed name is covered by the wildcard', async () => {
      getNames.mockResolvedValue(['*.acme.example']);
      render(<Harness names={['*.acme.example']} />);
      await waitFor(() => expect(getNames).toHaveBeenCalled());

      fireEvent.change(addressInput(), {
        target: { value: 'wazuh.acme.example' },
      });
      fireEvent.keyDown(addressInput(), { key: 'Enter' });

      await waitFor(() => expect(notice()).toBeInTheDocument());
      expect(notice()).toHaveTextContent('*.acme.example');
    });
  });

  describe('address outside the certificate', () => {
    const warning = () =>
      document.querySelector(
        '[data-test-subj="addressOutsideCertificateWarning"]',
      );

    it('warns that the address is not in the certificate', async () => {
      getNames.mockResolvedValue([]);
      render(<Harness names={['manager.example.com']} />);
      await waitFor(() => expect(getNames).toHaveBeenCalled());

      fireEvent.change(addressInput(), { target: { value: 'other.example' } });
      fireEvent.keyDown(addressInput(), { key: 'Enter' });

      await waitFor(() => expect(warning()).not.toBeNull());
    });

    it('does not warn for a name in the certificate or without names', async () => {
      getNames.mockResolvedValue([]);
      const { rerender } = render(<Harness names={['manager.example.com']} />);
      await waitFor(() => expect(getNames).toHaveBeenCalled());

      fireEvent.change(addressInput(), {
        target: { value: 'Manager.Example.com' },
      });
      fireEvent.keyDown(addressInput(), { key: 'Enter' });
      expect(warning()).toBeNull();

      rerender(<Harness names={[]} />);
      expect(warning()).toBeNull();
    });
  });
});
