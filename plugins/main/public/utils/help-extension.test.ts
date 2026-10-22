import { setAppHelpExtension } from './help-extension';

describe('setAppHelpExtension', () => {
  it('links the app documentation in the Help menu when the app defines it', () => {
    const chrome = { setHelpExtension: jest.fn() };

    setAppHelpExtension(chrome, { title: 'FIM', docsUrl: 'https://docs/fim' });

    expect(chrome.setHelpExtension).toHaveBeenCalledWith({
      appName: 'FIM',
      links: [{ linkType: 'documentation', href: 'https://docs/fim' }],
    });
  });

  it('keeps the default Help menu when the app has no documentation link', () => {
    const chrome = { setHelpExtension: jest.fn() };

    setAppHelpExtension(chrome, { title: 'Overview' });

    expect(chrome.setHelpExtension).not.toHaveBeenCalled();
  });
});
