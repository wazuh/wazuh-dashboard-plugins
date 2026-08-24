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
 * The contract enforced here, per catalog:
 *   1. every catalog id still exists in the source (no orphans);
 *   2. every source id is present in the catalog (no untranslated strings);
 *   3. the ICU argument names in a translation match the source `defaultMessage` exactly -- a
 *      renamed or dropped placeholder renders as literal text for that locale only;
 *   4. the raw JSON has no duplicate ids (`JSON.parse` keeps the last one silently).
 *
 * Extraction is a TypeScript AST walk rather than a regex so that concatenated messages
 * (`'a ' + 'b'`), apostrophes and JSX text cannot desync it, and so that a NON-static id or
 * `defaultMessage` (a template with `${}`, a variable) fails loudly instead of being skipped:
 * such a string can never be extracted for translation and must not be written in the first place.
 *
 * If a string is deliberately left untranslated for a locale, add its id to that catalog with the
 * English text rather than relaxing rule 2 -- the entry then documents the decision.
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

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['common', 'public', 'server'];
const TRANSLATIONS_DIR = path.join(PLUGIN_ROOT, 'translations');
const ID_PREFIX = 'wazuhAiAssistant.';

interface SourceMessage {
  defaultMessage: string;
  location: string;
}

function listSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'target') {
        continue;
      }
      listSourceFiles(full, out);
    } else if (
      /\.tsx?$/.test(entry.name) &&
      !/\.test\.tsx?$/.test(entry.name)
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

function isI18nTranslateCall(
  node: ts.Node,
  sourceFile: ts.SourceFile,
): boolean {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === 'translate' &&
    node.expression.expression.getText(sourceFile) === 'i18n'
  );
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

function collectSourceMessages(): Map<string, SourceMessage> {
  const messages = new Map<string, SourceMessage>();
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
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
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

    const visit = (node: ts.Node): void => {
      if (isI18nTranslateCall(node, sourceFile)) {
        const call = node as ts.CallExpression;
        const id = staticString(call.arguments[0], sourceFile);
        const options = call.arguments[1];
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
              formatLocation(call, sourceFile),
          );
        }
        record(id, defaultMessage, formatLocation(call, sourceFile));
      }

      if (
        (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
        node.tagName.getText(sourceFile) === 'FormattedMessage'
      ) {
        const { id, defaultMessage } = readJsxMessage(node, sourceFile);
        record(id, defaultMessage, formatLocation(node, sourceFile));
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  return messages;
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

/** Ids in file order, straight from the text: `JSON.parse` would hide duplicates. */
function rawCatalogIds(text: string): string[] {
  const ids: string[] = [];
  const pattern = /^\s*"([^"]+)"\s*:/gm;
  let match = pattern.exec(text);
  while (match !== null) {
    if (match[1].startsWith(ID_PREFIX)) {
      ids.push(match[1]);
    }
    match = pattern.exec(text);
  }
  return ids;
}

const sourceMessages = collectSourceMessages();
const catalogFiles = fs
  .readdirSync(TRANSLATIONS_DIR)
  .filter(name => name.endsWith('.json'))
  .sort();

describe('i18n source strings', () => {
  it('extracts every message from the plugin source', () => {
    // A floor, not an exact count: it only has to prove the walk found the catalogs' worth of
    // strings rather than silently matching nothing (which would make every check below vacuous).
    expect(sourceMessages.size).toBeGreaterThan(100);
  });

  it('namespaces every id under the plugin prefix', () => {
    const wrong: string[] = [];
    sourceMessages.forEach((message, id) => {
      if (!id.startsWith(ID_PREFIX)) {
        wrong.push(`${id} (${message.location})`);
      }
    });
    expect(wrong).toEqual([]);
  });

  it('ships a catalog only for non-default locales', () => {
    // English is the source language: `defaultMessage` is what renders at the default locale, and
    // `@osd/i18n` keys catalogs by file basename, so an `en-US.json` would be dead weight that
    // drifts unnoticed -- which is exactly what issue #8975 found.
    expect(catalogFiles.filter(name => /^en\b/i.test(name))).toEqual([]);
  });
});

describe.each(catalogFiles)('translation catalog %s', catalogFile => {
  const text = fs.readFileSync(
    path.join(TRANSLATIONS_DIR, catalogFile),
    'utf8',
  );
  const catalog = JSON.parse(text) as { messages: Record<string, string> };
  const messages = catalog.messages;

  it('has no duplicate ids', () => {
    const ids = rawCatalogIds(text);
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) {
        duplicates.push(id);
      }
      seen.add(id);
    }
    expect(duplicates).toEqual([]);
  });

  it('has no ids that no longer exist in the source', () => {
    const orphans = Object.keys(messages).filter(id => !sourceMessages.has(id));
    expect(orphans).toEqual([]);
  });

  it('covers every id used in the source', () => {
    const missing: string[] = [];
    sourceMessages.forEach((message, id) => {
      if (!(id in messages)) {
        missing.push(`${id} (${message.location})`);
      }
    });
    expect(missing).toEqual([]);
  });

  it('keeps the ICU placeholders of each source string', () => {
    const mismatches: string[] = [];
    Object.keys(messages).forEach(id => {
      const source = sourceMessages.get(id);
      if (!source) {
        return;
      }
      const expected = icuPlaceholders(source.defaultMessage);
      const actual = icuPlaceholders(messages[id]);
      if (expected.join(',') !== actual.join(',')) {
        mismatches.push(
          `${id}: source has {${expected.join(', ')}}, ` +
            `translation has {${actual.join(', ')}}`,
        );
      }
    });
    expect(mismatches).toEqual([]);
  });
});
