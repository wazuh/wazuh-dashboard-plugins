## Releasing

## Runbook

### Overview

### Release Phase 1 - Preparation

#### Files

The following files must be updated:

- `package.json`: Defines the package manifest. It contains the following properties:
  - `version`: Plugin version. Schema: `{major}.{minor}.{patch}`. Example: 4.4.5
  - `revision`: Plugin revision. Schema: number with 2 digits. This value is reset for each version to `01` and increament for following revisions.
  - `pluginPlatform.version`: version of the plugin platform.
- `opensearch_dashboards.json` or `kibana.json`: Defines the plugin manifest. It contains the following properties:
  - `version`: Combination of version and revision of the plugin: `{version}-{revision}`.
- `README.md`: References to the version of server, indexer and dashboard applications.
- `CHANGELOG.md`: Changelog of the new release.
- `common/api-info/endpoints.json`: Data related to endpoints and extracted from server's API
- `common/api-info/security-actions.json`: Data related to security actions of extracted from server's API
- Unit tests

To bump the version, see [# Bump](#Bump)

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
git tag {tag} -a -m "Wazuh {version} for {platform} {platform version}"
```

> replace the placeholders:
>
> - `{tag}`: tag name. Use this schema: `v{version}-{platform version}`. We add suffixes for release candidates or alpha versions:
>   - pre-alpha: `-pre-alpha{number}`. Example: `-pre-alpha1`.
>   - release candidates: `-rc{number}`. Example: `-rc1`.
> - `{version}`: plugin version
> - `{platform}`: platform name. One of `OpenSearch` or `Kibana`
> - `{platform}`: platform version.

4. Push the tag

```
git push origin {tag}
```

> replace the placeholder:

- `{tag}`: tag name

#### Create tags - Script

The process to create all the required tags can be run through a script ( `scripts/release/tag` ).

For each supported version defined in `scripts/release/tag`

- edit `revision` package manifest file: `package.json`
- edit the `version` property in plugin manifest file: `opensearch_dashboards.json` or `kibana.json`
- commit
- create tag
- push tag

The script can be run through the package script `yarn release:tag` too. This is the prefered method because defines some required parameters.

Steps:

1. Ensure the target versions are defined as the supported versions in `scripts/release/tag` and the others files are updated.
   Currently there are 3 platforms: OpenDistro (Kibana 7.10.2), Kibana 7.16-7.17 and OpenSearch (Wazuh stack).

2. Bump version/revision/platform version and create the local and remote tag using the package script

```console
yarn release:tag --revision <bump_revision>
```

> If the version or the revision is not specified, then it will use the current values from the package manifest file (package.json).
> You can bump the `version` or `platform-version` too or combine them.
> :warning: if the `version` is set, the base branches must exist in the remote repository.

```console
yarn release:tag --version <bump_version>
yarn release:tag --revision <bump_revision>
yarn release:tag --platform-version <bump_platform_version>
yarn release:tag --version <version> --revision <revision> --platform-version <bump_platform_version>
```

Examples:

- Change the plugin version

```
yarn release:tag --version 4.5.0
```
- Change the plugin revision

```
yarn release:tag --revision 02
```
- Change the platform version

```
yarn release:tag --platform-version 2.8.0
```
- Change the plugin version, revision and platform version

```
yarn release:tag --version 4.5.0 --revision 02 --platform-version 2.8.0
```
For tags that needs a suffix, use the `--tag-suffix <tag-suffix>` flag.

```
yarn release:tag --tag-suffix <tag-suffix> <options>
```

Example:

```
yarn release:tag --tag-suffix -rc2 --revision 02
```

If you want to get a report of the tags generated and stored locally, use the `--export-tags <file>`.

```
yarn release:tag --revision <bump_revision> --export-tags <file>
```

Example:

```
yarn release:tag --version 4.5.0 --export-tags tags.log
```

3. Review the new tags were pushed to the remote repository.

### Build packages

## Release Phase 2 - Release testing

### Release Phase 3 - Release Announcement

### Release Phase 4 - Post-Release

### Bump

It means to increment the version number to a new, unique value.

Bumping the version requires to do some changes in the source code of the application. See [# Files](#files).

We have a script (`scripts/release/bump`) to update some of these files:

- package.json
- opensearch_dashboards.json or kibana.json

This can be run through the `yarn release:bump` package script too. This is the prefered method because defines some required parameters. **The rest of the files should be changed manually.**

> The package script sets some required parameters related to manifest files.

Steps:

1. Switch to new branch from the base branch to bump

```console
git checkout <base_branch>
git pull
git checkout -b <bump_branch>
```

2. Bump the version/revision/platform version using the package script

```console
yarn release:bump --version <bump_version>
```

> You can bump the `revision` or `platform-version` too or combine them.

```console
yarn release:bump --version <bump_version>
yarn release:bump --revision <bump_revision>
yarn release:bump --platform-version <bump_platform_version>
yarn release:bump --version <version> --revision <revision> --platform-version <bump_platform_version>
```

Examples:

- Change the plugin version

```
yarn release:bump --version 4.5.0
```

- Change the plugin revision

```
yarn release:bump --revision 02
```

- Change the platform version

```
yarn release:bump --platform-version 2.8.0
```

- Change the plugin version, revision and platform version

```
yarn release:bump --version 4.5.0 --revision 02 --platform-version 2.8.0
```

3. Apply manually the changes to the rest of files if needed it. See [# Files](#Files).

4. Optional. Commit and push the new branch to the remote repository.

```
git add .
git commit -m "bump: Bump version/revision/platform version to <version/revision/platform version>"
git push origin <branch_name>
```

A new branch will be created in the remote and will be ready to receive pull requests or use as source to create the tags.
