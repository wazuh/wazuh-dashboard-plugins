import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
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
    ...extractUrlsFromObject(DOC_LINKS_WITH_FRAGMENTS),
  ];
}

async function main() {
  console.log('🔍 Starting URL validation process...');

  const urlList: string[] = retrieveUrlList();

  if (urlList.length > 0) {
    console.info(`Found ${urlList.length} URLs to validate.`);
  } else {
    console.warn('⚠️ No URLs found to validate.');
  }

  // Write URLs to markdown file
  const outputPath = path.join(__dirname, 'extracted-urls.md');

  const markdownContent = `# Documentation URLs\n\n${urlList
    .map(url => `- ${url}`)
    .join('\n')}\n`;

  await fs.writeFile(outputPath, markdownContent, 'utf8');
  console.log(`📝 URLs written to ${outputPath}`);
}

main();
