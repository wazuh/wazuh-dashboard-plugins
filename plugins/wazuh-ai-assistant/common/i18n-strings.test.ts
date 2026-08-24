/*
 * Wazuh app - i18n string integrity gate
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
 * Keeps this plugin's i18n strings sound, and keeps it English-only (issue #8975).
 *
 * The UI text lives in the `defaultMessage` of each `i18n.translate(...)` call and
 * `<FormattedMessage>` element. That is what the dashboard renders at the default `i18n.locale`
 * (`en`), and -- since this plugin ships no translation catalogs -- at every other locale too.
 *
 * WHY NO CATALOGS. The plugin used to carry `en-US.json` and `es-ES.json`. Neither ever reached a
 * user. `en-US.json` could not: `@osd/i18n`'s loader keys catalogs by file basename, so the default
 * locale `en` never looks at an `en-US` entry and renders `defaultMessage` instead. `es-ES.json`
 * could not either, on any packaged install: the platform discovers catalogs by globbing for an
 * `.i18nrc.json` in each plugin directory, and `osd-plugin-helpers` builds the archive from a
 * pattern list that matches no dotfile, so the installed plugin had `translations/` and no
 * `.i18nrc.json` to register it. Both had drifted badly from the source in the meantime -- 7 dead
 * ids, 8 entries translated from wording the source had since changed, 73 ids never covered -- with
 * nothing comparing them to anything. Localizing one plugin on its own also puts a per-PR
 * translation tax on every contributor. So the catalogs are gone, and localization is deferred to a
 * dashboard-wide effort that can decide the locale set and the workflow at once.
 *
 * Model answers are unaffected: the assistant replies in the language of the user's own question
 * (see the language rule in `server/prompts.ts`), which is the model's doing, not i18n's.
 *
 * What this file enforces:
 *   1. no translation catalogs come back one plugin at a time, and `.i18nrc.json` registers none;
 *   2. every id is namespaced under the plugin prefix;
 *   3. no id is used with two different `defaultMessage` values;
 *   4. every `defaultMessage` actually renders through `@osd/i18n`, so an unbalanced brace or a
 *      `plural`/`select` missing its `other` branch fails here rather than in front of a user.
 *
 * Extraction is a TypeScript AST walk rather than a regex so that concatenated messages
 * (`'a ' + 'b'`), apostrophes and JSX text cannot desync it, and so that a NON-static id or
 * `defaultMessage` (a template with `${}`, a variable) fails loudly instead of being skipped: such
 * a string cannot be extracted by the platform's own i18n tooling either, so it would silently sit
 * outside any future localization effort. For the same reason the walk reports i18n usage it does
 * NOT understand -- a `.translate(` or `.formatMessage(` call on anything other than `i18n`, a
 * `Formatted*Message` element under another name, or an aliased `@osd/i18n` import. None exist
 * today; the point is that the day one appears, this gate says so.
 *
 * Message validity goes through `@osd/i18n`'s own `init()` + `translate()` -- the same public API
 * the plugin already calls in `public/` and `common/nav-categories.ts` -- rather than reaching for
 * an ICU parser package directly. Formatting, not just parsing, is what production does, and it is
 * strictly stronger: a `plural` missing its `other` branch parses cleanly and only blows up when a
 * value selects the branch that is not there. Each message is therefore rendered once per entry in
 * `PLURAL_PROBES`.
 *
 * Placement: `common/` because the strings span `public/`, `server/` and `common/` alike and belong
 * to none of them. The usual "no Node-only APIs in common/" rule is about code that gets bundled
 * for the browser; this is a test file, excluded from every bundle and from `collectCoverageFrom`,
 * and jest runs the `common/` project under `testEnvironment: 'node'`, so `fs`/`typescript` here
 * never reach a browser build.
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
 * Values fed to every ICU argument in turn, chosen to drive a `plural` down both its `one` and its
 * `other` branch: a message whose `other` is missing renders fine for 1 and throws for 2.
 */
const PLURAL_PROBES = [1, 2];

const LOCALIZATION_HINT =
  'This plugin is English-only for now: UI text lives in each defaultMessage, and localization is ' +
  'deferred to a dashboard-wide effort rather than done one plugin at a time. Adding a catalog ' +
  'here reintroduces a per-PR translation tax and, on a packaged install, a catalog the platform ' +
  'never loads. Raise it with that wider effort instead of re-adding files here.';

interface SourceMessage {
  defaultMessage: string;
  location: string;
}

