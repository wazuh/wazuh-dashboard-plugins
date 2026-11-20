import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
});
