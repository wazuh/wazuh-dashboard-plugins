/* eslint-disable camelcase -- Content Manager and CTI console fields keep their API names */
/**
 * DEVELOPMENT ONLY. In-memory stand-in for the indexer Content Manager subscription API
 * (`/_plugins/_content_manager/subscription`), so the dashboard can be developed against
 * indexer changes that are not released yet:
 *
 * - `GET` adds the CTI console `environments/me` body, verbatim, as `message.environment`.
 * - `DELETE ?perform_permission_check=true` answers the permission check instead of
 *   removing anything, like `POST ?perform_permission_check=true` already does.
 *
 * Off unless `WAZUH_CTI_CONTENT_MANAGER_MOCK` is set when the dashboard starts. It holds
 * the access token in memory, and reads the plan from the CTI API the dashboard is
 * configured with (`wazuh_check_updates.ctiApiUrl`), as the indexer does. Point that
 * setting at the Imposter mock (`docker/imposter/cti`) to switch scenarios at runtime.
 */
import axios from 'axios';
import {
  CONTENT_MANAGER_PERMISSION_CHECK_QUERY_PARAM,
  ctiConsoleApiPaths,
} from '../../../common/constants';
import type { CtiRegistrationPermissionAction } from '../../../common/cti-registration-permission-api';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';
import { getCtiConsoleBaseUrl } from './cti-console-url';

/** `registered` starts with a token stored; any other value starts unregistered. */
export const CONTENT_MANAGER_MOCK_ENV = 'WAZUH_CTI_CONTENT_MANAGER_MOCK';
/** Comma-separated actions the mock denies: `register`, `clear`. */
export const CONTENT_MANAGER_MOCK_DENY_ENV =
  'WAZUH_CTI_CONTENT_MANAGER_MOCK_DENY';

/** Token stored when the mock starts registered. */
export const CONTENT_MANAGER_MOCK_SEEDED_TOKEN = 'mock-access-token';

const CTI_CONSOLE_TIMEOUT_MS = 10000;

const PRIVILEGES: Record<CtiRegistrationPermissionAction, string> = {
  register: 'cluster:admin/content_manager/subscription/create',
  clear: 'cluster:admin/content_manager/subscription/delete',
};

const OFF_VALUES = ['', 'false', '0', 'off', 'no'];

export interface ContentManagerMockRequest {
  method: string;
  querystring?: Record<string, unknown>;
  body?: unknown;
}

export interface ContentManagerMockResponse {
  body: unknown;
  statusCode: number;
}

interface MockState {
  accessToken: string | null;
}

let state: MockState | null = null;
let announced = false;

function readMode(): 'registered' | 'unregistered' | null {
  const value = process.env[CONTENT_MANAGER_MOCK_ENV]?.trim().toLowerCase();
  if (value === undefined || OFF_VALUES.includes(value)) {
    return null;
  }
  return value === 'registered' ? 'registered' : 'unregistered';
}

/** Whether `WAZUH_CTI_CONTENT_MANAGER_MOCK` turns the mock on. */
export function isContentManagerMockEnabled(): boolean {
  return readMode() !== null;
}

function getState(): MockState {
  if (!state) {
    state = {
      accessToken:
        readMode() === 'registered' ? CONTENT_MANAGER_MOCK_SEEDED_TOKEN : null,
    };
  }
  return state;
}

/** Test-only: forget the stored token and the startup warning. */
export function resetContentManagerMockForTests(): void {
  state = null;
  announced = false;
}

