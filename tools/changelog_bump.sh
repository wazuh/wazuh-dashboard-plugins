#!/bin/bash

# =========================
# Changelog bump
# =========================
# Rewrites CHANGELOG.md when repository_bumper.sh bumps to a new version.
#
# From 5.x, each changelog only contains its own version changes and
# references the prior changelogs with links, so on a version bump this
# script:
#   - Resets the changelog to a single "## [vX.Y.Z]" entry with empty
#     Added/Changed/Removed/Fixed sections, where Added starts with the
#     "- Support for Wazuh X.Y.Z" entry.
#   - Rebuilds the "## Prior versions" section with the two most recent
#     minors below the new version, including every patch of each,
#     newest first.
#
# Candidate prior versions are gathered from the remote version-shaped tags
# ("X.Y.Z" or "vX.Y.Z") only, since tags are the already-released versions.
#
# Stage-only bumps (version unchanged) and tag generation (--tag) only
# resync the "## Prior versions" section, leaving the changelog entries
# untouched.
#
# Usage: changelog_bump.sh <new_version> <current_version> [--tag]

set -euo pipefail

REPO_PATH=$(git rev-parse --show-toplevel)
CHANGELOG_FILE="${REPO_PATH}/CHANGELOG.md"

function log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1"
}

function usage() {
    echo "Usage: $0 <new_version> <current_version> [--tag]"
    echo ""
    echo "Arguments:"
    echo "  new_version       Version being bumped to (e.g., 5.1.0)"
    echo "  current_version   Version being replaced (e.g., 5.0.0)"
    echo "  --tag             Tag generation: only resync the Prior versions section"
}

# ====
# Determine the "owner/repo" path from the origin remote URL.
# ====
function get_repo_path() {
    local remote_url
    remote_url=$(git remote get-url origin)
    remote_url="${remote_url%.git}"
    remote_url="${remote_url#*github.com/}"
    remote_url="${remote_url#*github.com:}"
    echo "$remote_url"
}

# ====
# Emit every released version as "X.Y.Z" lines: remote version-shaped tags.
# ====
function collect_candidate_versions() {
    git ls-remote --tags origin \
        | sed -E 's#^[0-9a-f]+[[:space:]]+refs/tags/##' \
        | sed -E 's#\^\{\}$##' \
        | grep -E '^v?[0-9]+\.[0-9]+\.[0-9]+$' \
        | sed 's/^v//' \
        || true
}

# ====
# Build the "Prior versions" list: every candidate strictly lower than the
# new version, keeping only the two highest minors with every patch of each,
# newest first.
# Arguments:
#   $1 - new version
# ====
function build_prior_versions() {
    local new_version="$1"

    collect_candidate_versions \
        | sort -u \
        | awk -F. -v v="$new_version" '
            BEGIN { split(v, n, ".") }
            ($1 + 0) < (n[1] + 0) ||
            (($1 + 0) == (n[1] + 0) && ($2 + 0) < (n[2] + 0)) ||
            (($1 + 0) == (n[1] + 0) && ($2 + 0) == (n[2] + 0) && ($3 + 0) < (n[3] + 0))
        ' \
        | sort -t. -k1,1nr -k2,2nr -k3,3nr \
        | awk -F. '
            { minor = $1 "." $2 }
            minor != last { minors++; last = minor }
            minors <= 2 { print }
        '
}

# ====
# Print the "## Prior versions" section for the given version.
# Arguments:
#   $1 - version whose prior versions are listed
# ====
function print_prior_versions_section() {
    local version="$1"
    local repo_path prior_versions entry
    repo_path=$(get_repo_path)
    prior_versions=$(build_prior_versions "$version")

    printf '## Prior versions\n\n'
    while IFS= read -r entry; do
        [[ -z "$entry" ]] && continue
        printf -- '- [v%s](https://github.com/%s/blob/v%s/CHANGELOG.md)\n' \
            "$entry" "$repo_path" "$entry"
    done <<< "$prior_versions"
}

# ====
# Rewrite CHANGELOG.md with the new version entry (empty sections) and the
# rebuilt "## Prior versions" section.
# Arguments:
#   $1 - new version
# ====
function write_changelog() {
    local new_version="$1"
    local temp_file
    temp_file=$(mktemp)

    {
        printf '## [v%s]\n\n' "$new_version"
        printf '### Added\n\n'
        printf -- '- Support for Wazuh %s\n\n' "$new_version"
        printf '### Changed\n\n'
        printf '### Removed\n\n'
        printf '### Fixed\n\n'
        print_prior_versions_section "$new_version"
    } > "$temp_file"

    mv "$temp_file" "$CHANGELOG_FILE"
    log "CHANGELOG.md reset for v${new_version}; Prior versions rebuilt with the last 2 minors."
}

# ====
# Rebuild only the "## Prior versions" section, keeping the changelog
# entries untouched (used when the version does not change).
# Arguments:
#   $1 - version kept
# ====
function sync_prior_versions() {
    local version="$1"
    local temp_file

    if [[ ! -f "$CHANGELOG_FILE" ]]; then
        log "ERROR: CHANGELOG.md not found at $CHANGELOG_FILE"
        exit 1
    fi

    temp_file=$(mktemp)
    # Keep everything above the "## Prior versions" heading (whole file if absent)
    awk '/^## Prior versions?$/{exit} {print}' "$CHANGELOG_FILE" > "$temp_file"
    if [[ -s "$temp_file" && -n "$(tail -n1 "$temp_file")" ]]; then
        echo "" >> "$temp_file"
    fi
    print_prior_versions_section "$version" >> "$temp_file"

    mv "$temp_file" "$CHANGELOG_FILE"
    log "Prior versions section synced for v${version}; changelog entries left untouched."
}

# ====
# Main logic
# ====
function main() {
    local new_version=""
    local current_version=""
    local tag="false"
    local positional=()

    while [[ $# -gt 0 ]]; do
        case "$1" in
        --tag)
            tag="true"
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            positional+=("$1")
            shift
            ;;
        esac
    done

    if [[ ${#positional[@]} -ne 2 ]]; then
        usage
        exit 1
    fi

    new_version="${positional[0]}"
    current_version="${positional[1]}"

    if ! [[ "$new_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] ||
        ! [[ "$current_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        log "ERROR: Versions must be in the format x.y.z (e.g., 5.1.0)"
        exit 1
    fi

    if [[ "$tag" == "true" ]]; then
        log "Tag generation: syncing Prior versions section only."
        sync_prior_versions "$new_version"
        exit 0
    fi

    if [[ "$new_version" == "$current_version" ]]; then
        log "Version unchanged (${new_version}): syncing Prior versions section only."
        sync_prior_versions "$new_version"
        exit 0
    fi

    write_changelog "$new_version"
}

main "$@"
