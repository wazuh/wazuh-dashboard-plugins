# CTI Console Imposter mock + dev Imposter wiring

## Summary

- Introduced OpenAPI specification for the CTI Console mock API.
- Created configuration and response files for OAuth 2.0 Device Authorization Grant.
- Implemented logic for handling device authorization requests and access token polling in `token.js`.
- Added README documentation detailing the mock functionality and usage examples.
- Configured the **Imposter** service in dev Compose (`IMPOSTER_CONFIG_SCAN_RECURSIVE=true` in `docker/osd-dev/dev.yml` and `docker/kbn-dev/dev.yml`) so `docker/imposter/cti/cti-config.yml` is loaded next to `wazuh-config.yml`.
- Fixed `security/login.js` so JWT mocking no longer loads jsrsasign from GitHub `master` (ES6+ breaks Nashorn); signing uses `javax.crypto` / `java.util.Base64` on the JVM.

### Description

This change adds a **local mock** for the CTI Console device flow on a single endpoint, `POST /api/v1/platform/environments/token`, so the dashboard and other components can exercise registration/authorization **without real CTI infrastructure**.

The mock lives under `docker/imposter/cti/`: OpenAPI contract (`openapi.yml`), Imposter config (`cti-config.yml`), Nashorn script (`token.js`), and static JSON responses. It supports **form-urlencoded and JSON** bodies, default **two `authorization_pending` polls then success**, and optional **`X-Mock-Scenario`** to force `success`, `pending` / `authorization_pending`, `slow_down`, `access_denied`, or `expired_token`.

With recursive config scan enabled on the **Imposter** container, Imposter loads `cti/cti-config.yml` alongside the existing Wazuh API mock (`wazuh-config.yml`). CTI paths do not overlap the Wazuh manager OpenAPI routes.

### Issues Resolved

- [wazuh/internal-devel-requests#4620](https://github.com/wazuh/internal-devel-requests/issues/4620) — Mock CTI Console device authorization grant (`POST /api/v1/platform/environments/token`) with success and error scenarios; single Imposter process, extra config under `docker/imposter/cti/`, recursive scan.
- Imposter `POST /security/user/authenticate` failing with Nashorn `SyntaxError` after upstream jsrsasign added `const` — fixed by removing remote `load()` of jsrsasign and signing the mock JWT with JVM crypto APIs.

### Evidence

Responses below were captured against Imposter **3.44.1** using the repository’s `docker/imposter` directory as `/opt/imposter/config` and `IMPOSTER_CONFIG_SCAN_RECURSIVE=true`. The example base URL `http://127.0.0.1:18091` was a **mapped port on the host** for that run; on the osd-dev stack, use **`http://imposter:8080`** from containers on the same Compose network (e.g. `osd`).

#### 1. Device authorization (`client_id` only) — 200

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "device_code": "mock_device_code_123",
  "user_code": "WZH-999",
  "verification_uri": "https://cti.wazuh.com/activate",
  "expires_in": 600,
  "interval": 5
}
```

```bash
curl -si -X POST 'http://127.0.0.1:18091/api/v1/platform/environments/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'client_id=a17c21ed'
```

#### 2. Token polling — default (pending ×2, then success)

Poll 1 — **400** `authorization_pending`:

```json
{
  "error": "authorization_pending",
  "error_description": "The authorization request is still pending"
}
```

Poll 2 — **400** `authorization_pending` (same body as poll 1).

Poll 3 — **200** access token:

```json
{
  "access_token": "asdf1234",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

```bash
curl -si -X POST 'http://127.0.0.1:18091/api/v1/platform/environments/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'grant_type=urn:ietf:params:oauth:grant-type:device_code&client_id=a17c21ed&device_code=mock_device_code_123'
```

(Execute the same command three times in sequence for the default flow.)

#### 3. Forced scenario — `X-Mock-Scenario: slow_down` — 400

```json
{
  "error": "slow_down",
  "error_description": "Polling too frequently. Increase the polling interval"
}
```

```bash
curl -si -X POST 'http://127.0.0.1:18091/api/v1/platform/environments/token' \
  -H 'X-Mock-Scenario: slow_down' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'grant_type=urn:ietf:params:oauth:grant-type:device_code&client_id=a17c21ed&device_code=mock_device_code_123'
```

#### 4. JSON body for device step — 200

Same device authorization JSON as in §1.

```bash
curl -si -X POST 'http://127.0.0.1:18091/api/v1/platform/environments/token' \
  -H 'Content-Type: application/json' \
  -d '{"client_id":"a17c21ed"}'
```

#### 5. Wazuh API mock — `POST /security/user/authenticate` — 200

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{"data":{"token":"<JWT>","error":0}}
```

```bash
curl -si -X POST 'http://127.0.0.1:18091/security/user/authenticate' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Test

Do **not** hand-roll a standalone Imposter container for day-to-day work. Bring the stack up with the osd-dev wrapper (see `docker/osd-dev/README.md`):

```bash
./docker/osd-dev/dev.sh up
```

Alternatively, from `docker/osd-dev/`: `./dev.sh up`. The wrapper runs the TypeScript dev tooling, which applies `docker/osd-dev/dev.yml` (including the **Imposter** service: `outofcoffee/imposter`, bind mount `docker/imposter` → `/opt/imposter/config`, and `IMPOSTER_CONFIG_SCAN_RECURSIVE=true`). After `up`, CTI and Wazuh mocks are reachable on the Compose network at **`http://imposter:8080`**.

#### How to exercise endpoints

| Where you run `curl` | Base URL |
|----------------------|----------|
| Inside the `osd` container (or any service on the same Compose network as `imposter`) | `http://imposter:8080` |

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/platform/environments/token` | CTI mock: `client_id`-only body → device codes; device grant + `device_code` → token or OAuth errors. |
| `POST` | `/security/user/authenticate` | Wazuh API mock JWT; expect **200** and no Nashorn errors in Imposter logs. |
| `GET` | `/` | Wazuh API info (quick health check). |

#### Copy-paste (from `osd` shell, base `http://imposter:8080`)

```bash
curl -i -X POST http://imposter:8080/api/v1/platform/environments/token \
  -d 'client_id=a17c21ed'

curl -i -X POST http://imposter:8080/api/v1/platform/environments/token \
  -d 'grant_type=urn:ietf:params:oauth:grant-type:device_code&client_id=a17c21ed&device_code=mock_device_code_123'

curl -i -X POST http://imposter:8080/api/v1/platform/environments/token \
  -H 'X-Mock-Scenario: expired_token' \
  -d 'grant_type=urn:ietf:params:oauth:grant-type:device_code&client_id=a17c21ed&device_code=mock_device_code_123'

curl -i -X POST http://imposter:8080/security/user/authenticate \
  -H 'Content-Type: application/json' -d '{}'
```

#### Logs

If you need to confirm the Imposter container picked up config changes:

```bash
docker logs "$(docker ps --filter 'name=imposter' --format '{{.Names}}' | head -1)" 2>&1 | tail -80
```

(Adjust the filter if your compose project prefixes container names differently.)

### Check List

- [ ] All tests pass
  - [ ] `yarn test:jest`
- [ ] New functionality includes testing.
- [ ] New functionality has been documented (`docker/imposter/cti/README.md`).
- [ ] Update [CHANGELOG.md](../../../CHANGELOG.md) (path from this file; on GitHub use `./CHANGELOG.md` from repository root).
- [ ] Commits are signed per the DCO using `--signoff`
