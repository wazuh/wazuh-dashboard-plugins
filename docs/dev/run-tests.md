# How to run the tests

Tests are executed per plugin from within the Docker development environment. First, follow the steps in [Run from Sources](run-sources.md) to bring up the development environment.

## Starting the development environment

```bash
./dev.sh up
```

Once the containers are running, access the OpenSearch Dashboards container:

```bash
docker exec -it <container-id> bash
# Or use the container name pattern (e.g., osd-dev-330-osd-1)
docker exec -it osd-dev-330-osd-1 bash
```

Find your container ID or name:

```bash
docker ps | grep osd
```

## Unit tests (Jest)

From inside the container, run Jest tests from the plugin directory:

```bash
cd plugins/main
yarn test:jest
```

Repeat the same pattern for `plugins/wazuh-core` and
`plugins/wazuh-check-updates` if needed.

Jest will execute all `.test.ts` and `.test.tsx` files in the plugin and display results with coverage information.

## Important Notes

- Tests **must be executed inside the Docker container** – running tests directly on the host machine will fail due to missing dependencies and environment setup (e.g., `setup_node_env`).
- Ensure the Docker development environment is running before attempting to run tests (see [Run from Sources](run-sources.md)).
- The container includes all necessary Node.js dependencies and Jest for unit testing.
- Some test suites may produce warnings or console messages that do not affect test results (e.g., "Browserslist: caniuse-lite is outdated", prop validation warnings).
- **Note:** Other test scripts listed in `package.json` (e.g., `test:server`, `test:browser`, `test:ui:runner`) are not available in the Docker development environment as they require additional OpenSearch Dashboards infrastructure not included in the dev setup. For comprehensive testing, use the CI/CD pipeline or a production-like environment setup.
