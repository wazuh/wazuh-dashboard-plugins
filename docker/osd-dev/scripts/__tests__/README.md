# dev.ts Jest Tests

This directory contains the automated Jest test suite for `docker/osd-dev/scripts/dev.ts`.

It mirrors the pattern used in `docker/osd-dev/__tests__` and keeps all testing config and dependencies isolated within a Docker image.

## How to run

From `docker/osd-dev/scripts` (or anywhere inside the repo):

```bash
docker/osd-dev/scripts/__tests__/run-tests.sh
```

Pass extra arguments to forward them to `jest` (e.g. filtering by name):

```bash
docker/osd-dev/scripts/__tests__/run-tests.sh --testNamePattern "Auto-detection"
```

The test service is defined in `docker/osd-dev/scripts/__tests__/test.yml` and builds from `docker/osd-dev/scripts/__tests__/Dockerfile`, which installs its own `jest`, `ts-jest`, and `typescript` without touching your workspace.

## Structure

- `jest.config.js` – Jest config scoped to this folder.
- `tsconfig.json` – TypeScript options used by ts-jest.
- `Dockerfile` – Container image for running tests; installs dependencies.
- `test.yml` – Docker Compose service definition for the test runner.
- `run-tests.sh` – Helper to build and run the test container.
- `__mocks__/` – Place optional Jest manual mocks here when needed.

