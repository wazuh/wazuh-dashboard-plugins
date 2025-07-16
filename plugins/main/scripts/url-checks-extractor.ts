import path from 'path';
import { fileURLToPath } from 'url';
import { DOC_LINKS } from '../common/doc-links';

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
 * @returns {Promise<Array>} Array of URL path objects
 */
async function retrieveUrlList(): Promise<string[]> {
  return extractUrlsFromObject(DOC_LINKS);
}

async function main() {
  console.log('🔍 Starting URL validation process...');

  const urlList = await retrieveUrlList();

  console.log(
    urlList.length
      ? `Found ${urlList.length} URLs to validate.`
      : 'No URLs found to validate.',
  );

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
