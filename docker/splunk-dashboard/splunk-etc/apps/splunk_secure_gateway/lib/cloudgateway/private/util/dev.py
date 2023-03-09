"""
Utils for development testing
"""
import os


def set_splunk_env():
    # Set Environment Variables
    splunk_home = os.environ.get("SPLUNK_HOME")
    os.environ['NODE_PATH'] = splunk_home + '/lib/node_modules'
    os.environ['SPLUNK_ETC'] = splunk_home + '/etc'
    os.environ['SPLUNK_WEB_NAME'] = 'splunkweb'
    os.environ['LDAPCONF'] = splunk_home + '/etc/openldap/ldap.conf'
    os.environ['SPLUNK_DB'] = splunk_home + '/var/lib/splunk'
    os.environ['HOSTNAME'] = 'localhost'
    os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'