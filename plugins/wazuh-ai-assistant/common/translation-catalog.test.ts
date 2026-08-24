/*
 * Wazuh app - Translation catalog integrity gate
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/**
 * Guards `translations/*.json` against silent drift from the source strings (issue #8975).
 *
 * The English UI text lives in the `defaultMessage` of each `i18n.translate(...)` call and
 * `<FormattedMessage>` element -- that is what OSD renders at the default locale (`i18n.locale`
 * defaults to `en`, and `@osd/i18n`'s loader keys catalogs by their file basename, so no
 * `en-*.json` is ever consulted for `en`). Anything under `translations/` therefore only matters
 * for the NON-default locales it is named after, and nothing in the build compares those catalogs
 * with the source. Before this test, `es-ES.json` had accumulated 7 ids that no longer existed in
 * the source, 8 entries translated from wording the source had since changed, and 73 source ids it
 * never covered -- all invisible.
 *
 * The contract enforced here, per catalog in `REQUIRED_LOCALES`:
 *   1. every catalog id still exists in the source (no orphans);
 *   2. every source id is present in the catalog (no untranslated strings);
 *   3. the ICU argument names in a translation match the source `defaultMessage` exactly -- a
 *      renamed or dropped placeholder renders as literal text for that locale only;
 *   4. every message is valid ICU MessageFormat (an unbalanced brace or a malformed `plural`
 *      throws at render time, in that locale only);
 *   5. the raw JSON has no duplicate ids (`JSON.parse` keeps the last one silently).
 *
 * `REQUIRED_LOCALES` is asserted against the directory listing rather than derived from it: a
 * catalog that is deleted or renamed must fail here, not quietly reduce the suite to zero checks.
 *
 * Extraction is a TypeScript AST walk rather than a regex so that concatenated messages
 * (`'a ' + 'b'`), apostrophes and JSX text cannot desync it, and so that a NON-static id or
 * `defaultMessage` (a template with `${}`, a variable) fails loudly instead of being skipped:
 * such a string can never be extracted for translation and must not be written in the first place.
 * For the same reason the walk also reports i18n usage it does NOT understand -- a `.translate(`
 * or `.formatMessage(` call on anything other than `i18n`, a `Formatted*Message` element under
 * another name, or an aliased `@osd/i18n` import. None exist today; the point is that the day one
 * appears, this gate says so instead of silently extracting nothing from it.
 *
 * ICU validity uses `intl-messageformat-parser`, the parser `@osd/i18n` itself formats messages
 * with. It is not declared in this plugin's `package.json` for the same reason `@osd/i18n`,
 * `react` and `@elastic/eui` are not: the plugin takes everything from the host `wazuh-dashboard`
 * bundle (see the "zero npm runtime dependencies" note in README.md). No dependency is added.
 *
 * If a string is deliberately left untranslated for a locale, add its id to that catalog with the
 * English text rather than relaxing rule 2 -- the entry then documents the decision. Each failure
 * message repeats that instruction.
 *
 * Placement: `common/` because the catalogs cover `public/`, `server/` and `common/` alike and
 * belong to none of them. The usual "no Node-only APIs in common/" rule is about code that gets
 * bundled for the browser; this is a test file, excluded from every bundle and from
 * `collectCoverageFrom`, and jest runs the `common/` project under `testEnvironment: 'node'`, so
 * `fs`/`typescript` here never reach a browser build.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import icuParser from 'intl-messageformat-parser';

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['common', 'public', 'server'];
const TRANSLATIONS_DIR = path.join(PLUGIN_ROOT, 'translations');
const ID_PREFIX = 'wazuhAiAssistant.';

/**
 * The locales this plugin ships a catalog for. English is absent on purpose: it is the source
 * language, carried in each `defaultMessage`. Adding a locale means adding it here.
 */
const REQUIRED_LOCALES = ['es-ES'];

const TRANSLATE_HINT =
  'Translate each id above, or add it to the catalog with the English text to document a ' +
  'deliberate exception.';
const ORPHAN_HINT =
  'Remove each id above from the catalog: the source string it translated is gone.';
const PLACEHOLDER_HINT =
  'A translation must use the same ICU argument names as the source defaultMessage; an unknown ' +
  'name renders as literal text for this locale only.';

interface SourceMessage {
  defaultMessage: string;
  location: string;
}

