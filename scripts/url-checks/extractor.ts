import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import {
  DOC_LINKS,
  DOC_LINKS_WITH_FRAGMENTS,
} from '../../plugins/main/common/doc-links';
import { DOC_CORE_LINKS } from '../../plugins/wazuh-core/common/doc-links';
import { APIInfo, APIInfoDefault, WazuhRelease } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILEPATH = path.join(__dirname, 'extracted-urls.md');

async function collectAllApiInfo() {
  const filepaths = [
    import('../../plugins/main/common/api-info/endpoints.json'),
    import('../../plugins/main/server/lib/api-request-list.json'),
    import('../../plugins/wazuh-core/common/api-info/endpoints.json'),
  ];
  const APIInfoList: APIInfo[] = [];
  const APIInfoArrays = (await Promise.all(
    filepaths,
  )) as unknown as APIInfoDefault[][];
  APIInfoList.push(
    ...APIInfoArrays.flat()
      .map(info => info.default)
      .flat(),
  );

  return APIInfoList;
}

async function retrieveApiDocumentationUrls() {
  const result: string[] = [];

  const APIInfoList: APIInfo[] = await collectAllApiInfo();

  for (const APIInfo of APIInfoList) {
    for (const endpoint of APIInfo.endpoints) {
      // Process each endpoint
      let url = endpoint.documentation;
      if (url) {
        result.push(url);
      }
    }
  }

  return result;
}

function updateUrlToLatestVersion(url: string, currentVersion: string): string {
  let newUrl = url;
  try {
    const matchedUrlParts = newUrl.match(/https?:\/\/[^/]+\/([^/]+)\//);
    if (matchedUrlParts) {
      const versionInUrl = matchedUrlParts[1];
      if (versionInUrl !== 'current') {
        const latestTag = currentVersion;
        const latestMajorMinor = extractMajorMinorVersion(latestTag);

        const normalize = (v: string) => {
          const parts = v.split('.');
          if (parts.length === 1) return `${v}.0.0`;
          if (parts.length === 2) return `${v}.0`;
          return v;
        };

        const urlVersionNormalized = normalize(versionInUrl);
        const latestNormalized = normalize(latestMajorMinor);

        if (compareVersions(urlVersionNormalized, latestNormalized) > 0) {
          newUrl = newUrl.replace(`/${versionInUrl}/`, `/${latestMajorMinor}/`);
        }
      }
    }
  } catch {
    // On any error, keep original url
  }
  return newUrl;
}

async function getMostRecentRelease(): Promise<WazuhRelease> {
  const response = await fetch(
    'https://api.github.com/repos/wazuh/wazuh-dashboard/releases/latest',
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch latest release: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

async function getMostRecentTagName() {
  const release = await getMostRecentRelease();
  if (!release.tag_name) {
    throw new Error('Latest release does not have a tag name');
  }
  return release.tag_name;
}

function extractVersionFromText(text: string) {
  // grep -Po "[0-9]+\.[0-9]+\.[0-9](?= Release notes)" | head -1
  const match = text.match(/(\d+\.\d+\.\d+)(?= Release notes)/);
  return match ? match[1] : '';
}

async function getMostRecentReleaseVersionFromWazuhDoc() {
  const response = await fetch(
    'https://documentation.wazuh.com/current/quickstart.html',
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Wazuh documentation: ${response.statusText}`,
    );
  }

  const text = await response.text();

  return extractVersionFromText(text);
}

async function getMostRecentReleaseVersion() {
  return (await getMostRecentReleaseVersionFromWazuhDoc()).replace(/^v/, ''); // Remove 'v' prefix if present
}

function extractMajorMinorVersion(version: string): string {
  const parts = version.split('.');
  if (parts.length < 2) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return `${parts[0]}.${parts[1]}`; // Return major.minor version
}

function compareVersions(version1: string, version2: string): number {
  const toNumbers = (v: string) => {
    const [a, b, c] = v.split('.');
    const major = Number(a);
    const minor = Number(b);
    const patch = Number(c);
    return [
      Number.isNaN(major) ? 0 : major,
      Number.isNaN(minor) ? 0 : minor,
      Number.isNaN(patch) ? 0 : patch,
    ];
  };

  const [major1, minor1, patch1] = toNumbers(version1);
  const [major2, minor2, patch2] = toNumbers(version2);

  if (major1 !== major2) return major1 - major2;
  if (minor1 !== minor2) return minor1 - minor2;
  return patch1 - patch2;
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
 * @returns {string[]} Array of URL path objects
 */
function retrieveDocumentationUrls(): string[] {
  return [
    ...extractUrlsFromObject(DOC_LINKS),
    ...extractUrlsFromObject(DOC_CORE_LINKS),
    ...extractUrlsFromObject(DOC_LINKS_WITH_FRAGMENTS),
  ];
}

async function writeFile(filePath: string, content: string = '') {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`📝 Successfully wrote to ${filePath}`);
  } catch (error) {
    console.error(`Failed to write to ${filePath}: ${error}`);
  }
}

async function appendFile(filePath: string, content: string) {
  try {
    await fs.appendFile(filePath, `${content}\n`, 'utf8');
    console.log(`📝 Successfully appended to ${filePath}`);
  } catch (error) {
    console.error(`Failed to append to ${filePath}: ${error}`);
  }
}

async function main() {
  console.log('🔍 Starting URL validation process...\n');

  const mostRecentReleaseVersion = await getMostRecentReleaseVersion();
  console.log(`Most recent release version: ${mostRecentReleaseVersion}\n`);

  await writeFile(FILEPATH);

  const documentationUrls: string[] = retrieveDocumentationUrls();
  const updatedDocumentationUrls = documentationUrls
    .map(url => updateUrlToLatestVersion(url, mostRecentReleaseVersion))
    .filter(url => !url.includes('api/reference.html'));

  await appendFile(FILEPATH, updatedDocumentationUrls.join('\n'));

  console.log(`\n✅ Successfully updated documentation URLs in ${FILEPATH}`);
}

main();
