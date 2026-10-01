# Documentation installation and setup

This guide covers how to set up the documentation build environment for the Wazuh dashboard plugins documentation.

## Prerequisites

The documentation is built using [mdBook](https://rust-lang.github.io/mdBook/), a command-line tool for creating books
with Markdown, along with [mdBook Mermaid](https://github.com/badboy/mdbook-mermaid) for diagram support.

## Required versions

- **mdbook**: 0.5.2
- **mdbook-mermaid**: 0.17.0
- **mdbook-linkcheck** (optional locally — CI installs it automatically; `book.toml` marks the
  `[output.linkcheck]` backend `optional`, so a local build without it just skips the check instead
  of failing): install with `cargo install mdbook-linkcheck`.

## Installation

The documentation tools require Rust and Cargo. The recommended way to install them is via `rustup`:

Install Rust:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

Reload or create new terminal

Verify installation:

```bash
rustup --version
cargo --version
```

Install tools:

```bash
cargo install mdbook --version 0.5.2
cargo install mdbook-mermaid --version 0.17.0
```

Verify installation:

```bash
mdbook --version
mdbook-mermaid --version
```

## Building the documentation

Once you have installed mdBook and mdBook Mermaid:

```bash
# Navigate to the docs directory
cd docs

# Build the documentation (generates html in docs/book/html/, linkcheck output in docs/book/linkcheck/)
mdbook build

# Serve locally with live reload (recommended for development)
mdbook serve --open
```

The documentation will be available at `http://localhost:3000` when using `mdbook serve`.

## Development workflow

When editing documentation:

1. Run `mdbook serve --open` from the `docs/` directory
2. Edit markdown files in `docs/ref/`
3. Changes are automatically reflected in the browser
4. Navigation structure is defined in `docs/SUMMARY.md`

## Troubleshooting

### Version mismatch errors

If you encounter build errors, verify you have the correct versions installed:

```bash
mdbook --version
mdbook-mermaid --version
```

If you have different versions, uninstall the current ones and reinstall by following the [Installation section](#installation):

```bash
cargo uninstall mdbook
cargo uninstall mdbook-mermaid
```

### Cargo install fails with feature 'edition2024' is required

You may see an error like:

```sh
failed to download `globset v0.4.18`
failed to parse manifest ... feature `edition2024` is required
The package requires the Cargo feature called `edition2024`, but that feature is not stabilized in this version of Cargo.
```

This happens because one of mdBook's transitive dependencies has been updated to use Rust edition 2024. Edition 2024 has been stable since Rust 1.85 — this error means your `stable` toolchain
predates that release, not that edition 2024 requires nightly.

To fix it, update your stable toolchain:

```sh
rustup update stable
```

Installing the older `mdbook --version 0.4.52` instead would avoid the edition2024 error, but it
contradicts the `mdbook: 0.5.2` pin in [Required versions](#required-versions) above — update
Rust instead of downgrading mdBook.

### Mermaid diagrams not rendering

If Mermaid diagrams are not rendering in the browser:

1. Clear your browser cache
2. Run `mdbook clean` to remove the build directory
3. Run `mdbook serve --open` again

### Port already in use

If port 3000 is already in use, specify a different port:

```bash
mdbook serve --port 3001 --open
```

## Additional resources

- [mdBook documentation](https://rust-lang.github.io/mdBook/)
- [mdBook Mermaid documentation](https://github.com/badboy/mdbook-mermaid)
- [Mermaid diagram syntax](https://mermaid.js.org/)
