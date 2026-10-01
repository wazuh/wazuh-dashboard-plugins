# Get external resources

## wazuh plugin

The `wazuh` plugin requires some files that are based on some external resources. This is usually done when installing its dependencies or it can be executed on demand in the development phase.

### Indexer resources

#### Objective

Download templates for sample data indices and generate index pattern known fields for the different data schemas.

This process is done through the `update-indexer-resources` script located at `plugins/main/scripts/build-tools/update-indexer-resources` of `wazuh-dashboard-plugins` repository. This is designed to automate the process of updating resource files of the indexer. It ensures that the necessary resources are downloaded and updated based on the specified Git reference (branch, tag, or commit).

---

#### Process overview

The script performs the following steps, in this order:

1. **Skip Download Option**:

- If the environment variable `SKIP_DOWNLOAD_INDEXER_RESOURCES` is set to `true`, the script skips the resource download process and exits immediately, before checking anything else. This is used for some development process that does not require these files such as the code formatting checks.

2. **Git Reference Input**:

- Accepts a Git reference (branch, tag, or commit) as an input parameter.
- If no input is provided, it uses the `GIT_REF` environment variable as the default.
- If neither is set, the script prompts the user to manually enter the Git reference.

3. **Dependency Check**:

- Verifies that the required dependencies (`git` and `node`) are installed and available in the system's `PATH`.
- If any dependency is missing, the script exits with an error message.

4. **Resolve Candidate Reference**:

- The supplied Git reference (parameter, `GIT_REF`, or prompted value) is the **first** candidate tried against the `wazuh-indexer-plugins` repository.
- If that doesn't resolve, it falls back to the version read from `wazuh`'s (`main` directory) `package.json` and that version's `v`-prefixed tag (e.g. `5.0.0`, then `v5.0.0`) as further candidates.
- The first candidate that exists as a branch or tag in `wazuh-indexer-plugins` is used as the resolved reference.

5. **Update Resources**:

- Executes the following functions to update the indexer resources:
- `update_known_fields_from_templates`: Add files with the known fields for the data schemas based on the templates to the `plugins/main/common/known-fields` directory that are used as default fields for the index pattern creation of health check.
- `update_templates_sample_data`: Add the template files to `server/lib/sample-data/dataset` subdirectories that are used for the creation of the sample data indices.

---

#### Usage

##### Prerequisites

Ensure the following dependencies are installed:

- **Git**: Used to interact with the repository.
- **Node.js**: Required for executing JavaScript-based tasks.

##### Running the Script

You can run the script with the following command:

The script is located at `plugins/main/scripts/build-tools/update-indexer-resources` path of the `wazuh-dashboard-plugins` repository.

Within the repository, go to `plugins/main` directory:

- Provide reference as parameter:

```bash
bash scripts/build-tools/update-indexer-resources [GIT_REF]
```

- Provide reference as `GIT_REF` environment variable:

```bash
GIT_REF=<git_ref_wazuh_indexer_plugins> bash scripts/build-tools/update-indexer-resources
```

If no parameter or `GIT_REF` environment variable is declared, the script will prompt the user to manually enter the Git reference.
