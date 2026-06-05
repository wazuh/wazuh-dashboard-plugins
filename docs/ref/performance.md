# Performance

Use these practices to keep the dashboard responsive in large deployments.

## Query and UI practices

- Narrow time ranges when exploring data-heavy views.
- Use filters before opening high-cardinality tables.
- Limit large exports and avoid exporting very large saved object sets.

## Indexer considerations

- Ensure the Wazuh indexer is sized for your data volume and retention.
- Monitor shard counts and index sizes to prevent slow queries.

## Client performance

- Use modern browsers and keep them updated.
- Prefer wired or low-latency networks when operating on large datasets.
