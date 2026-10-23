import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
});
