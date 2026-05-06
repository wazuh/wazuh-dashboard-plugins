// Mock for Content Manager subscription endpoint.
//
//   GET  /_plugins/_content_manager/subscription?clientId=<cluster_uuid>
//   POST /_plugins/_content_manager/subscription
//
// GET is used for CTI registration status.
// POST is kept as backward-compatible fallback.
// Nashorn (ES5 only) — same constraints as token.js.

function parseJsonObject(rawBody) {
  if (!rawBody) {
    return null;
  }
  var trimmed = String(rawBody).trim();
  if (trimmed.charAt(0) !== '{') {
    return null;
  }
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    return null;
  }
}

function getFirstQueryParamValue(name) {
  var values = context.request.queryParams && context.request.queryParams[name];
  if (!values || !values.length) {
    return '';
  }
  return String(values[0]).trim();
}

var method = String(context.request.method || '').toUpperCase();

if (method === 'GET') {
  var clientId = getFirstQueryParamValue('clientId');
  if (!clientId) {
    respond().withStatusCode(400).withJson({
      message: 'Missing [clientId] query parameter.',
      status: 400,
    });
  } else {
    respond()
      .withStatusCode(200)
      .withFile('responses/subscription_status_registered.json');
  }
} else {
  var body = parseJsonObject(context.request.body);
  var token =
    body && body.access_token !== null && body.access_token !== undefined
      ? String(body.access_token).trim()
      : '';

  if (!token) {
    respond()
      .withStatusCode(400)
      .withFile('responses/subscription_missing_access_token.json');
  } else {
    respond()
      .withStatusCode(201)
      .withFile('responses/subscription_credentials_received.json');
  }
}
