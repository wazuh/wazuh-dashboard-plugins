# Wazuh alerts generator

This is an utility to generate sample data related to Wazuh alerts.

The code is based in a feature included in the Wazuh plugin for Kibana or Wazuh dashboard.

A command line interface was created to use it.

# Requirements

- NodeJS

# Usage

```sh
node cli.js [options]
```

## Help

```sh
node cli.js --help
```

## Examples

```sh
node cli.js --examples
```

# Develop or use with Docker

If want to use Docker to develop or use, create a container with:

```
docker run -itd --rm --name wazuh-alerts-generator -w "/home/node/app" -v "$(pwd):/home/node/app" node:14.15-alpine3.13
```

Then, you can to enter to the container and use `NodeJS` CLI to develop or use the utility.

# How to create sample data and index to an existent Elasticsearch, OpenSearch or Wazuh indexer instance

1. Generate the sample data using Wazuh alerts generator with the `bulk-api` format and save the output to a file:
```sh
node cli.js --format bulk-api <options> > output.json
```
where `<options>` is the rest of options

2. Index the data through the bulk API to Elasticsearch, OpenSearch or Wazuh indexer instance
- Server doesn't need authentication and it served in http:
```sh
curl <server_address>/_bulk -H "Content-Type: application/x-ndjson" --data-binary "@output.ndjson"
```

- Server needs authentication and it served in https:
```sh
curl -k -u <username>:<password> <server_address>/_bulk -H "Content-Type: application/x-ndjson" --data-binary "@output.ndjson"
```

> Note to replace the placeholders.