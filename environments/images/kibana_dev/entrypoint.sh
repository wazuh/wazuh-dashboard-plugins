#!/usr/bin/env sh

# WITNESS_FILE_PATH=/tmp/odfe_configurated

# if [ ! -f $WITNESS_FILE_PATH ]; then
# 	# Create a witness file
# 	touch $WITNESS_FILE_PATH
# fi

# Load NVM
. $NVM_DIR/nvm.sh
cd $KIBANA_APP_HOME && nvm use
# Install Open Distro if required
KIBANA_PLUGINS_HOME="$KIBANA_APP_HOME/plugins"
ODFE_DIRECTORY_NAME="opendistro_security"
ODFE_DIRECTORY_HOME="$KIBANA_PLUGINS_HOME/$ODFE_DIRECTORY_NAME"
KIBANA_EXTRA_ARG = "$@"

if [ -n "${ODFE_BRANCH}" ] && [ ! -d "${ODFE_DIRECTORY_HOME}" ] ; then
    echo "Installing Open Distro for Elasticsearch Kibana plugin '$ODFE_BRANCH'";
    cd $KIBANA_PLUGINS_HOME \
	&& git clone --single-branch --depth 1 -b $ODFE_BRANCH https://github.com/opendistro-for-elasticsearch/security-kibana-plugin $ODFE_DIRECTORY_NAME \
    && echo "Cloned Open Distro for Elasticsearch Security plugin in $ODFE_DIRECTORY_HOME" \
    && cd $ODFE_DIRECTORY_HOME \
    && echo "Installing plugin dependencies" \
    && yarn
    KIBANA_EXTRA_ARG = "$KIBANA_EXTRA_ARG --oss"
fi

# Start Kibana dev
cd $KIBANA_APP_HOME && yarn start $KIBANA_EXTRA_ARG