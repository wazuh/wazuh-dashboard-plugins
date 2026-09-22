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
 * Shared i18n gate for the Wazuh dashboard plugins. Each plugin runs it from a thin
 * `common/i18n-strings.test.ts` that calls `describeI18nStringsGate` with its own root and id
 * prefix; see the i18n section of `STYLEGUIDE.md` for the message-id convention it enforces.
 *
 * The UI text lives in the `defaultMessage` of each `i18n.translate(...)` call and
 * `<FormattedMessage>` element. That is what the dashboard renders at the default `i18n.locale`
 * (`en`), and -- while a plugin ships no translation catalogs -- at every other locale too.
 *
 * WHY NO ENGLISH CATALOG. A catalog entry takes precedence over `defaultMessage`, so an English
 * catalog overrides the source instead of documenting it, and every drift between the two becomes
 * stale English in front of a user. The platform ships no English catalog for the same reason. A
 * translator template comes from the platform's `i18n:extract` on demand. Which catalogs a plugin
 * ships is therefore an explicit option (`catalogs`) rather than an assumption baked in here, so
 * the same gate holds whichever way the localization policy resolves.
 *
 * What the gate enforces, per plugin:
 *   1. every id is namespaced under the plugin prefix;
 *   2. no id is used with two different `defaultMessage` values;
 *   3. every `defaultMessage` actually renders through `@osd/i18n`, so an unbalanced brace or a
 *      `plural`/`select` missing its `other` branch fails here rather than in front of a user;
 *   4. no id or message is built at runtime, and no i18n usage goes unrecognized;
 *   5. `.i18nrc.json` declares the prefix, maps it to the whole plugin, and registers exactly the
 *      catalogs the plugin says it ships -- and those catalogs only hold ids the source still uses.
 *
 * Extraction is a TypeScript AST walk rather than a regex so that concatenated messages
 * (`'a ' + 'b'`), apostrophes and JSX text cannot desync it, and so that a NON-static id or
 * `defaultMessage` (a template with `${}`, a variable) fails loudly instead of being skipped: such
 * a string cannot be extracted by the platform's own i18n tooling either, so it would silently sit
 * outside any localization effort. For the same reason the walk reports i18n usage it does NOT
 * understand -- a `.translate(` or `.formatMessage(` call on anything other than `i18n`, a
 * `Formatted*Message` element under another name, or an aliased `@osd/i18n` import.
 *
 * Message validity goes through `@osd/i18n`'s own `init()` + `translate()` rather than an ICU
 * parser package. Formatting, not just parsing, is what production does, and it is strictly
 * stronger: a `plural` missing its `other` branch parses cleanly and only throws when a value
 * selects the branch that is not there. Each message is therefore rendered once per entry in
 * `PLURAL_PROBES`.
 *
 * Placement: `common/` of `wazuh-core` because every plugin depends on it and the gate belongs to
 * no single layer. It uses `fs` and `typescript`, so it must only ever be imported from test files,
 * which jest runs under Node and which no bundle includes.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { i18n } from '@osd/i18n';

const SOURCE_DIRS = ['common', 'public', 'server'];

/**
 * Values fed to every ICU argument in turn, chosen to drive a `plural` down both its `one` and its
 * `other` branch: a message whose `other` is missing renders fine for 1 and throws for 2.
 */
const PLURAL_PROBES = [1, 2];

const LOCALIZATION_HINT =
  'Translation catalogs are registered per plugin through the `catalogs` option of this gate, so ' +
  'adding or removing one is a deliberate change to that option. An English catalog overrides ' +
  'defaultMessage rather than documenting it; generate a translator template with the ' +
  "platform's i18n:extract instead of committing one.";

export interface I18nStringsGateOptions {
  /** Absolute path of the plugin folder, the one holding `.i18nrc.json`. */
  pluginRoot: string;
  /** The plugin's OSD id, which is also its message-id prefix: `wazuh`, `wazuhCore`, ... */
  idPrefix: string;
  /**
   * File names under `translations/` the plugin ships and registers. Empty while the dashboard is
   * English-only, which is the default.
   */
  catalogs?: string[];
  /**
   * Lower bound for the number of extracted ids. It only has to prove the walk found the plugin's
   * strings rather than silently matching nothing, which would make every other check vacuous.
   */
  minimumMessages: number;
}

