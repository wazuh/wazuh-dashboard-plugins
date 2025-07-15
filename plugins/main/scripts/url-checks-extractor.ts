import { Project, SyntaxKind, ts } from 'ts-morph';
import path from 'path';
import { fileURLToPath } from 'url';
import { webDocumentationLink } from '../common/services/web_documentation';

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
 * Check if a URL is valid by making a HEAD request
 * @param {string} url - The URL to check
 * @returns {Promise<{status: number, valid: boolean, error?: string}>}
 */
async function checkUrlStatus(url: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const status = response.status;
    const valid = status >= 200 && status < 300;

    return { status, valid };
  } catch (error) {
    const _error = error as Error;
    return {
      status: 0,
      valid: false,
      error: _error.message,
    };
  }
}

async function findUrlPaths(tsConfigPath: string) {
  // 1. Initialize a ts-morph Project
  const project = new Project({
    tsConfigFilePath: tsConfigPath,
  });

  const urlPaths = new Set<UrlPath>();
  const urlStrings = new Set<string>(); // To track unique URLs for checking

  // 3. Walk each source file
  for (const sourceFile of project.getSourceFiles()) {
    // Ignore test files
    const filename = sourceFile.getFilePath();

    if (/\.test\.(js|ts)x?$/.test(filename)) continue;

    sourceFile.forEachDescendant(node => {
      if (node.getKind() !== SyntaxKind.CallExpression) return;

      const call = node.asKindOrThrow(SyntaxKind.CallExpression);
      const fnName = call.getExpression().getText();

      if (fnName !== 'webDocumentationLink') return;

      const [firstArg, secondArg] = call.getArguments();

      if (!isValidStringLiteral(firstArg)) return;

      const fullUrl = webDocumentationLink(
        firstArg.getText().slice(1, -1),
        isValidStringLiteral(secondArg)
          ? secondArg.getText().slice(1, -1)
          : undefined,
      );

      urlPaths.add({
        filename: filename,
        wazuh_docs_sub_path: firstArg.getText().slice(1, -1),
        full_url: fullUrl,
      });

      urlStrings.add(fullUrl);
    });
  }

  // Convert to array and check URLs
  const urlPathsArray = Array.from(urlPaths);
  console.log(`\nChecking ${urlStrings.size} unique URLs...`);

  // Check each unique URL
  const urlStatusMap = new Map();
  let checkedCount = 0;

  for (const url of urlStrings) {
    checkedCount++;
    console.log(`[${checkedCount}/${urlStrings.size}] Checking: ${url}`);
    const status = await checkUrlStatus(url);
    urlStatusMap.set(url, status);
  }

  // Add status to each URL path entry
  for (const entry of urlPathsArray) {
    const status = urlStatusMap.get(entry.full_url);
    entry.status_code = status.status;
    entry.is_valid = status.valid;
    if (status.error) {
      entry.error = status.error;
    }
  }

  return urlPathsArray;
}

function isValidStringLiteral(arg: any): arg is ts.StringLiteral {
  return arg && arg.getKind?.() === SyntaxKind.StringLiteral;
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

async function main() {
  try {
    console.log('🔍 Starting URL validation process...');
    const tsConfigPath = path.join(__dirname, '..', 'tsconfig.json');
    console.log('Using tsconfig path:', tsConfigPath);

    const urlPaths = await findUrlPaths(tsConfigPath);

    console.log('\n📊 URL Validation Results:');
    console.log('='.repeat(50));
    console.log(JSON.stringify(urlPaths, null, 2));

    console.log('\n📈 Summary:');
    console.log('='.repeat(50));
    const summary = generateSummary(urlPaths);
    console.log(JSON.stringify(summary, null, 2));

    // Log summary in a readable format
    console.log('\n📋 Quick Summary:');
    console.log(`Total URLs checked: ${summary.total_urls_checked}`);
    console.log(`✅ Valid URLs: ${summary.valid_urls}`);
    console.log(`❌ Invalid URLs: ${summary.invalid_urls}`);
    console.log(`🚨 URLs with errors: ${summary.urls_with_errors}`);
    console.log(`📊 Success rate: ${summary.success_rate}`);

    if (summary.invalid_urls > 0) {
      console.log('\n🔗 Invalid URLs found:');
      urlPaths
        .filter(entry => !entry.is_valid)
        .forEach(entry => {
          console.log(`  - ${entry.full_url} (Status: ${entry.status_code})`);
          if (entry.error) {
            console.log(`    Error: ${entry.error}`);
          }
        });

      process.exit(1); // Exit with error code if invalid URLs found
    }
  } catch (error) {
    console.error('Error extracting URL paths:', error);
    process.exit(1);
  }
}

main();
