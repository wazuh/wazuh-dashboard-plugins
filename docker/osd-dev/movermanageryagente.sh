#!/bin/bash

# Default to yesterday's date
DATE=$(date -d "yesterday"  +%Y-%m-%d)

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
    arm64|aarch64)
        DEB_ARCH="arm64"
        RPM_ARCH="aarch64"
        ;;
    x86_64|amd64)
        DEB_ARCH="amd64"
        RPM_ARCH="x86_64"
        ;;
    *)
        echo "Error: Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

echo "Detected architecture: $ARCH (DEB: $DEB_ARCH, RPM: $RPM_ARCH)"

# Flags for what to download (default: download all)
DOWNLOAD_AGENT_DEB=0
DOWNLOAD_MANAGER_DEB=0
DOWNLOAD_AGENT_RPM=0
DOWNLOAD_INDEXER_DEB=0
DOWNLOAD_ALL=1

# Process arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--date)
            DATE="$2"
            shift 2
            ;;
        -a|--agent-deb)
            DOWNLOAD_AGENT_DEB=1
            DOWNLOAD_ALL=0
            shift
            ;;
        -m|--manager)
            DOWNLOAD_MANAGER_DEB=1
            DOWNLOAD_ALL=0
            shift
            ;;
        -r|--agent-rpm)
            DOWNLOAD_AGENT_RPM=1
            DOWNLOAD_ALL=0
            shift
            ;;
        -i|--indexer)
            DOWNLOAD_INDEXER_DEB=1
            DOWNLOAD_ALL=0
            shift
            ;;
        *)
            echo "Usage: $0 [-d|--date YYYY-MM-DD] [-a|--agent-deb] [-m|--manager] [-r|--agent-rpm] [-i|--indexer]"
            echo "  -d, --date     Specify date (default: yesterday)"
            echo "  -a, --agent-deb    Download agent .deb"
            echo "  -m, --manager  Download manager .deb"
            echo "  -r, --agent-rpm      Download agent .rpm"
            echo "  -i, --indexer  Download indexer .deb"
            echo "  If no package flags are specified, all packages will be downloaded"
            exit 1
            ;;
    esac
done

# Validate date format (YYYY-MM-DD)
if ! [[ "$DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    echo "Error: Date format must be YYYY-MM-DD (year-month-day)"
    echo "Example: 2026-01-20"
    exit 1
fi

# Validate that the date is valid (Ubuntu/GNU version)
if ! date -d "$DATE" > /dev/null 2>&1; then
    echo "Error: Invalid date: $DATE"
    exit 1
fi

# Base URL
BASE_URL="https://packages-dev.wazuh.com/nightly-backup/${DATE}"

# Download packages
echo "Downloading packages for date: ${DATE}"

# Download with error checking
DOWNLOAD_FAILED=0

if [ $DOWNLOAD_ALL -eq 1 ] || [ $DOWNLOAD_AGENT_DEB -eq 1 ]; then
    echo "Downloading wazuh-agent_5.0.0-latest_${DEB_ARCH}.deb..."
    if ! curl -f -O "${BASE_URL}/wazuh-agent_5.0.0-latest_${DEB_ARCH}.deb" 2>&1; then
        echo "Error: Failed to download wazuh-agent_5.0.0-latest_${DEB_ARCH}.deb"
        DOWNLOAD_FAILED=1
    fi
fi

if [ $DOWNLOAD_ALL -eq 1 ] || [ $DOWNLOAD_MANAGER_DEB -eq 1 ]; then
    echo "Downloading wazuh-manager_5.0.0-latest_${DEB_ARCH}.deb..."
    if ! curl -f -O "${BASE_URL}/wazuh-manager_5.0.0-latest_${DEB_ARCH}.deb" 2>&1; then
        echo "Error: Failed to download wazuh-manager_5.0.0-latest_${DEB_ARCH}.deb"
        DOWNLOAD_FAILED=1
    fi
fi

if [ $DOWNLOAD_ALL -eq 1 ] || [ $DOWNLOAD_AGENT_RPM -eq 1 ]; then
    echo "Downloading wazuh-agent-5.0.0-latest.${RPM_ARCH}.rpm..."
    if ! curl -f -O "${BASE_URL}/wazuh-agent-5.0.0-latest.${RPM_ARCH}.rpm" 2>&1; then
        echo "Error: Failed to download wazuh-agent-5.0.0-latest.${RPM_ARCH}.rpm"
        DOWNLOAD_FAILED=1
    fi
fi

if [ $DOWNLOAD_ALL -eq 1 ] || [ $DOWNLOAD_INDEXER_DEB -eq 1 ]; then
    echo "Downloading wazuh-indexer_5.0.0-latest_${DEB_ARCH}.deb..."
    if ! curl -f -O "${BASE_URL}/wazuh-indexer_5.0.0-latest_${DEB_ARCH}.deb" 2>&1; then
        echo "Error: Failed to download wazuh-indexer_5.0.0-latest_${DEB_ARCH}.deb"
        DOWNLOAD_FAILED=1
    fi
fi

# Check if any download failed
if [ $DOWNLOAD_FAILED -eq 1 ]; then
    echo ""
    echo "Error: One or more downloads failed. No files were moved."
    # Clean up any partially downloaded files
    rm -f wazuh-agent_5.0.0-latest_arm64.deb wazuh-manager_5.0.0-latest_arm64.deb wazuh-agent-5.0.0-latest.aarch64.rpm wazuh-indexer_5.0.0-latest_arm64.deb
    exit 1
fi

echo "Download completed. Moving files..."

# Move files to destinations
if [ $DOWNLOAD_ALL -eq 1 ] || [ $DOWNLOAD_MANAGER_DEB -eq 1 ]; then
    mv wazuh-manager*.deb /home/adam/development/Wazuh/src/plugins-src/wazuh-dashboard-plugins/docker/osd-dev/manager/ 2>/dev/null
fi

if [ $DOWNLOAD_ALL -eq 1 ] || [ $DOWNLOAD_AGENT_DEB -eq 1 ] || [ $DOWNLOAD_AGENT_RPM -eq 1 ]; then
    mv wazuh-agent* /home/adam/development/Wazuh/src/plugins-src/wazuh-dashboard-plugins/docker/osd-dev/agents 2>/dev/null
fi

if [ $DOWNLOAD_ALL -eq 1 ] || [ $DOWNLOAD_INDEXER_DEB -eq 1 ]; then
    mv wazuh-indexer*.deb /home/adam/development/Wazuh/src/plugins-src/wazuh-dashboard-plugins/docker/osd-dev/indexer/ 2>/dev/null
fi

echo "Process completed."
echo ""
echo "Files in manager:"
ls -lt /home/ferrjr/Escritorio/Wazuh/wazuh-dashboard-plugins/docker/osd-dev/manager/ | grep "wazuh-manager"
echo ""
echo "Files in agents:"
ls -lt /home/ferrjr/Escritorio/Wazuh/wazuh-dashboard-plugins/docker/osd-dev/agents/ | grep "wazuh-agent"
echo ""
echo "Files in indexer:"
ls -lt /home/ferrjr/Escritorio/Wazuh/wazuh-dashboard-plugins/docker/osd-dev/indexer/ | grep "wazuh-indexer"