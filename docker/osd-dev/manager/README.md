# Manager

This directory contains the files required to run a Wazuh manager container in the OSD (OpenSearch Dashboards) development environment.

## Contents

- **Dockerfile**: Defines the Docker image for Wazuh manager.
- **entrypoint.sh**: Entrypoint script to initialize the container.
- **installer.sh**: Script used to automate the installation and configuration of Wazuh manager and its dependencies inside the container.

## Usage

### Recommended: Using `dev.sh`

The preferred way to start the development environment is with the `dev.sh` script located in the parent directory. For example:

```bash
./dev.sh -r external=/absolute/path/to/wazuh-dashboard-external up
```

Or, if you keep all repositories in a single checkout, pass that directory as the optional default root:

```bash
./dev.sh /absolute/path/to/wazuh-dashboard-plugins/plugins up
```

You can pass additional options and profiles (e.g., `saml`, `server`). Run `./dev.sh` without arguments to see usage instructions.

### Manual

1. Build the Docker image:

   ```bash
   docker build -t wazuh-manager .
   ```

2. Run the container:

   ```bash
   docker run -d --name wazuh-manager wazuh-manager
   ```

3. Customize the configuration by editing the files in the `config/` directory before building the image.

## Notes

- This environment is intended for development and testing, not for production use.
- Make sure to review and adapt the configurations as needed.
