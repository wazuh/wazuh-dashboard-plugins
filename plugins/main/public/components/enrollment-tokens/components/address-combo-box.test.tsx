import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { getListenerCertificateNames } from '../../../services/enrollment-tokens';
import { AddressComboBox } from './address-combo-box';

jest.mock('../../../services/enrollment-tokens', () => ({
  getListenerCertificateNames: jest.fn(),
}));

const getNames = getListenerCertificateNames as jest.Mock;

describe('AddressComboBox', () => {
  it('does not submit the surrounding form when a wildcard pattern is clicked', async () => {
    getNames.mockResolvedValue(['manager.example.com', '*.acme.example']);
    const onSubmit = jest.fn(event => event.preventDefault());

    render(
      <form onSubmit={onSubmit}>
        <AddressComboBox value='' onChange={jest.fn()} />
      </form>,
    );

    const chip = await waitFor(() => {
      const found = document.querySelector(
        '[data-test-subj="addressWildcardPattern"]',
      );

      expect(found).not.toBeNull();

      return found as HTMLElement;
    });

    expect(chip.getAttribute('type')).toBe('button');

    fireEvent.click(chip);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('tells to replace the wildcard and that the manager must be reachable', async () => {
    getNames.mockResolvedValue(['*.acme.example']);

    render(<AddressComboBox value='' onChange={jest.fn()} />);

    const help = await waitFor(() => {
      const found = document.querySelector(
        '[data-test-subj="addressWildcardPatternsHelp"]',
      );

      expect(found).not.toBeNull();

      return found as HTMLElement;
    });

    expect(help.textContent).toContain('Replace the * with the missing part');
    expect(help.textContent).toContain('reachable from the agents');
  });

  it('shows the help before the wildcard patterns', async () => {
    getNames.mockResolvedValue(['*.acme.example']);

    render(
      <AddressComboBox
        value=''
        onChange={jest.fn()}
        help={<span data-test-subj='addressHelp'>Help</span>}
      />,
    );

    const patterns = await waitFor(() => {
      const found = document.querySelector(
        '[data-test-subj="addressWildcardPatternsHelp"]',
      );

      expect(found).not.toBeNull();

      return found as HTMLElement;
    });
    const help = document.querySelector('[data-test-subj="addressHelp"]');

    expect(
      help?.compareDocumentPosition(patterns) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
