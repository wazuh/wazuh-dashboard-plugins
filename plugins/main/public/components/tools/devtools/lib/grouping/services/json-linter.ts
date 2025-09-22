import jsonLint from '../../../../../../utils/codemirror/json-lint';

/**
 * Lints JSON and throws if invalid.
 */
export interface JsonLinter {
  parse(raw: string): void;
}

export class DefaultJsonLinter implements JsonLinter {
  parse(raw: string): void {
    jsonLint.parse(raw);
  }
}
