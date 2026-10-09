// Stores the polling scenario used by token.js when a request carries no
// `X-Mock-Scenario` header (the dashboard server never sends it):
//   POST /mock/cti/scenario  scenario=<name>
// An empty or `default` scenario restores the default behaviour (pending for
// 2 polls, then success).

var SCENARIOS = [
  'success',
  'pending',
  'authorization_pending',
  'slow_down',
  'access_denied',
  'expired_token',
  'environment_exists',
];

var store = stores.open('storeCti');

// Reads `scenario` from a form-urlencoded or JSON body.
function readScenario(rawBody) {
  var trimmed = rawBody ? String(rawBody).trim() : '';
  if (trimmed.charAt(0) === '{') {
    try {
      return JSON.parse(trimmed).scenario || '';
    } catch (e) {
      return '';
    }
  }
  var match = /(?:^|&)scenario=([^&]*)/.exec(trimmed);
  return match ? decodeURIComponent(match[1]) : '';
}

function respondJson(statusCode, body) {
  respond()
    .withStatusCode(statusCode)
    .withHeader('Content-Type', 'application/json')
    .withContent(JSON.stringify(body));
}

var scenario = String(readScenario(context.request.body)).toLowerCase();

if (scenario === '' || scenario === 'default') {
  store.delete('scenario');
  store.save('pollCount', 0);
  respondJson(200, { scenario: 'default' });
} else if (SCENARIOS.indexOf(scenario) === -1) {
  var unknown = { error: 'Unknown scenario' };
  unknown.scenarios = SCENARIOS.concat(['default']);
  respondJson(400, unknown);
} else {
  store.save('scenario', scenario);
  respondJson(200, { scenario: scenario });
}
