/**
 * Domain-specific error used for controlled exits/reporting.
 */
export class DevScriptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DevScriptError';
  }
}

