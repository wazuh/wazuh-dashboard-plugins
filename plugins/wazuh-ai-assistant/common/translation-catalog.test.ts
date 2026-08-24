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
 *   4. every message actually renders through `@osd/i18n` under its own locale, so an unbalanced
 *      brace or a `plural`/`select` missing its `other` branch fails here rather than at runtime,
 *      in that locale only;
 *   5. the raw JSON has no duplicate ids (`JSON.parse` keeps the last one silently).
 *
 * `REQUIRED_LOCALES` is asserted against BOTH the directory listing and the `translations` array of
 * `.i18nrc.json`, rather than derived from either. A catalog that is deleted or renamed must fail
 * here instead of quietly reducing the suite to zero checks -- and so must a catalog dropped from
 * `.i18nrc.json` while the file stays on disk, which is the failure mode with no symptom at all:
 * every check below would still pass while the platform silently stopped loading that locale (see
 * `getTranslationPaths` in `src/legacy/server/i18n`, which reads only that array).
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
 * Message validity goes through `@osd/i18n`'s own `init()` + `translate()` -- the same public API
 * the plugin already calls in `public/` and `common/nav-categories.ts` -- rather than reaching for
 * an ICU parser package directly. Formatting, not just parsing, is what production does, and it is
 * strictly stronger: a `plural` missing its `other` branch parses cleanly and only blows up when a
 * value selects the branch that is not there. Each message is therefore rendered once per entry in
 * `PLURAL_PROBES`.
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
import { i18n } from '@osd/i18n';

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['common', 'public', 'server'];
const TRANSLATIONS_DIR = path.join(PLUGIN_ROOT, 'translations');
const I18NRC_PATH = path.join(PLUGIN_ROOT, '.i18nrc.json');
const ID_PREFIX = 'wazuhAiAssistant.';

/**
 * The locales this plugin ships a catalog for. English is absent on purpose: it is the source
 * language, carried in each `defaultMessage`. Adding a locale means adding it here.
 */
const REQUIRED_LOCALES = ['es-ES'];

/**
 * Values fed to every ICU argument in turn, chosen to drive a `plural` down both its `one` and its
 * `other` branch: a message whose `other` is missing renders fine for 1 and throws for 2.
 */
const PLURAL_PROBES = [1, 2];

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

/**
 * Top-level ICU argument names of a message: `{name}`, `{count, plural, ...}`.
 *
 * Only braces opened at nesting depth 0 name an argument. The bodies of a `plural`/`select`
 * branch are LITERAL TEXT, so a single-word branch such as the `one {conversation}` in
 * "the selected {count, plural, one {conversation} other {conversations}}" must not be read as
 * two extra arguments named `conversation`/`conversations` -- a depth-blind scan did exactly that,
 * and since a translation renders those words in its OWN language it could never match, which
 * demanded English words inside the Spanish string to pass. Nested arguments are still compared
 * through their top-level parent, whose name is what a caller actually has to supply.
 */
function icuPlaceholders(message: string): string[] {
  const found = new Set<string>();
  let depth = 0;
  for (let index = 0; index < message.length; index += 1) {
    const char = message[index];
    if (char === '}') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (char !== '{') {
      continue;
    }
    if (depth === 0) {
      const name = /^\{\s*([A-Za-z0-9_$]+)\s*[,}]/.exec(message.slice(index));
      if (name) {
        found.add(name[1]);
      }
    }
    depth += 1;
  }
  const names: string[] = [];
  found.forEach(name => names.push(name));
  return names.sort();
}

/**
 * Renders every `[id, message]` through `@osd/i18n` under `locale`, once per `PLURAL_PROBES` value,
 * and returns one line per message that failed. `loaded` is what `i18n.init` registers: pass the
 * catalog to exercise the translations, or `{}` so `translate` falls back to each `defaultMessage`.
 */
