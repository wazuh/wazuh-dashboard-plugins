import unittest
import splunk.rest as rest

from unittest import mock
from pytest import fixture
import json

from moncocon import Moncocon

from _test_assets import _search_groups_to_hosts, _peers, _search_groups_to_hosts_file_pre_change, _search_groups_to_hosts_file_after_change

class TestMonCoCon(unittest.TestCase):

    @mock.patch("builtins.open", new_callable=mock.mock_open, read_data=json.dumps(_search_groups_to_hosts_file_pre_change))
    def test_can_compare_previous_search_groups_to_hosts_file(self, a):
        monco = Moncocon(session_key='asdfasdf')

        observed = monco._has_search_groups_changed( _search_groups_to_hosts_file_pre_change )
        unittest.TestCase().assertEqual(observed, False)

        observed = monco._has_search_groups_changed( _search_groups_to_hosts_file_after_change )
        unittest.TestCase().assertEqual(observed, True)

    @mock.patch("splunk.rest.simpleRequest", return_value=(201, _peers))
    def test_can_map_roles_to_search_groups(self, a):

        monco = Moncocon(session_key='asdfasdf')

        observed = monco._build_search_groups(json.loads(_peers) )
        unittest.TestCase().assertDictEqual(observed, _search_groups_to_hosts)

if __name__ == '__main__':
    unittest.main()
