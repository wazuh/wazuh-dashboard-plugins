import path from 'path';
import { fileURLToPath } from 'url';
import {
  DOC_LINKS,
  DOC_LINKS_WITH_FRAGMENTS,
} from '../../plugins/main/common/doc-links';
import { DOC_CORE_LINKS } from '../../plugins/wazuh-core/common/doc-links';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Recursively extract all URL strings from an object
 * @param {any} obj - Object to traverse
 * @returns {string[]} Array of URL strings
 */
function extractUrlsFromObject(obj: any): string[] {
  const urls: string[] = [];

  function traverse(item: any) {
    if (typeof item === 'string' && item.startsWith('http')) {
      urls.push(item);
    } else if (typeof item === 'object' && item !== null) {
      Object.values(item).forEach(traverse);
    }
  }

  traverse(obj);
  return urls;
}

/**
 * Extract URL paths from the documentation directory
 * @returns {string[]} Array of URL path objects
 */
function retrieveUrlList(): string[] {
  return [
    ...extractUrlsFromObject(DOC_LINKS),
    ...extractUrlsFromObject(DOC_CORE_LINKS),
  ];
}

function retrieveUrlListWithFragments(): string[] {
  return extractUrlsFromObject(DOC_LINKS_WITH_FRAGMENTS);
}

function isValidStatusCode(status: number): boolean {
  return (
    (status >= 100 && status <= 103) || // Informational responses
    (status >= 200 && status <= 299) // Successful responses
  );
}

async function validateUrls(urls: string[]): Promise<boolean> {
  let success = true;
  for (const url of urls) {
    try {
      const response = await fetch(url);

      if (!isValidStatusCode(response.status)) {
        success = false;
        console.log(`🔴 ${url} - Status: ${response.status}`);
        continue;
      }

      const html = await response.text();

      // Extract anchor ID from URL fragment (after #)
      const urlObj = new URL(url);
      const anchorId = urlObj.hash.slice(1); // Remove the # symbol

      if (anchorId) {
        // Check if the ID exists in the HTML
        const hasId = html.includes(`id="${anchorId}"`);

        if (hasId) {
          console.log(`✅ ${url} - Page accessible and anchor ID found`);
        } else {
          success = false;
          console.log(
            `🔴 ${url} - Page accessible but anchor ID "${anchorId}" not found`,
          );
        }
      } else {
        console.log(`✅ ${url} - Page accessible (no anchor to validate)`);
      }
    } catch (error) {
      success = false;
      console.log(
        `🔴 ${url} - Error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
  return success;
}

async function main() {
  console.log('🔍 Starting URL validation process...');

  const success = await validateUrls(retrieveUrlListWithFragments());

  if (!success) {
    console.error('🔴 URL validation failed.');
    process.exit(1);
  }

  const urlList = retrieveUrlList();

  if (urlList.length > 0) {
    console.info(`Found ${urlList.length} URLs to validate.`);
  } else {
    console.warn('⚠️ No URLs found to validate.');
  }

  // Write URLs to markdown file
  const fs = await import('fs/promises');
  const outputPath = path.join(__dirname, 'extracted-urls.md');

  const markdownContent = `# Documentation URLs\n\n${urlList
    .map(url => `- ${url}`)
    .join('\n')}\n`;

  await fs.writeFile(outputPath, markdownContent, 'utf8');
  console.log(`📝 URLs written to ${outputPath}`);
}

main();
