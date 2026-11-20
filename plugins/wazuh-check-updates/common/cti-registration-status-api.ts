/**
 * GET `/api/wazuh-check-updates/cti-registration/status` — server-side CTI device flow snapshot.
 * Used to rehydrate the browser after reload (in-memory store on the server).
 */

/** Shape of `message` from Content Manager `GET …/subscription`. */
export interface CtiSubscriptionPlan {
  name: string;
  is_public: boolean;
}

export type CtiPlanSubscriptionInterval = 'month' | 'year';

/** A paid subscription assigned to the environment (`environments/me` → `subscriptions[]`). */
export interface CtiPlanSubscription {
  /** Name of the plan it pays for; matches `plan.name`. */
  plan: string;
  interval?: CtiPlanSubscriptionInterval;
  /**
   * ISO 8601 dates. `renews_at` is `null` when the subscription will not renew,
   * `past_due_ends_at` is set while a payment is overdue: when it passes, the
   * subscription is suspended.
   */
  started_at?: string;
  renews_at?: string | null;
  expires_at?: string | null;
  past_due_ends_at?: string | null;
}

/**
 * The registered environment as the Wazuh Console describes it (`environments/me`), which
 * Content Manager passes through verbatim as `message.environment`. The status route keeps
 * only the fields below, validated. Every field is optional: older indexers do not send
 * the environment at all.
 */
export interface CtiSubscriptionEnvironment {
  name?: string;
  organization?: { name?: string };
  /** ISO 8601 date the environment was registered in the Wazuh Console. */
  registered_at?: string;
  subscriptions?: CtiPlanSubscription[];
}

export interface CtiSubscriptionMessage {
  plan?: CtiSubscriptionPlan;
  is_registered: boolean;
  environment?: CtiSubscriptionEnvironment;
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
  /** Seconds since the device code was issued. */
  pending_for_sec?: number;
  /**
   * Environment UID sent as `client_id`. The Wazuh Console shows it as the deployment ID, which
   * identifies the deployment to delete after an "Environment already exists" rejection.
   * Returned in every state.
   */
  environment_uid?: string;
}

/** DELETE `/api/wazuh-check-updates/cti-registration` — clears the local registration. */
export interface CtiClearRegistrationApiBody {
  cleared: true;
}
