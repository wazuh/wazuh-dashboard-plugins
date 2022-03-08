#!/usr/bin/env sh
# Replace git dir and fix gir dir error
if [ -f $KIBANA_APP_HOME/src/dev/register_git_hook/register_git_hook.js ]; then
    sed -i -e 's/--git-common-dir/--git-dir/' src/dev/register_git_hook/register_git_hook.js
fi
# Kibana 7.9
if [ -f $KIBANA_APP_HOME/packages/kbn-dev-utils/src/precommit_hook/get_git_dir.ts ]; then
    sed -i -e 's/--git-common-dir/--git-dir/' packages/kbn-dev-utils/src/precommit_hook/get_git_dir.ts 
fi

# Fix restarting loop due to changes in wazuh-registry.json Wazuh <=3.13
if [ -f $KIBANA_APP_HOME/src/cli/cluster/cluster_manager.ts ]; then
    sed -i -r "s/resolve\(path, 'docs\/\*\*'\)/resolve\(path, 'docs\/\*\*'\),\n\t\tresolve\('plugins\/wazuh\/server\/wazuh-registry.json'\)/" src/cli/cluster/cluster_manager.ts
fi