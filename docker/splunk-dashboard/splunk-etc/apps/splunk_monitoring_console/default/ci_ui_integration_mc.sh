#!/bin/bash

#  Jenkins UI integration script
#
#  EDIT WITH CAUTION!
#    This script impacts all of our CI runs. If you break it, expect pitchforks and flaming torches.
#
#  WHAT THIS DOES:
#    Prepares environment for JS/node scripts (npm install)
#    Hand over control to task runner (runs unit tests and linters)
#
#  INPUT/ENVIRONMENT:
#    No arguments
#    Working directory is $SPLUNK_SOURCE/cfg/bundles/splunk_monitoring_console
#    Contrib installed in $SPLUNK_HOME/bin (might be cached)
#    Splunk is -not- compiled/installed/available
#    GNU parallel is available
#
#  OUTPUT:
#    Writes ci_ui_results_mc_mc.properties, setting UI_UNIT_JUNIT_FILES to a list of
#      JUnit-style XML files we want Jenkins to evaluate.
printf -v line '%*s\n' 78
line2="### %-70s ###\n"
echo ${line// /#}
printf "$line2" "Starting MC UI CI run - ci_ui_integration_mc.sh"
echo ${line// /#}

fail_build() {
    echo ${line// /#}
    echo ${line// /#}
    printf "$line2" " FAILED $2"
    echo ${line// /#}
    echo ${line// /#}
    exit $1
}

# ensure contrib node/npm are used (not system)
# enable node to find shared libraries (ssl/zlib)
# install npm packages
# create xml output directory (fails if exists)
prepare() {
    echo ${line// /#}
    printf "$line2" "Setting LD_LIBRARY_PATH to splunk /lib"

    export LD_LIBRARY_PATH=$SPLUNK_HOME/lib
    printf "$line2" "LD_LIBRARY_PATH is now: $LD_LIBRARY_PATH"

    echo ${line// /#}
    printf "$line2" "Prepending splunk /bin to PATH"

    export PATH=$SPLUNK_HOME/bin:$PATH
    printf "$line2" "PATH is now: $PATH"

    echo ${line// /#}
    printf "$line2" "Run (with npm): install"

    $SPLUNK_HOME/bin/node $SPLUNK_HOME/bin/npm --tmp /tmp/npmtmp install
    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ] ; then
        printf "$line2" "UI preparation ERROR: npm install failed"
        fail_build $EXIT_CODE npm_install
    fi

    echo ${line// /#}
    printf "$line2" "Creating xml output directory"
    mkdir $SPLUNK_SOURCE/cfg/bundles/splunk_monitoring_console/ci_ui_xml_mc
}

run_mc_tasks() {
    echo ${line// /#}
    printf "$line2" "Run: node ci_ui_runner_mc.js"

    $SPLUNK_HOME/bin/node ci_ui_runner_mc.js
    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ] ; then
        printf "$line2" "UI tasks ERROR: ci_ui_runner_mc.js: ${EXIT_CODE}"
        fail_build $EXIT_CODE ci_ui_mc_tasks
    fi
}

# write list of xml output files
writeResults() {
    cd $SPLUNK_SOURCE/cfg/bundles/splunk_monitoring_console
    echo UI_UNIT_JUNIT_FILES=\
ci_ui_xml_mc/test_splunk_monitoring_console.xml,\
ci_ui_xml_mc/lint_splunk_monitoring_console.xml,\
ci_ui_xml_mc/lint_splunk_monitoring_console_jsx.xml\
 > ci_ui_results_mc.properties
}

prepare
run_mc_tasks
writeResults
