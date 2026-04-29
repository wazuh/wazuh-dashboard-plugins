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

  reset(): void {
    deviceCode = null;
    registrationComplete = false;
  },
};
