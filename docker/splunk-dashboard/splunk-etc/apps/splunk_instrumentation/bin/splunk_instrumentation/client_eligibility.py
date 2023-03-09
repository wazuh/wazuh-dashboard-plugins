'''
Methods for determining client (browser) eligibility.

For reference, all server roles defined by ServerRoles.cpp are:

- indexer
- universal_forwarder
- heavyweight_forwarder
- lightweight_forwarder
- license_master
- cluster_master
- cluster_slave
- cluster_search_head
- deployment_server
- deployment_client
- search_head
- search_peer
- kv_store
- management_console
- shc_captain
- shc_member
- shc_deployer

This list may change. Refer to _predefinedRole_literals in
ServerRoles.cpp to be certain.
'''


import sys

def get_eligibility(services, opt_in_version=None, username=None):
    '''
    Gathers eligibility data describing the instrumentation actions that
    the current server supports for the given user.

    IMPORTANT: Provided services should be configured with system access,
               as we will be using them to read the distributed search config.

    Legacy Behavior (up to and including Splunk 7.0):

    This method returned a dict with 2 fields:

    - is_eligible
      + Should the instrumentation UI be shown?
    - reason
      + Why not?

    This result was augmented in the instrumentation controller to take user
    capabilities into account and returned to the caller (often the instrumentation
    page, or some other page checking if it should show the opt-in modal).

    However, as the UI has grown more complex - integration diag UI and its
    own visibility constraints - this proved to be inflexible.

    Current Behavior (as of Nightlight):

    To allow the UI to handle more complicated user capability and server
    configuration scenarios, we've begun to include information about all
    relevant checks in separate fields. To include:

    - messages
      + May include warnings/errors to be displayed on the UI
    - can_server_edit_telemetry_settings
      + True for single instance and search heads
    - can_server_get_diag
      + True for single instance and search heads
    - is_client_agreement_current
      + Is the optInVersion given by the client up to date?
      + This is used to reject clients that have yet updated
        their code to reflect the most recent data sharing
        terms.
    - can_user_edit_telemetry_settings
      + True if the requested user has edit_telemetry_settings
    - can_user_get_diag
      + True if the requested user has get_diag
    - can_show_telemetry_ui
      + True if telemetry settings related UI should be shown
      + This includes the opt-in modal and the telemetry settings & report logs
        on the instrumentation page (but not diag UI).
    - can_show_diag_ui
      + True if diag related UI should be shown

    Note: Though some of these fields are based on the same criteria now, they
          are kept separate to allow them to vary independently in the future
          without requiring client code changes.

    As some pages may still be compiled against outdated opt-in modals from Splunk
    core, the legacy flags are still supported and retain their original meaning.
    These can now be understood as:

    - is_eligible
       + Should the telemetry-specific instrumentation UI be shown?
       + Equivalent to new 'can_show_telemetry_ui' field
    - reason
      + Why not?
    '''

    result = {
        'messages': [],

        # Legacy fields
        'is_eligible': True,
        'reason': None,

        # Server eligibility fields
        'can_server_edit_telemetry_settings': True,
        'can_server_get_diag': True,

        # Client eligibility fields
        'is_client_agreement_current': True,

        # User eligibility fields
        'can_user_edit_telemetry_settings': True,
        'can_user_get_diag': True,

        # Summary fields
        'can_show_telemetry_ui': True,
        'can_show_diag_ui': True,
    }

    if services.server_info_service.content.get('isFree', '0') == '1':
        # Skip the following calls, as they will throw on free Splunk,
        # and the checks they make are not required.
        return result

    unsupported_server_msg = (
        'Instrumentation settings are not accessible on this server. '
        'Please access the settings from a search head.'
    )
    if (not check_server_roles_for_eligibility(
            services.server_info_service.content.get('server_roles'))):
        result['can_server_edit_telemetry_settings'] = False
        result['can_server_get_diag'] = False
        if result['is_eligible']:
            result['is_eligible'] = False
            result['reason'] = unsupported_server_msg

    currentOptInVersion = services.telemetry_conf_service.content.get('optInVersion')
    if opt_in_version != '*' and opt_in_version != currentOptInVersion:
            result['is_client_agreement_current'] = False
            if result['is_eligible']:
                result['is_eligible'] = False
                result['reason'] = 'The client does not support the current instrumentation agreement'

    # If we're not running on a free license (where there are no users),
    # validate that the user has the requisite capabilities.
    if services.server_info_service.content.get('isFree', '0') != '1' and username:
        capabilities = (
            services.splunkd.get_json(
                '/services/authentication/users/%s' % (username if sys.version_info >= (3, 0) else username.encode('utf-8'))
            )
            ['entry'][0]['content']['capabilities']
        )
        if ('edit_telemetry_settings' not in capabilities):
            result['can_user_edit_telemetry_settings'] = False
            if result['is_eligible']:
                result['is_eligible'] = False
                result['reason'] = 'You do not have permissions to edit telemetry settings'

        if ('get_diag' not in capabilities):
            result['can_user_get_diag'] = False

    if not check_peers_have_telemetry_index(services):
        result['messages'].append({
            'text': ('Some search peers are incompatible with instrumentation. '
                     'To use these features, ensure that all peers are running '
                     'Splunk Enterprise 6.5.0 or later.'),
            'type': 'warning'
        })

    # Only want to show the unsupported server message if
    # the user would otherwise be able to access some
    # functionality.
    # Note: May need a separate message for each feature
    #       in the future, but at the moment the server
    #       requirements are the same for telemetry &
    #       diag, so we use one unified message.
    if (
            (result['can_user_edit_telemetry_settings'] and
             not result['can_server_edit_telemetry_settings'])
            or
            (result['can_user_get_diag'] and
             not result['can_server_get_diag'])
    ):
        result['messages'].append({
            'type': 'warning',
            'text': unsupported_server_msg
        })

    result['can_show_telemetry_ui'] = (
        result['can_user_edit_telemetry_settings'] and
        result['can_server_edit_telemetry_settings'] and
        result['is_client_agreement_current']
    )

    result['can_show_diag_ui'] = (
        result['can_user_get_diag'] and
        result['can_server_get_diag']
    )

    return result


