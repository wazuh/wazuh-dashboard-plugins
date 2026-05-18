#!/usr/bin/env node
/**
 * Ensures every saved object in .ndjson files has attributes.description
 * starting with "Provided by Wazuh. ".
 *
 * Usage:
 *   node scripts/check-ndjson-descriptions.mjs            # check only
 *   node scripts/check-ndjson-descriptions.mjs --fix      # fix in place
 *   node scripts/check-ndjson-descriptions.mjs --files path/a.ndjson path/b.ndjson
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../..');
const PREFIX = 'Provided by Wazuh. ';

const args = process.argv.slice(2);
const fix = args.includes('--fix');
const filesIdx = args.indexOf('--files');
const specificFiles =
  filesIdx !== -1 ? args.slice(filesIdx + 1).filter(a => a !== '--fix') : null;

function findNdjsonFiles() {
  if (specificFiles && specificFiles.length > 0) {
    return specificFiles.map(f => resolve(PROJECT_ROOT, f));
  }
  const output = execSync(
    'find . -name "*.ndjson" -not -path "*/node_modules/*"',
    { cwd: PROJECT_ROOT, encoding: 'utf8' },
  );
  return output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(f => resolve(PROJECT_ROOT, f));
}

let totalViolations = 0;
let affectedFiles = 0;

const files = findNdjsonFiles();

for (const filePath of files) {
  const relPath = relative(PROJECT_ROOT, filePath);
  const raw = readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');
  let fileViolations = 0;
  const outLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      outLines.push(line);
      continue;
    }

    let obj;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      outLines.push(line);
      continue;
    }

    const desc = obj?.attributes?.description;
    const isMissing = typeof desc !== 'string';
    const needsFix = isMissing || !desc.startsWith(PREFIX);

    if (needsFix) {
      fileViolations++;
      totalViolations++;

      if (!fix) {
        const id = obj.id ?? '(no id)';
        const type = obj.type ?? '(unknown)';
        const preview = isMissing
          ? '(missing)'
          : desc === ''
          ? '(empty)'
          : JSON.stringify(desc);
        console.log(`  ${relPath}:${i + 1}  [${type}] ${id}  →  ${preview}`);
        outLines.push(line);
      } else {
        if (!obj.attributes) obj.attributes = {};
        obj.attributes.description = PREFIX + (isMissing ? '' : desc);
        outLines.push(JSON.stringify(obj));
      }
    } else {
      outLines.push(line);
    }
  }

  if (fix && fileViolations > 0) {
    writeFileSync(filePath, outLines.join('\n'), 'utf8');
    affectedFiles++;
    console.log(`  Fixed ${fileViolations} object(s) in ${relPath}`);
  } else if (!fix && fileViolations > 0) {
    affectedFiles++;
  }
}

if (fix) {
  if (totalViolations === 0) {
    console.log(
      'Nothing to fix. All descriptions already have the required prefix.',
    );
  } else {
    console.log(
      `\nFixed ${totalViolations} object(s) across ${affectedFiles} file(s).`,
    );
  }
} else {
  if (totalViolations > 0) {
    console.error(
      `\n${totalViolations} violation(s) in ${affectedFiles} file(s). Run with --fix to correct them.`,
    );
    process.exit(1);
  } else {
    console.log(
      'All descriptions start with the required prefix. No violations found.',
    );
  }
}
