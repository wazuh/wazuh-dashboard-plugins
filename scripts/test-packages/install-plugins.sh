set -e

plugins=$(ls /tmp/wazuh-dashboard-plugins_*.zip 2>/dev/null || true)
for plugin in $plugins; do
  echo $plugin
  /usr/share/opensearch-dashboards/bin/opensearch-dashboards-plugin install file://$plugin
done
echo "All plugins installed successfully"
