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
- `plugins/*/opensearch_dashboards.json` or `kibana.json`: Defines the plugin manifest. It contains the following properties:
  - `version`: Combination of version and revision of the plugin: `{version}-{revision}`.
- `CHANGELOG.md`: Changelog of the new release.
- `plugins/main/common/api-info/endpoints.json`: Data related to endpoints and extracted from server's API
- `plugins/maincommon/api-info/security-actions.json`: Data related to security actions of extracted from server's API
- Unit tests

To bump the version, see [# Bump](#Bump)

#### Update the API info static files

We have a script to update the files of the `plugins/main` that have information about the Wazuh API. This script uses the API specification
file that is stored in the GitHub repository of [wazuh/wazuh](https://github.com/wazuh/wazuh) repository. This must run for each version.

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

#### Create tags

After the base branches have set the expected [# Files](#files), we must create the tags.

The tag name follows the pattern:

- final release tag: `v{version}-{platform version}`. Example: `v4.4.5-2.6.0`.
- non-final release tag: `v{version}-{platform version}{suffix}`. Example: `v4.4.5-2.6.0-pre-alpha1`, `v4.4.5-2.6.0-alpha1`, `v4.4.5-2.6.0-rc1`.

> See the [script instructions](#create-tags---script) that reduces this job.

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
> - `{tag}`: tag name. Use this schema: `v{version}-{platform version}`. We add suffixes for release candidates or alpha versions:
>   - pre-alpha: `-pre-alpha{number}`. Example: `-pre-alpha1`.
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

The process to create the required tag can be run through a script ( `scripts/release/tag.js` ).

- for each plugin in `plugins-directory`:
  - edit `version`, `revision`, `pluginPlatfrom.version` in the package manifest file: `package.json`
  - edit the `version` property in plugin manifest file: `opensearch_dashboards.json`
- edit the entry in the `CHANGELOG.md` file
- commit (if required)
- create local tag
- push local tag to remote

Steps:

1. Ensure the others files are updated.

2. Bump version/revision/platform version and create the local and remote tags using the script

- Define the `version`, `revision` and `pluginPlatformVersion`:

```console
node scripts/release/tag.js --plugins-directory ./plugins --version 4.6.0 --revision 03 --platform-version 2.8.0
```

- Use a package manifest as base to take the `version`, `revision` and `pluginPlatformVersion` values:

```console
node scripts/release/tag.js --plugins-directory ./plugins --manifest-plugin ./plugins/main/package.json
```

> If the version or the revision is not specified, then it will use the current values from the package manifest file (package.json).
> You can bump the `version`, `revision` or `platform-version` too or combine them in this step. It is not recommended because these
> values should be bumped previously.

```console
node scripts/release/tag.js --plugins-directory ./plugins --version <bump_version>
node scripts/release/tag.js --plugins-directory ./plugins --revision <bump_revision>
node scripts/release/tag.js --plugins-directory ./plugins --platform-version <bump_platform_version>
node scripts/release/tag.js --plugins-directory ./plugins --version <bump_version> --revision <bump_revision> --platform-version <bump_platform_version>
```

Examples:

- Change the plugin version

```console
node scripts/release/tag.js --plugins-directory ./plugins --version 4.5.0
```

- Change the plugin revision

```console
node scripts/release/tag.js --plugins-directory ./plugins --revision 02
```

- Change the platform version

```console
node scripts/release/tag.js --plugins-directory ./plugins --platform-version 2.8.0
```

- Change the plugin version, revision and platform version

```console
node scripts/release/tag.js --plugins-directory ./plugins --version 4.5.0 --revision 02 --platform-version 2.8.0
```

For tags that needs a suffix, use the `--tag-suffix <tag-suffix>` flag.

```console
node scripts/release/tag.js --plugins-directory ./plugins --tag-suffix <tag-suffix> <options>
```

Example:

```console
node scripts/release/tag.js --plugins-directory ./plugins --tag-suffix -rc2 --revision 02
```

3. Review the new tags were pushed to the remote repository.

### Build packages

## Release Phase 2 - Release testing

### Release Phase 3 - Release Announcement

### Release Phase 4 - Post-Release

### Bump

It means to increment the version number to a new and unique value.

Bumping the version requires to do some changes in the source code of the plugins. See [# Files](#files).

We have a script (`scripts/release/bump`) to update some of these files for each plugin:

- package.json
- opensearch_dashboards.json

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
node scripts/release/bump.js --plugins-directory ./plugins --version <version> --revision <revision> --platform-version <bump_platform_version>
```

- Take the values from a package manifest file and replace some value

```console
node scripts/release/bump.js --plugins-directory ./plugins --manifest-package ./plugins/main/package.json --revision <revision>
```

Examples:

- Change the plugin version

```console
node scripts/release/bump.js --plugins-directory ./plugins --manifest-package ./plugins/main/package.json --version 4.5.0
```

- Change the plugin revision

```console
node scripts/release/bump.js --plugins-directory ./plugins --manifest-package ./plugins/main/package.json --revision 02
```

- Change the platform version

```console
node scripts/release/bump.js --plugins-directory ./plugins --manifest-package ./plugins/main/package.json --platform-version 2.8.0
```

- Change the plugin version, revision and platform version

```console
node scripts/release/bump.js --plugins-directory ./plugins --version 4.5.0 --revision 02 --platform-version 2.8.0
```

3. Apply manually the changes to the rest of files if needed it. See [# Files](#Files).

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
