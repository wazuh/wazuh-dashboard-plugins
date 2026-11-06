import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DOCS_PATHS } from '../../../../../../common/services/docs-paths';
import { WAZUH_FINDINGS_PATTERN } from '../../../../../../common/constants';
import { ButtonAboutRegulatoryCompliance } from './button-about-regulatory-compliance';

jest.mock('../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

describe('ButtonAboutRegulatoryCompliance', () => {
  it('opens a flyout with the overview, the terms and how to start, and the docs link', () => {
    render(<ButtonAboutRegulatoryCompliance />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'About Regulatory Compliance' }),
    );

    const flyout = screen.getByRole('dialog');
    expect(flyout).toHaveTextContent(
      'Regulatory Compliance assesses your envi',
    );
    ['Framework', 'Requirement'].forEach(term =>
      expect(flyout).toHaveTextContent(term),
    );
    expect(flyout).toHaveTextContent('How to start');
    expect(screen.getByRole('link', { name: /documentation/ })).toHaveAttribute(
      'href',
      `https://docs.example/${DOCS_PATHS.regulatoryCompliance}`,
    );
  });

  it('lists the index patterns that each tab reads', () => {
    render(<ButtonAboutRegulatoryCompliance />);
    fireEvent.click(
      screen.getByRole('button', { name: 'About Regulatory Compliance' }),
    );

    const getIndices = (id: string) =>
      Array.from(
        screen
          .getByRole('dialog')
          .querySelectorAll(`[data-test-subj$="Index-${id}"]`),
      ).map(element => element.textContent);

    expect(screen.getByRole('dialog')).toHaveTextContent('Indices');
    expect(getIndices('dashboard')).toEqual([WAZUH_FINDINGS_PATTERN]);
    expect(getIndices('controls')).toEqual([WAZUH_FINDINGS_PATTERN]);
    expect(getIndices('findings')).toEqual([WAZUH_FINDINGS_PATTERN]);
  });
});