function deniedActions(): Set<string> {
  return new Set(
    (process.env[CONTENT_MANAGER_MOCK_DENY_ENV] ?? '')
      .split(',')
      .map(action => action.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Mirrors the transport, which rejects any status >= 400 with `meta.statusCode`. */
function responseError(statusCode: number, message: string): Error {
  return Object.assign(new Error(message), {
    meta: { statusCode, body: { message, status: statusCode } },
  });
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** An empty value counts as `true`, as on the indexer. */
function isPermissionCheck(
  querystring: Record<string, unknown> | undefined,
): boolean {
  const value = querystring?.[CONTENT_MANAGER_PERMISSION_CHECK_QUERY_PARAM];
  if (value === undefined || value === null) {
    return false;
  }
  return String(value).trim().toLowerCase() !== 'false';
}

function permissionCheck(
  action: CtiRegistrationPermissionAction,
): ContentManagerMockResponse {
  const denied = deniedActions().has(action);
  return {
    statusCode: 200,
    body: {
      accessAllowed: !denied,
      missingPrivileges: denied ? [PRIVILEGES[action]] : [],
    },
  };
}

function toPlan(raw: unknown): { name: string; is_public: boolean } | null {
  if (!isRecord(raw) || typeof raw.name !== 'string') {
    return null;
  }
  return { name: raw.name, is_public: Boolean(raw.is_public) };
}

async function getPublicPlan() {
  try {
    const response = await axios.get(
      `${getCtiConsoleBaseUrl()}${ctiConsoleApiPaths.catalogPlans}`,
      { timeout: CTI_CONSOLE_TIMEOUT_MS, validateStatus: () => true },
    );
    const plans = isRecord(response.data) ? response.data.plans : undefined;
    if (response.status !== 200 || !Array.isArray(plans)) {
      return null;
    }
    return (
      plans.map(toPlan).find(plan => plan !== null && plan.is_public) ?? null
    );
  } catch {
    return null;
  }
}

/**
 * The plan of the registered environment and the `environments/me` body, or `null` when
 * the CTI console rejected the token (the token is then forgotten, as the indexer does).
 */
async function getEnvironment(accessToken: string) {
  let response;
  try {
    response = await axios.get(
      `${getCtiConsoleBaseUrl()}${ctiConsoleApiPaths.environmentsMe}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: CTI_CONSOLE_TIMEOUT_MS,
        validateStatus: () => true,
      },
    );
  } catch {
    throw responseError(502, 'The CTI Console could not be reached.');
  }
  if (response.status === 401) {
    return null;
  }
  const environment = response.data;
  const plan =
    isRecord(environment) && Array.isArray(environment.plans)
      ? toPlan(environment.plans[0])
      : null;
  if (response.status !== 200 || !plan) {
    throw responseError(
      502,
      `The CTI Console answered status ${response.status} to the plan lookup.`,
    );
  }
  return { plan, environment };
}

async function getSubscription(): Promise<ContentManagerMockResponse> {
  const current = getState();
  if (current.accessToken) {
    const registered = await getEnvironment(current.accessToken);
    if (registered) {
      return {
        statusCode: 200,
        body: {
          message: {
            plan: registered.plan,
            is_registered: true,
            environment: registered.environment,
          },
          status: 200,
        },
      };
    }
    current.accessToken = null;
  }
  const plan = await getPublicPlan();
  return {
    statusCode: 200,
    body: {
      message: plan ? { plan, is_registered: false } : { is_registered: false },
      status: 200,
    },
  };
}

function registerSubscription(body: unknown): ContentManagerMockResponse {
  const accessToken = isRecord(body) ? body.access_token : undefined;
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw responseError(400, 'Missing access_token.');
  }
  getState().accessToken = accessToken;
  return {
    statusCode: 201,
    body: { message: 'Access token stored.', status: 201 },
  };
}

function removeSubscription(): ContentManagerMockResponse {
  getState().accessToken = null;
  return {
    statusCode: 200,
    body: { message: 'Credentials removed', status: 200 },
  };
}

/** Logs once that the indexer is bypassed, so the mock is never on unnoticed. */
export function announceContentManagerMock(): void {
  if (announced || !isContentManagerMockEnabled()) {
    return;
  }
  announced = true;
  try {
    getWazuhCheckUpdatesServices().logger.warn(
      `${CONTENT_MANAGER_MOCK_ENV} is set: the dashboard answers /_plugins/_content_manager/subscription itself instead of the indexer. Development only.`,
    );
  } catch {
    // Logger unavailable; the mock still works.
  }
}

function answer(
  request: ContentManagerMockRequest,
): ContentManagerMockResponse | Promise<ContentManagerMockResponse> {
  const method = request.method.toUpperCase();
  const checkOnly = isPermissionCheck(request.querystring);
  switch (method) {
    case 'GET':
      return getSubscription();
    case 'POST':
      return checkOnly
        ? permissionCheck('register')
        : registerSubscription(request.body);
    case 'DELETE':
      return checkOnly ? permissionCheck('clear') : removeSubscription();
    default:
      throw responseError(405, `Method ${method} not allowed.`);
  }
}

/**
 * Answers a request to `/_plugins/_content_manager/subscription`. Always settles as a
 * promise: an error rejects, as the cluster transport does.
 */
export function requestContentManagerMock(
  request: ContentManagerMockRequest,
): Promise<ContentManagerMockResponse> {
  announceContentManagerMock();
  try {
    return Promise.resolve(answer(request));
  } catch (error) {
    return Promise.reject(error);
  }
}
