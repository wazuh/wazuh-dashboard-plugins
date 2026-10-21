import type { ChromeHelpExtension } from 'opensearch_dashboards/public';

/** Application fields that the Help menu link reads. */
export interface AppHelpDocs {
  title: string;
  /**
   * Full URL of the application documentation, linked from the Help menu of the header. Build it
   * with `webDocumentationLink('<path>')` so it points to the documentation of this version.
   */
  docsUrl?: string;
}

/**
 * Adds a documentation link for the application to the Help menu of the header. Applications
 * without `docsUrl` keep the default Help menu. The core clears the extension when the user
 * switches to another application, so this runs on each application mount.
 */
export const setAppHelpExtension = (
  chrome: { setHelpExtension: (helpExtension?: ChromeHelpExtension) => void },
  { title, docsUrl }: AppHelpDocs,
) => {
  if (!docsUrl) {
    return;
  }
  chrome.setHelpExtension({
    appName: title,
    links: [{ linkType: 'documentation', href: docsUrl }],
  });
};
