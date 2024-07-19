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

To bump the version, see [# Bump](#Bump).

### Bump

It means to increment the plugin version or revision or platform version number to a new and unique value.

Bumping the version requires to do some changes in the source code of the plugins. See [# Files](#files).

Steps:

1. Switch to new branch from the base branch to bump:

```console
git checkout <base_branch>
git pull
git checkout -b <bump_branch>
```

2. Bump the version/revision/platform version using the script:

- Define the `revision`:

```console
node scripts/release/bump.js --plugins-directory <plugins_directory> --manifest-changelog <manifest_changelog_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --revision <bump_revision>
```

Example:

```console
WAZUH_SERVER_BRANCH_TAG=4.6.0 && node scripts/release/bump.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --manifest-package ./plugins/main/package.json --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/${WAZUH_SERVER_BRANCH_TAG}/api/api/spec/spec.yaml --revision 03
```

- Define the `version`:

```console
node scripts/release/bump.js --plugins-directory <plugins_directory> --manifest-changelog <manifest_changelog_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --version <bump_version>
```

Example:

```console
WAZUH_SERVER_BRANCH_TAG=4.7.0 && node scripts/release/bump.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --manifest-package ./plugins/main/package.json --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/${WAZUH_SERVER_BRANCH_TAG}/api/api/spec/spec.yaml --version 4.7.0
```

- Define the `pluginPlatform.version`:

```console
node scripts/release/bump.js --plugins-directory <plugins_directory> --manifest-changelog <manifest_changelog_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --version <bump_version> --revision <bump_revision> --platform-version <bump_platform_version>
```

Example:

```console
WAZUH_SERVER_BRANCH_TAG=4.6.0 && node scripts/release/bump.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --manifest-package ./plugins/main/package.json --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/${WAZUH_SERVER_BRANCH_TAG}/api/api/spec/spec.yaml --platform-version 2.8.0
```

You can bump one or more values at the same time using a combination of these:

- Define the `version`, `revision` and `pluginPlatform.version`:

```console
WAZUH_SERVER_BRANCH_TAG=<wazuh-server-branch-tag> && node scripts/release/bump.js --plugins-directory <plugins_directory> --manifest-changelog <manifest_changelog_file> --plugin-main-generate-api-data-spec <url_api_spec_file> --version <bump_version> --revision <bump_revision> --platform-version <bump_platform_version>
```

Example:

```console
WAZUH_SERVER_BRANCH_TAG=4.7.0 && node scripts/release/bump.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --manifest-package ./plugins/main/package.json --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/${WAZUH_SERVER_BRANCH_TAG}/api/api/spec/spec.yaml --version 4.7.0 --revision 03 --platform-version 2.8.0
```

3. Depending on the case, it could be required to update the snapshots of the plugin tests:

For each plugin on `plugins` directory:

```console
cd plugins/<plugin_name>
yarn test:jest -u
```

4. Commit and push the new branch to the remote repository.

```console
git add .
git commit -m "bump: Bump version/revision/platform version to <version/revision/platform version>"
git push origin <branch_name>
```

A new branch will be created in the remote and will be ready to receive pull requests or use as source to create the tags.

5. Create a pull request

If you have installed the [GitHub CLI](https://cli.github.com/):

```console
gh pr create -a @me -B <base_branch> -t "Bump Wazuh version <version>"
```

or use the through the GitHub web.

#### Update the API info static files

⚠️ This is done by the bump script.

We have a script to update the files of the `plugins/main` that have information about the Wazuh API. This script uses the API specification
file that is stored in the GitHub repository of [wazuh/wazuh](https://github.com/wazuh/wazuh) repository.

```console
cd plugins/main
yarn generate:api-data --spec <api_spec_file_URL>
```

Examples:

- Update the files with a final tag

```console
cd plugins/main
yarn generate:api-data --spec https://raw.githubusercontent.com/wazuh/wazuh/v4.6.0/api/api/spec/spec.yaml
```

- Update the files with a pre-release tag

```console
cd plugins/main
yarn generate:api-data --spec https://raw.githubusercontent.com/wazuh/wazuh/v4.6.0-rc1/api/api/spec/spec.yaml
```

- Update the files with a development branch

```console
cd plugins/main
yarn generate:api-data --spec https://raw.githubusercontent.com/wazuh/wazuh/4.6.0/api/api/spec/spec.yaml
```

### Tags

After the base branch have set the expected [# Files](#files), we must create the tags.

The tag name follows the pattern:

- final release tag: `v{version}`. Example: `v4.9.0`.
- non-final release tag: `v{version}{suffix}`. Example: `v4.9.0-pre-alpha1`, `v4.9.0-alpha1`, `v4.9.0-rc1`.

> See the [script instructions](#tags---script) that simplifies the task.

#### Tags - Script

The process to create the required tag can be run through a script ( `scripts/release/tag.js` ) that bumps the repository through the script (`scripts/release/bump.js`) .

- for each plugin in `plugins-directory`:
  - edit `version`, `revision`, `pluginPlatfrom.version` in the package manifest file: `package.json`
  - edit the `version` property in plugin manifest file: `opensearch_dashboards.json`
- edit the entry in the `CHANGELOG.md` file
- commit (if required)
- create local tag
- push local tag to remote

> THIS SCRIPT MUST RUN FROM THE SAME BRANCH (OR SIMILAR REGARDING THE SOURCE CODE) THAT MATCHES THE `--version` VALUE. IF NOT, IT WILL RUN UNWANTED CODE AND COULD FAIL.

> The tag script can bump the `version`, `revision` and `pluginPlatfrom.version` values, but it should not be done. If we need to change some of this values, then we should follow the protocol to bump.

Steps:

1. Create the tag:

- Non-final tag (pre-alpha, alpha, beta, rc):

```console
WAZUH_SERVER_BRANCH_TAG=<wazuh-server-branch-tag> node scripts/release/tag.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --manifest-package ./plugins/main/package.json --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/${WAZUH_SERVER_BRANCH_TAG}/api/api/spec/spec.yaml
```

where:

- `<wazuh-server-branch-tag>`: tag ( or branch ) of Wazuh server repository to take the API spec file

- Final:

```console
WAZUH_SERVER_BRANCH_TAG=<wazuh-server-branch-tag> node scripts/release/tag.js --plugins-directory ./plugins --manifest-changelog ./CHANGELOG.md --manifest-package ./plugins/main/package.json --plugin-main-generate-api-data-spec https://raw.githubusercontent.com/wazuh/wazuh/${WAZUH_SERVER_BRANCH_TAG}/api/api/spec/spec.yaml --tag-suffix <tag-suffix>
```

where:

- `<wazuh-server-branch-tag>`: tag ( or branch ) of Wazuh server repository to take the API spec file
- `<tag-suffix>` <tag-suffix>

For more details about the tag scripts options, see [README.md](./scripts/release/README.md)

#### Tags - Manually

Steps:

1. Switch and update the base branch

```
git checkout <base_branch>
git pull
```

2. Review if the version, revision and platform values are defined to the target release in the [#Files](#files), if not accomodate them (creating a new commit).

3. Create the tag

> IMPORTANT: Due to a problem in the process to build Wazuh dashboard using reusable GHA workflow pointing to tags of this repository, it is required the tag is not signed, annotated or both.

- No sign, no annotated, no message:

```
git tag {tag}
```

- Sign, annotate and add message:

```
git tag -s -a -m "Wazuh {version} for Wazuh dashboard {platform version}" {tag}
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

2. Review the new tags were pushed to the remote repository.

### Build packages

## Release Phase 2 - Release testing

### Release Phase 3 - Release announcement

### Release Phase 4 - Post-Release
