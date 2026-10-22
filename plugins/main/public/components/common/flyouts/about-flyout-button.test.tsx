import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { queryDataTestAttr } from '../../../../test/public/query-attr';
import { AboutFlyoutButton } from './about-flyout-button';

jest.mock('../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

describe('AboutFlyoutButton', () => {
  it('opens a flyout with the content and a docs link, and closes it', () => {
    render(
      <AboutFlyoutButton
        title='About Some Module'
        testSubj='SomeModule'
        docsPath='some-module.html'
      >
        <p>What the module does.</p>
      </AboutFlyoutButton>,
    );
    const button = screen.getByRole('button', { name: 'About Some Module' });
    expect(button).toHaveAttribute('data-test-subj', 'wzAboutSomeModuleButton');

    fireEvent.click(button);

    const flyout = screen.getByRole('dialog');
    expect(flyout).toHaveAttribute('data-test-subj', 'wzAboutSomeModuleFlyout');
    expect(flyout).toHaveTextContent('What the module does.');
    const docsLink = screen.getByRole('link', { name: /documentation/ });
    expect(docsLink).toHaveAttribute(
      'href',
      'https://docs.example/some-module.html',
    );
    expect(docsLink).toHaveAttribute('target', '_blank');

    fireEvent.click(
      document.querySelector(queryDataTestAttr('euiFlyoutCloseButton'))!,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
