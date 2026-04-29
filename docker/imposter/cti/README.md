Mocks the CTI Console registration and authorization endpoints used during
local development of the Wazuh Dashboard CTI integration.

## What it mocks

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

## Forcing a polling result

By default the mock returns `authorization_pending` for the first 2 polls and
then `success` (200 with `access_token`). To force a specific scenario, send
the header `X-Mock-Scenario` with one of:

- `success`
- `pending` (alias `authorization_pending`)
- `slow_down`
- `access_denied`
- `expired_token`

## Files

- `openapi.yml` — OpenAPI 3.0 specification consumed by Imposter.
- `cti-config.yml` — Imposter resource configuration.
- `token.js` — Dispatch logic (body parsing, scenario selection, poll counter).
- `responses/*.json` — Static payloads for each response.

> **Note:** Imposter scripts run on **Nashorn (ES5 only)**. Avoid trailing
> commas in function calls, `const`/`let`, arrow functions, template literals,
> destructuring and any other ES2015+ syntax in `token.js`.

## Topology

This mock runs **inside the existing Imposter container** (no extra service
required). With `IMPOSTER_CONFIG_SCAN_RECURSIVE=true` on the Imposter service
(see `docker/osd-dev/dev.yml` and `docker/kbn-dev/dev.yml`), every `*-config.yml`
under `/opt/imposter/config` is loaded, including `cti/cti-config.yml` alongside
`wazuh-config.yml`. Paths do not collide with the Wazuh API mocks.

## Quick test

`client_id` must match the **environment UID**: the same value as OpenSearch **`cluster_uuid`** from `GET /` on the cluster root (the dashboard uses that automatically). For ad-hoc curls against Imposter you can use any placeholder string the mock accepts.

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