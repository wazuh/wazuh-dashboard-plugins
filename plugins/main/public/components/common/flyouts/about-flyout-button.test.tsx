import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { AboutFlyoutButton } from './about-flyout-button';

jest.mock('../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

const renderButton = () =>
  render(
    <AboutFlyoutButton
      title='About Some Module'
      testSubj='SomeModule'
      docsPath='user-manual/capabilities/some-module/index.html'
    >
      <p>What the module does.</p>
    </AboutFlyoutButton>,
  );

const openFlyout = () => {
  renderButton();
  fireEvent.click(screen.getByRole('button', { name: 'About Some Module' }));
  return screen.getByRole('dialog');
};

describe('AboutFlyoutButton', () => {
  it('renders the button with the flyout closed', () => {
    renderButton();

    expect(
      screen.getByRole('button', { name: 'About Some Module' }),
    ).toHaveAttribute('data-test-subj', 'wzAboutSomeModuleButton');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a flyout titled like the button with the given content', () => {
    const flyout = openFlyout();

    expect(flyout).toHaveAttribute('data-test-subj', 'wzAboutSomeModuleFlyout');
    expect(
      screen.getByRole('heading', { level: 2, name: 'About Some Module' }),
    ).toHaveAttribute('id', 'wzAboutSomeModuleTitle');
    expect(flyout).toHaveTextContent('What the module does.');
  });

  it('links to the module documentation in a new tab', () => {
    const flyout = openFlyout();

    expect(flyout).toHaveTextContent('Learn more in the documentation');
    const docsLink = screen.getByRole('link', { name: /documentation/ });
    expect(docsLink).toHaveAttribute(
      'href',
      'https://docs.example/user-manual/capabilities/some-module/index.html',
    );
    expect(docsLink).toHaveAttribute('target', '_blank');
    expect(docsLink.getAttribute('rel')).toEqual(
      expect.stringMatching(/noopener.*noreferrer|noreferrer.*noopener/),
    );
  });

  it('closes the flyout', () => {
    openFlyout();

    fireEvent.click(
      document.querySelector('[data-test-subj="euiFlyoutCloseButton"]')!,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
