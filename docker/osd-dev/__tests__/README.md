# dev.sh Bats Tests

This directory contains the automated test suite for `dev.sh`, based on [bats-core](https://github.com/bats-core/bats-core) and executed via Docker Compose.

## Prerequisites

- Docker 24+ and Docker Compose v2 available in your `PATH`.
- Permissions to build local images.

## How to run the tests

From `docker/osd-dev`:

```bash
__tests__/run-tests.sh
```

The script will build the image defined in `__tests__/Dockerfile` (if necessary) and start the `dev-sh-tests` service described in `__tests__/test.yml` to execute `__tests__/dev.sh.bats`.

### Filter specific cases

Pass additional arguments so that Bats only runs matching tests:

```bash
__tests__/run-tests.sh --filter "server-local"
```

### Debugging

To inspect the execution inside the container you can keep it open:

```bash
__tests__/run-tests.sh --keep-going --no-tempdir
```

After running the tests, `dev.override.generated.yml` will be created (or cleaned) as appropriate; the test scripts take care of removing artifacts.

