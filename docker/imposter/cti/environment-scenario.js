// Stores the scenario of `GET /api/v1/platform/environments/me` (see
// environment.js):
//   POST /mock/cti/environment/scenario  scenario=<name>
// An empty or `default` scenario restores `professional`.

var SCENARIOS = [
  'professional',
  'canceling',
  'open',
  'token_rejected',
  'unavailable',
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
  store.delete('environmentScenario');
  respondJson(200, { scenario: 'professional' });
} else if (SCENARIOS.indexOf(scenario) === -1) {
  var unknown = { error: 'Unknown scenario' };
  unknown.scenarios = SCENARIOS.concat(['default']);
  respondJson(400, unknown);
} else {
  store.save('environmentScenario', scenario);
  respondJson(200, { scenario: scenario });
}
