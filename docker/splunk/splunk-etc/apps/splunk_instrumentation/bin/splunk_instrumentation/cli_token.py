import subprocess


def get_existing_token(splunk_uri):
    '''
    Returns an existing token for splunk_uri, or None if there
    is no active session for the given uri.
    '''
    token_proc = subprocess.Popen(('splunk _authtoken %s' % splunk_uri),
                                  shell=True,
                                  stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE)

    (token_out, token_err) = token_proc.communicate()

    if token_proc.returncode != 0:
        return None
    else:
        return token_out.strip()


def login(splunk_uri):
    '''
    Prompts the user to login to the given splunk_uri.
    '''
    subprocess.check_call(('splunk login -uri %s' % splunk_uri), shell=True)


def get_token(splunk_uri):
    '''
    Get a token for the given splunk_uri, prompting
    the user to login if required.
    '''
    token = get_existing_token(splunk_uri)
    if not token:
        login(splunk_uri)
        token = get_existing_token(splunk_uri)
    return token
