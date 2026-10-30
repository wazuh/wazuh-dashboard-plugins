import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DOCS_PATHS } from '../../../../../../common/services/docs-paths';
import {
  WAZUH_FINDINGS_CLOUD_SERVICES_PATTERN,
  WAZUH_FINDINGS_PATTERN,
} from '../../../../../../common/constants';
import { ButtonAboutOffice365 } from './button-about-office-365';

jest.mock('../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

describe('ButtonAboutOffice365', () => {
  it('opens a flyout with the overview, the terms and how to start, and the docs link', () => {
    render(<ButtonAboutOffice365 />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'About Office 365' }));

    const flyout = screen.getByRole('dialog');
    expect(flyout).toHaveTextContent(
      'Office 365 shows the security events of ',
    );
    ['Dashboard', 'Panel'].forEach(term =>
      expect(flyout).toHaveTextContent(term),
    );
    expect(flyout).toHaveTextContent('How to start');
    expect(screen.getByRole('link', { name: /documentation/ })).toHaveAttribute(
      'href',
      `https://docs.example/${DOCS_PATHS.office365}`,
    );
  });

  it('lists the index patterns that each tab reads', () => {
    render(<ButtonAboutOffice365 />);
    fireEvent.click(screen.getByRole('button', { name: 'About Office 365' }));

    const getIndices = (id: string) =>
      Array.from(
        screen
          .getByRole('dialog')
          .querySelectorAll(`[data-test-subj$="Index-${id}"]`),
      ).map(element => element.textContent);

    expect(screen.getByRole('dialog')).toHaveTextContent('Indices');
    expect(getIndices('dashboard')).toEqual([
      WAZUH_FINDINGS_CLOUD_SERVICES_PATTERN,
    ]);
    expect(getIndices('panel')).toEqual([
      WAZUH_FINDINGS_CLOUD_SERVICES_PATTERN,
    ]);
    expect(getIndices('findings')).toEqual([WAZUH_FINDINGS_PATTERN]);
  });
});
