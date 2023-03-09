from commonAuth import *
logger = getLogger("{}/splunk_scripted_authentication_azure.log".format(logPath), "azure")

if sys.version_info < (3,0):
    logger.error("Python 2 has been deprecated. Use Python 3 to execute this script instead.")

import requests
import json
from urllib.parse import quote


# This is for getting SAML user information, it is an alternative to using SAML attribute
# query requests (AQR) which Azure AD does not support.
#
# Provide Azure API key credentials and base url in the authentication.conf
# file or using the Splunk Web UI
# (Settings > Authentication Methods > SAML Configuration > Authentication Extensions)
# and use the Azure API to extract user information.
#
# In authentication.conf, configure the 'scriptSecureArguments' setting to
# "apiKey:<your Azure API key>". For example:
#
# scriptSecureArguments = apiKey:<your Azure API key string>,baseUrl:<your Azure url>
#
# After you restart the Splunk platform, the platform encrypts your Azure credentials.
# For more information about Splunk platform configuration files, search the
# Splunk documentation for "about configuration files".
#
# In Splunk Web UI under Authentication Extensions > Script Secure Arguments:
# key = apiKey, value = <your Azure API key string>

USER_ENDPOINT = 'https://graph.microsoft.com/v1.0/users/'
LOGIN_ENDPOINT = 'https://login.microsoftonline.com/'
GRAPH_SCOPE = 'https://graph.microsoft.com/.default'
CLIENT_CREDENTIALS = 'client_credentials'
GROUP_TYPE = 'groupType'
# create persistent connection
session = requests.Session()
request_timeout = 10
errMsg = ""

def getAuthToken(tenantId, clientId, clientSecret, logger):
    tokenEndpoint = LOGIN_ENDPOINT + tenantId + "/oauth2/v2.0/token"  # To Generate OAuth2 Token

    # Retrieve Auth Token from Azure
    body = {
            'grant_type': CLIENT_CREDENTIALS,
            'scope': GRAPH_SCOPE,
            'client_id': clientId,
            'client_secret': clientSecret
             }

    logger.info("Requesting Authentication Token for client={} and tenant={}".format(clientId, tenantId))

    auth_response = session.post(tokenEndpoint, data=body, timeout=request_timeout)

    if auth_response.status_code != 200:
        errMsg = "Failed to get authorization token for client={} tenant={} with status={} and response={}".format(clientId, tenantId, auth_response.status_code, auth_response.text)
        logger.error(errMsg)
        if auth_response.status_code == 400:
            errMsg = "It appears your clientId and/or tenantId are incorrect. " \
                "Search the Microsoft documentation to retrieve those values: " \
                "\"Create an Azure AD app & service principal in the portal - Microsoft identity platform\" " \
                "/ \"Get tenant and app ID values for signing in\""
            logger.warning(errMsg)
        elif auth_response.status_code == 401:
            errMsg = "It appears your clientSecret is incorrect. " \
                "Search the Microsoft documentation to retrieve that value: " \
                "\"Create an Azure AD app & service principal in the portal - Microsoft identity platform\" " \
                "/ \"Option 2: Create a new application secret\""
            logger.warning(errMsg)
        return FAILED + " " + ERROR_MSG + errMsg

    try:
        auth_responseSTR = json.loads(auth_response.text)
    except Exception as e:
        errMsg = "Failed to parse authorization token for client={} with error={}".format(clientId, str(e))
        logger.error(errMsg)
        return FAILED + " " + ERROR_MSG + errMsg
    return auth_responseSTR['access_token']

# If azureUserFilter is set and API did not find a user, always fall back to filter by mail
def getPrincipalNameWithMail(username, logger):
    query = "mail eq \'{}\'".format(username)
    filterUrl = '?$filter=' + quote(query)
    usernameFilterUrl = USER_ENDPOINT + filterUrl
    usernameFilterResponse = session.get(usernameFilterUrl, timeout=request_timeout)

    if usernameFilterResponse.status_code == 200:
        try:
            filterValues = json.loads(usernameFilterResponse.text)
        except Exception as e:
            logger.error("Failed to parse principal name for username={} when defaulting to filtering by mail with error={}".format(username, str(e)))
            return ""

        # API will return 200 even if the user doesn't exist
        if len(filterValues['value']) == 0:
            logger.warning("Empty response returned for principal name for username={} when defaulting to filtering by mail".format(username))
            return ""
        if len(filterValues['value']) > 1:
            logger.error("Found more than one entry when getting principal name for username={} when defaulting to filtering by mail".format(username))
            return ""
        logger.info("Found principal name when defaulting to filtering by mail: {}".format(filterValues['value'][0]['userPrincipalName']))
        return filterValues['value'][0]['userPrincipalName']
    else:
        logger.error("Failed to get principal name for username={} when defaulting to filtering by mail with status={} and response={}".format(username, filterBy, usernameFilterResponse.status_code, usernameFilterResponse.text))
        return ""

