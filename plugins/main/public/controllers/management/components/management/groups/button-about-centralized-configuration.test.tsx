import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { queryDataTestAttr } from '../../../../../../test/public/query-attr';
import { ButtonAboutCentralizedConfiguration } from './button-about-centralized-configuration';

jest.mock('../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

describe('ButtonAboutCentralizedConfiguration', () => {
  it('opens the guide with a link to the docs, and closes it', () => {
    render(<ButtonAboutCentralizedConfiguration />);
    fireEvent.click(
      screen.getByRole('button', { name: 'About centralized configuration' }),
    );

    const flyout = screen.getByRole('dialog');
    [
      'Structure',
      'Targeting agents',
      'Precedence',
      'Applying changes',
      'Validation',
    ].forEach(term => expect(flyout).toHaveTextContent(term));
    expect(flyout).toHaveTextContent(
      'merged in the order the groups were assigned to the agent',
    );
    expect(flyout).toHaveTextContent('the group assigned last wins');
    expect(screen.getByRole('link', { name: /documentation/ })).toHaveAttribute(
      'href',
      'https://docs.example/user-manual/reference/centralized-configuration.html',
    );

    fireEvent.click(
      document.querySelector(queryDataTestAttr('euiFlyoutCloseButton'))!,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
