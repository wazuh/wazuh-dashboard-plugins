set -e

plugins=$(ls /tmp)
for plugin in $plugins; do
  echo $plugin
  /usr/share/opensearch-dashboards/bin/opensearch-dashboards-plugin install file:///tmpf/$plugin/$(ls /tmp/$plugin)
done
echo "All plugins installed successfully"
