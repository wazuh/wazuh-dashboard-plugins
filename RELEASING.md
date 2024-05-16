## Releasing

## Runbook

### Overview

### Release Phase 1 - Preparation

#### Files

The following files must be updated:

- `plugins/*/package.json`: Defines the package manifest. It contains the following properties:
  - `version`: Plugin version. Schema: `{major}.{minor}.{patch}`. Example: 4.4.5
  - `revision`: Plugin revision. Schema: number with 2 digits. This value is reset for each version to `01` and increament for following revisions.
  - `pluginPlatform.version`: version of the plugin platform.
- `plugins/*/opensearch_dashboards.json`: Defines the plugin manifest. It contains the following properties:
  - `version`: Combination of version and revision of the plugin: `{version}-{revision}`.
- `CHANGELOG.md`: Changelog of the new release.
- `plugins/main/common/api-info/endpoints.json`: Data related to endpoints and extracted from server's API specification file
- `plugins/main/common/api-info/security-actions.json`: Data related to security actions of extracted from server's API specification file
- Unit tests (when bumping the minor version could fail some tests due to snapshots)

To bump the version, see [# Bump](#Bump)

### Bump

It means to increment the plugin version or revision or platform version number to a new and unique value.

Bumping the version requires to do some changes in the source code of the plugins. See [# Files](#files).

Steps:

1. Switch to new branch from the base branch to bump

```console
git checkout <base_branch>
git pull
git checkout -b <bump_branch>
```

2. Bump the version/revision/platform version using the package script

- Define the values for `version`, `revision` and `platform-version`:

```console
node scripts/release/bump.js --plugins-directory <plugins_directory> --manifest-changelog <manifest_changelog_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --version <bump_version> --revision <bump_revision> --platform-version <bump_platform_version>
```

Example:

- Take the values from a package manifest file and replace some value (`version`, `revision` or `platform-plugin`)

```console
node scripts/release/bump.js --plugins-directory <plugins_directory> --manifest-changelog <manifest_changelog_file> --manifest-package <package_manifest_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --revision <bump_revision>
```

Example:

```console
node scripts/release/bump.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/4.6.0/api/api/spec/spec.yaml --manifest-package ./plugins/main/package.json --revision 03
```

- Change the plugin version. Take the `revision` and `platform-version` parameters from the specified manifest plugin file.

```console
node scripts/release/bump.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/4.6.0/api/api/spec/spec.yaml --manifest-package ./plugins/main/package.json --version 4.6.0
```

- Change the plugin revision. Take the `version` and `platform-version` parameters from the specified manifest plugin file.

```console
node scripts/release/bump.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/4.6.0/api/api/spec/spec.yaml --manifest-package ./plugins/main/package.json --revision 03
```

- Change the platform version. Take the `version` and `revision` parameters from the specified manifest plugin file.

```console
node scripts/release/bump.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/4.6.0/api/api/spec/spec.yaml --manifest-package ./plugins/main/package.json --platform-version 2.8.0
```

- Change the plugin version, revision and platform version

```console
node scripts/release/bump.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/4.6.0/api/api/spec/spec.yaml --version 4.6.0 --revision 03 --platform-version 2.8.0
```

3. Commit and push the new branch to the remote repository.

```console
git add .
git commit -m "bump: Bump version/revision/platform version to <version/revision/platform version>"
git push origin <branch_name>
```

A new branch will be created in the remote and will be ready to receive pull requests or use as source to create the tags.

4. Create a pull request

If you have installed the [GitHub CLI](https://cli.github.com/):

```console
gh pr create -a @me -B <base_branch> -t "Bump Wazuh version <version>"
```

#### Update the API info static files

⚠️ This is done by the bump script.

We have a script to update the files of the `plugins/main` that have information about the Wazuh API. This script uses the API specification
file that is stored in the GitHub repository of [wazuh/wazuh](https://github.com/wazuh/wazuh) repository.

```console
yarn generate:api-data --spec <api_spec_file_URL>
```

Examples:

- Update the files with a final tag

```
yarn generate:api-data --spec https://raw.githubusercontent.com/wazuh/wazuh/v4.6.0/api/api/spec/spec.yaml
```

- Update the files with a pre-release tag

```
yarn generate:api-data --spec https://raw.githubusercontent.com/wazuh/wazuh/v4.6.0-rc1/api/api/spec/spec.yaml
```

- Update the files with a development branch

```
yarn generate:api-data --spec https://raw.githubusercontent.com/wazuh/wazuh/4.6.0/api/api/spec/spec.yaml
```

#### Create tags

After the base branches have set the expected [# Files](#files), we must create the tags.

The tag name follows the pattern:

- final release tag: `v{version}`. Example: `v4.9.0`.
- non-final release tag: `v{version}{suffix}`. Example: `v4.9.0-pre-alpha1`, `v4.9.0-alpha1`, `v4.9.0-rc1`.

> See the [script instructions](#create-tags---script) that simplifies the task.

#### Create tags - Manually

Steps:

1. Switch and update the base branch

```
git checkout <base_branch>
git pull
```

2. Review if the version, revision and platform values are defined to the target release in the [#Files](#files), if not accomodate them (creating a new commit).

3. Create the tag

```
git tag {tag} -a -m "Wazuh {version} for OpenSearch Dashboards {platform version}"
```

> replace the placeholders:
>
> - `{tag}`: tag name. Use this schema: `v{version}`. We add suffixes for release candidates, pre-alpha, alpha or beta versions:
>   - pre-alpha: `-pre-alpha{number}`. Example: `-pre-alpha1`.
>   - alpha: `-alpha{number}`. Example: `-alpha1`.
>   - beta: `-beta{number}`. Example: `-beta1`.
>   - release candidates: `-rc{number}`. Example: `-rc1`.
> - `{version}`: plugin version
> - `{platform version}`: platform version.

4. Push the tag

```
git push origin {tag}
```

> replace the placeholder:

- `{tag}`: tag name

#### Create tags - Script

The process to create the required tag can be run through a script ( `scripts/release/tag.js` ) that bumps the repository through the script (`scripts/release/bump.js`) .

- for each plugin in `plugins-directory`:
  - edit `version`, `revision`, `pluginPlatfrom.version` in the package manifest file: `package.json`
  - edit the `version` property in plugin manifest file: `opensearch_dashboards.json`
- edit the entry in the `CHANGELOG.md` file
- commit (if required)
- create local tag
- push local tag to remote

> THIS SCRIPT MUST RUN FROM THE SAME BRANCH (OR SIMILAR REGARDING THE SOURCE CODE) THAT MATCHES THE `--version` VALUE. IF NOT, IT WILL RUN UNWANTED CODE AND COULD FAIL.

Steps:

1. Bump version/revision/platform version, update the CHANGELOG.md and create the local and remote tags using the script.

- Define the `version`, `revision` and `pluginPlatformVersion`:

```console
node scripts/release/tag.js --plugins-directory <plugins_directory> --manifest-changelog <changelog_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --version <bump_version> --revision <bump_revision> --platform-version <bump_platform_version>
```

Example:

```console
node scripts/release/tag.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/v4.6.0/api/api/spec/spec.yaml --version 4.6.0 --revision 03 --platform-version 2.8.0
```

- Use a package manifest as base to take the `version`, `revision` and `pluginPlatformVersion` values:

```console
node scripts/release/tag.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --manifest-plugin ./plugins/main/package.json
```

> If the version, the revision or platform version is not specified, then you can define the package manifest file base to take these values.
> You can overwrite these values using the appropiate configuration (`version`, `revision` or `platform-version`) too or combine them in this step.
> It is not recommended because these values should be bumped previously to create the tag.

```console
node scripts/release/tag.js --plugins-directory <plugins_directory> --manifest-changelog <changelog_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --manifest-plugin <package_manifest_file> --version <bump_version>
node scripts/release/tag.js --plugins-directory <plugins_directory> --manifest-changelog <changelog_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --manifest-plugin <package_manifest_file> --revision <bump_revision>
node scripts/release/tag.js --plugins-directory <plugins_directory> --manifest-changelog <changelog_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --manifest-plugin <package_manifest_file> --platform-version <bump_platform_version>
```

Examples:

- Change the plugin version. Take the `revision` and `platform-version` parameters from the specified manifest plugin file.

```console
node scripts/release/tag.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/v4.6.0/api/api/spec/spec.yaml --manifest-plugin ./plugins/main/package.json --version 4.5.0
```

- Change the plugin revision. Take the `version` and `platform-version` parameters from the specified manifest plugin file.

```console
node scripts/release/tag.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/v4.6.0/api/api/spec/spec.yaml --manifest-plugin ./plugins/main/package.json --revision 02
```

- Change the platform version. Take the `version` and `revision` parameters from the specified manifest plugin file.

```console
node scripts/release/tag.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/v4.6.0/api/api/spec/spec.yaml --manifest-plugin ./plugins/main/package.json --platform-version 2.8.0
```

For tags that needs a suffix, use the `--tag-suffix <tag-suffix>` flag.

```console
node scripts/release/tag.js --plugins-directory <plugins_directory> --manifest-changelog <changelog_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --version <bump_version> --revision <bump_revision> --platform-version <bump_platform_version> --tag-suffix <tag-suffix>
node scripts/release/tag.js --plugins-directory <plugins_directory> --manifest-changelog <changelog_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --manifest-plugin <package_manifest_file> --platform-version <bump_platform_version> --tag-suffix <tag-suffix>
```

Example:

```console
node scripts/release/tag.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/v4.6.0/api/api/spec/spec.yaml --version 4.6.0 --revision 03 --platform-version 2.8.0 --tag-suffix -rc2
node scripts/release/tag.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/v4.6.0/api/api/spec/spec.yaml --manifest-package ./plugins/main/package.json --revision 02 --tag-suffix -rc2
```

2. Review the new tags were pushed to the remote repository.

### Build packages

## Release Phase 2 - Release testing

### Release Phase 3 - Release Announcement

### Release Phase 4 - Post-Release