interface SourceScan {
  messages: Map<string, SourceMessage>;
  /** i18n usage the walk cannot extract from, and so cannot keep the catalogs in step with. */
  unrecognized: string[];
}

/** Fails with every problem listed at once, plus what to do about them. */
function assertNoProblems(problems: string[], hint: string): void {
  if (problems.length > 0) {
    throw new Error(
      `${problems.length} problem(s):\n  ${problems.join('\n  ')}\n\n${hint}`,
    );
  }
  expect(problems).toEqual([]);
}

function scriptKindFor(file: string): ts.ScriptKind {
  if (file.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }
  if (file.endsWith('.jsx')) {
    return ts.ScriptKind.JSX;
  }
  if (file.endsWith('.js')) {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

/**
 * Every non-test source file. `.js`/`.jsx` are included because `yarn lint` allows them in these
 * directories: matching only TypeScript would skip such a file's strings without a word.
 */
function listSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'target') {
        continue;
      }
      listSourceFiles(full, out);
    } else if (
      /\.(js|jsx|ts|tsx)$/.test(entry.name) &&
      !/\.test\.(js|jsx|ts|tsx)$/.test(entry.name)
    ) {
      out.push(full);
    }
  }
  return out;
}

/** Resolves a string literal, a parenthesized one, or a `+` chain of them; throws otherwise. */
function staticString(
  node: ts.Node | undefined,
  sourceFile: ts.SourceFile,
): string {
  if (node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      return node.text;
    }
    if (ts.isParenthesizedExpression(node)) {
      return staticString(node.expression, sourceFile);
    }
    if (ts.isJsxExpression(node)) {
      return staticString(node.expression, sourceFile);
    }
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.PlusToken
    ) {
      return (
        staticString(node.left, sourceFile) +
        staticString(node.right, sourceFile)
      );
    }
  }
  const where = node ? formatLocation(node, sourceFile) : sourceFile.fileName;
  throw new Error(
    `i18n strings must be static string literals so they can be extracted: ${where}`,
  );
}

function formatLocation(node: ts.Node, sourceFile: ts.SourceFile): string {
  const { line } = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );
  const relative = path
    .relative(PLUGIN_ROOT, sourceFile.fileName)
    .replace(/\\/g, '/');
  return `${relative}:${line + 1}`;
}

function isFormattedMessageTag(tag: string): boolean {
  return /(^|\.)Formatted[A-Za-z]*Message$/.test(tag);
}

function readJsxMessage(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  sourceFile: ts.SourceFile,
): { id: string; defaultMessage: string } {
  let id: string | undefined;
  let defaultMessage: string | undefined;
  for (const attribute of node.attributes.properties) {
    if (!ts.isJsxAttribute(attribute)) {
      continue;
    }
    const name = attribute.name.getText(sourceFile);
    if (name === 'id') {
      id = staticString(attribute.initializer, sourceFile);
    } else if (name === 'defaultMessage') {
      defaultMessage = staticString(attribute.initializer, sourceFile);
    }
  }
  if (id === undefined || defaultMessage === undefined) {
    throw new Error(
      `<FormattedMessage> needs a static id and defaultMessage: ${formatLocation(
        node,
        sourceFile,
      )}`,
    );
  }
  return { id, defaultMessage };
}

