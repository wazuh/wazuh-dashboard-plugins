import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ButtonAboutFileIntegrityMonitoring } from './button-about-file-integrity-monitoring';

jest.mock('../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

const openFlyout = () => {
  render(<ButtonAboutFileIntegrityMonitoring />);
  fireEvent.click(
    screen.getByRole('button', { name: 'About File Integrity Monitoring' }),
  );
  return screen.getByRole('dialog');
};

describe('ButtonAboutFileIntegrityMonitoring', () => {
  it('renders the button with the flyout closed', () => {
    render(<ButtonAboutFileIntegrityMonitoring />);

    expect(
      screen.getByRole('button', { name: 'About File Integrity Monitoring' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('explains what the module does and the terms shown on its pages', () => {
    const flyout = openFlyout();

    expect(flyout).toHaveTextContent(
      'detects when files and registry entries are created, modified or deleted',
    );
    [
      'Baseline',
      'Current state',
      'Inventory',
      'Findings',
      'mtime',
      'Getting started',
    ].forEach(term => expect(flyout).toHaveTextContent(term));
    expect(flyout).toHaveTextContent(
      'monitor only a few system directories by default',
    );
  });

  it('links to the module documentation and the configuration guide', () => {
    openFlyout();

    const docsLink = screen.getByRole('link', { name: /documentation/ });
    expect(docsLink).toHaveAttribute(
      'href',
      'https://docs.example/user-manual/capabilities/file-integrity/index.html',
    );
    const configureLink = screen.getByRole('link', {
      name: /How to configure File Integrity Monitoring/,
    });
    expect(configureLink).toHaveAttribute(
      'href',
      'https://docs.example/user-manual/capabilities/file-integrity/how-to-configure-fim.html',
    );
    [docsLink, configureLink].forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.getAttribute('rel')).toEqual(
        expect.stringMatching(/noopener.*noreferrer|noreferrer.*noopener/),
      );
    });
  });

  it('closes the flyout', () => {
    openFlyout();

    fireEvent.click(
      document.querySelector('[data-test-subj="euiFlyoutCloseButton"]')!,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
