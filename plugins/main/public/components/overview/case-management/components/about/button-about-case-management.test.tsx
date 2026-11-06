import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DOCS_PATHS } from '../../../../../../common/services/docs-paths';
import { WAZUH_FINDINGS_PATTERN } from '../../../../../../common/constants';
import { ButtonAboutCaseManagement } from './button-about-case-management';

jest.mock('../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

describe('ButtonAboutCaseManagement', () => {
  it('opens a flyout with the overview, the terms and how to start, and the docs link', () => {
    render(<ButtonAboutCaseManagement />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'About Case Management' }),
    );

    const flyout = screen.getByRole('dialog');
    expect(flyout).toHaveTextContent(
      'Case Management lets you track, triage a',
    );
    ['Case', 'Dashboard', 'Cases'].forEach(term =>
      expect(flyout).toHaveTextContent(term),
    );
    expect(flyout).toHaveTextContent('How to start');
    expect(screen.getByRole('link', { name: /documentation/ })).toHaveAttribute(
      'href',
      `https://docs.example/${DOCS_PATHS.caseManagement}`,
    );
  });

  it('lists the index patterns that each tab reads', () => {
    render(<ButtonAboutCaseManagement />);
    fireEvent.click(
      screen.getByRole('button', { name: 'About Case Management' }),
    );

    const getIndices = (id: string) =>
      Array.from(
        screen
          .getByRole('dialog')
          .querySelectorAll(`[data-test-subj$="Index-${id}"]`),
      ).map(element => element.textContent);

    expect(screen.getByRole('dialog')).toHaveTextContent('Indices');
    expect(getIndices('dashboard')).toEqual([WAZUH_FINDINGS_PATTERN]);
    expect(getIndices('cases')).toEqual([WAZUH_FINDINGS_PATTERN]);
  });
});
