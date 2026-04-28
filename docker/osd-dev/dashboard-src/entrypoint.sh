# Update and install dependencies

ROOT_APP_DIR="/home/node/kbn"
APP_PLUGINS_DIR="/home/node/kbn/plugins"
plugins=$(ls $APP_PLUGINS_DIR)
for plugin in $plugins; do
  echo "Checking if $plugin has node_modules"
  if [ ! -d "$APP_PLUGINS_DIR/$plugin/node_modules" ]; then
    cd $APP_PLUGINS_DIR/$plugin
    echo "Installing dependencies for $plugin"
    yarn
  fi
done

cd $ROOT_APP_DIR

# Block to avoid the container exit
tail -f /dev/null
