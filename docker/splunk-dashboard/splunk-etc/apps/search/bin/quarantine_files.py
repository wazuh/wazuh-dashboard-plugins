import os
import sys
import time
from splunk.quarantine_files import core_utils
from splunk.quarantine_files.configs import get_all_configs

def run():
    start_time = time.time()
    session_key = sys.stdin.read()
    try:
        configs = get_all_configs.get_all_configs(session_key)
        web_settings = core_utils.get_web_settings(session_key)
        moved_files = False
        for config in configs:
            try:
                core_utils.update_restriction(config, web_settings)
                if core_utils.setting_changed(config.setting, config.should_restrict):
                    base_path = core_utils.get_base_path(not config.should_restrict)
                    paths_to_restrict = config.get_paths_to_restrict(base_path)
                    destination_paths = core_utils.generate_destination_paths(paths_to_restrict)
                    successfully_moved_files = core_utils.move_files(paths_to_restrict, destination_paths, config.should_restrict, config.setting)
                    if successfully_moved_files:
                        core_utils.log_toggle_information(config, start_time)
                        moved_files = True
                    core_utils.update_manifest(config.setting, config.should_restrict if successfully_moved_files else 'error')
                    core_utils.clean_quarantined_directory()
            except Exception as e:
                core_utils.LOGGER.error('Quarantine files framework - Setting {} - Unexpected error during execution: {}'.format(config.setting, str(e)))
                core_utils.update_manifest(config.setting, 'error')
        if moved_files:
            core_utils.bump_ui_version()
    except Exception as e:
        core_utils.LOGGER.error('Quarantine files framework - Unexpected error during execution: {}'.format(str(e)))

if __name__ == '__main__':
    run()
