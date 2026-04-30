// Mock for the OpenSearch Content Manager subscription endpoint (stand-in until
// the real indexer plugin exists). POST JSON body must include a non-empty
// `access_token`. The real dashboard must send this only from the server.
//
//   POST /_plugins/_content_manager/subscription
//
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
