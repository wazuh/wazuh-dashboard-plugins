# this script is to disable DMC on SHC members.
from __future__ import print_function
import sys
import splunk.rest as rest
import splunk
import json
from splunk import LicenseRestriction, SplunkdConnectionException
import logging


SHC_CONFIG_ENDPOINT = '/services/shcluster/config?output_mode=json'
DISABLE_DMC_APP_CONF_ENDPOINT = '/services/apps/local/splunk_monitoring_console/disable?output_mode=json'
session_key = None

def disable_dmc_on_shc(session_key=None):

    try:
        (shc_response, shc_content) = rest.simpleRequest(SHC_CONFIG_ENDPOINT, session_key)
    except LicenseRestriction:
        logging.info('Cannot detect SHC status because of License Restriction. Will not disable DMC.')
        return False
    except SplunkdConnectionException:
        logging.info('Cannot connect to splunkd. Will not disable DMC.')
        return False
    shc_config = json.loads(shc_content)
    mode = shc_config['entry'][0]['content']['mode']
    if mode != 'disabled':
        logging.info('SHC is enabled, mode is ' + mode + ', disable DMC ...')
        rest.simpleRequest(DISABLE_DMC_APP_CONF_ENDPOINT, sessionKey=session_key, method='POST')
        return True
    else:
        return False

if __name__ == '__main__':
    # set up logger to send message to stderr so it will end up in splunkd.log
    sh = logging.StreamHandler()
    # the following line is to make sure the log event looks the same as any other splunkd.log
    sh.setFormatter(logging.Formatter("%(levelname)s %(message)s"))
    l = logging.getLogger()
    l.setLevel(logging.INFO)
    l.addHandler(sh)

    session_key = sys.stdin.read()

    try:
        disable_dmc_on_shc(session_key)
    except:
        logging.exception('DMC is not disabled due to an error.')
        raise
