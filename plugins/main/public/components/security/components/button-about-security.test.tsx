import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ButtonAboutSecurity } from './button-about-security';
import {
  WAZUH_ACTIVE_RESPONSES_PATTERN,
  WAZUH_AGENT_CONFIG_PATTERN,
  WAZUH_AGENT_STATS_PATTERN,
  WAZUH_METRICS_AGENTS_PATTERN,
  WAZUH_METRICS_COMMS_PATTERN,
} from '../../../../common/constants';

jest.mock('../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

describe('ButtonAboutSecurity', () => {
  it('opens a flyout with the general information and the indexer permissions warning', () => {
    render(<ButtonAboutSecurity />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'About Wazuh API access' }),
    );

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
      WAZUH_ACTIVE_RESPONSES_PATTERN,
      WAZUH_METRICS_AGENTS_PATTERN,
      WAZUH_METRICS_COMMS_PATTERN,
      WAZUH_AGENT_CONFIG_PATTERN,
      WAZUH_AGENT_STATS_PATTERN,
      '{"terms":{"wazuh.agent.groups":["<group>"]}}',
      '{"term":{"wazuh.agent.id":"<agent id>"}}',
      'With run as, the roles come from Roles mapping instead.',
    ].forEach(text => expect(flyout).toHaveTextContent(text));
  });

  it('links the header to the API RBAC docs and the warning to the indexer security docs', () => {
    render(<ButtonAboutSecurity />);
    fireEvent.click(
      screen.getByRole('button', { name: 'About Wazuh API access' }),
    );

    const links = screen.getAllByRole('link', { name: /documentation/ });
    expect(links.map(link => link.getAttribute('href'))).toEqual([
      'https://docs.example/user-manual/api/rbac/index.html',
      'https://docs.example/user-manual/wazuh-indexer/security.html#roles',
    ]);
    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.getAttribute('rel')).toEqual(
        expect.stringMatching(/noopener.*noreferrer|noreferrer.*noopener/),
      );
    });
  });

  it('closes the flyout', () => {
    render(<ButtonAboutSecurity />);
    fireEvent.click(
      screen.getByRole('button', { name: 'About Wazuh API access' }),
    );

    fireEvent.click(
      document.querySelector('[data-test-subj="euiFlyoutCloseButton"]')!,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
