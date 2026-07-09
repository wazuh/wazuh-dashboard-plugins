/**
 * GET `/api/wazuh-check-updates/cti-registration/status` — server-side CTI device flow snapshot.
 * Used to rehydrate the browser after reload (in-memory store on the server).
 */

/** Shape of `message` from Content Manager `GET …/subscription`. */
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

/** Outcome of a best-effort Content Manager update attempt for this poll cycle. */
export interface CtiContentUpdateOutcome {
  triggered: boolean;
  failed: boolean;
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
  /** Present only when a content update was attempted for this poll cycle. */
  contentUpdate?: CtiContentUpdateOutcome;
}
