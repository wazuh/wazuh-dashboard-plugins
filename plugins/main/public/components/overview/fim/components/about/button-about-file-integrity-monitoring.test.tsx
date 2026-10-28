import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ButtonAboutFileIntegrityMonitoring } from './button-about-file-integrity-monitoring';

jest.mock('../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

describe('ButtonAboutFileIntegrityMonitoring', () => {
  it('explains the module and links to its docs and configuration guide', () => {
    render(<ButtonAboutFileIntegrityMonitoring />);
    fireEvent.click(
      screen.getByRole('button', { name: 'About File Integrity Monitoring' }),
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('Baseline');
    [
      [/documentation/, 'index.html'],
      [
        /How to configure File Integrity Monitoring/,
        'how-to-configure-fim.html',
      ],
    ].forEach(([name, page]) =>
      expect(screen.getByRole('link', { name })).toHaveAttribute(
        'href',
        `https://docs.example/user-manual/capabilities/file-integrity/${page}`,
      ),
    );
  });
});
