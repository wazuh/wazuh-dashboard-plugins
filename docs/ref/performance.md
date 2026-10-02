# Performance

Use these practices to keep the dashboard responsive in large deployments.

## Query and UI practices

- Narrow time ranges when exploring data-heavy views.
- Use filters before opening high-cardinality tables.
- Limit large exports and avoid exporting very large saved object sets.

## Indexer considerations

- Ensure the Wazuh indexer is sized for your data volume and retention.
- Monitor shard counts and index sizes to prevent slow queries.

## Dashboard configuration

- `timeout` (Advanced settings, default `20000` ms) bounds how long the dashboard waits for some
  UI-triggered requests — raise it if large deployments see premature timeouts on heavy views, but
  prefer narrowing the query first.
- `reports.csv.maxRows` (Advanced settings, default `10000`) caps the rows of the CSV exports built
  from Server API tables (for example, the agents and groups lists), which the dashboard fetches
  page by page; a larger table is truncated to that many rows. Raising it makes those exports
  issue more Server API requests.
- `healthcheck.interval` (`opensearch_dashboards.yml`, default `15m`) controls how often the
  recurring health check re-runs after the initial one — see
  [Health check](modules/healthcheck.md#settings). A shorter interval means more background load
  from the registered checks; there is usually no need to go below the default.
- `--max-old-space-size` (and other Node.js flags) go in `/etc/wazuh-dashboard/node.options`, one
  flag per line, to raise the Node.js heap limit on deployments that serve many concurrent users
  or very large result sets.
- `opensearch.requestTimeout` (`opensearch_dashboards.yml`, default `30s`) bounds how long the
  dashboard waits for a single request to the Wazuh indexer before failing it.

## Client performance

- Use modern browsers and keep them updated.
- Prefer wired or low-latency networks when operating on large datasets.
