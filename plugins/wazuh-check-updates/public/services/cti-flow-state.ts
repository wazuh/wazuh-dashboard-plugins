/**
 * In-memory CTI device-authorization flow state for the current SPA lifetime.
 * Survives client-side navigation; resets on full page reload (unlike Web Storage).
 */
let deviceCode: string | null = null;
let registrationComplete = false;

export const ctiFlowState = {
  getDeviceCode(): string | null {
    return deviceCode;
  },

  setDeviceCode(code: string | null): void {
    deviceCode = code && code.length > 0 ? code : null;
  },

  isRegistrationComplete(): boolean {
    return registrationComplete;
  },

  setRegistrationComplete(complete: boolean): void {
    registrationComplete = complete;
    if (complete) {
      deviceCode = null;
    }
  },

  /** Clears all flags (e.g. tests or explicit sign-out if added later). */
  reset(): void {
    deviceCode = null;
    registrationComplete = false;
  },
};
