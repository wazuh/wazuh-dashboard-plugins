# This script is to help set up the dashboard studio app during the Enterprise startup.
# Specifically, it uploads some icons to kvstore, so that user can use them right away.
# This needs to run right after user installs the app, and only runs once.
#
# To debug this script, run a splunk search: index=_internal
# "save_image_and_icon_on_install"
import sys
import logging
import base64
import json
import time
import splunk.rest as rest
from mimetypes import guess_type
from splunk import SplunkdConnectionException
from os import walk
from os.path import join
from splunk.clilib.bundle_paths import get_base_path
from splunk.clilib.cli_common import getAppConf, readConfFile, writeConfFile
from utils import IS_PYTHON_3, strip_uuid

KVSTORE_ENDPOINT = '/servicesNS/nobody/splunk-dashboard-studio/storage/collections/data'

KVSTORE_STATUS_ENDPOINT = '/services/kvstore/status?output_mode=json'

KVSTORE_ICON_STATUS_CONF = join('splunk-dashboard-studio', 'kvstore_icon_status.conf')

def get_kvstore_status(session_key=None):
    logging.debug('fetch kvstore status')
    response, content = rest.simpleRequest(KVSTORE_STATUS_ENDPOINT, sessionKey=session_key, method='GET')
    if response.status != 200:
        logging.error('Unable to fetch kvstore status response: {}, content: {}'.format(response, content))
        exit(1)
    content_dict = json.loads(content)
    kvstore_status = content_dict.get('entry')[0].get('content', {}).get('current', {}).get('status')
    logging.info('kvstore current status is {}'.format(kvstore_status))
    return kvstore_status


def wait_kvstore_ready(session_key=None):
    # retry 10 times
    retry = 10
    kvstore_status = get_kvstore_status(session_key=session_key)

    if kvstore_status == 'disabled' or kvstore_status == 'failed':
        logging.info('kvstore current status is {}. Exiting now.'.format(kvstore_status))
        exit(1)
    elif kvstore_status == 'ready':
        return kvstore_status

    # wait for 5 seconds if the current status is starting
    while kvstore_status == "starting" and retry > 0:
        logging.info('kvstore current status is starting, wait 5 seconds')
        time.sleep(5)
        kvstore_status = get_kvstore_status(session_key=session_key)
        if kvstore_status == "ready":
            logging.info('kvstore status is ready, start next step to upload icons')
            return kvstore_status
        retry = retry - 1


def get_dashboard_studio_version():
    app_conf = getAppConf('app', 'splunk-dashboard-studio')
    app_version = app_conf.get('launcher', {}).get('version')
    logging.info('{} version is {}'.format('splunk-dashboard-studio', app_version))
    return app_version


def read_kvstore_icon_status_conf():
    conf_settings = {}
    try:
        path = join(get_base_path(), KVSTORE_ICON_STATUS_CONF)
        conf_settings = readConfFile(path)
    except Exception as e:
        logging.error(str(e))
        logging.error('Failed to read {}'.format(path))
    logging.info('Content of {} is {}'.format(path, conf_settings))
    return conf_settings


def create_kvstore_icon_status_conf(app_version=None):
    try:
        path = join(get_base_path(), KVSTORE_ICON_STATUS_CONF)
        dictionary = {
            'default': {
                'uploadedVersion': app_version
            }
        }
        writeConfFile(path, dictionary)
    except Exception as e:
        logging.error(str(e))
        logging.error('Failed to create {} with app version {}'.format(path, app_version))
    logging.info('{} is updated with {}'.format(path, dictionary))
    return


def get_items(collection_name=None, fields='_key'):
    items = set()
    if collection_name is not None:
        # fetch only _key and not the entire object
        url = KVSTORE_ENDPOINT + '/' + collection_name + '?fields=' + fields
        response, content = rest.simpleRequest(url, sessionKey=session_key, method='GET')
        if response.status != 200:
            logging.error('Unable to get {} from kvstore collection {}'.format(fields, collection_name))
            logging.error('response: {}, content: {}'.format(response, content))
            return items
        content_list = json.loads(content)
        for record in content_list:
            items.add(record.get(fields))
    logging.debug('keys in {} collection {}'.format(collection_name, items))
    return items


