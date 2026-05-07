/**
 * GET `/api/wazuh-check-updates/cti-registration/status` — server-side CTI device flow snapshot.
 * Used to rehydrate the browser after reload (in-memory store on the server).
 */

/** Shape of `message` from Content Manager `GET …/subscription?clientId=…`. */
export interface CtiSubscriptionPlan {
  name: string;
  is_public: boolean;
}

export interface CtiSubscriptionMessage {
  plan?: CtiSubscriptionPlan;
  is_registered: boolean;
}

export interface CtiSubscriptionSnapshot {
  message: CtiSubscriptionMessage | null;
  status: number | null;
}

export interface CtiRegistrationStatusApiBody {
  registrationComplete: boolean;
  inProgress: boolean;
  subscription: CtiSubscriptionSnapshot;
  device_code?: string;
  user_code?: string;
  verification_uri?: string;
  verification_uri_complete?: string;
  poll_interval_sec?: number;
  /** Seconds remaining for the device code (derived from server expiry). */
  expires_in_remaining_sec?: number;
}
