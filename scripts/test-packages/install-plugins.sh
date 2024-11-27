# plugins=$(ls /tmp)
# echo $plugins
# for plugin in $plugins; do
#   echo $plugin
#   unzip /tmp/$plugin -d /tmp/unziped/
# done
plugins=$(ls /tmp/plugins)
for plugin in $plugins; do
  echo $plugin
  /usr/share/opensearch-dashboards/bin/opensearch-dashboards-plugin install file:///tmp/plugins/$plugin/$(ls /tmp/plugins/$plugin)
done