interface SourceScan {
  messages: Map<string, SourceMessage>;
  /** i18n usage the walk cannot extract from, and so cannot vouch for. */
  unrecognized: string[];
  /** One id used with two different `defaultMessage` values. */
  conflicts: string[];
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
  const conflicts: string[] = [];
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
      // Reusing an id for the same text is fine and common; reusing it for DIFFERENT text is not.
      // Whichever call site loses the race decides what the user sees.
      if (previous && previous.defaultMessage !== defaultMessage) {
        conflicts.push(
          `${id}: ${JSON.stringify(previous.defaultMessage)} at ` +
            `${previous.location}, ${JSON.stringify(
              defaultMessage,
            )} at ${location}`,
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

  return { messages, unrecognized, conflicts };
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
 * Only braces opened at nesting depth 0 name an argument. The bodies of a `plural`/`select` branch
 * are LITERAL TEXT, so a single-word branch such as the `one {conversation}` in
 * "the selected {count, plural, one {conversation} other {conversations}}" must not be read as two
 * extra arguments named `conversation`/`conversations` -- a depth-blind scan did exactly that.
 * Nested arguments are covered through their top-level parent, whose name is what a caller actually
 * has to supply.
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
 * Renders every `[id, message]` through `@osd/i18n` at the default locale, once per `PLURAL_PROBES`
 * value, and returns one line per message that failed. No catalog is registered, so `translate`
 * formats each `defaultMessage` -- exactly what the dashboard does.
 */
function renderFailures(entries: Array<[string, string]>): string[] {
  i18n.init({ locale: 'en', messages: {} });
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

describe('icuPlaceholders', () => {
  it('names only the arguments a caller has to supply', () => {
    expect(icuPlaceholders('Ask about {name}')).toEqual(['name']);
    expect(icuPlaceholders('Request failed (HTTP {status}): {detail}')).toEqual(
      ['detail', 'status'],
    );
    expect(icuPlaceholders('Nothing to interpolate')).toEqual([]);
  });

  it('ignores plural and select branch bodies', () => {
    // Regression: a depth-blind scan read the single-word branch bodies as arguments.
    expect(
      icuPlaceholders(
        'Delete the selected {count, plural, one {conversation} other {conversations}}?',
      ),
    ).toEqual(['count']);
    expect(
      icuPlaceholders('{kind, select, chat {chat} other {other}}'),
    ).toEqual(['kind']);
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

describe('i18n strings', () => {
  it('extracts every message from the plugin source', () => {
    // A floor, not an exact count: it only has to prove the walk found the plugin's worth of
    // strings rather than silently matching nothing, which would make every check below vacuous.
    expect(sourceMessages().size).toBeGreaterThan(100);
  });

  it('has no i18n usage the extractor does not understand', () => {
    assertNoProblems(
      sourceScan().unrecognized,
      'Teach this test to extract the usage above, or rewrite the call site as i18n.translate() ' +
        '/ <FormattedMessage>.',
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

  it('never uses one id for two different messages', () => {
    assertNoProblems(
      sourceScan().conflicts,
      'Give each distinct string its own id: whichever call site is scanned last would otherwise ' +
        'decide what the user sees.',
    );
  });

  it('renders every message', () => {
    const entries: Array<[string, string]> = [];
    const locations = new Map<string, string>();
    sourceMessages().forEach((message, id) => {
      entries.push([id, message.defaultMessage]);
      locations.set(id, message.location);
    });
    const problems = renderFailures(entries).map(problem => {
      const id = problem.slice(0, Math.max(problem.indexOf(' '), 0));
      return `${problem} [${locations.get(id) ?? 'unknown location'}]`;
    });
    assertNoProblems(
      problems,
      'Fix the ICU syntax of each defaultMessage above.',
    );
  });
});

describe('localization', () => {
  it('ships no translation catalogs', () => {
    const catalogs = fs.existsSync(TRANSLATIONS_DIR)
      ? fs.readdirSync(TRANSLATIONS_DIR).filter(name => name.endsWith('.json'))
      : [];
    assertNoProblems(
      catalogs.map(name => `translations/${name}`),
      LOCALIZATION_HINT,
    );
  });

  it('registers no catalogs in .i18nrc.json', () => {
    // `getTranslationPaths` in src/legacy/server/i18n reads this array and nothing else, so it is
    // what actually decides whether a locale loads. `prefix`/`paths` stay: they keep the plugin
    // visible to the platform's i18n tooling for whenever localization is picked up for real.
    const i18nrc = JSON.parse(fs.readFileSync(I18NRC_PATH, 'utf8')) as {
      prefix?: string;
      translations?: string[];
    };
    expect(i18nrc.prefix).toBe(ID_PREFIX.replace(/\.$/, ''));
    assertNoProblems(i18nrc.translations ?? [], LOCALIZATION_HINT);
  });
});
