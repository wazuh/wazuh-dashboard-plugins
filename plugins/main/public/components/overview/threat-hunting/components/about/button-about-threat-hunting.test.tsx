import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DOCS_PATHS } from '../../../../../../common/services/docs-paths';
import { WAZUH_FINDINGS_PATTERN } from '../../../../../../common/constants';
import { ButtonAboutThreatHunting } from './button-about-threat-hunting';

jest.mock('../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

describe('ButtonAboutThreatHunting', () => {
  it('opens a flyout with the overview, the terms and how to start, and the docs link', () => {
    render(<ButtonAboutThreatHunting />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'About Threat Hunting' }),
    );

    const flyout = screen.getByRole('dialog');
    expect(flyout).toHaveTextContent(
      'Threat Hunting lets you browse the secur',
    );
    ['Dashboard', 'Findings'].forEach(term =>
      expect(flyout).toHaveTextContent(term),
    );
    expect(flyout).toHaveTextContent('How to start');
    expect(screen.getByRole('link', { name: /documentation/ })).toHaveAttribute(
      'href',
      `https://docs.example/${DOCS_PATHS.threatHunting}`,
    );
  });

  it('lists the index patterns that each tab reads', () => {
    render(<ButtonAboutThreatHunting />);
    fireEvent.click(
      screen.getByRole('button', { name: 'About Threat Hunting' }),
    );

    const getIndices = (id: string) =>
      Array.from(
        screen
          .getByRole('dialog')
          .querySelectorAll(`[data-test-subj$="Index-${id}"]`),
      ).map(element => element.textContent);

    expect(screen.getByRole('dialog')).toHaveTextContent('Indices');
    expect(getIndices('dashboard')).toEqual([WAZUH_FINDINGS_PATTERN]);
    expect(getIndices('findings')).toEqual([WAZUH_FINDINGS_PATTERN]);
  });
});
