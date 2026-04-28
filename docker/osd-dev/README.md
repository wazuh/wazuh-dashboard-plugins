# Wazuh development with Wazuh Stack

## Requirements

- vm.max_map_count=262144, needed by Elasticsearch to prevent out-of-memory exceptions.

  To modify the vm.max_map_count temporarily, you can run this command:
  `sudo sysctl -w vm.max_map_count=262144`

  To make the change permanent in host machine:

  - In host machine:
    `sudo nano /etc/sysctl.conf`
  - Add at the end of the file: vm.max_map_count=262144

- jq

  The jq tool is used by the scripts to process JSON files.
  To install jq, you can run this command:

  - In Debian/Ubuntu:
    `sudo apt-get install jq`
  - In RedHat/CentOS:
    `sudo yum install jq`
  - In Arch:
    `sudo pacman -Sy --noconfirm jq`
  - In macOS:
    `brew install jq`

## Usage

Always use the provided script to bring up or down the development environment. The only allowed positional argument is the action.

```bash
./dev.sh <action> \
  [--plugins-root </absolute/path>]  # aliases: -wdp, --wz-home \
  [-os <os_version>] [-osd <osd_version>] \
  [-a <rpm|deb|without>]  # aliases: none, 0 \
  [-r <repo>=</absolute/path> ...] \
  [-saml | --server <version> | --server-local <tag> | --indexer-local [tag]] \
  [--base [</absolute/path>]]
```

### About <common-parent-directory>

- Meaning: a host directory where you keep external repositories (e.g., `~/dev`). The script uses it for shorthand `-r <repo>` resolution and for auto‑discovery.
- How it’s set: the wrapper `docker/osd-dev/dev.sh` sets `SIBLING_REPO_HOST_ROOT` to the parent folder of this repo by default. You can override it explicitly:
  - `export SIBLING_REPO_HOST_ROOT=/absolute/path/to/your/common-parent-directory`
  - Then run `./docker/osd-dev/dev.sh …`
- How to verify: `echo $SIBLING_REPO_HOST_ROOT` (must be an absolute host path).
- Note: docs refer to this location as `<common-parent-directory>`.

### Parameters

- Action (positional): One of up | down | stop | start | manager-local-up.
  - `up` Launches the containers.
  - `down` Removes the containers.
  - `stop` Stops the containers, they go into "exited" state, useful to avoid re-optimization.
  - `start` Restarts the containers that were in "exited" state.
  - `manager-local-up` Launches only the manager.
- -os <os_version> : (Optional) Specifies the OpenSearch version. If not provided, it's obtained from plugins/wazuh-core/package.json .
- -osd <osd_version> : (Optional) Specifies the OpenSearch Dashboards version. If not provided, it's obtained from plugins/wazuh-core/package.json .
- -a <agents_up> : (Optional) Relevant when using server-local mode. Specifies agent deployment:
  - rpm : Deploys an RPM-based agent.
  - deb : Deploys a DEB-based agent.
  - without : Deploys no agents.
  - If this option is not used with server-local mode (or an empty string is provided), the default agent configuration for the server-local profile is used ( 2 agents, one RPM-based and one DEB-based ).
- -r <repo>=<path> : (Optional, repeatable) ONLY for external plugin repositories that are not stored inside this repository.
  - Internal repositories (`main`, `wazuh-core`, `wazuh-check-updates`) are auto-detected under `<root>/plugins/` when running from this repo, or can be set via `--plugins-root` (aliases: `-wdp`, `--wz-home`).
  - External repositories passed with `-r` are dynamically added as volumes to the `osd` service via an auto-generated `dev.override.generated.yml` (git-ignored).
  - Paths MUST be absolute and must point to the repository ROOT (do not pass subfolders like `/plugins/...`). Shorthand is also supported: `-r <repo>` (no `=`), which resolves from your <common-parent-directory> using the same `<repo>` name. If not found, an error is raised.
- -saml: (Optional) Deploys a SAML-enabled environment with KeyCloak IDP.
  - Note for SAML: You need to add idp to your hosts file ( /etc/hosts on Linux/macOS, C:\\Windows\\System32\\drivers\\etc\\hosts on Windows) pointing to 127.0.0.1 . Also, based on previous configurations, KeyCloak IDP might need to be started with the --no-base-path option.
  ```
  # Example entry in /etc/hosts
  127.0.0.1 idp
  ```
- --server <version>: (Optional) Deploys an environment with a real Wazuh server using the given release version (e.g., 4.7.2) for WAZUH_STACK.
- --server-local <tag>: (Optional) Deploys an environment with a local Wazuh server package using the given image tag (e.g., my-custom-image) for IMAGE_TAG.
  - Important for `server-local`: Place the Wazuh manager installation packages (`.deb`) in `wazuh-dashboard-plugins/docker/osd-dev/manager/` and any Wazuh agent packages (`.rpm`/`.deb`) in `wazuh-dashboard-plugins/docker/osd-dev/agents/`.
  - If neither `--server` nor `--server-local` is specified, a standard development environment is deployed (profile standard).
- --indexer-local [tag]: (Optional) Deploys an environment with a local Wazuh indexer package using the given image tag (e.g., my-custom-image) for IMAGE_INDEXER_PACKAGE_TAG.
  - Important: Place the Wazuh indexer installation package (`.deb`) in `wazuh-dashboard-plugins/docker/osd-dev/indexer/`.

If you run the script from inside this repository, internal repositories are auto-detected under `<root>/plugins/>`. Otherwise, pass `--plugins-root` (aliases: `-wdp`, `--wz-home`) to specify the root. Use `-r` only for external plugins.

Multi-repository context explanation:

