import json
import logging
import os.path
from lib.input import input_question

class Configuration:
  def __init__(self, file, options = {}):
    self.logger = logging.getLogger('configuration')
    self.logger.setLevel(options.get('log_level', logging.INFO))
    self.file = file
    self.config = {}

  def load(self):
    self.logger.debug(f'Loading configuration from file [{self.file}]')
    if os.path.exists(self.file):
      with open(self.file) as configFile:
        self.config = json.load(configFile)
        self.logger.debug(f'Loaded configuration from file [{self.file}]: {self.config}')
        self.logger.info(f'Loaded configuration from file [{self.file}]')
    else:
      self.logger.info(f'Configuration file not found [{self.file}]')
    return self.config

  def save(self):
    self.logger.debug(f'Saving configuration in [{self.file}]')
    with open(self.file, 'w') as configFile:
        json.dump(self.config, configFile, indent=2, sort_keys=True)
    self.logger.info(f'Saved configuration in [{self.file}]')

  def get(self, name = None):
    return self.config[name] if name else self.config

  def register(self, name, get_config, validate = None):
    self.logger.debug(f'Registering configuration [{name}]')

    should_get_config=True
    if self.config and self.config.get(name):
      self.logger.debug(f'Configuration for [{name}] was found. Validating... [{self.config[name]}]')
      is_valid = validate(self.config[name])

      self.logger.debug(f'Configuration for [{name}] validation: {"yes" if is_valid else "no"}')

      if is_valid:
          self.logger.info(f'Configuration for [{name}]: [{self.config[name]}]')
          use_stored_configuration = input_question(f'Configuration is valid for [{name}], do you want to use it? [Y/n]: ', {'default_value': 'y'}).lower()
          if use_stored_configuration == 'y':
            should_get_config = False

    if should_get_config:
      self.logger.info(f'Getting configuration for [{name}]')
      self.config[name] = get_config(self.config)
      self.save()

    return self.config[name]






