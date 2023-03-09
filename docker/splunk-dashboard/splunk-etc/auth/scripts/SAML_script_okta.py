from commonAuth import *
logger = getLogger("{}/splunk_scripted_authentication_okta.log".format(logPath), "okta")

if sys.version_info < (3,0):
    logger.error("Python 2 has been deprecated. Use Python 3 to execute this script instead.")

import requests
import json
from urllib.parse import quote
# This is for getting SAML user information, it is an alternative to using SAML attribute
# query requests (AQR) which Okta does not support.
#
# Provide Okta API key credentials and base url in the authentication.conf
# file or using the Splunk Web UI
# (Settings > Authentication Methods > SAML Configuration > Authentication Extensions)
# and use the Okta API to extract user information.
#
# In authentication.conf, configure the 'scriptSecureArguments' setting to
# "apiKey:<your Okta API key>" and "baseUrl:<your Okta url>. For example:
#
# scriptSecureArguments = apiKey:<your Okta API key string>,baseUrl:<your Okta url>
#
# After you restart the Splunk platform, the platform encrypts your Okta credentials.
# For more information about Splunk platform configuration files, search the
# Splunk documentation for "about configuration files".
#
# In Splunk Web UI under Authentication Extensions > Script Secure Arguments:
# key = apiKey, value = <your Okta API key string>
# key = baseUrl, value =<your Okta url>
request_timeout = 10
errMsg = ""
def getUserInfo(args):
    username = args['username']

    if not username:
        errMsg = "Username is empty. Not executing API call"
        logger.error(errMsg)
        return FAILED + " " + ERROR_MSG + errMsg
    logger.info("Running getUserInfo() for username={}".format(username))

    # Extracting base url and API key from authentication.conf under scriptSecureArguments
    BASE_URL = args['baseUrl']
    API_KEY = args['apiKey']
    API_KEY_HEADER = 'SSWS ' + API_KEY
    # create persistent connection
    session = requests.Session()
    session.headers = {'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': API_KEY_HEADER}
    OKTA_USER_SEARCH_INPUT = "oktaUserSearch"
    encoded_username = quote(username)
    if OKTA_USER_SEARCH_INPUT not in args:
        # By default use the email as the attribute to query user information from Okta.
        # Typically Okta APIs can be quieried directly using the email attribute.
        # For example, for a customer Acme and username "acme@example.com" the Okta
        # URL will look something like
        # https://acme.okta.com/api/v1/users/<Base64UrlEncode(acme@example.com)>
        usernameUrl = BASE_URL + '/api/v1/users/' + encoded_username
        groupsUrl = usernameUrl + '/groups'

        logger.info("Okta username url is {}".format(usernameUrl))

        usernameResponse = session.get(usernameUrl, timeout=request_timeout)
        if usernameResponse.status_code != 200:
            errMsg = "Failed to get user info for username={} with status={} and response={}".format(username, usernameResponse.status_code, usernameResponse.text)
            logger.error(errMsg)
            if usernameResponse.status_code == 401:
                errMsg = "It appears your baseUrl and/or apiKey are incorrect. Check your Okta instance URL " \
                    "and search the Okta documentation to retrieve the apiKey: " \
                    "\"Create the token | Okta Developer\""
                logger.warning(errMsg)
            elif usernameResponse.status_code == 404:
                errMsg = "The user you are querying (username={}) does not exist".format(username)
                logger.error(errMsg)
            return FAILED + " " + ERROR_MSG + errMsg
        try:
            nameAttributes = json.loads(usernameResponse.text)
        except Exception as e:
            errMsg = "Failed to parse user info for username={} with error={}".format(username, str(e))
            logger.error(errMsg)
            return FAILED + " " + ERROR_MSG + errMsg
        if 'status' not in nameAttributes:
            errMsg = "Failed to parse user info for username={}, 'status' not present in response output: {}".format(username, usernameResponse.text)
            logger.error(errMsg)
            return FAILED + " " + ERROR_MSG + errMsg
        status = nameAttributes['status']
    else:
        # In rare cases (like when Okta has been paired with a customer's Active Directory) the email may *not*
        # used directly to lookup user information. In such cases an AD attribute e.g (samAccountName) is needed.
        # More info https://help.okta.com/en/prod/Content/Topics/Directory/Directory_AD_Field_Mappings.htm
        # In such cases we allow the customer to construct a search based on whatever attribute they have choosen.
        # Okta's user APIs are queried by construncting a search with the unique user identifier passed in as a
        # argument to the script. This can be done directly through the SAML configuration page or
        # through authentication.conf
        # if the user has passed in a custom search attribute, use that instead of the email.
        # API Ref: https://developer.okta.com/docs/reference/api/users/#list-users-with-search
        # Note that this search attribute is passed in as a key:value pair through the scripted inputs section.
        # E.g if  we want to search based on 'samAccountName' we will pass in the following input to the script
        #
        # search=profile.samAccountName eq <attr-to-be-queried>
        #
        # Currently, only one attribute is allowed as an input to search.
        # https://acme.okta.com/api/v1/users/?<Base64UrlEncode(search profile.samAccountName eq <username>)>
        logger.info('Using attribute={} to do a lookup for value={}'.format(args[OKTA_USER_SEARCH_INPUT], encoded_username))
        query = '{} eq \"{}\"'.format(args[OKTA_USER_SEARCH_INPUT], username)
        searchUrl = '/api/v1/users/?search=' + quote(query)
        usernameUrl = BASE_URL + searchUrl
        logger.info("Okta search url is {}".format(usernameUrl))
        usernameResponse = session.get(usernameUrl, timeout=request_timeout)
        if usernameResponse.status_code != 200:
            errMsg = "Failed to get user info for username={} with status={} and response={}".format(username, usernameResponse.status_code, usernameResponse.text)
            logger.error(errMsg)
            if usernameResponse.status_code == 400:
                errMsg = "It appears you are using a search parameter that does not exist. " \
                    "Search the Okta documentation for examples: " \
                    "\"Okta Users API - Okta Developer\" / \"List Users with Search\""
                logger.error(errMsg)
            elif usernameResponse.status_code == 401:
                errMsg = "It appears your baseUrl and/or apiKey are incorrect. Check your Okta instance URL " \
                    "and search the Okta documentation to retrieve the apiKey: " \
                    "\"Create the token | Okta Developer\""
                logger.warning(errMsg)
            elif usernameResponse.status_code == 404:
                errMsg = "The user you are querying ({}) does not exist".format(username)
                logger.error(errMsg)
            return FAILED + " " + ERROR_MSG + errMsg
        try:
            nameAttributes = json.loads(usernameResponse.text)
        except Exception as e:
            errMsg = "Failed to parse user info for username={} with error={}".format(username, str(e))
            logger.error(errMsg)
            return FAILED + " " + ERROR_MSG + errMsg
        if not len(nameAttributes):
            errMsg = "Search query returned an empty response using attribute={} to do a lookup for value={}".format(args[OKTA_USER_SEARCH_INPUT], encoded_username)
            logger.error(errMsg)
            return FAILED + " " + ERROR_MSG + errMsg
        if len(nameAttributes) > 1:
            logger.error("Returned more than one result while fetching get user info for username={} with user response status={} and user response={}. Check your search criteria.".format(username, usernameResponse.status_code, usernameResponse.text))
            errMsg = "Returned more than one result while fetching get user info for username={}. " \
                "Check your search criteria.".format(username)
            return FAILED + " " + ERROR_MSG + errMsg
        userId = nameAttributes[0]['id']
        groupsUrl = BASE_URL + '/api/v1/users/' + userId + '/groups'

        try:
            nameAttributes = json.loads(usernameResponse.text)[0]
        except Exception as e:
            errMsg = "Failed to parse user info for username={} with error={}".format(username, str(e))
            logger.error(errMsg)
            return FAILED + " " + ERROR_MSG + errMsg
        if 'status' not in nameAttributes:
            errMsg = "Failed to parse user info for username={}, status not present in response output".format(username)
            logger.error(errMsg)
            return FAILED + " " + ERROR_MSG + errMsg
        status = nameAttributes['status']

    roleString = ''
    realNameString = ''
    fullString = ''
    if usernameResponse.status_code == 429:
        logger.error("Rate limit reached for IdP, failed to get user info for username={} with user "
                        "response status={} and user response={}".format(username, usernameResponse.status_code, usernameResponse.text))
        errMsg = "Rate limit reached for IdP, failed to get user info for username={} " \
            "with user response status={}".format(username, usernameResponse.status_code)
        return FAILED + " " + ERROR_MSG + errMsg
    if usernameResponse.status_code != 200:
        logger.error("Failed to get user info for username={} with user response status={} and user "
                        "response={}".format(username, usernameResponse.status_code, usernameResponse.text))
        errMsg = "Failed to get user info for username={} " \
            "with user response status={}".format(username, usernameResponse.status_code)
        return FAILED + " " + ERROR_MSG + errMsg
    else:
        logger.info("Successfully obtained user info for username={} with user response status={} and user "
                    "response={}".format(username, usernameResponse.status_code, usernameResponse.text))

    # Available statuses : Staged, Pending User Action, Active, Password Reset, Locked Out, Suspended, Deactivated
    # https://help.okta.com/en/prod/Content/Topics/Directory/end-user-states.htm
    if status not in {"ACTIVE", "PASSWORD_EXPIRED", "RECOVERY", "LOCKED_OUT"}:
        errMsg = "User is not active in IdP for username={} with user status={}".format(username, status)
        logger.error(errMsg)
        return FAILED + " " + ERROR_MSG + errMsg
    realNameString += nameAttributes['profile']['firstName'] + ' ' + nameAttributes['profile']['lastName']

    encodeOutput = True # default to always encode unless specified in args
    if 'encodeOutput' in args and args['encodeOutput'].lower() == 'false':
        encodeOutput = False

    while groupsUrl:
        logger.info("Okta group url is {}".format(groupsUrl))
        groupsResponse = session.get(groupsUrl, timeout=request_timeout)
        if groupsResponse.status_code == 429:
            logger.error("Rate limit reached for IdP, failed to get group info for username={} with group "
                            "response status={} and group response={}".format(username, groupsResponse.status_code, groupsResponse.text))
            errMsg = "Rate limit reached for IdP, failed to get group info for username={} " \
                "with group response status={}".format(username, groupsResponse.status_code)
            return FAILED + " " + ERROR_MSG + errMsg
        if groupsResponse.status_code != 200:
            logger.error("Failed to get group info for username={} with group response status={} and group "
                            "response={}".format(username, groupsResponse.status_code, groupsResponse.text))
            errMsg = "Failed to get group info for username={} " \
                "with group response status={}".format(username, groupsResponse.status_code)
            return FAILED + " " + ERROR_MSG + errMsg
        try:
            groupAttributes = json.loads(groupsResponse.text)
        except Exception as e:
            errMsg = "Failed to parse group info for username={} with status={} and response={}".format(username, groupsResponse.status_code, groupsResponse.text)
            logger.error(errMsg)
            return FAILED + " " + ERROR_MSG + errMsg

        groupNames = ['{}'.format(urlsafe_b64encode_to_str(group['profile']['name'])) for group in groupAttributes] if encodeOutput else ['{}'.format(group['profile']['name']) for group in groupAttributes]
        roleString += ":".join(groupNames)

        if groupsResponse.links.get('next'):
            groupsUrl = groupsResponse.links['next']['url']
        else:
            groupsUrl = None
    logger.info("Successfully obtained group info for username={}".format(username))

    if encodeOutput:
        logger.info("base64 encoding script output")
        base64UrlEncodedUsername = urlsafe_b64encode_to_str(username)
        base64UrlEncodedRealName = urlsafe_b64encode_to_str(realNameString)

        fullString += '{} --userInfo={};{};{} --encodedOutput=true'.format(SUCCESS, base64UrlEncodedUsername, base64UrlEncodedRealName, roleString)
    else:
        logger.info("Not base64 encoding script output")
        fullString += '{} --userInfo={};{};{}'.format(SUCCESS, username, realNameString, roleString)

    logger.info("getUserInfo() successful for username={}".format(username))
    return fullString


if __name__ == "__main__":
    callName = sys.argv[1]
    dictIn = readInputs()

    if callName == "getUserInfo":
        response = getUserInfo(dictIn)
        print(response)