function renderFailures(
  locale: string,
  loaded: Record<string, string>,
  entries: Array<[string, string]>,
): string[] {
  i18n.init({ locale, messages: loaded });
  const problems: string[] = [];
  for (const [id, message] of entries) {
    for (const probe of PLURAL_PROBES) {
      const values: Record<string, number> = {};
      for (const name of icuPlaceholders(message)) {
        values[name] = probe;
      }
      try {
        i18n.translate(id, { defaultMessage: message, values });
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        problems.push(
          `${id} (every argument = ${probe}): ${detail.replace(
            /\s*\n\s*/g,
            ' ',
          )}`,
        );
        break;
      }
    }
  }
  return problems;
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

describe('icuPlaceholders', () => {
  it('names only the arguments a caller has to supply', () => {
    expect(icuPlaceholders('Ask about {name}')).toEqual(['name']);
    expect(icuPlaceholders('Request failed (HTTP {status}): {detail}')).toEqual(
      ['detail', 'status'],
    );
    expect(icuPlaceholders('Nothing to interpolate')).toEqual([]);
  });

  it('ignores plural and select branch bodies', () => {
    // Regression: a depth-blind scan read the single-word branch bodies as arguments, so this
    // English message yielded {conversation, conversations, count} and its translation could
    // never match -- the branch bodies are literal text, in each locale's own words.
    const english =
      'Delete the selected {count, plural, one {conversation} other {conversations}}?';
    const spanish =
      'Eliminar {count, plural, one {la conversacion} other {las conversaciones}} seleccionada?';
    expect(icuPlaceholders(english)).toEqual(['count']);
    expect(icuPlaceholders(spanish)).toEqual(['count']);
    expect(icuPlaceholders(english)).toEqual(icuPlaceholders(spanish));

    expect(
      icuPlaceholders('{kind, select, chat {chat} other {other}}'),
    ).toEqual(['kind']);
    // The `#` form was never affected, since `# more field` cannot look like an argument name.
    expect(
      icuPlaceholders(
        ' (+{count, plural, one {# more field} other {# more fields}} per row.)',
      ),
    ).toEqual(['count']);
  });

  it('still sees arguments that follow a nested block', () => {
    expect(
      icuPlaceholders(
        '{count, plural, one {one thing} other {# things}} for {name}',
      ),
    ).toEqual(['count', 'name']);
  });

  it('does not derail on unbalanced braces', () => {
    // Malformed messages are the render check's job; this must not throw or mis-scan the rest.
    expect(icuPlaceholders('Algo {salio mal')).toEqual([]);
    expect(icuPlaceholders('Stray } then {name}')).toEqual(['name']);
  });
});

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

  it('renders every source defaultMessage', () => {
    const entries: Array<[string, string]> = [];
    const locations = new Map<string, string>();
    sourceMessages().forEach((message, id) => {
      entries.push([id, message.defaultMessage]);
      locations.set(id, message.location);
    });
    // Empty `messages`, so `translate` falls back to each `defaultMessage` -- exactly what the
    // dashboard renders at the default locale.
    const problems = renderFailures('en', {}, entries).map(problem => {
      const id = problem.slice(0, Math.max(problem.indexOf(' '), 0));
      return `${problem} [${locations.get(id) ?? 'unknown location'}]`;
    });
    assertNoProblems(
      problems,
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

  it('registers exactly those catalogs in .i18nrc.json', () => {
    // The platform loads a catalog only if it is listed here: `getTranslationPaths` in
    // src/legacy/server/i18n reads this array and nothing else. Dropping an entry while leaving the
    // file on disk silently stops that locale from loading, and every other check in this file
    // would still pass -- so it has to be asserted, not inferred from the directory listing.
    const i18nrc = JSON.parse(fs.readFileSync(I18NRC_PATH, 'utf8')) as {
      translations?: string[];
    };
    expect(i18nrc.translations).toEqual(
      REQUIRED_LOCALES.map(locale => `translations/${locale}.json`),
    );
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

  it('renders every translation under its own locale', () => {
    const { messages } = readCatalog();
    // The catalog IS the loaded translation set here, so `translate` formats the Spanish string --
    // the same path a dashboard running `i18n.locale: es-ES` takes.
    const problems = renderFailures(
      locale,
      messages,
      Object.keys(messages).map(id => [id, messages[id]]),
    );
    assertNoProblems(
      problems,
      'A message that fails to format throws when rendered, in this locale only.',
    );
  });
});
