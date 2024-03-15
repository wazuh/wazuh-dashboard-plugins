 plugins=$(ls /tmp)
echo $plugins
for plugin in $plugins; do
  echo $plugin
  /usr/share/opensearch-dashboards/bin/opensearch-dashboards-plugin install file:///tmp/$plugin
done