# Microsoft graph API can only query information with user's principal name or object id
# This function makes another API call to get the user's principal name
# from their email or a user supplied filter argument
def getPrincipalName(username, logger, filterBy):
    if not username:
        errMsg = "Username is empty. Not executing API call"
        logger.error(errMsg)
        return FAILED + " " + ERROR_MSG + errMsg

    logger.info("Requesting principal name for username={} through filtering by {}".format(username, filterBy))

    query = "{} eq \'{}\'".format(filterBy, username)
    filterUrl = '?$filter=' + quote(query)
    usernameFilterUrl = USER_ENDPOINT + filterUrl
    logger.info("Azure filter url is {}".format(usernameFilterUrl))
    usernameFilterResponse = session.get(usernameFilterUrl, timeout=request_timeout)

    if usernameFilterResponse.status_code != 200:
        if usernameFilterResponse.status_code == 403:
            logger.error(usernameFilterResponse.text)
            errMsg = "You do not have sufficient API privileges. Refer to the Splunk documentation to set API privileges for your Azure AD application"
            logger.warning(errMsg)
        else:
            logger.error("Failed to get principal name for username={} through filtering by {} with status={} and response={}".format(username, filterBy, usernameFilterResponse.status_code, usernameFilterResponse.text))
            errMsg = "You might be trying to use a filter property that does not exist. " \
                "Search the Microsoft documentation for a full list of supported properties: " \
                "\"user resource type - Microsoft Graph v1.0\" / \"Properties\""
            logger.warning(errMsg)
        return FAILED + " " + ERROR_MSG + errMsg

    try:
        filterValues = json.loads(usernameFilterResponse.text)
    except Exception as e:
        errMsg = "Failed to parse principal name for username={} with error={}".format(username, str(e))
        logger.error(errMsg)
        return FAILED + " " + ERROR_MSG + errMsg

    # API will return 200 even if the user doesn't exist
    if len(filterValues['value']) == 0:
        logger.warning("Empty response returned for principal name for username={} when filtering by {}. "
            "This could mean either we are already using the principal name, we are filtering by the wrong property, or the user doesn't exist".format(username, filterBy))
        # As a failsafe, always try to filter by mail if cannot find by azureUserFilter
        if filterBy.lower() != "mail": # except when we're already filtering by mail
            logger.info("Trying to get user info for username={} by defaulting to filtering by mail instead".format(username))
            return getPrincipalNameWithMail(username, logger)
        return ""

    if len(filterValues['value']) > 1:
        errMsg = "Found more than one entry when getting principal name for username={} when filtering by {}".format(username, filterBy)
        logger.error(errMsg)
        return FAILED + " " + ERROR_MSG + errMsg

    logger.info("Found principal name: {}".format(filterValues['value'][0]['userPrincipalName']))
    return filterValues['value'][0]['userPrincipalName']


