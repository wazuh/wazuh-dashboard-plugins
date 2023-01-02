import json
import logging
import os
import subprocess

versionOSD = '2.4.1'
# major.minor.patch
version = '4.4.0'
# App's revision number (previous rev + 1)
revision = '00'
# 'pre-alpha','alpha','beta','release-candidate', 'stable'
stage = 'alpha'
# Base branch
branch = f'{".".join( version.split(".")[:2])}-{".".join( versionOSD.split(".")[:2])}-wzd'

def get_git_revision_short_hash() -> str:
    return subprocess.check_output(['git', 'rev-parse', '--short', branch]).decode('ascii').strip()


def update_package_json() -> tuple:
  logging.info(f'Updating package.json')
  data, success = {}, True

  # Read JSON and update keys.
  with open('package.json', 'r') as f:
    data, success = json.load(f), False


    # Update file
    data['commit'] = get_git_revision_short_hash()
    data['version'] = version
    data['revision'] = revision
    data['stage'] = stage

  with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)

  return data, success

def setup():
  logging.info(f'Switching to branch {branch} and removing outdated tags...')
  os.system(f'git checkout {branch}')
  os.system('git fetch --prune --prune-tags')

def main():
  logging.info(f'Wazuh version is {version}. App revision is {revision}')
  tag = f'v{version}-{versionOSD}-wzd'
  logging.info(f'Generating tag {tag}')
  update_package_json()
  os.system(f'git commit -am "Bump {tag}"')
  os.system(f'git tag -a {tag} -m "Wazuh {version} for Opensearch Dashboards {versionOSD}"')
  logging.info(f'Pushing tag {tag} to remote.')
  os.system(f'git push origin {tag}')
  # Undo latest commit
  os.system(f'git reset --hard origin/{branch}')


if __name__ == '__main__':
  logging.basicConfig(
    filename='output.log',
    level=logging.INFO,
    format='%(asctime)s %(message)s'
  )
  setup()
  main()
