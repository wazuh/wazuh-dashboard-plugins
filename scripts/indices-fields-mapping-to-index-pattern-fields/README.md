# Description

This tool maps the index field mappings definitions to index pattern fields of Wazuh dashboard.

Example:

Index field mapping:

```json
{
  "mappings": {
    "properties": {
      "rule": {
        "properties": {
          "level": {
            "type": "keyword"
          }
        }
      }
    }
  }
}
```

Index pattern field:

```json
{
  "name": "rule.level",
  "type": "string",
  "esTypes": ["keyword"],
  "searchable": true,
  "aggregatable": true,
  "readFromDocValues": true
}
```

This can be used to generate a static file with the index pattern fields from index templates to use as values by default when creating the default index patterns in the Wazuh dashboard initialization.

# Usage

```console
node cli.js --template <url/file> [options]
```

See the help for more information:

```console
node cli.js --help
```

# Use cases

## Fetch template from URL and save to a file

```console
node cli.js --template https://example/template.json --output output.json
```

## Fetch template from URL and display the output to stdout

```console
node cli.js --template https://example/template.json
```

## Get template from file and save to a file

```console
node cli.js --template path/to/template.json --output output.json
```

## Get template from file and display the output to stdout

```console
node cli.js --template path/to/template.json
```

# References

- Wazuh index templates: https://github.com/wazuh/wazuh-indexer-plugins/tree/main/plugins/setup/src/main/resources
