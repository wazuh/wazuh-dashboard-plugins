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

/** A registration this dashboard saw, which the Content Manager no longer reports. */
export interface CtiRegistrationLost {
  /** ISO date of the first unregistered read after a registered one. */
  detected_at: string;
  /** Plan name of the last registered read. */
  last_plan: string;
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
  /** Seconds since the device code was issued. */
  pending_for_sec?: number;
  /**
   * Environment UID sent as `client_id`. Wazuh Cloud shows it as the deployment ID, which
   * identifies the deployment to delete after an "Environment already exists" rejection.
   */
  environment_uid?: string;
  registration_lost?: CtiRegistrationLost;
}
