# Description

This folder contains the releasing tools:

- `bump`: bumps the `version`, `revision` and `pluginPlatform.version` values of the plugins
- `tag`: create a tag (final or non-final)

# Bump

It means to increment the plugin version or revision or platform version number to a new and unique value.

This script bumps the plugins

- version
- revision
- platform version
- specific plugin tasks

See the help:

```console
node bump.js -h
```

## Usage

- Take the values from a package manifest file (`package.json`) and replace some value (`version`, `revision` or `platform-plugin`):

```console
node scripts/release/bump.js --plugins-directory <plugins_directory> --manifest-changelog <manifest_changelog_file> --manifest-package <manifest_package_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --revision <bump_revision>
```

Example:

```console
node scripts/release/bump.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/4.6.0/api/api/spec/spec.yaml --manifest-package ./plugins/main/package.json --revision 03
```

- Change the plugin version. Take the `revision` and `platform-version` parameters from the specified manifest plugin package file.

```console
node scripts/release/bump.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/4.6.0/api/api/spec/spec.yaml --manifest-package ./plugins/main/package.json --version 4.6.0
```

- Change the plugin revision. Take the `version` and `platform-version` parameters from the specified manifest plugin package file.

```console
node scripts/release/bump.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/4.6.0/api/api/spec/spec.yaml --manifest-package ./plugins/main/package.json --revision 03
```

- Change the platform version. Take the `version` and `revision` parameters from the specified manifest plugin package file.

```console
node scripts/release/bump.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/4.6.0/api/api/spec/spec.yaml --manifest-package ./plugins/main/package.json --platform-version 2.8.0
```

- Define the values for `version`, `revision` and `platform-version`:

```console
node scripts/release/bump.js --plugins-directory <plugins_directory> --manifest-changelog <manifest_changelog_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --version <bump_version> --revision <bump_revision> --platform-version <bump_platform_version>
```

Example:

```console
node scripts/release/bump.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/4.6.0/api/api/spec/spec.yaml --version 4.6.0 --revision 03 --platform-version 2.8.0
```

# Tag

This script creates the tag.

> Under the hoods, run the bump script so this lets to bump the version, revision or plugin platform but this is should be done in the bump process.

See the help:

```console
node tag.js -h
```

## Usage

### Add a suffix to the tag

For tags that needs a suffix, use the `--tag-suffix <tag-suffix>` flag.

```console
node scripts/release/tag.js --plugins-directory <plugins_directory> --manifest-changelog <changelog_file> --manifest-package <manifest_package_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --tag-suffix <tag-suffix>
```

Example:

```console
node scripts/release/tag.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --manifest-package ./plugins/main/package.json --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/v4.6.0/api/api/spec/spec.yaml --version 4.6.0 --revision 03 --platform-version 2.8.0 --tag-suffix -rc2
```

For non-final tags (pre-alpha, alpha, beta, rc):

Example:

```
node scripts/release/tag.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --manifest-package ./plugins/main/package.json --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/v4.6.0/api/api/spec/spec.yaml --manifest-package ./plugins/main/package.json --tag-suffix -rc2
```

### Sign tag

It uses the `--tag-sign`.

### Annotate tag

It uses the `--tag-annotate`.

### Bump version, revision or platform version. NOT APPLICABLE.

IMPORTANT: The script lets to bumps the values, but this should be done in the bump process instead of creating the tag.

- Define the `version`, `revision` and `pluginPlatformVersion`:

```console
node scripts/release/tag.js --plugins-directory <plugins_directory> --manifest-changelog <changelog_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --version <bump_version> --revision <bump_revision> --platform-version <bump_platform_version>
```

Example:

```console
node scripts/release/tag.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/v4.6.0/api/api/spec/spec.yaml --version 4.6.0 --revision 03 --platform-version 2.8.0
```

- Use a `manifest-package` as base to take the `version`, `revision` and `pluginPlatformVersion` values:

```console
node scripts/release/tag.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/v4.6.0/api/api/spec/spec.yaml --manifest-package ./plugins/main/package.json
```

> If the version, the revision or platform version is not specified, then you can define the package manifest file base to take these values.
> You can overwrite these values using the appropiate configuration (`version`, `revision` or `platform-version`) too or combine them in this step.
> It is not recommended because these values should be bumped previously to create the tag.

```console
node scripts/release/tag.js --plugins-directory <plugins_directory> --manifest-changelog <changelog_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --manifest-package <manifest_package_file> --version <bump_version>
node scripts/release/tag.js --plugins-directory <plugins_directory> --manifest-changelog <changelog_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --manifest-package <manifest_package_file> --revision <bump_revision>
node scripts/release/tag.js --plugins-directory <plugins_directory> --manifest-changelog <changelog_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --manifest-package <manifest_package_file> --platform-version <bump_platform_version>
```

Examples:

- Change the plugin version. Take the `revision` and `platform-version` parameters from the specified manifest plugin package file.

```console
node scripts/release/tag.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/v4.6.0/api/api/spec/spec.yaml --manifest-package ./plugins/main/package.json --version 4.5.0
```

- Change the plugin revision. Take the `version` and `platform-version` parameters from the specified manifest plugin package file.

```console
node scripts/release/tag.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/v4.6.0/api/api/spec/spec.yaml --manifest-package ./plugins/main/package.json --revision 02
```

- Change the platform version. Take the `version` and `revision` parameters from the specified manifest plugin package file.

```console
node scripts/release/tag.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/v4.6.0/api/api/spec/spec.yaml --manifest-package ./plugins/main/package.json --platform-version 2.8.0
```
