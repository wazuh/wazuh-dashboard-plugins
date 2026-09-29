/*
 * Wazuh app - Neutralize spreadsheet-formula values before a CSV export
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/**
 * Characters that make a spreadsheet engine evaluate a cell as a formula when
 * they are the first character of the cell. Includes the full-width variants,
 * which some engines normalize to their ASCII counterpart.
 *
 * A leading line feed is deliberately absent: it is not a formula trigger, and
 * the CSV writer already quotes embedded newlines.
 */
export const CSV_FORMULA_TRIGGER_CHARACTERS = [
  '=',
  '+',
  '-',
  '@',
  '\t',
  '\r',
  '＝',
  '＋',
  '－',
  '＠',
];

const NEUTRALIZING_PREFIX = "'";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
};

/**
 * Return a copy of `value` in which every string that starts with a CSV formula
 * trigger character is prefixed with an apostrophe, so a spreadsheet renders it
 * as literal text instead of evaluating it.
 *
 * The traversal is recursive and structure-preserving: it walks into arrays and
 * plain objects, keeps keys and key order untouched, and never mutates the
 * input. Non-string primitives are returned unchanged, and non-plain objects
 * (`Date`, `RegExp`, class instances, `Map`/`Set`) are returned by reference so
 * the CSV writer serializes them exactly as it does today.
 *
 * @param value any value about to be handed to the CSV writer
 * @returns a neutralized copy of `value`
 */
export function neutralizeCsvFormulaValues<T>(value: T): T {
  if (typeof value === 'string') {
    return (CSV_FORMULA_TRIGGER_CHARACTERS.some(trigger =>
      value.startsWith(trigger),
    )
      ? NEUTRALIZING_PREFIX + value
      : value) as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map(item => neutralizeCsvFormulaValues(item)) as unknown as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        neutralizeCsvFormulaValues(item),
      ]),
    ) as unknown as T;
  }

  return value;
}
