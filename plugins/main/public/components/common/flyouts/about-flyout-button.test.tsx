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
        overview={<p>What the module does.</p>}
      />,
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

  it('renders the overview and how to start first, then the sections in order', () => {
    render(
      <AboutFlyoutButton
        title='About Some Module'
        testSubj='SomeModule'
        docsPath='some-module.html'
        overview={<p>Overview text.</p>}
        terms={[{ title: 'Term A', description: 'Meaning of A.' }]}
        extraSections={[{ title: 'Extra', content: <p>Extra text.</p> }]}
        indices={[
          { id: 'dashboard', tab: 'Dashboard', patterns: ['index-a*'] },
        ]}
        howToStart={<p>Start here.</p>}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'About Some Module' }));

    const headings = screen
      .getAllByRole('heading', { level: 3 })
      .map(heading => heading.textContent);
    expect(headings).toEqual(['Terms', 'Extra', 'Indices']);
    expect(screen.getByText('How to start')).toBeInTheDocument();
    const text = screen.getByRole('dialog').textContent!;
    ['Overview text.', 'Start here.', 'Term A', 'Extra text.', 'index-a*']
      .map(chunk => text.indexOf(chunk))
      .reduce((previous, position) => {
        expect(position).toBeGreaterThan(previous);
        return position;
      }, -1);
  });

  it('opens the first section and opens another one from the jump links', () => {
    render(
      <AboutFlyoutButton
        title='About Some Module'
        testSubj='SomeModule'
        docsPath='some-module.html'
        overview={<p>Overview text.</p>}
        terms={[{ title: 'Term A', description: 'Meaning of A.' }]}
        indices={[
          { id: 'dashboard', tab: 'Dashboard', patterns: ['index-a*'] },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'About Some Module' }));

    const getButtons = (name: string) =>
      screen.getAllByRole('button', { name });
    const isExpanded = (name: string) =>
      getButtons(name)
        .find(button => button.hasAttribute('aria-expanded'))!
        .getAttribute('aria-expanded');
    expect(isExpanded('Terms')).toBe('true');
    expect(isExpanded('Indices')).toBe('false');

    fireEvent.click(
      getButtons('Indices').find(
        button => !button.hasAttribute('aria-expanded'),
      )!,
    );

    expect(isExpanded('Indices')).toBe('true');
  });

  it('renders each index pattern of a tab', () => {
    render(
      <AboutFlyoutButton
        title='About Some Module'
        testSubj='SomeModule'
        docsPath='some-module.html'
        overview={<p>Overview text.</p>}
        indices={[
          {
            id: 'dashboard',
            tab: 'Dashboard',
            patterns: ['index-a*', 'index-b*'],
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'About Some Module' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Dashboard');
    expect(
      Array.from(
        dialog.querySelectorAll(
          '[data-test-subj="wzAboutSomeModuleIndex-dashboard"]',
        ),
      ).map(element => element.textContent),
    ).toEqual(['index-a*', 'index-b*']);
  });

  it('omits the terms and how to start sections when they are not given', () => {
    render(
      <AboutFlyoutButton
        title='About Some Module'
        testSubj='SomeModule'
        docsPath='some-module.html'
        overview={<p>Overview text.</p>}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'About Some Module' }));

    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
  });
});