export interface SourceMessage {
  defaultMessage: string;
  location: string;
}

export interface SourceScan {
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
 * directories: matching only TypeScript would skip such a file's strings without a word. The gate
 * itself is skipped, since its own `translate()` call renders messages it does not own.
 */
function listSourceFiles(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) {
    return out;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'target') {
        continue;
      }
      listSourceFiles(full, out);
    } else if (
      /\.(js|jsx|ts|tsx)$/.test(entry.name) &&
      !/\.test\.(js|jsx|ts|tsx)$/.test(entry.name) &&
      !/\.d\.ts$/.test(entry.name) &&
      path.resolve(full) !== path.resolve(__filename)
    ) {
      out.push(full);
    }
  }
  return out;
}

function formatLocation(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  root: string,
): string {
  const { line } = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );
  const relative = path.relative(root, sourceFile.fileName).replace(/\\/g, '/');
  return `${relative}:${line + 1}`;
}

function isFormattedMessageTag(tag: string): boolean {
  return /(^|\.)Formatted[A-Za-z]*Message$/.test(tag);
}

/**
 * Walks one source text and records its messages into `scan`. Split from `scanSource` so the walk
 * can be exercised on fixtures without touching the filesystem.
 */
export function scanSourceText(
  fileName: string,
  text: string,
  root: string,
  scan: SourceScan = { messages: new Map(), unrecognized: [], conflicts: [] },
): SourceScan {
  const sourceFile = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
    scriptKindFor(fileName),
  );
  const where = (node: ts.Node) => formatLocation(node, sourceFile, root);

  /** Resolves a string literal, a parenthesized one, or a `+` chain of them; throws otherwise. */
  const staticString = (node: ts.Node | undefined): string => {
    if (node) {
      if (
        ts.isStringLiteral(node) ||
        ts.isNoSubstitutionTemplateLiteral(node)
      ) {
        return node.text;
      }
      if (ts.isParenthesizedExpression(node) || ts.isJsxExpression(node)) {
        return staticString(node.expression);
      }
      if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.PlusToken
      ) {
        return staticString(node.left) + staticString(node.right);
      }
    }
    throw new Error(
      'i18n strings must be static string literals so they can be extracted: ' +
        (node ? where(node) : fileName),
    );
  };

  const record = (
    id: string,
    defaultMessage: string,
    location: string,
  ): void => {
    const previous = scan.messages.get(id);
    // Reusing an id for the same text is fine and common; reusing it for DIFFERENT text is not.
    // Whichever call site loses the race decides what the user sees.
    if (previous && previous.defaultMessage !== defaultMessage) {
      scan.conflicts.push(
        `${id}: ${JSON.stringify(previous.defaultMessage)} at ` +
          `${previous.location}, ${JSON.stringify(
            defaultMessage,
          )} at ${location}`,
      );
    }
    scan.messages.set(id, { defaultMessage, location });
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
      scan.unrecognized.push(
        `${receiver}.${method}(...) at ${where(node)} ` +
          '-- only i18n.translate() is extracted',
      );
      return;
    }
    const id = staticString(node.arguments[0]);
    const options = node.arguments[1];
    let defaultMessage: string | undefined;
    if (options && ts.isObjectLiteralExpression(options)) {
      for (const property of options.properties) {
        if (
          ts.isPropertyAssignment(property) &&
          property.name.getText(sourceFile) === 'defaultMessage'
        ) {
          defaultMessage = staticString(property.initializer);
        }
      }
    }
    if (defaultMessage === undefined) {
      throw new Error(
        `i18n.translate('${id}') has no static defaultMessage: ${where(node)}`,
      );
    }
    record(id, defaultMessage, where(node));
  };

  const readJsxMessage = (
    node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  ): { id: string; defaultMessage: string } => {
    let id: string | undefined;
    let defaultMessage: string | undefined;
    for (const attribute of node.attributes.properties) {
      if (!ts.isJsxAttribute(attribute)) {
        continue;
      }
      const name = attribute.name.getText(sourceFile);
      if (name === 'id') {
        id = staticString(attribute.initializer);
      } else if (name === 'defaultMessage') {
        defaultMessage = staticString(attribute.initializer);
      }
    }
    if (id === undefined || defaultMessage === undefined) {
      throw new Error(
        `<FormattedMessage> needs a static id and defaultMessage: ${where(
          node,
        )}`,
      );
    }
    return { id, defaultMessage };
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
            scan.unrecognized.push(
              `${element.propertyName.text} imported as ${element.name.text} at ` +
                `${where(
                  node,
                )} -- aliased @osd/i18n bindings are not extracted`,
            );
          }
        }
      }
    }

    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sourceFile);
      if (tag === 'FormattedMessage') {
        const { id, defaultMessage } = readJsxMessage(node);
        record(id, defaultMessage, where(node));
      } else if (isFormattedMessageTag(tag)) {
        scan.unrecognized.push(
          `<${tag}> at ${where(node)} -- only <FormattedMessage> is extracted`,
        );
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return scan;
}

