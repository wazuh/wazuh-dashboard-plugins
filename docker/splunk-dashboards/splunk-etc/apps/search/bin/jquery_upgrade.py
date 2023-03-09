from __future__ import print_function
import os
import sys
import logging
import json
import splunk.search as se

dashboards_with_customjs_search = """
| rest splunk_server=local /servicesNS/-/-/data/ui/views search="rootNode=form OR rootNode=dashboard" count=0
| rename eai:data as xml
  title as view_name
  eai:acl.app as app
  eai:acl.owner as owner
| search owner=* app=*
| regex xml="^<(dashboard|form)(.|\n)*script[ ]*=[ ]*(?:\\'|\\").*\.js(?:\\'|\\")(.|\n)*>(.|\n)*"
| regex xml!="^<(dashboard|form)(.|\n)*version[ ]*=[ ]*(?:\\'|\\")1.1(?:\\'|\\")(.|\n)*>(.|\n)*"
| table view_name, owner, app
| join type=inner app
	[ | rest splunk_server=local /servicesNS/-/-/apps/local count=0
	| rename title as app label as app_label
	| table app app_label]
"""

html_dashboard_search = """
| rest splunk_server=local /servicesNS/-/-/data/ui/views search="eai:type=html" count=0
| rename title as view_name eai:acl.app as app eai:acl.owner as owner
| search owner=* app=*
| table view_name, app
| join type=inner app
	[ | rest splunk_server=local /servicesNS/-/-/apps/local count=0
	| rename title as app label as app_label
	| table app app_label]
"""

def setup_logger():
    sh = logging.StreamHandler()
    sh.setFormatter(logging.Formatter("%(levelname)s %(message)s"))
    logger = logging.getLogger()
    logger.setLevel(logging.WARN)
    logger.addHandler(sh)
    return logger

def log_dashboards_data(search_job, logger, log_message):
    if (len(search_job) > 0):
        data = []
        for result in search_job:
            row_data = {}
            for column in result:
                row_data[column] = str(result[column])
            data.append(row_data)
        logger.warning('%s: %s' % (log_message, json.dumps(data)))

def run():
    logger = setup_logger()
    session_key = sys.stdin.read()
    try:
        dashboards_with_customjs_search_job = se.searchAll(dashboards_with_customjs_search, sessionKey=session_key)
        html_dashboard_search_job = se.searchAll(html_dashboard_search, sessionKey=session_key)

        log_dashboards_data(dashboards_with_customjs_search_job, logger, 'Dashboards with CustomJS')
        log_dashboards_data(html_dashboard_search_job, logger, 'HTML Dashboards')
    except Exception as e:
        logger.error('Unexpected error during execution of jquery_upgrade.py: %s' % str(e))

if __name__ == '__main__':
    run()
