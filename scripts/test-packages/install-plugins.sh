 plugins=$(ls /tmp)
echo $plugins
for plugin in $plugins; do
  echo $plugin
  unzip $plugin -d /unziped/
done
 plugins=$(ls /tmp/unziped)
for plugin in $plugins; do
  echo $plugin
  /usr/share/opensearch-dashboards/bin/opensearch-dashboards-plugin install file:///tmp/unziped/$plugin
done
