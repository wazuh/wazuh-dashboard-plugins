import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ButtonAboutITHygiene } from './button-about-it-hygiene';

jest.mock('../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

describe('ButtonAboutITHygiene', () => {
  it('explains the module and links to the System inventory docs', () => {
    render(<ButtonAboutITHygiene />);
    fireEvent.click(screen.getByRole('button', { name: 'About IT Hygiene' }));

    expect(screen.getByRole('dialog')).toHaveTextContent(
      'IT Hygiene is the inventory of your endpoints',
    );
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'the first inventory is still syncing',
    );
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'has to be configured in the agents',
    );
    [
      ['system', 'wazuh-states-inventory-system'],
      ['packages', 'wazuh-states-inventory-packages'],
      ['ports', 'wazuh-states-inventory-ports'],
      ['dashboard', 'wazuh-states-inventory'],
    ].forEach(([id, index]) =>
      expect(
        screen
          .getByRole('dialog')
          .querySelector(`[data-test-subj="itHygieneIndex-${id}"]`),
      ).toHaveTextContent(new RegExp(`^${index}$`)),
    );
    [
      [/available fields/, 'available-inventory-fields.html'],
      [/documentation/, 'index.html'],
      [/configure Syscollector/, 'configuration.html'],
    ].forEach(([name, page]) =>
      expect(screen.getByRole('link', { name })).toHaveAttribute(
        'href',
        `https://docs.example/user-manual/capabilities/system-inventory/${page}`,
      ),
    );
  });
});