function scanSource(): SourceScan {
  const messages = new Map<string, SourceMessage>();
  const unrecognized: string[] = [];
  const files: string[] = [];
  for (const dir of SOURCE_DIRS) {
    listSourceFiles(path.join(PLUGIN_ROOT, dir), files);
  }

  for (const file of files) {
    const sourceFile = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      scriptKindFor(file),
    );

    const record = (
      id: string,
      defaultMessage: string,
      location: string,
    ): void => {
      const previous = messages.get(id);
      if (previous && previous.defaultMessage !== defaultMessage) {
        throw new Error(
          `i18n id ${id} is used with two different defaultMessage values ` +
            `(${previous.location}, ${location})`,
        );
      }
      messages.set(id, { defaultMessage, location });
    };

    const visitCall = (node: ts.CallExpression): void => {
      if (!ts.isPropertyAccessExpression(node.expression)) {
        return;
      }
      const method = node.expression.name.text;
      if (method !== 'translate' && method !== 'formatMessage') {
        return;
      }
      const receiver = node.expression.expression.getText(sourceFile);
      if (receiver !== 'i18n' || method !== 'translate') {
        unrecognized.push(
          `${receiver}.${method}(...) at ${formatLocation(node, sourceFile)} ` +
            '-- only i18n.translate() is extracted',
        );
        return;
      }
      const id = staticString(node.arguments[0], sourceFile);
      const options = node.arguments[1];
      let defaultMessage: string | undefined;
      if (options && ts.isObjectLiteralExpression(options)) {
        for (const property of options.properties) {
          if (
            ts.isPropertyAssignment(property) &&
            property.name.getText(sourceFile) === 'defaultMessage'
          ) {
            defaultMessage = staticString(property.initializer, sourceFile);
          }
        }
      }
      if (defaultMessage === undefined) {
        throw new Error(
          `i18n.translate('${id}') has no static defaultMessage: ` +
            formatLocation(node, sourceFile),
        );
      }
      record(id, defaultMessage, formatLocation(node, sourceFile));
    };

    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) {
        visitCall(node);
      }

      // An aliased binding hides the names this walk keys on, so flag it rather than miss it.
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        node.moduleSpecifier.text.startsWith('@osd/i18n')
      ) {
        const bindings = node.importClause?.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) {
          for (const element of bindings.elements) {
            if (element.propertyName) {
              unrecognized.push(
                `${element.propertyName.text} imported as ` +
                  `${element.name.text} at ${formatLocation(
                    node,
                    sourceFile,
                  )} ` +
                  '-- aliased @osd/i18n bindings are not extracted',
              );
            }
          }
        }
      }

      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(sourceFile);
        if (tag === 'FormattedMessage') {
          const { id, defaultMessage } = readJsxMessage(node, sourceFile);
          record(id, defaultMessage, formatLocation(node, sourceFile));
        } else if (isFormattedMessageTag(tag)) {
          unrecognized.push(
            `<${tag}> at ${formatLocation(node, sourceFile)} ` +
              '-- only <FormattedMessage> is extracted',
          );
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  return { messages, unrecognized };
}

/**
 * Lazily scanned and memoized, including a thrown error. Module-scope scanning would turn one
 * non-static string into a suite that fails to load, hiding the names of every check below it.
 */
let scanned: SourceScan | undefined;
let scanError: unknown;

function sourceScan(): SourceScan {
  if (scanError !== undefined) {
    throw scanError;
  }
  if (!scanned) {
    try {
      scanned = scanSource();
    } catch (error) {
      scanError = error;
      throw error;
    }
  }
  return scanned;
}

function sourceMessages(): Map<string, SourceMessage> {
  return sourceScan().messages;
}

/** Top-level ICU argument names of a message: `{name}`, `{count, plural, ...}`. */
function icuPlaceholders(message: string): string[] {
  const found = new Set<string>();
  const pattern = /\{\s*([A-Za-z0-9_$]+)\s*[,}]/g;
  let match = pattern.exec(message);
  while (match !== null) {
    found.add(match[1]);
    match = pattern.exec(message);
  }
  const names: string[] = [];
  found.forEach(name => names.push(name));
  return names.sort();
}

/** The ICU parse error for a message, or undefined when it is valid. */
function icuParseError(message: string): string | undefined {
  try {
    icuParser.parse(message);
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/**
 * Catalog ids straight from the raw text, in file order: `JSON.parse` keeps only the last of a
 * duplicated key. Not anchored to line starts, so several ids on one line are still all seen.
 * A JSON value can never be followed by `:`, so matching `"..."\s*:` only ever finds keys.
 */
function rawCatalogIds(text: string): string[] {
  const ids: string[] = [];
  const pattern = /"((?:[^"\\]|\\.)*)"\s*:/g;
  let match = pattern.exec(text);
  while (match !== null) {
    if (match[1].startsWith(ID_PREFIX)) {
      ids.push(match[1]);
    }
    match = pattern.exec(text);
  }
  return ids;
}

