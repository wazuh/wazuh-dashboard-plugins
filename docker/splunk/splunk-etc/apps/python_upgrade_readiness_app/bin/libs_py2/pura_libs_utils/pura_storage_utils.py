import os
import json
import sys

from pura_libs_utils import pura_logger_manager as logger_manager
from pura_libs_utils.pura_consts import *
logging = logger_manager.setup_logging('pura_storage_utils')


def create_dirs_if_not_exists(collection_name, user, host):
    """
    Create the directories and files for storage path if not present.
    :param collection_name: Name of the collection
    :param user: Name of the user

    :returns dictionary containing the name of file and file path
    """
    try:

        if not os.path.exists(os.path.join(LOCAL_DIR)):
            logging.info(PATH_DOES_NOT_EXISTS_MESSAGE.format(LOCAL_DIR))
            os.mkdir(os.path.join(LOCAL_DIR))

        if not os.path.exists(os.path.join(STORAGE_PATH)):
            logging.info(PATH_DOES_NOT_EXISTS_MESSAGE.format(STORAGE_PATH))
            os.mkdir(os.path.join(STORAGE_PATH))

        if not os.path.exists(os.path.join(STORAGE_PATH, user)):
            logging.info(PATH_DOES_NOT_EXISTS_MESSAGE.format(os.path.join(STORAGE_PATH, user)))
            os.mkdir(os.path.join(STORAGE_PATH, user))

        if not os.path.exists(os.path.join(STORAGE_PATH, user, collection_name)):
            logging.info(PATH_DOES_NOT_EXISTS_MESSAGE.format(os.path.join(STORAGE_PATH, user, collection_name)))
            os.mkdir(os.path.join(STORAGE_PATH, user, collection_name))

        file_name = "{}_{}_{}.json".format(collection_name, user, host)
        file_path = os.path.join(STORAGE_PATH, user, collection_name, file_name)

        if not os.path.exists(file_path):
            logging.info(PATH_DOES_NOT_EXISTS_MESSAGE.format(file_path))
            with open(file_path, "w") as f:
                json.dump([], f)

        return {"file_name": file_name, "file_path": file_path}

    except Exception as e:
        logging.exception(str(e))
        return {"file_name": None, "file_path": None}

def add(file_path, data, replace_file_contents=False):

    try:
        if file_path is None:
            return None
        if not replace_file_contents:
            with open(file_path, "r+") as f:
                try:
                    file_data = json.load(f)
                except Exception as e:
                    logging.exception(str(e))
                    file_data = []

        else:
            file_data = []

        with open(file_path, "w+") as f:
            file_data.append(data)
            json.dump(file_data, f)

        return True

    except Exception as e:
        logging.exception(str(e))
        return None

def search(file_data, filter):

    result_list = []
    if file_data is None:
        return None
    try:
        for entry in file_data:
            flag = True

            for k,v in filter.items():

                if k in entry and entry.get(k) == v:
                    continue

                else:
                    flag = False
                    break

            if flag:
                result_list.append(entry)

        return result_list
    except Exception as e:
        logging.exception(str(e))
        return None

def delete(file_path, key):
    try:
        if file_path is None:
            return None
        file_data = read(file_path)
        if not file_data:
            return None
        updated_data = []
        is_key_found = False
        for entry in file_data:
            if entry["_key"] == key:
                is_key_found = True
            else:
                updated_data.append(entry)
        if not is_key_found:
            logging.info("Key- {} not found for file path- {}".format(key, file_path))
            return False
        with open(file_path, "w+") as f:
            json.dump(updated_data, f)
        return True
    except Exception as e:
        logging.exception(str(e))
        return None


def read(file_path):
    try:
        if file_path is None:
            return None
        with open(file_path, "r+") as f:
            try:
                file_data = json.load(f)
            except Exception as e:
                logging.exception(str(e))
                file_data = []
            return file_data
    except Exception as e:
        logging.exception(str(e))
        return None

def update(file_path, data, key):
    try:
        if file_path is None:
            return None
        file_data = read(file_path)
        if not file_data:
            return None
        updated_data = []
        is_key_found = False
        for entry in file_data:
            if entry["_key"] == key:
                is_key_found = True
                for k,v in data.items():
                    entry[k] = v
            updated_data.append(entry)
        if not is_key_found:
            logging.info("Key- {} not found for file path- {}".format(key, file_path))
            return False
        with open(file_path, "w+") as f:
            json.dump(updated_data, f)
        return True
    except Exception as e:
        logging.exception(str(e))
        return None
