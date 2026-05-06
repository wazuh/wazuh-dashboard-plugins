/**
 * GET `/api/wazuh-check-updates/cti-registration/status` — server-side CTI device flow snapshot.
 * Used to rehydrate the browser after reload (in-memory store on the server).
 */
export interface CtiRegistrationStatusApiBody {
  registrationComplete: boolean;
  inProgress: boolean;
  isRegistered: boolean;
  device_code?: string;
  user_code?: string;
  verification_uri?: string;
  verification_uri_complete?: string;
  poll_interval_sec?: number;
  /** Seconds remaining for the device code (derived from server expiry). */
  expires_in_remaining_sec?: number;
}
