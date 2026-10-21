import { setAppHelpExtension } from './help-extension';

describe('setAppHelpExtension', () => {
  it('links the app documentation in the Help menu when the app defines it', () => {
    const chrome = { setHelpExtension: jest.fn() };

    setAppHelpExtension(chrome, {
      title: 'File Integrity Monitoring',
      docsUrl: 'https://documentation.wazuh.com/5.0/fim.html',
    });

    expect(chrome.setHelpExtension).toHaveBeenCalledWith({
      appName: 'File Integrity Monitoring',
      links: [
        {
          linkType: 'documentation',
          href: 'https://documentation.wazuh.com/5.0/fim.html',
        },
      ],
    });
  });

  it('keeps the default Help menu when the app has no documentation link', () => {
    const chrome = { setHelpExtension: jest.fn() };

    setAppHelpExtension(chrome, { title: 'Overview' });

    expect(chrome.setHelpExtension).not.toHaveBeenCalled();
  });
});
