// Mock for the CTI Console endpoint the indexer Content Manager calls with the
// stored access token to read the plan of the registered environment:
//   GET /api/v1/platform/environments/me
//
// The response is chosen by the scenario stored with
// `POST /mock/cti/environment/scenario` (see environment-scenario.js), because
// the indexer does not forward any mock header:
//   - `professional` (default): the Professional plan and its yearly
//     subscription, which renews.
//   - `canceling`: the same subscription, set to end instead of renewing
//     (`renews_at: null`, `expires_at` set).
//   - `open`: the public plan and no subscription.
//   - `token_rejected`: 401, so the indexer clears its credentials.
//   - `unavailable`: 503, so the indexer keeps the registration and answers
//     its subscription request with 502.

var store = stores.open('storeCti');

var PROFESSIONAL_PLAN = {
  name: 'Professional',
  is_public: false,
  features: [
    {
      name: 'Vulnerability CVE Stream',
      description:
        'Delta updates for vulnerability entries in the Wazuh CTI catalog.',
      resource:
        'https://cti.dev.cloud.wazuh.com/api/v1/catalog/contexts/vulnerabilities_vdp/consumers/vdp_v1',
      type: 'cti:catalog:consumer:vulnerabilities',
    },
  ],
};

var OPEN_PLAN = { name: 'Open', is_public: true, features: [] };

function buildEnvironment(scenario) {
  var environment = {
    name: 'environment-01',
    organization: { name: 'Acme Corp' },
    registered_at: '2026-03-01T10:00:00Z',
    plans: [PROFESSIONAL_PLAN],
    subscriptions: [
      {
        plan: 'Professional',
        interval: 'year',
        started_at: '2026-03-01T10:00:00Z',
        renews_at: '2027-03-01T10:00:00Z',
        expires_at: null,
      },
    ],
  };
  if (scenario === 'canceling') {
    environment.subscriptions[0].renews_at = null;
    environment.subscriptions[0].expires_at = '2027-03-01T10:00:00Z';
  } else if (scenario === 'open') {
    environment.plans = [OPEN_PLAN];
    environment.subscriptions = [];
  }
  return environment;
}

function respondJson(statusCode, body) {
  respond()
    .withStatusCode(statusCode)
    .withHeader('Content-Type', 'application/json')
    .withContent(JSON.stringify(body));
}

var scenario = store.load('environmentScenario') || 'professional';

if (scenario === 'token_rejected') {
  respondJson(401, { error: 'unauthorized' });
} else if (scenario === 'unavailable') {
  respondJson(503, { error: 'service_unavailable' });
} else {
  respondJson(200, buildEnvironment(scenario));
}
