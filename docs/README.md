# Wazuh dashboard Technical Documentation

This folder contains the technical documentation for the Wazuh dashboard. The documentation is organized into the following guides:

- **Development Guide**: Instructions for building, testing, and packaging the application.
- **Reference Manual**: Detailed information on the application's architecture, configuration, and usage.
- **Migration Guide**: Manual steps to migrate from Wazuh dashboard 4.x to 5.x.
- **Diagnostic Guide**: Steps to diagnose errors and resolve common issues.

## Setup and usage

See [Documentation installation and setup](INSTALLATION.md) for the required mdBook/mdBook-Mermaid
versions, installing them via `rustup`, and troubleshooting. Once installed:

- Build: `./build.sh` (output in the `book` directory).
- Serve locally for preview: `./server.sh` (available at
  [http://127.0.0.1:3000](http://127.0.0.1:3000)).