def getUserInfo(args, logger, username):

    # Construct script response with the original username since 
    # we might be using a different username to get user info
    originalUsername = args['username']
    encoded_username = quote(username)
    realNameString = ''
    fullString = ''
    rolesString = ''

    usernameUrl = USER_ENDPOINT + encoded_username
    usernameResponse = session.get(usernameUrl, timeout=request_timeout)

    if usernameResponse.status_code != 200:
        errMsg = "Failed to get user info for username={} with status={} and response={}".format(username, usernameResponse.status_code, usernameResponse.text)
        logger.error(errMsg)
        if usernameResponse.status_code == 404:
            errMsg = "Unable to get user info for username={}. " \
                "This script only officially supports querying usernames by the User Principal Name, Object ID, or Email properties. " \
                "To use other user properties, use the 'azureUserFilter' argument and search the Microsoft documentation for a full list of properties: " \
                "\"user resource type - Microsoft Graph v1.0\" / \"Properties\"".format(username)
            logger.warning(errMsg)
        return FAILED + " " + ERROR_MSG + errMsg

    try:
        nameAttributes = json.loads(usernameResponse.text)
    except Exception as e:
        errMsg = "Failed to parse user info for username={} with error={}".format(username, str(e))
        logger.error(errMsg)
        return FAILED + " " + ERROR_MSG + errMsg

    realNameString += nameAttributes['displayName']

    # Construct a groups endpoint with the user's object ID
    groupsUrl = USER_ENDPOINT + encoded_username

    if GROUP_TYPE in args and args[GROUP_TYPE] == 'transitive':
        logger.info("Using transitive groups endpoint to query groups for username={}".format(username))
        groupsUrl += '/transitiveMemberOf'
    else:
        logger.info("Using direct groups endpoint to query groups for username={}".format(username))
        groupsUrl += '/memberOf'

    encodeOutput = True # default to always encode unless specified in args
    if 'encodeOutput' in args and args['encodeOutput'].lower() == 'false':
        encodeOutput = False

    groupsUrl += '?$top=999'
    while groupsUrl:
        groupsResponse = session.get(groupsUrl, timeout=request_timeout)
        if groupsResponse.status_code != 200:
            errMsg = "Failed to get user group membership for username={} with status={} and response={}".format(username, groupsResponse.status_code, groupsResponse.text)
            logger.error(errMsg)
            return FAILED + " " + ERROR_MSG + errMsg

        try:
            groupsResponseSTR = json.loads(groupsResponse.text)
        except Exception as e:
            errMsg = "Failed to parse user groups response for username={} with error={}".format(username, str(e))
            logger.error(errMsg)
            return FAILED + " " + ERROR_MSG + errMsg

        if groupsResponseSTR['value']:
            groupIds = [urlsafe_b64encode_to_str(group['id']) for group in groupsResponseSTR['value']] if encodeOutput else [group['id'] for group in groupsResponseSTR['value']]
            rolesString += ":".join(groupIds)
            if '@odata.nextLink' in groupsResponseSTR:
                groupsUrl = groupsResponseSTR['@odata.nextLink']
            else:
                groupsUrl = None
        else:
            errMsg = "Failed to find user groups in response for username={}".format(username)
            logger.error(errMsg)
            return FAILED + " " + ERROR_MSG + errMsg
        
    # Returning the id associated with each group the user is a part of SAML has to be set up to use group id
    # from Azure AD as SAML group name Ref: customer case &
    # https://www.splunk.com/en_us/blog/cloud/configuring-microsoft-s-azure-security-assertion-markup-language
    # -saml-single-sign-on-sso-with-splunk-cloud-azure-portal.htm

    if encodeOutput:
        logger.info("base64 encoding script output for function=getUserInfo()")
        base64UrlEncodedUsername = urlsafe_b64encode_to_str(originalUsername)
        base64UrlEncodedRealName = urlsafe_b64encode_to_str(realNameString)

        fullString += '{} --userInfo={};{};{} --encodedOutput=true'.format(SUCCESS, base64UrlEncodedUsername, base64UrlEncodedRealName, rolesString)
    else:
        logger.info("Not base64 encoding script output for function=getUserInfo()")
        fullString += '{} --userInfo={};{};{}'.format(SUCCESS, originalUsername, realNameString, rolesString)

    logger.info("function=getUserInfo() successful for username={}".format(originalUsername))
    return fullString

