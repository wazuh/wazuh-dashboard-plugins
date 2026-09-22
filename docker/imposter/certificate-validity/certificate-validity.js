// Mock of the per node certificate validity resource:
// GET /cluster/{node_id}/daemons/remoted/tls
//
// Certificates are valid by default, so the health check reads green on a
// fresh environment. Pick another scenario to exercise the other states, then
// restart the container:
//
//   docker compose -f docker/osd-dev/dev.yml restart imposter
//
//   healthy      green,  valid for 10 years
//   warning      yellow, listener expires in 20 days
//   critical     red,    listener expires in 3 days
//   expired      red,    listener expired yesterday
//   ca-mismatch  red,    no CA in the bundle signs the listener certificate
//   chain-invalid red,   signs the leaf but does not validate as a chain
//   read-failure yellow, the bundle file cannot be read right now
//   unavailable  yellow, the manager could not reach the daemon
//   notfound     yellow, the node does not expose the resource
var SCENARIO = 'healthy';

var DAY = 24 * 60 * 60;
var nowTs = Math.floor(Date.now() / 1000);
var nodeId = context.request.pathParams.node_id || 'node01';

function iso(ts) {
  return new Date(ts * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function certificate(subject, issuer, secondsUntilExpiry, extra) {
  var cert = {
    subject: subject,
    issuer: issuer,
    not_before: iso(nowTs - 365 * DAY),
    not_before_ts: nowTs - 365 * DAY,
    not_after: iso(nowTs + secondsUntilExpiry),
    not_after_ts: nowTs + secondsUntilExpiry,
    seconds_until_expiry: secondsUntilExpiry,
    fingerprint: 'x509-sha256:3f1a',
    serial: '0x1a2b3c',
  };
  for (var key in extra) {
    cert[key] = extra[key];
  }
  return cert;
}

var leafSeconds = 3650 * DAY;
var signsActiveLeaf = true;
var chainValid = true;
var chainError = null;
var readFailure = null;

switch (SCENARIO) {
  case 'warning':
    leafSeconds = 20 * DAY;
    break;
  case 'critical':
    leafSeconds = 3 * DAY;
    break;
  case 'expired':
    leafSeconds = -1 * DAY;
    break;
  case 'ca-mismatch':
    signsActiveLeaf = false;
    chainValid = false;
    chainError = 'unable to get local issuer certificate';
    break;
  case 'chain-invalid':
    chainValid = false;
    chainError = 'invalid CA certificate';
    break;
  case 'read-failure':
    readFailure = {
      cause: 'cannot be opened (No such file or directory)',
      errno: 2,
      consecutive: 2,
    };
    break;
}

if (SCENARIO === 'notfound') {
  respond()
    .withStatusCode(404)
    .withContent(
      JSON.stringify({
        title: 'Not Found',
        detail: 'The requested resource does not exist',
      }),
    );
} else if (SCENARIO === 'unavailable') {
  respond()
    .withStatusCode(200)
    .withContent(
      JSON.stringify({
        data: {
          affected_items: [
            {
              node: nodeId,
              state: 'unavailable',
              reason: 'remoted is not running',
            },
          ],
          total_affected_items: 1,
          failed_items: [],
          total_failed_items: 0,
        },
        message: 'Certificate validity was not determined',
        error: 0,
      }),
    );
} else {
  var snapshot = {
    node: nodeId,
    available: true,
    evaluated_at: iso(nowTs - 3600),
    evaluated_at_ts: nowTs - 3600,
    listener: certificate('CN=' + nodeId, 'CN=Corp Root CA', leafSeconds, {
      sans: [nodeId + '.example.com', '10.0.0.5'],
      path: 'etc/certs/remoted.pem',
      loaded_at: iso(nowTs - 86400),
      loaded_at_ts: nowTs - 86400,
    }),
    ca_bundle: {
      path: 'etc/certs/root-ca.pem',
      publication: 0,
      publication_vouched: false,
      content_sha256: 'e3b0c44298fc1c149afbf4c8996fb924',
      certificates_count: 1,
      certificates_limit: 6,
      serialized_bytes: 2428,
      serialized_bytes_limit: 8191,
      matches_active_leaf: signsActiveLeaf,
      chain_valid: chainValid,
      certificates: [
        certificate('CN=Corp Root CA', 'CN=Corp Root CA', 3650 * DAY, {
          signs_active_leaf: signsActiveLeaf,
        }),
      ],
    },
  };

  if (chainError) {
    snapshot.ca_bundle.chain_error = chainError;
  }

  if (readFailure) {
    snapshot.ca_bundle.last_read_failure = readFailure;
  }

  respond()
    .withStatusCode(200)
    .withContent(
      JSON.stringify({
        data: {
          affected_items: [snapshot],
          total_affected_items: 1,
          failed_items: [],
          total_failed_items: 0,
        },
        message: 'Certificate validity was returned',
        error: 0,
      }),
    );
}