The model is intentionally hybrid: this repository ships several core plugins, while other plugins live (and will continue to live) in their own, permanent external Git repositories. There is no plan to merge everything into a monorepo. For external plugins just point the script to their absolute paths. Example layout for external plugins:

```
~/dev/wazuh-dashboard-reporting
~/dev/wazuh-security-dashboards-plugin
```

Launch using explicit mappings for external plugins:

```bash
./dev.sh up -r wazuh-dashboard-reporting=~/dev/wazuh-dashboard-reporting -r wazuh-security-dashboards-plugin=~/dev/wazuh-security-dashboards-plugin
```

Security plugin alias accepted by `-r` (no auto-descend, no search inside dashboardBase, path used as-is):

```
security
```

Examples (shorthand alias resolves to the canonical folder 'wazuh-security-dashboards-plugin' under your <common-parent-directory>):

```
./dev.sh up --base -r security                          # resolves <common-parent-directory>/wazuh-security-dashboards-plugin
./dev.sh up --base -r security=/abs/path/wazuh-security-dashboards-plugin  # uses absolute path as-is
```

### Search Order and Precedence (Security Plugin)

- Auto-discovery (no `-r`):

  - Looks only at the canonical folder 'wazuh-security-dashboards-plugin' under your <common-parent-directory>.

- Overrides with `-r` (takes precedence):
  - `-r <alias>=/absolute/repo/root` → uses the absolute path exactly as provided (no subfolders like `/plugins/...`).
  - `-r <alias>` → resolves to the canonical folder 'wazuh-security-dashboards-plugin' under your <common-parent-directory>.
  - Alias: `security`.

Or, with a single root checkout containing `plugins/`:

```bash
./dev.sh up --plugins-root /absolute/path/to/wazuh-dashboard-plugins/plugins
```

Note: The model is hybrid: some plugins are here and others will always be external. For external ones, specify them with `-r repo=/absolute/path`.

### Examples

Standard environment (single repository checkout):

```sh
./dev.sh up --plugins-root /absolute/path/to/wazuh-dashboard-plugins/plugins
```

Standard environment with extra external plugins:

```sh
./dev.sh up -r wazuh-dashboard-reporting=/workspace/wazuh-dashboard-reporting -r wazuh-security-dashboards-plugin=/workspace/wazuh-security-dashboards-plugin
```

Standard environment (auto-detect internal plugins when called from inside repo root):

```sh
./dev.sh up
```

With specific OpenSearch/OSD versions:

```sh
./dev.sh up -os 2.11.0 -osd 2.11.0 --plugins-root /absolute/path/to/wazuh-dashboard-plugins/plugins
```

SAML-enabled environment:

```sh
./dev.sh up -saml --plugins-root /absolute/path/to/wazuh-dashboard-plugins/plugins
```

Environment with a real Wazuh server:

```sh
./dev.sh up --plugins-root /absolute/path/to/wazuh-dashboard-plugins/plugins --server 4.7.2
```

Environment with a local Wazuh server build and DEB agent:

```sh
./dev.sh up --plugins-root /absolute/path/to/wazuh-dashboard-plugins/plugins --server-local my-custom-tag -a deb
```

Environment with a local Wazuh server build and no agents:

```sh
./dev.sh up --plugins-root /absolute/path/to/wazuh-dashboard-plugins/plugins --server-local my-custom-tag -a without
```

Environment with a local Wazuh indexer build:

```sh
./dev.sh up --plugins-root /absolute/path/to/wazuh-dashboard-plugins/plugins --indexer-local my-custom-tag
```

Important Note about Plugin Version:

The script will not select the appropriate version of the wazuh-dashboard-plugins to use, so be sure to check out the appropriate version before bringing up the environment!

### Launch UI

- Once the docker containers are online, use `yarn start` command to launch the UI:
  - Find the osd-dev container_id:
    `docker ps`
  - Enter the shell.
    `docker exec -it <CONTAINER_ID> bash`
  - Launch the UI from the kbn folder.
    `yarn start --no-base-path`
  - Wait for `[success][@osd/optimizer]` to show in console (could take a lot of time).

#### Warning

- After using the yarn start command, an error about missing dependencies could appear, to fix the dependencies:

  - In osd-dev container shell inside `/plugins` folder:
    `for d in */; do (cd "$d" && yarn); done`

  - If the following line stops the installation of dependencies:

    ```bash
    Enter the git reference (branch/tag) of the current source code. This reference will be used to get
    the reference in the indexer git repository to update the resource files (e.g., main, develop):
    ```

    Provide the branch name of indexre repository to retrieve the resource files and generate in the
    plugin directory.

    e.g. if working in `main` (or derivated) branch of the plugins, type `main`.

    Note the dashboard plugins repository branch name could be different to the indexer.

Repeat `yarn start --no-base-path` command.

### UI Credentials

The default user and password to access the UI at https://0.0.0.0:5601/ are:

```
admin:admin
```

For SAML-enabled environments, use:

```
wazuh:wazuh
```

## Notes

`Wazuh Indexer` and `Wazuh Dashboard` are both a redistribution of a
version of the OpenSearch Stack. We will only create environments for
the versions of OpenSearch which will be included into a Wazuh
version.

We must use official `Wazuh Indexer` and `Wazuh Dashboard` images for
testing!

This environment will start a working deployment with:

- Imposter - a mock server.
- Elasticsearch-exporter - Elasticsearch metrics to Prometheus adapter.
- OpenSearch single-node cluster.
- OpenSearch Dashboards development environment.
  The OpenSearch Dashboards development environment includes an already
  bootstrapped Kibana, with all the node modules precompiled and ready to
  use in a development session.
