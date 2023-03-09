"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
Low level interface for interacting with the kvstore.
"""
from builtins import range
from builtins import object
import json
import re
import sys
import splunk.rest as rest
from splunk import ResourceNotFound, RESTException

if sys.version_info < (3, 0):
    from urllib import quote_plus

else:
    from urllib.parse import quote_plus



from spacebridgeapp.logging.setup_logging import logger
from spacebridgeapp.util.splunk_utils.common import get_conf_stanza_single_entry

REST_TIMEOUT = 300

class StateStoreError(Exception):
    def __init__(self, message, status_code=None):
        self.message = message
        self.status_code = status_code

    def __str__(self):
        s = repr(self.message)
        if self.status_code is not None:
            s = "status={} ".format(self.status_code) + s
        return s

class StateStore(object):

    appname = "splunk_secure_gateway"

    # Per http://docs.splunk.com/Documentation/Splunk/6.5.0/RESTREF/RESTkvstore#Limits, 16 MB is max limit for document
    # size in KV store and non-configurable
    _max_document_size_limit_bytes = 16777216  # 16 * 1024 * 1024 = 16 MB

    # Per http://docs.splunk.com/Documentation/Splunk/6.5.0/RESTREF/RESTkvstore#Limits, the max size per batch save in
    # MB is set in the kvstore stanza in the limits.conf file with the name max_size_per_batch_save_mb
    _max_size_per_batch_save = None
    # Per http://docs.splunk.com/Documentation/Splunk/6.5.0/RESTREF/RESTkvstore#Limits, the max count of documents per
    # batch save
    _max_documents_per_batch_save = None

    def __init__(self, **kwargs):
        # Defaults here
        self.owner = "nobody"
        self.app = kwargs.get("namespace") or self.appname
        self.collectionname = kwargs.get("collection", "")
        # This member variable stores indexes to indicate which documents to save to aviod exceeding the max size per batch save
        self._save_ranges = []

    def _set_batch_save_size_limit(self, session_key, host_base_uri=''):
        """
        Fetches the max size per batch save if not already fetched

        @param session_key: splunkd session key
        @type session_key: string

        @param host_base_uri: The base uri <scheme>://<host>:<port> of the target host.  '' targets local host.
        @type host_base_uri: basestring
        """
        # Sets static variable from limits conf file if not already set
        if StateStore._max_size_per_batch_save is None:
            resp = get_conf_stanza_single_entry(session_key, 'limits', 'kvstore', 'max_size_per_batch_save_mb', host_base_uri=host_base_uri)
            StateStore._max_size_per_batch_save = int(resp.get('content', 50)) * 1024 * 1024
        if StateStore._max_documents_per_batch_save is None:
            resp = get_conf_stanza_single_entry(session_key, 'limits', 'kvstore', 'max_documents_per_batch_save', host_base_uri=host_base_uri)
            StateStore._max_documents_per_batch_save = int(resp.get('content', 1000))

    def check_payload_size(self, data_list, session_key, throw_on_violation=True, host_base_uri=''):
        """
        Method to verify KV store payload size isnt larger than 16MB limit of per document size

        @type: list
        @param data_list: JSON list payload to verify

        @type: boolean
        @param throw_on_violation: True if violation should trigger exception, else returns bool indicating
            if violation detected

        @type host_base_uri: basestring
        @param host_base_uri: The base uri <scheme>://<host>:<port> of the target host.  '' targets local host.

        @rtype: tuple (boolean, integer)
        @return: (True, -1) if no violation detected, (False, size causing violation in bytes) if violation detected
        """
        if not isinstance(data_list, list):
            raise StateStoreError(_('JSON payload is invalid.'))

        self._set_batch_save_size_limit(session_key, host_base_uri=host_base_uri)

        self._save_ranges = []
        cur_size = 0
        first_index = 0
        for idx, data in enumerate(data_list):
            size_of_payload = sys.getsizeof(str(data))
            if size_of_payload > self._max_document_size_limit_bytes:
                if throw_on_violation:
                    raise StateStoreError(
                        _('Object you are trying to save is too large (%s bytes). KV store only supports '
                          'documents within 16MB sizes.')% size_of_payload
                    )
                else:
                    # Return False indicating violation even if one object violates limits
                    return False, size_of_payload
            cur_size += size_of_payload
            # Check that you have not reached the document limit
            if cur_size >= StateStore._max_size_per_batch_save or (
                    idx - first_index) == StateStore._max_documents_per_batch_save:
                self._save_ranges.append((first_index, idx))
                first_index = idx
                cur_size = size_of_payload
        self._save_ranges.append((first_index, len(data_list)))

        return True, -1

    def lazy_init(self, session_key, host_base_uri=''):
        '''
        Query the kvstore config uri with the collection name, initialize the collection if 404 exception is returned,
        otherwise pass.

        @param session_key: The splunkd session key
        @type session_key: string

        @param host_base_uri: The base uri <scheme>://<host>:<port> of the target host.  '' targets local host.
        @type host_base_uri: basestring
        '''
        LOG_PREFIX = "[lazy_init] "
        entries = []
        uri = "{}/servicesNS/{}/{}/storage/collections/config/{}".format(host_base_uri, self.owner, self.app, self.collectionname)
        try:
            response, content = rest.simpleRequest(
                    uri,
                    getargs={"output_mode":"json"},
                    sessionKey=session_key,
                    raiseAllErrors=False
                    )

            parsed_content = json.loads(content)
            entries = parsed_content.get('entry',[])
        except ResourceNotFound:
            logger.debug('%s does not exist, it could be a new collection, will try to create it.', self.collectionname)
        except Exception as e:
            logger.exception(str(e))

        if len(entries) == 0:
            #If it doesnt have the collection, we need to create it
            postargs = {"name":self.collectionname}
            postargs["output_mode"] = "json"
            response,content = rest.simpleRequest(
                    uri,
                    method="POST",
                    postargs=postargs,
                    sessionKey=session_key,
                    raiseAllErrors=False
                    )
            if response.status != 200 and response.status != 201:
                logger.error("%s Unable to create collection=`%s`. URL=`%s`. Response=`%s`. Content=`%s`",
                    LOG_PREFIX, self.collectionname, uri, response, content)
            else:
                logger.debug("%s Created collection successfully.", LOG_PREFIX)

    def is_available(self, session_key, host_base_uri=''):
        """
        Tries to check the kvstore readiness via server info rest endpoint
        Parse kvStoreStatus status from the Json response.

        @param session_key: The splunkd session key
        @type session_key: string

        @param host_base_uri: The base uri <scheme>://<host>:<port> of the target host.  '' targets local host.
        @type host_base_uri: basestring

        @returns true if response contains ready
        @rtype bool
        """
        kvStoreStatus = ''
        uri = host_base_uri + '/services/server/info'
        getargs = {'output_mode': 'json'}
        response, content = rest.simpleRequest(uri, getargs=getargs, sessionKey=session_key, rawResult=True)
        try:
            parsed_content = json.loads(content)
            if isinstance(parsed_content, dict):
                entry = parsed_content.get('entry',[])
                if entry[0]:
                    content = entry[0].get('content', {})
                    kvStoreStatus = content.get('kvStoreStatus', '')
        except Exception:
            pass
        return 'ready' in kvStoreStatus


    def create(self, session_key, owner, objecttype, data, host_base_uri=''):
        """
        Create accepts different entity specifiers here, but can be reporposed for
        other collection tasks

        @param session_key: splunkd session key
        @type session_key: string

        @param objecttype: The type of object we are attempting to create
        @type objecttype: string

        @param data: The dict data (suitable for json-ification)
        @type data: dict

        @param host_base_uri: The host to run the rest request. '' defaults to localhost
        @type host_base_uri: string
        """
        LOG_PREFIX = "[create_statestore_" + objecttype + "]"
        #Build the request
        uri = "{}/servicesNS/{}/{}/storage/collections/data/{}".format(host_base_uri, owner, self.app, self.collectionname)
        data['object_type'] = objecttype
        response, content = rest.simpleRequest(
                uri,
                method="POST",
                jsonargs=json.dumps(data),
                sessionKey=session_key,
                raiseAllErrors=False
                )
        if response.status != 200 and response.status != 201:
            #Something failed in our request, raise an error
            message = _("Unable to save {0}, request failed. ").format(objecttype)
            logger.error('%s %s. response=`%s` content=`%s`', LOG_PREFIX, message, response, content)
            raise StateStoreError(content, response.status)
        try:
            #What we'll get back here is of the form {"_key":"somelongnumber"} (note the quotes)
            parsed_content = json.loads(content)
            return parsed_content
        except TypeError:
            message = _("Unable to parse response from statestore for {0} {1}.").format(objecttype,data)
            logger.exception(LOG_PREFIX + message)
            raise StateStoreError(message)

    def get(self, session_key, owner, objecttype, identifier, sort_key=None, sort_dir=None, filter_data={}, fields=None, skip=None, limit=None, host_base_uri=''):
        """
        Retrieves the object specified by the identifier, which can be either internal or external
        @param session_key: The splunkd session key
        @type session_key: str

        @param objecttype: The type of object (currently service or entity)
        @type objecttype: str

        @param identifier: The object's primary identifier, if None retrieves all objects of the selected type
        @type identifier: str or None

        @param sort_key: the field on which to ask the server to sort the results
        @type sort_key: str

        @param fields: An array of fields to be returned.  This is an array that is used to limit the field set returned
        @type fields: list

        @param host_base_uri: The host to to run the rest request. '' defaults to localhost
        @type host_base_uri: string
        """
        LOG_PREFIX = "[get_statestore_" + objecttype + "]"
        uri = host_base_uri + "/servicesNS/" + owner + "/" + self.app + "/storage/collections/data/" + self.collectionname
        get_args = None
        if identifier is None:
            filter_data = {} if filter_data is None else filter_data
            endpoint = uri #Here we plan on getting all elements
            #Pass in the filter_data and use the sort_key,sort_dir if defined
            if sort_key != None and sort_dir is None:
                logger.error(LOG_PREFIX + "sort_key defined as {0} with no sort direction".format(sort_key))
            elif sort_key is None and sort_dir != None:
                logger.error(LOG_PREFIX + "sort_dir defined as {0} with no sort key".format(sort_dir))
            elif sort_key != None and sort_dir != None:
                if sort_dir == "desc":
                    sort_dir = -1
                else:
                    sort_dir = 1 #Default to ascending
                get_args = {"sort":sort_key+ ":" + str(sort_dir)}

            filter_data["object_type"] = objecttype
            #ITOA-2913
            if "" in filter_data:
                message = _("Empty field received - Rejecting filter.")
                logger.error(LOG_PREFIX + message)
                raise StateStoreError(message)

            if "filter_string" in filter_data:
                logger.debug(LOG_PREFIX + "filter_string=%s", filter_data["filter_string"])
                filter_data.update(filter_data["filter_string"])
                del filter_data["filter_string"]

            if "shared" in filter_data:
                get_args = {} if get_args is None else get_args
                get_args["shared"] = filter_data["shared"]
                del filter_data["shared"]

            if fields is not None:
                get_args = {} if get_args is None else get_args
                if "object_type" not in fields:
                    fields.append("object_type")
                exclude = [field for field in fields if ':0' in field]
                # Mongodb does not allow field inclusion and exclusion in a single query.
                # The assumption is that if there is more than one field exclusion,
                # the system will ignore the field inclusion.
                if len(exclude) > 0:
                    final_fields = exclude
                else:
                    final_fields = fields
                get_args['fields'] = ','.join(final_fields)

            if skip is not None:
                get_args = {} if get_args is None else get_args
                get_args['skip'] = skip
            if limit is not None:
                get_args = {} if get_args is None else get_args
                get_args['limit'] = limit

            # At this point, 'filter_data' should have only the data for the 'query' param
            # Other params should be stored in 'get_args' and deleted from 'filter_data'
            if len(filter_data) > 0:
                get_args = {} if get_args is None else get_args
                try:
                    get_args['query'] = json.dumps(filter_data)
                    logger.debug(LOG_PREFIX + "json.dumps successful, get_args=%s", get_args)
                except ValueError:
                    logger.error(LOG_PREFIX + "error parsing json of query - query=%s", filter_data)
        else:
            endpoint = uri + "/" + quote_plus(identifier)

        content = "[]"
        for retry in range(3):
            try:
                response, content = rest.simpleRequest(
                        endpoint,
                        method="GET",
                        sessionKey=session_key,
                        raiseAllErrors=True,
                        getargs=get_args,
                        timeout=REST_TIMEOUT
                        )
                if 300 > response.status > 199:
                    break
            except ResourceNotFound:
                logger.error("%s 404 Not Found on GET to %s", LOG_PREFIX, endpoint)
                # Return None when something is not found
                return None
            except RESTException as e:
                if e.statusCode == 503 and retry != 2:
                    logger.warn(
                        "%s status 503 on endpoint %s, assuming KV Store starting up and retrying request, retries=%s",
                        LOG_PREFIX, endpoint, retry)
                    import time
                    time.sleep(2)
                else:
                    logger.error("%s status %s on endpoint %s, raising exception", LOG_PREFIX, e.statusCode, endpoint)
                    raise

        try:
            parsed_content = json.loads(content)
            if len(parsed_content) == 0:
                parsed_content = {}
            return parsed_content
        except TypeError:
            message = _("Unable to parse response from statestore for {0} {1}.").format(objecttype, identifier)
            logger.exception(LOG_PREFIX + message)
            raise StateStoreError(message)
        except ValueError:
            message = _("Unable to decode response from statestore for {0} {1}.").format(objecttype, identifier)
            logger.exception(LOG_PREFIX + message)
            raise StateStoreError(message)

    def edit(self, session_key, owner, objecttype, identifier, data, host_base_uri=''):
        """
        Per the contract that we're defining, edit will only cover a single thing, and that thing will be found by its id
        Which in this case is the statestore id.

        If no records are found, we will throw an error

        @param session_key: splunkd session key
        @type session_key: string

        @param objecttype: The type of object we are attempting to create - can currently be entity or service
        @type objecttype: string

        @param identifier: The id of the object
        @type identifier: string

        @param data: The dict data (suitable for json-ification)
        @type data: dict

        @param host_base_uri: The host to run the rest request. '' defaults to localhost
        @type host_base_uri: string
        """
        LOG_PREFIX = "[edit_statestore_" + objecttype + "]"
        curr_owner = owner
        uri = host_base_uri + "/servicesNS/" + curr_owner + "/" + self.app + "/storage/collections/data/" + self.collectionname + "/" + quote_plus(identifier)
        # These are the two fields that we require
        if '_key' not in data:
            data['_key'] = identifier
        data['object_type'] = objecttype

        response0 = self.get(session_key, curr_owner, objecttype, identifier, host_base_uri=host_base_uri)
        if response0 is None or len(response0) == 0: # object doesn't exist under input namespace
            if curr_owner != "nobody":
                message = _("Cannot change permissions from 'app' to 'user' without cloning.")
                logger.error(LOG_PREFIX + message)
                raise StateStoreError(message)
            # find object (if possible) in other namespace
            if curr_owner == "nobody":
                curr_owner = data.get('acl').get('owner') if data.get('acl') else "nobody"
            else:
                curr_owner = "nobody"
            response1 = self.get(session_key, curr_owner, objecttype, identifier, host_base_uri=host_base_uri)
            if response1 is None or len(response1) == 0: # object doesn't exist in either namespace, error
                message = _("Object with ID: %s does not exist in statestore.") % (identifier)
                logger.error(LOG_PREFIX + message)
                raise StateStoreError(message)
            else:
                # DELETE object from original namespace
                self.delete(session_key, curr_owner, objecttype, identifier, host_base_uri=host_base_uri)
                # CREATE object in input name space
                return self.create(session_key, owner, objecttype, data, host_base_uri=host_base_uri)
        else: # found object under current namespace
            response, content = rest.simpleRequest(
                    uri,
                    method="POST",
                    jsonargs=json.dumps(data),
                    sessionKey=session_key,
                    raiseAllErrors=True
                    )
            # Here. we're being generous about what we choose to accept
            if response.status not in (200, 201, 202):
                message = _("Unable to edit {0} {1}.").format(objecttype, identifier)
                logger.error('%s %s. Response=`%s` Content=`%s`', LOG_PREFIX, message, response, content)
                raise StateStoreError(message + ' ' + str(content), response.status)

            return {"_key": identifier}

    def delete(self, session_key, owner, objecttype, identifier, host_base_uri=''):
        """
        Deletes only the record at the specified endpoint, so it will look for that specific record
        @param session_key: splunkd session key
        @type session_key: string

        @param objecttype: The type of object we are attempting to create - can currently be entity or service
        @type objecttype: string

        @param identifier: The id of the object
        @type identifier: string

        @param host_base_uri: The host to run the rest request. '' defaults to localhost
        @type host_base_uri: string
        """
        LOG_PREFIX = "[delete_statestore_" + objecttype + "]"
        #First, we need to get the identifiers of the objects we plan on deleting
        uri = "{}/servicesNS/{}/{}/storage/collections/data/{}/{}".format(host_base_uri, self.owner, self.app, self.collectionname, quote_plus(identifier))
        try:
            response,content = rest.simpleRequest(
                    uri,
                    method="DELETE",
                    sessionKey=session_key,
                    raiseAllErrors=False
                    )
        except ResourceNotFound:
            # We tried to delete something that doesnt exist, just continue
            return
        # Here we're being generous about what we choose to accept
        if response.status not in (200, 201, 202):
            message = _("Unable to delete {0} {1}.").format(objecttype, identifier)
            logger.error('%s %s. Response=`%s`. Content=`%s`', LOG_PREFIX, message, response, content)
            raise StateStoreError(message + ' ' + str(content), response.status)

    def delete_all(self, session_key, owner, objecttype, filter_data, host_base_uri=''):
        """
        Implements a bulk delete based on the object type and the other filter data that comes in.
        While you can put in things without filterdata, in this case I am requiring it to not be empty.
        Because that's how you delete your entire environment, and that isn't good
        """
        LOG_PREFIX = "[delete_all_statestore_" + objecttype + "]"
        if filter_data is None or len(filter_data) == 0:
            logger.error(LOG_PREFIX + "filter data required for batch delete")
            return

        # ITOA-2913
        if "" in filter_data:
            message = _("Empty field received - Rejecting filter.")
            logger.error(LOG_PREFIX + message)
            raise StateStoreError(message)

        uri = host_base_uri + "/servicesNS/" + owner + "/" + self.app + "/storage/collections/data/" + self.collectionname
        filter_data['object_type'] = objecttype
        get_args = {}
        try:
            get_args['query'] = json.dumps(filter_data)
        except ValueError:
            logger.exception("error parsing json of query - aborting request - query=%s", filter_data)
            return
        try:
            #get_args are used here because those are appended to the URI - so they work in this case for deletes
            response, content = rest.simpleRequest(uri, method="DELETE", sessionKey=session_key,
                    getargs=get_args, raiseAllErrors=False)
            del content
        except ResourceNotFound:
            #We tried to delete something that doesnt exist, just continue
            logger.exception("error parsing json of query - aborting request - query=%s", filter_data)
            return
        #Here we're being generous about what we choose to accept
        if response.status != 200:
            logger.error(LOG_PREFIX + "could not batch delete status={0} query={1}".format(response.status,filter_data))
        return

    def get_all(self, session_key, owner, objecttype, sort_key=None, sort_dir=None, filter_data=None, fields=None, skip=None, limit=None, host_base_uri=''):
        """
        Gets all of the data associated with the object type; like get all entities or services

        @param session_key: splunkd session key
        @type session_key: string

        @param objecttype: The type of object we are attempting to create - can currently be entity or service
        @type objecttype: string

        @param filter_data: Currently unused filter data
        @type filter_data: A dict of kv pairs that can be passed along to the backend for filtering.
        """

        if not fields:
            fields = {}

        olive_me = self.get(
                session_key,
                owner,
                objecttype,
                None,
                sort_key=sort_key,
                sort_dir=sort_dir,
                filter_data=filter_data,
                fields=fields,
                skip=skip,
                limit=limit,
                host_base_uri=host_base_uri
                )
        if olive_me is None or len(olive_me) == 0:
            return []
        return olive_me

    @staticmethod
    def _extract_content_error(content):
        """
        Method takes in a content string from KV store API returned when API reports error
        and returns extracted first error message from it

        @type content: basestring
        @param content: XML containing content with error message in <messages><msg>...</msg>...<messages>
            Will return the first error message from the first element of type <msg>

        @rtype: basestring
        @return: extracted error message or a default if unavailable
        """
        default_error = 'Unknown, check logs for details.'
        match = re.search(r'<response>.*<messages>.*<msg.*>.*</msg>', content, flags=re.S)
        if match is not None and match.group(0) is not None:
            error_message = match.group(0)
            return error_message[error_message.find('>', error_message.find('<msg')) + 1: error_message.find('</msg>')]

        return default_error

    def batch_save(self, session_key, owner, data, host_base_uri=''):
        """
        WARNING: object_type must be set in everything or the data will be irretrievable with standard library
        Create accepts different entity specifiers here, but can be repurposed for
        other collection tasks

        @param session_key: splunkd session key
        @type session_key: string

        @param data: The list of dicts (suitable for json-ification)
        @type data: list

        @param host_base_uri: The host to run action. '' defaults to localhost
        @type host_base_uri: string
        """
        self.check_payload_size(data, session_key, host_base_uri=host_base_uri)

        LOG_PREFIX = "[batch_save]"
        if not isinstance(data, list):
            message = _("Batch save requires input be a list, actual data input={0}").format(data)
            logger.error(LOG_PREFIX + message)
            raise StateStoreError(message)
        if len(data) == 0:
            logger.warning("%s empty array passed to batch save, no op required", LOG_PREFIX)
            return []

        parsed_content = []
        for range in self._save_ranges:
            parsed_content.extend(self._execute_save_request(session_key, owner, data[range[0]:range[1]], host_base_uri=host_base_uri))
        self._save_ranges = []

        return parsed_content

    def _execute_save_request(self, session_key, owner, data, host_base_uri=''):
        """
        Executes a save request for the specified data

        @param session_key: splunkd session key
        @type session_key: string

        @param owner: splunkd session key
        @type session_key: string

        @param data: The dict data (suitable for json-ification)
        @type data: dict

        @rtype: dict
        @return: return value from the save request

        @param host_base_uri: The host to run action. '' defaults to localhost
        @type host_base_uri: string
        """
        LOG_PREFIX = "[batch_save]"
        uri = "{}/servicesNS/{}/{}/storage/collections/data/{}/batch_save".format(host_base_uri, owner, self.app, self.collectionname)
        response, content = rest.simpleRequest(
                uri,
                method="POST",
                jsonargs=json.dumps(data),
                sessionKey=session_key,
                raiseAllErrors=False
                )
        if response.status not in (200, 201):
            details = StateStore._extract_content_error(content)
            message = _("Batch save to KV store failed with code {0}. Error details: {1}").format(response.status, details)
            logger.error('%s %s. Response=`%s`. Content=`%s`', LOG_PREFIX, message, response, content)
            raise StateStoreError(message)
        try:
            # What we'll get back here is of the form {"_key":"somelongnumber"} (note the quotes)
            parsed_content = json.loads(content)
            return parsed_content
        except TypeError:
            message = _("Unable to parse batch response from statestore for batch_edit")
            logger.exception(LOG_PREFIX + message)
            raise StateStoreError(message)
