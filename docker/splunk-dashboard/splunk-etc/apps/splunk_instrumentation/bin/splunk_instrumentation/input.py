'''
This is the main entry point to scripted inputs to run

checks if this instance should run the app and then runs the app

'''
from __future__ import absolute_import

from splunk_instrumentation.constants import INST_EXECUTION_ID, INST_SCHEMA_FILE, INST_DEBUG_LEVEL
import sys
import logging
from splunk_instrumentation.report import report
from time import sleep
from splunk_instrumentation.schedule_manager import ScheduleManager
from splunk_instrumentation.dataPoints.data_point import dataPointFactory
from splunk_instrumentation.metrics.metrics_schema import load_schema
from splunk_instrumentation.metrics.instance_profile import get_instance_profile, is_lead_node
from splunk_instrumentation.constants import INTROSPECTION_INDEX_NAME

logging.root.setLevel(INST_DEBUG_LEVEL)
formatter = logging.Formatter('%(levelname)s %(message)s')
handler = logging.StreamHandler(stream=sys.stderr)
handler.setFormatter(formatter)
logging.root.addHandler(handler)

report.report('executionID', INST_EXECUTION_ID)


def pre_run(profile):
    '''
    Do some work to keep the environment healthy
        - sync deployment id from CM to current node
        - sync salt from CM to current node
        - retry transaction if retryTransaction in telemtry.conf is not empty

    :param profile
    :return: None
    '''

    profile.sync_deployment_id()
    profile.sync_salt()

    # if current node is a single search head or a seach head captain in SHC env
    # call profile.retry_transaction() to retry sync telemetry conf values to Cluster Master
    # TelemetryHandler.cpp SHOULD sync telemetry.conf to CM already whenever any value is changed.
    # This is to handle the case when it failed
    if (profile.roles.get('search_head') and
            not profile.roles.get('shc_member')) \
            or profile.roles.get('sh_captain'):
        report.report("profile.retry_transaction", True)
        profile.retry_transaction()


def run_phase_1_for_all_nodes(dateRange, schema_file):
    '''
    phase 1 runs by all nodes to collect role based data and index to data to _introspection
    phase 1 does not check opt in options

    :param profile
    :param dateRange
    :param schema_file
    :return: None
    '''

    report.report('Running_Phase[]', 1)
    ms = load_schema(schema_file, '*')
    sm = ScheduleManager(ms, dataPointFactory)

    # to add phase 1 and ignore visibility
    sm.phase_1(dateRange, INTROSPECTION_INDEX_NAME)


def can_run_phase2(profile):
    '''
    determine if current node can run phase 2
    the requirement is that the current node needs to be the lead node and
    that the deployment is opted-in (profile.visibility is not empty)

    :param profile
    :return: Boolean
    '''
    if is_lead_node(profile.roles) is False:
        report.report("lead node", False)
        return False

    report.report("lead node", True)
    report.report("profile.visibility", profile.visibility)
    if not profile.visibility:
        report.report("not-opted-in", True)
        return False

    if not profile.opt_in_is_up_to_date():
        report.report("opt-in-out-of-date-license-only", True)

    report.report("profile.cluster_mode", profile.profile.get('cluster_mode'))
    report.report("profile.roles", profile.roles)

    if profile.server_info.get('product_type') == "splunk":
        report.report("instance.type", 'Cloud')
        return False

    return True


def run_phase_2(profile, dateRange, schema_file):
    '''
    phase 2 runs by lead node only and only runs when a deployment is opted in.
    sm.phase_2() does the following:
    - collects and indexes data points marked as phase = 2
    - query data collected by phase = 1 and phase = 2 and send the data to splunkx

    :param profile
    :param dateRange
    :param schema_file
    :return: None
    '''
    report.report('Running_Phase[]', 2)
    ms = load_schema(schema_file, profile.visibility)
    sm = ScheduleManager(ms, dataPointFactory)

    sleep(5)
    sm.phase_2(dateRange, INTROSPECTION_INDEX_NAME)


def run_input(dateRange):
    profile = get_instance_profile()
    pre_run(profile)

    logging.info("INST Started")
    try:
        run_phase_1_for_all_nodes(dateRange, INST_SCHEMA_FILE)
    except Exception as ex:
        report.report('input.error', str(ex))

    if can_run_phase2(profile):
        try:
            run_phase_2(profile, dateRange, INST_SCHEMA_FILE)
            report.send()
        except Exception as ex:
            report.report('input.error', str(ex))

    logging.info("INST Done")
