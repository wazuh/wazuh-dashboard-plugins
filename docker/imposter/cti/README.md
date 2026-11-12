Mocks the CTI Console registration and authorization endpoints used during
local development of the Wazuh Dashboard CTI integration.

## What it mocks

### CTI Console (device flow)

A single endpoint implementing the OAuth 2.0 Device Authorization Grant
(RFC 8628):

```
POST /api/v1/platform/environments/token
```

The response depends on the request body:

| Body                                                                                    | Behaviour                                            |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `client_id` only                                                                        | Returns the **Device Authorization Response** (200). |
| `grant_type=urn:ietf:params:oauth:grant-type:device_code` + `client_id` + `device_code` | Returns the **Access Token polling** result.         |

Both `application/x-www-form-urlencoded` and `application/json` request
bodies are accepted.

### CTI Console (plan of the registered environment)

The indexer Content Manager calls these with the stored access token to read
the plan. Point the indexer at the mock to use them (see
[Pointing the indexer at this mock](#pointing-the-indexer-at-this-mock)).

```
GET /api/v1/platform/environments/me
GET /api/v1/catalog/plans
```

`environments/me` returns the environment name, its organization, its
registration date, the active plan and the subscriptions paying for it:

```json
{
  "name": "environment-01",
  "organization": { "name": "Acme Corp" },
  "registered_at": "2026-03-01T10:00:00Z",
  "plans": [{ "name": "Professional", "is_public": false, "features": [] }],
  "subscriptions": [
    {
      "plan": "Professional",
      "interval": "year",
      "started_at": "2026-03-01T10:00:00Z",
      "renews_at": "2027-03-01T10:00:00Z",
      "expires_at": null
    }
  ]
}
```

The indexer does not forward any mock header, so store the scenario in the
mock:

```bash
curl -X POST http://imposter:8080/mock/cti/environment/scenario -d 'scenario=canceling'
```

| Scenario                 | Answer                                                                       |
| ------------------------ | ---------------------------------------------------------------------------- |
| `professional` (default) | The Professional plan and its yearly subscription, which renews.             |
| `canceling`              | The same subscription set to end: `renews_at: null`, `expires_at` set.       |
| `open`                   | The public plan and no subscription.                                         |
| `token_rejected`         | `401`: the indexer clears its credentials and falls back to the public plan. |
| `unavailable`            | `503`: the indexer keeps the registration and answers its GET with `502`.    |

`default` restores `professional`. `catalog/plans` always returns the Open
(public) and Professional plans.

### Content Manager (`/_plugins/_content_manager/subscription`)

**Not mocked here.** The dashboard calls those paths on the **OpenSearch
cluster** configured for OpenSearch Dashboards. Use your indexer directly
(e.g. `curl` against `:9200`) to test GET/POST subscription.

## Forcing a polling result

By default the mock returns `authorization_pending` for the first 2 polls and
then `success` (200 with `access_token`). To force a specific scenario, send
the header `X-Mock-Scenario` with one of:

- `success`
- `pending` (alias `authorization_pending`)
- `slow_down`
- `access_denied`
- `expired_token`
- `environment_exists`: what the real CTI Console does after rejecting a user
  code with "Environment already exists". The rejection is never reported:
  the code stays pending and every poll answers `authorization_pending`.

The dashboard server does not forward that header. To drive a scenario through
the dashboard, store it in the mock instead (the header still wins when sent):

```bash
curl -X POST http://imposter:8080/mock/cti/scenario -d 'scenario=environment_exists'
# Back to the default behaviour (pending x2, then success):
curl -X POST http://imposter:8080/mock/cti/scenario -d 'scenario=default'
```

To reproduce the "Environment already exists" flow, store `environment_exists`,
start a registration from the dashboard, and wait until the modal explains the
rejection (one minute after the code was issued). Then store `default` (the
equivalent of deleting the deployment in Wazuh CTI) and the registration
completes on the next polls.

## Files

- `openapi.yml` — OpenAPI 3.0 specification consumed by Imposter.
- `cti-config.yml` — Imposter resource configuration.
- `token.js` — Dispatch logic (body parsing, scenario selection, poll counter).
- `scenario.js` — Stores the scenario used when no `X-Mock-Scenario` header is sent.
- `environment.js` — Answers `GET /api/v1/platform/environments/me` for the stored scenario.
- `environment-scenario.js` — Stores the `environments/me` scenario.
- `responses/catalog_plans.json` — Answer of `GET /api/v1/catalog/plans`.

> **Note:** Imposter scripts run on **Nashorn (ES5 only)**. Avoid trailing
> commas in function calls, `const`/`let`, arrow functions, template literals,
> destructuring and any other ES2015+ syntax in the `*.js` scripts.

## Topology

This mock runs **inside the existing Imposter container** (no extra service
required). With `IMPOSTER_CONFIG_SCAN_RECURSIVE=true` on the Imposter service
(see `docker/osd-dev/dev.yml`), every `*-config.yml`
under `/opt/imposter/config` is loaded, including `cti/cti-config.yml` alongside
`wazuh-config.yml`. Paths do not collide with the Wazuh API mocks.

## Quick test

`client_id` must match the **environment UID**: the same value as **`cluster_uuid`** from `GET /` on the cluster root (the dashboard uses that automatically). For ad-hoc curls against Imposter you can use any placeholder string the mock accepts.

```bash
# 1. Device authorization request
curl -i -X POST http://imposter:8080/api/v1/platform/environments/token \
  -d 'client_id=a17c21ed'

# 2. Token polling (default: pending x2, then success)
curl -i -X POST http://imposter:8080/api/v1/platform/environments/token \
  -d 'grant_type=urn:ietf:params:oauth:grant-type:device_code&client_id=a17c21ed&device_code=mock_device_code_123'

# 3. Force a specific error
curl -i -X POST http://imposter:8080/api/v1/platform/environments/token \
  -H 'X-Mock-Scenario: expired_token' \
  -d 'grant_type=urn:ietf:params:oauth:grant-type:device_code&client_id=a17c21ed&device_code=mock_device_code_123'
```

## Pointing the dashboard at this mock

The CTI Console base URL defaults to the compiled constant
(`WAZUH_CTI_CONSOLE_BASE_URL` in
`plugins/wazuh-check-updates/common/constants.ts`). Override it in
`opensearch_dashboards.yml` to target this mock — or any other CTI environment:

```yml
wazuh_check_updates.ctiApiUrl: 'http://imposter:8080'
```

The setting is absent from the shipped configuration file, so without it the
device flow keeps going to the default CTI environment. Only the `http` and
`https` schemes are accepted; an invalid value stops the dashboard at startup.
A restart is required for a change to take effect.

## Pointing the indexer at this mock

The indexer Content Manager reads the CTI API base from the
`plugins.content_manager.cti.api` setting in `opensearch.yml` (default: the
`pre` CTI environment). To read the plan from this mock:

```yml
plugins.content_manager.cti.api: 'http://imposter:8080/api/v1'
```

Restart the indexer afterwards. Then `GET /_plugins/_content_manager/subscription`
reports the plan of the stored `environments/me` scenario once a token is
registered, and the dashboard status route
(`GET /api/wazuh-check-updates/cti-registration/status`) passes the identity and
the dates through when the indexer returns them.

The catalog content endpoints (consumers, changes, snapshots) are **not**
mocked: content sync fails while the indexer points at the mock. Point it back
at the real CTI API to sync content.