describe('i18n source strings', () => {
  it('extracts every message from the plugin source', () => {
    // A floor, not an exact count: it only has to prove the walk found the catalogs' worth of
    // strings rather than silently matching nothing (which would make every check below vacuous).
    expect(sourceMessages().size).toBeGreaterThan(100);
  });

  it('has no i18n usage the extractor does not understand', () => {
    assertNoProblems(
      sourceScan().unrecognized,
      'Teach this test to extract the usage above (and keep the catalogs in step with it), or ' +
        'rewrite the call site as i18n.translate() / <FormattedMessage>.',
    );
  });

  it('namespaces every id under the plugin prefix', () => {
    const wrong: string[] = [];
    sourceMessages().forEach((message, id) => {
      if (!id.startsWith(ID_PREFIX)) {
        wrong.push(`${id} (${message.location})`);
      }
    });
    assertNoProblems(
      wrong,
      `Every id must start with "${ID_PREFIX}" to match the prefix in .i18nrc.json.`,
    );
  });

  it('every source defaultMessage is valid ICU', () => {
    const invalid: string[] = [];
    sourceMessages().forEach((message, id) => {
      const error = icuParseError(message.defaultMessage);
      if (error) {
        invalid.push(`${id} (${message.location}): ${error}`);
      }
    });
    assertNoProblems(
      invalid,
      'Fix the ICU syntax of each defaultMessage above.',
    );
  });

  it('ships exactly the catalogs listed in REQUIRED_LOCALES', () => {
    // English is the source language: `defaultMessage` is what renders at the default locale, and
    // `@osd/i18n` keys catalogs by file basename, so an `en-US.json` would be dead weight that
    // drifts unnoticed -- which is exactly what issue #8975 found. A catalog that disappears has
    // to fail here too, or the per-catalog checks below would just stop running.
    const present = fs
      .readdirSync(TRANSLATIONS_DIR)
      .filter(name => name.endsWith('.json'))
      .sort();
    expect(present).toEqual(REQUIRED_LOCALES.map(locale => `${locale}.json`));
  });
});

describe.each(REQUIRED_LOCALES)('translation catalog %s', locale => {
  const catalogPath = path.join(TRANSLATIONS_DIR, `${locale}.json`);

  function readCatalog(): { text: string; messages: Record<string, string> } {
    if (!fs.existsSync(catalogPath)) {
      throw new Error(
        `${locale}.json is missing. It is required by REQUIRED_LOCALES; restore it, or remove ` +
          'the locale from that list if the plugin genuinely stopped shipping it.',
      );
    }
    const text = fs.readFileSync(catalogPath, 'utf8');
    const parsed = JSON.parse(text) as { messages?: Record<string, string> };
    if (!parsed.messages) {
      throw new Error(`${locale}.json has no "messages" object.`);
    }
    return { text, messages: parsed.messages };
  }

  it('has no duplicate ids', () => {
    const { text } = readCatalog();
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const id of rawCatalogIds(text)) {
      if (seen.has(id)) {
        duplicates.push(id);
      }
      seen.add(id);
    }
    assertNoProblems(
      duplicates,
      'JSON.parse keeps only the last of a duplicated key, so one of each pair is dead.',
    );
  });

  it('has no ids that no longer exist in the source', () => {
    const { messages } = readCatalog();
    const source = sourceMessages();
    const orphans = Object.keys(messages).filter(id => !source.has(id));
    assertNoProblems(orphans, ORPHAN_HINT);
  });

  it('covers every id used in the source', () => {
    const { messages } = readCatalog();
    const missing: string[] = [];
    sourceMessages().forEach((message, id) => {
      if (!(id in messages)) {
        missing.push(
          `${id} = ${JSON.stringify(message.defaultMessage)} (${
            message.location
          })`,
        );
      }
    });
    assertNoProblems(missing, TRANSLATE_HINT);
  });

  it('keeps the ICU placeholders of each source string', () => {
    const { messages } = readCatalog();
    const source = sourceMessages();
    const mismatches: string[] = [];
    Object.keys(messages).forEach(id => {
      const entry = source.get(id);
      if (!entry) {
        return;
      }
      const expected = icuPlaceholders(entry.defaultMessage);
      const actual = icuPlaceholders(messages[id]);
      if (expected.join(',') !== actual.join(',')) {
        mismatches.push(
          `${id}: source has {${expected.join(', ')}}, ` +
            `translation has {${actual.join(', ')}}`,
        );
      }
    });
    assertNoProblems(mismatches, PLACEHOLDER_HINT);
  });

  it('has valid ICU in every translation', () => {
    const { messages } = readCatalog();
    const invalid: string[] = [];
    Object.keys(messages).forEach(id => {
      const error = icuParseError(messages[id]);
      if (error) {
        invalid.push(`${id}: ${error}`);
      }
    });
    assertNoProblems(
      invalid,
      'An invalid ICU message throws when rendered, in this locale only.',
    );
  });
});
