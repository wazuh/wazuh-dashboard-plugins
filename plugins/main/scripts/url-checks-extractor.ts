import path from 'path';
import { fileURLToPath } from 'url';
import { DOC_LINKS } from '../common/doc-links';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface UrlPath {
  filename: string;
  wazuh_docs_sub_path: string;
  full_url: string;
  status_code?: number;
  is_valid?: boolean;
  error?: string;
}

/**
 * Generate summary statistics
 * @param {Array} urlPaths - Array of URL path objects
 */
function generateSummary(urlPaths: UrlPath[]) {
  const total = urlPaths.length;
  const valid = urlPaths.filter(entry => entry.is_valid).length;
  const invalid = urlPaths.filter(entry => !entry.is_valid).length;
  const errors = urlPaths.filter(entry => entry.error).length;

  // Group by status code
  const statusCodes = {} as Record<string, number>;
  urlPaths.forEach(entry => {
    const code = entry.status_code;
    if (!code) return; // Skip entries without a status code
    if (code < 100 || code >= 600) return; // Skip invalid status codes
    if (isNaN(code)) return; // Skip non-numeric status codes
    const statusCode = code.toString();
    statusCodes[statusCode] = (statusCodes[statusCode] || 0) + 1;
  });

  return {
    total_urls_checked: total,
    valid_urls: valid,
    invalid_urls: invalid,
    urls_with_errors: errors,
    status_code_breakdown: statusCodes,
    success_rate: total > 0 ? ((valid / total) * 100).toFixed(2) + '%' : '0%',
  };
}

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
}

main();
