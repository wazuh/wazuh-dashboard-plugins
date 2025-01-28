# Description

This directory contains tools to generate static files with information about the index pattern
fields for the Wazuh indices using different approaches:

- build-static-files-get-from-wildcard: retrieve the index pattern fields from Wazuh dashboard indexing the Wazuh indexer templates
- build-static-files-transform-templates: get the template from [wazuh/wazuh-indexer/plugins] and transform locally the data

# build-static-files-get-from-wildcard

## Usage

```console
node build-static-files-get-from-wildcard.js --branch master
```

By default, this should move the static files to `plugins/wazuh-core/server/initialization/index-pattern-fields` directory that are used to define the initialization tasks related to index patterns.

> [NOTE]
> If you are using a Wazuh dashboard development, move the files could cause the Wazuh dashboard is restarted, losing the data, define an external directory for the output and move manually the files after checing they were generated correctly.

# build-static-files-transform-templates

This tool uses under the hood the [CLI](../README.md).

## Usage

```console
node build-static-files-get-from-wildcard.js --branch master
```

By default, this should move the static files to `plugins/wazuh-core/server/initialization/index-pattern-fields` directory that are used to define the initialization tasks related to index patterns.