/** Scans every source file of a plugin. */
export function scanSource(pluginRoot: string): SourceScan {
  const scan: SourceScan = {
    messages: new Map(),
    unrecognized: [],
    conflicts: [],
  };
  const files: string[] = [];
  for (const dir of SOURCE_DIRS) {
    listSourceFiles(path.join(pluginRoot, dir), files);
  }
  for (const file of files) {
    scanSourceText(file, fs.readFileSync(file, 'utf8'), pluginRoot, scan);
  }
  return scan;
}

/**
 * Top-level ICU argument names of a message: `{name}`, `{count, plural, ...}`.
 *
 * Only braces opened at nesting depth 0 name an argument. The bodies of a `plural`/`select` branch
 * are LITERAL TEXT, so a single-word branch such as the `one {conversation}` in
 * "the selected {count, plural, one {conversation} other {conversations}}" must not be read as two
 * extra arguments named `conversation`/`conversations`. Nested arguments are covered through their
 * top-level parent, whose name is what a caller actually has to supply. A backslash-escaped brace
 * (`\{`), the only escape the platform's `intl-messageformat` honors, is literal text too.
 */
export function icuPlaceholders(message: string): string[] {
  const found = new Set<string>();
  let depth = 0;
  for (let index = 0; index < message.length; index += 1) {
    const char = message[index];
    if (char === '\\') {
      index += 1;
      continue;
    }
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
  return [...found].sort();
}

/**
 * Renders every `[id, message]` through `@osd/i18n` at the default locale, once per `PLURAL_PROBES`
 * value, and returns one line per message that failed. No catalog is registered, so `translate`
 * formats each `defaultMessage` -- exactly what the dashboard does.
 */
export function renderFailures(entries: Array<[string, string]>): string[] {
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

/**
 * Registers the gate's suites for one plugin. Call it at the top level of a test file.
 */
export function describeI18nStringsGate({
  pluginRoot,
  idPrefix,
  catalogs = [],
  minimumMessages,
}: I18nStringsGateOptions): void {
  const namespace = `${idPrefix}.`;
  const translationsDir = path.join(pluginRoot, 'translations');
  const i18nrcPath = path.join(pluginRoot, '.i18nrc.json');

  /**
   * Lazily scanned and memoized, including a thrown error. Module-scope scanning would turn one
   * non-static string into a suite that fails to load, hiding the names of every check below it.
   */
  let scanned: SourceScan | undefined;
  let scanError: unknown;
  const sourceScan = (): SourceScan => {
    if (scanError !== undefined) {
      throw scanError;
    }
    if (!scanned) {
      try {
        scanned = scanSource(pluginRoot);
      } catch (error) {
        scanError = error;
        throw error;
      }
    }
    return scanned;
  };
  const sourceMessages = () => sourceScan().messages;

  const readCatalog = (name: string): Record<string, string> => {
    const parsed = JSON.parse(
      fs.readFileSync(path.join(translationsDir, name), 'utf8'),
    ) as { messages?: Record<string, string> };
    return parsed.messages ?? {};
  };

  describe(`i18n strings (${idPrefix})`, () => {
    it('extracts every message from the plugin source', () => {
      expect(sourceMessages().size).toBeGreaterThanOrEqual(minimumMessages);
    });

    it('has no i18n usage the extractor does not understand', () => {
      assertNoProblems(
        sourceScan().unrecognized,
        'Teach the gate in wazuh-core/common/i18n-strings-gate.ts to extract the usage above, or ' +
          'rewrite the call site as i18n.translate() / <FormattedMessage>.',
      );
    });

    it('namespaces every id under the plugin prefix', () => {
      const wrong: string[] = [];
      sourceMessages().forEach((message, id) => {
        if (!id.startsWith(namespace)) {
          wrong.push(`${id} (${message.location})`);
        }
      });
      assertNoProblems(
        wrong,
        `Every id must start with "${namespace}" to match the prefix in .i18nrc.json, and ` +
          'follow <osdPluginId>.<area>.<component>.<element> (see STYLEGUIDE.md).',
      );
    });

    it('never uses one id for two different messages', () => {
      assertNoProblems(
        sourceScan().conflicts,
        'Give each distinct string its own id: whichever call site is scanned last would ' +
          'otherwise decide what the user sees.',
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
        'Fix the ICU syntax of each defaultMessage above. A literal brace is written \\{ ... \\}.',
      );
    });
  });

  describe(`i18n configuration (${idPrefix})`, () => {
    const i18nrc = () =>
      JSON.parse(fs.readFileSync(i18nrcPath, 'utf8')) as {
        prefix?: string;
        paths?: Record<string, string>;
        translations?: string[];
      };

    it('declares the prefix for the whole plugin in .i18nrc.json', () => {
      // A path narrower than `.` leaves `common/` or `server/` outside the namespace, and the
      // platform's `validateMessageNamespace` throws a TypeError on any id found there.
      const { prefix, paths } = i18nrc();
      expect(prefix).toBe(idPrefix);
      expect(paths).toEqual({ [idPrefix]: '.' });
    });

    it('ships exactly the configured translation catalogs', () => {
      const shipped = fs.existsSync(translationsDir)
        ? fs.readdirSync(translationsDir).filter(name => name.endsWith('.json'))
        : [];
      const unexpected = shipped
        .filter(name => !catalogs.includes(name))
        .map(name => `translations/${name} is shipped but not configured`);
      const missing = catalogs
        .filter(name => !shipped.includes(name))
        .map(name => `translations/${name} is configured but not shipped`);
      assertNoProblems([...unexpected, ...missing], LOCALIZATION_HINT);
    });

    it('registers exactly the configured catalogs in .i18nrc.json', () => {
      // `getTranslationPaths` in src/legacy/server/i18n reads this array and nothing else, so it is
      // what actually decides whether a locale loads.
      expect([...(i18nrc().translations ?? [])].sort()).toEqual(
        catalogs.map(name => `translations/${name}`).sort(),
      );
    });

    it('keeps every catalog entry pointing at a live, renderable message', () => {
      const problems: string[] = [];
      for (const name of catalogs) {
        const messages = readCatalog(name);
        for (const id of Object.keys(messages)) {
          if (!sourceMessages().has(id)) {
            problems.push(
              `translations/${name}: ${id} is not used in the source`,
            );
          }
        }
        problems.push(
          ...renderFailures(Object.entries(messages)).map(
            problem => `translations/${name}: ${problem}`,
          ),
        );
      }
      assertNoProblems(
        problems,
        'Regenerate the catalog from the source with i18n:extract rather than editing it by hand.',
      );
    });
  });
}
