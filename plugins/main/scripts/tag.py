import json
import logging
import os
import subprocess

# ==================== CONFIGURATION ==================== #
# Fill the variables below with the desired values
#
# Values to modify:
#  - version        - sent to the package.json
#  - revision       - sent to the package.json
#  - stage          - sent to the package.json
#  - tag_suffix     - used by the tag generation
#  - supported_versions & kbn_versions ONLY IF NEEDED (e.g. new Kibana version)
# ======================================================= #

# Wazuh version: major.minor.patch
version = '4.6.0'
# App's revision number (previous rev + 1)
revision = '02'
# One of 'pre-alpha', 'alpha', 'beta', 'release-candidate', 'stable'
stage = 'stable'
# Tag suffix. Usually set to stage + stage iteration.
tag_suffix = '-alpha1'

# ================================================ #
# Constants and global variables                   #
# ================================================ #
LOG_FILE = 'output.log'
TAGS_FILE = 'tags.log'
# Global variable. Will be set later
branch = None
minor = version

# Supported versions of Kibana
kbn_versions = [
    [f'7.16.{x}' for x in range(0, 4)],
    [f'7.17.{x}' for x in range(0, 10)]
]

# Platforms versions
supported_versions = {
    'OpenDistro': {
        'branch': f'{minor}-7.10',
        'versions': ['7.10.2']
    },
    'Kibana': {
        'branch': f'{minor}-7.16',
        # Flatten 2D list kbn_versions using lists comprehension
        'versions': [item for sublist in kbn_versions for item in sublist]
    },
    'Wazuh Dashboard': {
        'branch': f'{minor}',
        'versions': ['2.6.0']
    }
}

# ================================================ #
# Functions                                        #
# ================================================ #

def require_confirmation():
    """Ask for confirmation before running the script."""
    print('WARNING! This script will commit and push the tags to the remote '
        + 'repository, deleting any unpushed changes.')
    confirmation = input('Do you want to continue? [y/N] ')

    if confirmation.lower() != 'y':
        logging.info('Aborting...')
        exit(0)


def get_git_revision_short_hash() -> str:
    return subprocess.check_output(['git', 'rev-parse', '--short', branch]).decode('ascii').strip()


def update_package_json(v: str) -> tuple:
    """Update package.json with the new version and revision."""
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
        data['pluginPlatform']['version'] = v

    with open('package.json', 'w') as f:
        json.dump(data, f, indent=2)

    os.system('node scripts/generate-build-version')

    return data, success


def setup():
    """Sync the repo."""
    logging.info(
        f'Switching to branch "{branch}" and removing outdated tags...')
    os.system(f'git checkout {branch}')
    os.system('git fetch --prune --prune-tags')


def main(platform: str, versions: list):
    """Main function."""
    for v in versions:
        # if stage == 'stable':
        #     pass    # skipped as we have been asked to
        #     tag = f'v{version}-{v}'
        # else:
        tag = f'v{version}-{v}{tag_suffix}'
        logging.info(f'Generating tag "{tag}"')
        update_package_json(v)
        os.system(f'git commit -am "Bump {tag}"')
        os.system(
            f'git tag -a {tag} -m "Wazuh {version} for {platform} {v}"')
        logging.info(f'Pushing tag "{tag}" to remote.')
        os.system(f'git push origin {tag}')
        # Undo latest commit
        os.system(f'git reset --hard origin/{branch}')

    # Save created tags to file
    os.system(f'git tag | grep -P -i "^v{version}-.*-{tag_suffix}" > {TAGS_FILE}')

# ================================================ #
# Main program                                     #
# ================================================ #

if __name__ == '__main__':
    logging.basicConfig(
        filename=LOG_FILE,
        level=logging.INFO,
        format='%(asctime)s %(message)s'
    )
    logging.info(
        f'Wazuh version is "{version}". App revision is "{revision}". Stage is "{stage}"')
    require_confirmation()

    for platform_name, platform_data in supported_versions.items():
        branch, versions = platform_data['branch'], platform_data['versions']
        setup()
        main(platform_name, versions)


    print(f'\nCOMPLETED. \nCheck {LOG_FILE} for more details.')
    print(f'Tags are stored in {TAGS_FILE}')