def check_server_roles_for_eligibility(server_roles):
    '''
    Args:
      - server_roles: A list of server roles (strings)

    Returns:
      True or False, indicating whether this server type is supported
    '''

    roles = {}
    for role in server_roles:
        roles[role] = True

    # The whitelist determines what nodes are even considered
    # for instrumentation eligibility. All nodes that contain
    # any of these server roles will be considered (but may
    # ultimately still be rejected based on the blacklist, etc.)
    whitelist = [
        # Search heads are the typical place to access the UI.
        'search_head',
        # Some search heads lack the search_head role and instead
        # report as shc_member or shc_captain
        'shc_member',
        'shc_captain',
        'cluster_search_head',
        # Have to whitelist indexer to cover single instance deployments.
        # (A single instance is not a "search head" - search heads only
        #  exist when paired with separate indexers).
        'indexer'
    ]

    # The blacklist immediately rejects servers that have any of
    # the blacklisted roles.
    blacklist = [
        # The cluster master does not propagate conf settings to the search
        # heads, so we blacklist it for the UI to avoid inconsistent configurations
        # in the cluster.
        'cluster_master',
        # We've whitelisted indexers to handle the single instance case.
        # However, in a distributed deployment you should only be configuring
        # settings on the SH's (since they will propagate values correctly
        # within the cluster), so we'll blacklist cluster_slaves to catch
        # this case.
        'cluster_slave',
    ]

    special_case_rejections = [
        # Any indexer that is a search peer is in a distributed environment.
        # In a distributed environment, the instrumentation UI must be accessed
        # by a search head. So we disable the UI if we see indexer and search_peer
        # roles, without the search_head role. The explicit check for the search_head
        # role was added to cover the DMC case, in which the search heads are themselves
        # made search peers of the DMC node, but should still show the UI.
        roles.get('indexer') and roles.get('search_peer') and not roles.get('search_head'),

        # Previously we always rejected the heavywieght forwarder via the blacklist.
        # SPL-151920 revealed that the heavyweight_forwarder role is added to search
        # heads when configuring forwarding from the UI until the next restart. This,
        # due to some incongruency in how server roles are determined at runtime vs
        # startup time (runtime sets hw/f when tcpouts are enabled, startup time apparently
        # only checks for the SplunkForwarder app to be enabled).
        #
        # For details about the heavyweight_forwarder role assignment, see discussion
        # in SPL-76190, or you may have luck with the following search in splunk main:
        #
        # git --no-pager grep -EHni 'declareServerRole.*heavy' -- '*.h' '*.cpp'
        #
        # In any case, the only search head that shouldn't show the instrumentation settings
        # is the cluster master, which is covered by the blacklist, so here we go...
        roles.get('heavyweight_forwarder') and not (
            roles.get('cluster_search_head')
            or roles.get('search_head')
            or roles.get('shc_captain')
            or roles.get('shc_member')
        )
    ]

    if (any((roles.get(role) for role in whitelist)) and
            not any((roles.get(role) for role in blacklist)) and
            not any(special_case_rejections)):
        return True
    return False


def check_peers_have_telemetry_index(services):
    splunkd = services.splunkd

    dist_search_disabled = True
    try:
        dist_search_disabled = (
            splunkd.get_json('/services/search/distributed/config')
            ['entry'][0]['content']['disabled']
        )
    except Exception:
        # Proceed as if it's disabled if we can't hit the endpoint
        pass

    if dist_search_disabled:
        return True

    search_peers = splunkd.get_json('/services/search/distributed/peers')['entry']
    if search_peers:
        for peer in search_peers:
            if (peer['content']['status'].lower() == 'up' and
                    not peer['content']['disabled'] and
                    '_telemetry' not in peer['content']['searchable_indexes']):
                return False

    return True


if __name__ == '__main__':
    from splunk_instrumentation.splunkd import Splunkd
    from splunk_instrumentation.service_bundle import ServiceBundle
    from splunk_instrumentation.cli_token import get_token

    bundle = ServiceBundle(Splunkd(token=get_token('https://localhost:8089')))

    from pprint import pprint

    pprint(get_eligibility(bundle, opt_in_version='*'))
