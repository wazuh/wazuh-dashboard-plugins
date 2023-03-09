import os
import sys
import re
import ntpath
from splunk.clilib import cli_common as cli

SPLUNK_HOME = os.environ["SPLUNK_HOME"]
OTHER_APPS_DIR = os.path.join(SPLUNK_HOME, 'etc', 'apps')
SLAVE_APPS_DIR = os.path.join(SPLUNK_HOME, 'etc', 'slave-apps')


def get_app_python_file_versions(app_name):

    python_files_with_version = {"python2": [], "python3": []}
    app_default_python = None
    app_path = os.path.join(OTHER_APPS_DIR, app_name)
    slave_app_path = os.path.join(SLAVE_APPS_DIR, app_name)

    server_conf = cli.getAppConf("server", app_name)

    for server_stanza_name, server_stanza_contents in server_conf.items():
        if server_stanza_name == "general":
            app_default_python = server_stanza_contents.get("python.version")
            if app_default_python:
                if app_default_python == "python3" or app_default_python == "force_python3":
                    app_default_python = "python3"
                else:
                    app_default_python = "python2"

    confs_list = ["inputs", "restmap", "commands", "alert_actions"]

    for conf in confs_list:

        conf_contents = cli.getAppConf(conf, app_name)

        if conf == "inputs":
            for stanza_name, stanza_contents in conf_contents.items():
                if stanza_name == "default":
                    continue
                stanza_info = stanza_name.split("://")
                if len(stanza_info) == 1:
                    file_name = stanza_info[0] + ".py"
                    file_abs_path = os.path.join(app_path, "bin", file_name)
                    slave_file_abs_path = os.path.join(slave_app_path, "bin", file_name)
                elif len(stanza_info) == 2:
                    if stanza_info[0] == "script":
                        file_name = ntpath.basename(stanza_info[1])
                        file_abs_path = os.path.join(app_path, "bin", file_name)
                        slave_file_abs_path = os.path.join(slave_app_path, "bin", file_name)
                    else:
                        file_name = stanza_info[0] + ".py"
                        file_abs_path = os.path.join(app_path, "bin", file_name)
                        slave_file_abs_path = os.path.join(slave_app_path, "bin", file_name)

                if stanza_contents.get("python.version") == "python3" or stanza_contents.get("python.version") == "force_python3":
                    python_files_with_version["python3"] += [file_abs_path, slave_file_abs_path]
                elif stanza_contents.get("python.version") == "python2":
                    python_files_with_version["python2"] += [file_abs_path, slave_file_abs_path]
                else:
                    if app_default_python:
                        python_files_with_version[app_default_python] += [file_abs_path, slave_file_abs_path]

        if conf == "restmap":
            for stanza_name, stanza_contents in conf_contents.items():
                if stanza_name == "default":
                    continue
                file_name = stanza_contents.get("handlerfile", "spura.py")
                file_abs_path = os.path.join(app_path, "bin", file_name)
                slave_file_abs_path = os.path.join(slave_app_path, "bin", file_name)
                if stanza_contents.get("handlertype", "other") == "python":
                    if stanza_contents.get("python.version") == "python3" or stanza_contents.get("python.version") == "force_python3":
                        python_files_with_version["python3"] += [file_abs_path, slave_file_abs_path]
                    elif stanza_contents.get("python.version") == "python2":
                        python_files_with_version["python2"] += [file_abs_path, slave_file_abs_path]
                    else:
                        if app_default_python:
                            python_files_with_version[app_default_python] += [file_abs_path, slave_file_abs_path]

        if conf == "commands":
            for stanza_name, stanza_contents in conf_contents.items():
                if stanza_name == "default":
                    continue
                file_name = stanza_contents.get("filename", "spura.py")
                file_abs_path = os.path.join(app_path, "bin", file_name)
                slave_file_abs_path = os.path.join(slave_app_path, "bin", file_name)
                if stanza_contents.get("python.version") == "python3" or stanza_contents.get("python.version") == "force_python3":
                    python_files_with_version["python3"] += [file_abs_path, slave_file_abs_path]
                elif stanza_contents.get("python.version") == "python2":
                    python_files_with_version["python2"] += [file_abs_path, slave_file_abs_path]
                else:
                    if app_default_python:
                        python_files_with_version[app_default_python] += [file_abs_path, slave_file_abs_path]

        if conf == "alert_actions":
            for stanza_name, stanza_contents in conf_contents.items():
                if stanza_name == "default":
                    continue
                file_name = stanza_name + ".py"
                file_abs_path = os.path.join(app_path, "bin", file_name)
                slave_file_abs_path = os.path.join(slave_app_path, "bin", file_name)
                if stanza_contents.get("python.version") == "python3" or stanza_contents.get("python.version") == "force_python3":
                    python_files_with_version["python3"] += [file_abs_path, slave_file_abs_path]
                elif stanza_contents.get("python.version") == "python2":
                    python_files_with_version["python2"] += [file_abs_path, slave_file_abs_path]
                else:
                    if app_default_python:
                        python_files_with_version[app_default_python] += [file_abs_path, slave_file_abs_path]

    python_files_with_version["python2"] = list(set(python_files_with_version["python2"]))
    python_files_with_version["python3"] = list(set(python_files_with_version["python3"]))

    return python_files_with_version