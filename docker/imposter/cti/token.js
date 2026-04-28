// Mock for the CTI Console Device Authorization Grant endpoint:
//   POST /api/v1/platform/environments/token
//
// The endpoint handles two scenarios depending on the request body:
//   1. Device Authorization Request -> only `client_id` is provided.
//   2. Access Token Polling         -> `grant_type`, `client_id`, `device_code`.
//
// The polling response can be forced via the `X-Mock-Scenario` header with
// one of: `pending`, `slow_down`, `access_denied`, `expired_token`, `success`.
//
// When the header is not provided, the mock returns `authorization_pending`
// for the first 2 polls and `success` (200 with access_token) afterwards.

var RESPONSES_DIR = 'responses/';

var store = stores.open('storeCti');

// File paths are relative to the config file directory (cti/).
var FILES = {
  device_authorization: RESPONSES_DIR + 'device_authorization.json',
  success: RESPONSES_DIR + 'token_success.json',
  pending: RESPONSES_DIR + 'error_authorization_pending.json',
  slow_down: RESPONSES_DIR + 'error_slow_down.json',
  access_denied: RESPONSES_DIR + 'error_access_denied.json',
  expired_token: RESPONSES_DIR + 'error_expired_token.json',
};

// Reads a request body as either form-urlencoded or JSON, returning a plain
// object with the resulting key/value pairs. Returns an empty object when the
// body cannot be parsed.
function parseBody(rawBody) {
  if (!rawBody) {
    return {};
  }

  var trimmed = String(rawBody).trim();

  if (trimmed.charAt(0) === '{') {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      return {};
    }
  }

  var result = {};
  var pairs = trimmed.split('&');
  for (var i = 0; i < pairs.length; i++) {
    if (!pairs[i]) {
      continue;
    }
    var idx = pairs[i].indexOf('=');
    var key = idx === -1 ? pairs[i] : pairs[i].substring(0, idx);
    var value = idx === -1 ? '' : pairs[i].substring(idx + 1);
    try {
      result[decodeURIComponent(key)] = decodeURIComponent(
        value.replace(/\+/g, ' '),
      );
    } catch (e) {
      result[key] = value;
    }
  }
  return result;
}

var body = parseBody(context.request.body);

// Access headers using Imposter's API - the headers object is a Java Map
var scenario = null;
if (context.request.headers) {
  // Try direct access first (case-sensitive)
  scenario = context.request.headers['X-Mock-Scenario'];
  if (!scenario) {
    // Try lowercase variant
    scenario = context.request.headers['x-mock-scenario'];
  }
}

var hasDeviceCode = !!body.device_code;
var hasGrantType = !!body.grant_type;

if (!hasDeviceCode && !hasGrantType) {
  // ------------------------------------------------------------------
  // Scenario 1: Device Authorization Request (only client_id).
  // ------------------------------------------------------------------
  // Reset the polling counter for the next flow.
  store.save('pollCount', 0);
  respond().withStatusCode(200).withFile(FILES.device_authorization);
} else {
  // ------------------------------------------------------------------
  // Scenario 2: Access Token Polling.
  // ------------------------------------------------------------------
  if (scenario) {
    switch (String(scenario).toLowerCase()) {
      case 'success':
        store.save('pollCount', 0);
        respond().withStatusCode(200).withFile(FILES.success);
        break;
      case 'pending':
      case 'authorization_pending':
        respond().withStatusCode(400).withFile(FILES.pending);
        break;
      case 'slow_down':
        respond().withStatusCode(400).withFile(FILES.slow_down);
        break;
      case 'access_denied':
        respond().withStatusCode(400).withFile(FILES.access_denied);
        break;
      case 'expired_token':
        respond().withStatusCode(400).withFile(FILES.expired_token);
        break;
      default:
        respond().withStatusCode(400).withFile(FILES.pending);
    }
  } else {
    // Default behaviour: pending for the first 2 polls, then success.
    var pollCount = store.load('pollCount');
    if (pollCount === null || typeof pollCount === 'undefined') {
      pollCount = 0;
    }

    if (pollCount < 2) {
      store.save('pollCount', pollCount + 1);
      respond().withStatusCode(400).withFile(FILES.pending);
    } else {
      store.save('pollCount', 0);
      respond().withStatusCode(200).withFile(FILES.success);
    }
  }
}