def update_kvstore_collection(folder_name, collection_name=None, session_key=None):
    update_status = []
    # read files
    folder = join(
        get_base_path(),
        'splunk-dashboard-studio',
        'appserver',
        'static',
        folder_name)

    _, _, filenames = walk(folder).__next__(
    ) if IS_PYTHON_3 else walk(folder).next()

    visible_filenames = [f for f in filenames if not f[0] == '.']

    # get _keys which are already stored in kvstore collection
    _keys = get_items(collection_name)

    for filename in visible_filenames:
        # if file is already stored in kvstore, skip saving and continue
        if filename in _keys:
            logging.debug('skip saving {} in kvstore collection {}'.format(filename, collection_name))
            continue

        file_full_path = join(folder, filename)
        with open(file_full_path, 'rb') as image_file:
            encoded_string = base64.b64encode(image_file.read())
            (image_type, _) = guess_type(file_full_path)
            data_uri = 'data:{};base64,{}'.format(
                image_type, encoded_string.decode('utf-8') if IS_PYTHON_3 else encoded_string)
            url = KVSTORE_ENDPOINT + '/' + collection_name
            logging.info('start saving to kvstore, name is {}, type is {}'.format(filename, image_type))
            payload = {
                # manually specify _key to avoid random _key, so that pre-built
                # dashboard can use them
                '_key': filename,
                'dataURI': data_uri,
                'metaData': {
                    'name': strip_uuid(filename)
                }
            }
            # although kvstore has /batch_save endpoint, we cannot use it
            # because data_uri could be very large that kvstore throws error.
            response, content = rest.simpleRequest(
                url, sessionKey=session_key, method='POST', jsonargs=json.dumps(payload))
            logging.info('complete saving to kvstore, response: {}, content: {}'.format(response, content))
            # 201 record is stored successfully in kvstore collection
            # 409 indicates that key is already stored in kvstore collection
            if response.status == 201 or response.status == 409:
                update_status.append(True)
            else:
                update_status.append(False)

    return all(update_status)


if __name__ == '__main__':
    # set up logger to send message to stderr so it will end up in splunkd.log
    sh = logging.StreamHandler()
    # the following line is to make sure the log event looks the same as any
    # other splunkd.log
    sh.setFormatter(logging.Formatter("%(levelname)s %(message)s"))
    l = logging.getLogger()
    l.setLevel(logging.INFO)
    l.addHandler(sh)
    try:
        session_key = sys.stdin.readline().strip()

        # Get dashboard studio version
        dashboard_studio_version = get_dashboard_studio_version()
        if dashboard_studio_version is None:
            logging.error('Not able to find dashboard studio version')

        # Get uploaded version from kvstore_icon_status.conf file if it is available
        kvstore_icon_status_conf = read_kvstore_icon_status_conf()
        kvstore_icon_status_conf_uploaded_version = kvstore_icon_status_conf.get('default', {}).get('uploadedVersion')

        # If dashboard studio version and kvstore_icon_status.conf uploaded version are same,
        # then there is no need to save icons in kvstore collection again.
        # Just exit the process
        if dashboard_studio_version is not None and \
           kvstore_icon_status_conf_uploaded_version is not None and \
           dashboard_studio_version == kvstore_icon_status_conf_uploaded_version:
                logging.info('Icons of {} version {} are already stored in kvstore collection. Skipping '
                             'now and exiting.'.format('splunk-dashboard-studio', dashboard_studio_version))
                exit(1)

        logging.info('dashboard studio version is not matching uploaded version in {}. '
                     'checking kvstore now ...'.format(KVSTORE_ICON_STATUS_CONF))

        kvstore_status = wait_kvstore_ready(session_key=session_key)
        if kvstore_status != 'ready':
            logging.info('kvstore status is {}, exiting now.'.format(kvstore_status))
            exit()

        # update splunk-dashboard-icons kvstore collection
        update_kvstore_status = update_kvstore_collection(
            folder_name='icons',
            collection_name='splunk-dashboard-icons',
            session_key=session_key)
        logging.info('splunk-dashboard-icons collection is successfully updated :: {}'.format(update_kvstore_status))

        # update uploaded version in kvstore_icon_status.conf with dashboard_studio_version,
        # only if all dashboard icons are stored successfully
        if update_kvstore_status:
            create_kvstore_icon_status_conf(app_version=dashboard_studio_version)

    except SplunkdConnectionException as e:
        logging.error(str(e))
        logging.error('Failed to connect to splunkd.')
        exit(1)
    except Exception as e:
        logging.error(str(e))
        logging.error('Failed to save icons to kvstore due to an error.')
        exit(1)
