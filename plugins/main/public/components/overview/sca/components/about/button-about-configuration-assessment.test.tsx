import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  WAZUH_FINDINGS_PATTERN,
  WAZUH_SCA_PATTERN,
} from '../../../../../../common/constants';
import { ButtonAboutConfigurationAssessment } from './button-about-configuration-assessment';

jest.mock('../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

describe('ButtonAboutConfigurationAssessment', () => {
  it('opens a flyout with the result definitions and the docs link', () => {
    render(<ButtonAboutConfigurationAssessment />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'About Configuration Assessment' }),
    );

    const flyout = screen.getByRole('dialog');
    [
      'States',
      'Findings',
      'Passed',
      'Failed',
      'Not applicable',
      'Score',
    ].forEach(term => expect(flyout).toHaveTextContent(term));
    const link = screen.getByRole('link', { name: /documentation/ });
    expect(link).toHaveAttribute(
      'href',
      'https://docs.example/user-manual/capabilities/sec-config-assessment/index.html',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toEqual(
      expect.stringMatching(/noopener.*noreferrer|noreferrer.*noopener/),
    );
  });

  it('closes the flyout', () => {
    render(<ButtonAboutConfigurationAssessment />);
    fireEvent.click(
      screen.getByRole('button', { name: 'About Configuration Assessment' }),
    );

    fireEvent.click(
      document.querySelector('[data-test-subj="euiFlyoutCloseButton"]')!,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists the index patterns that each tab reads', () => {
    render(<ButtonAboutConfigurationAssessment />);
    fireEvent.click(
      screen.getByRole('button', { name: 'About Configuration Assessment' }),
    );

    const getIndices = (id: string) =>
      Array.from(
        screen
          .getByRole('dialog')
          .querySelectorAll(`[data-test-subj$="Index-${id}"]`),
      ).map(element => element.textContent);

    expect(screen.getByRole('dialog')).toHaveTextContent('Indices');
    expect(getIndices('dashboard')).toEqual([WAZUH_SCA_PATTERN]);
    expect(getIndices('inventory')).toEqual([WAZUH_SCA_PATTERN]);
    expect(getIndices('findings')).toEqual([WAZUH_FINDINGS_PATTERN]);
  });
});
