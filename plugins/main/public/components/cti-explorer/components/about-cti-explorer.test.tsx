import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DOCS_PATHS } from '../../../../common/services/docs-paths';
import { AboutCtiExplorer } from './about-cti-explorer';

jest.mock('../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

describe('AboutCtiExplorer', () => {
  it('opens a flyout with the overview, how values match and the docs link', () => {
    render(<AboutCtiExplorer />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'About CTI Explorer' }));

    const flyout = screen.getByRole('dialog');
    expect(flyout).toHaveTextContent(
      'CTI Explorer shows what the Cyber Threat Intelligence (CTI) feed delivered',
    );
    expect(flyout).toHaveTextContent('Checking a value');
    expect(flyout).toHaveTextContent(
      'A value matches when it equals a catalog value',
    );
    expect(screen.getByRole('link', { name: /documentation/ })).toHaveAttribute(
      'href',
      `https://docs.example/${DOCS_PATHS.ctiExplorer}`,
    );
  });
});
