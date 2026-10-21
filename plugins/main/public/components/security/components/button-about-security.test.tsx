import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ButtonAboutSecurity } from './button-about-security';

jest.mock('../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

describe('ButtonAboutSecurity', () => {
  it('opens a flyout with the general information and the indexer permissions warning', () => {
    render(<ButtonAboutSecurity />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'About Security' }));

    const flyout = screen.getByRole('dialog');
    ['Users', 'Roles', 'Policies', 'Roles mapping'].forEach(term =>
      expect(flyout).toHaveTextContent(term),
    );
    const warning = screen.getByText(
      'Agent restrictions also need indexer permissions',
    );
    expect(warning).toBeInTheDocument();
    [
      'wazuh-events-*',
      'wazuh-findings-*',
      'wazuh-states-*',
      'wazuh-active-responses-*',
      'wazuh-metrics-agents-*',
      '{"terms":{"wazuh.agent.groups":["<group>"]}}',
    ].forEach(text => expect(flyout).toHaveTextContent(text));
  });

  it('links to the indexer security documentation', () => {
    render(<ButtonAboutSecurity />);
    fireEvent.click(screen.getByRole('button', { name: 'About Security' }));

    const links = screen.getAllByRole('link', { name: /documentation/ });
    expect(links).toHaveLength(2);
    links.forEach(link => {
      expect(link).toHaveAttribute(
        'href',
        'https://docs.example/user-manual/wazuh-indexer/security.html',
      );
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.getAttribute('rel')).toEqual(
        expect.stringMatching(/noopener.*noreferrer|noreferrer.*noopener/),
      );
    });
  });

  it('closes the flyout', () => {
    render(<ButtonAboutSecurity />);
    fireEvent.click(screen.getByRole('button', { name: 'About Security' }));

    fireEvent.click(
      document.querySelector('[data-test-subj="euiFlyoutCloseButton"]')!,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