def login(args, logger, username):
    encoded_username = quote(username)
    fullString = ''
    rolesString = ''
    usernameUrl = USER_ENDPOINT + encoded_username
    usernameResponse = session.get(usernameUrl, timeout=request_timeout)
    if usernameResponse.status_code != 200:
        errMsg = "Failed to get user info for username={} with status={} and response={}".format(username, usernameResponse.status_code, usernameResponse.text)
        logger.error(errMsg)
        if usernameResponse.status_code == 404:
            errMsg = "Unable to get user info for username={}. " \
                "This script only officially supports querying usernames by the User Principal Name, Object ID, or Email properties. " \
                "To use other user properties, use the 'azureUserFilter' argument and search the Microsoft documentation for a full list of properties: " \
                "\"user resource type - Microsoft Graph v1.0\" / \"Properties\"".format(username)
            logger.warning(errMsg)
        return FAILED + " " + ERROR_MSG + errMsg
    try:
        nameAttributes = json.loads(usernameResponse.text)
    except Exception as e:
        errMsg = "Failed to parse user info for username={} with error={}".format(username, str(e))
        logger.error(errMsg)
        return FAILED + " " + ERROR_MSG + errMsg
    # Construct a groups endpoint with the user's object ID
    groupsUrl = USER_ENDPOINT + encoded_username

    if GROUP_TYPE in args and args[GROUP_TYPE] == 'transitive':
        logger.info("Using transitive groups endpoint to query groups for username={}".format(username))
        groupsUrl += '/transitiveMemberOf'
    else:
        logger.info("Using direct groups endpoint to query groups for username={}".format(username))
        groupsUrl += '/memberOf'

    encodeOutput = True # default to always encode unless specified in args
    if 'encodeOutput' in args and args['encodeOutput'].lower() == 'false':
        encodeOutput = False

    groupsUrl += '?$top=999'
    while groupsUrl:
        groupsResponse = session.get(groupsUrl, timeout=request_timeout)
        if groupsResponse.status_code != 200:
            errMsg = "Failed to get user group membership info for username={} with status={} and response={}".format(username, groupsResponse.status_code, groupsResponse.text)
            logger.error(errMsg)
            return FAILED + " " + ERROR_MSG + errMsg

        try:
            groupsResponseSTR = json.loads(groupsResponse.text)
        except Exception as e:
            errMsg = "Failed to parse user groups response for username={} with error={}".format(username, str(e))
            logger.error(errMsg)
            return FAILED + " " + ERROR_MSG + errMsg 
        allgroups = []
        if groupsResponseSTR['value']:
            groupIds = [urlsafe_b64encode_to_str(group['id']) for group in groupsResponseSTR['value']] if encodeOutput else [group['id'] for group in groupsResponseSTR['value']]
            allgroups += groupIds
            if '@odata.nextLink' in groupsResponseSTR:
                groupsUrl = groupsResponseSTR['@odata.nextLink']
            else:
                groupsUrl = None
        else:
            errMsg = "Failed to find user groups in response for username={}".format(username)
            logger.error(errMsg)
            return FAILED + " " + ERROR_MSG + errMsg
    # Returning the id associated with each group the user is a part of SAML has to be set up to use group id
    # from Azure AD as SAML group name Ref: customer case &
    # https://www.splunk.com/en_us/blog/cloud/configuring-microsoft-s-azure-security-assertion-markup-language
    # -saml-single-sign-on-sso-with-splunk-cloud-azure-portal.htm
    for i in range(len(allgroups)):
        rolesString += '--groups={} '.format(allgroups[i])

    if encodeOutput:
        logger.info("base64 encoding script output for function=login()")
        fullString += '{} {} --encodedOutput=true'.format(SUCCESS, rolesString)
    else:
        logger.info("Not base64 encoding script output for function=login()")
        fullString += '{} {}'.format(SUCCESS, rolesString)

    logger.info("function=login() successful for username={}".format(args['userInfo'].split(';')[0]))
    return fullString

if __name__ == "__main__":
    callName = sys.argv[1]
    dictIn = readInputs()

    apiKey = getAuthToken(dictIn['tenantId'], dictIn['clientId'], dictIn['clientSecret'], logger)
    # Exit script early and output error if we cannot retrieve API access token
    if FAILED in apiKey:
        print(apiKey)

    else:
        # Set the headers once and reuse for all API calls
        API_KEY_HEADER = 'Bearer ' + apiKey
        session.headers = {'Host': 'graph.microsoft.com', 'Authorization': API_KEY_HEADER}

        # We default filter to email
        filterBy = 'mail'
        if 'azureUserFilter' in dictIn.keys():
            filterBy = dictIn['azureUserFilter']

        # getPrincipalName will determine what username we use to query the graph API
        if callName == "getUserInfo":
            username = dictIn['username']
            principalName = getPrincipalName(username, logger, filterBy)
            if FAILED in principalName:
                print(principalName)
            else:
                if principalName:
                    username = principalName

                response = getUserInfo(dictIn, logger, username)
                print(response)

        if callName == "login":
            username = dictIn['userInfo'].split(';')[0]
            # getPrincipalName will determine what username we use to query the graph API
            principalName = getPrincipalName(username, logger, filterBy)
            if FAILED in principalName:
                print(principalName)
            else:
                if principalName:
                    username = principalName

                response = login(dictIn, logger, username)
                print(response)
