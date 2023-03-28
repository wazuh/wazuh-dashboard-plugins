import json
import logging
import os
import subprocess

# ==================== CONFIGURATION ==================== #
# Values to modify:
#  - version
#  - revision
#  - stage
#  - supported_versions & kbn_versions ONLY IF NEEDED (e.g. new Kibana version)
# ======================================================= #

# Wazuh version: major.minor.patch
version = '4.4.0'
# App's revision number (previous rev + 1)
revision = '05'
# One of 'pre-alpha', 'alpha', 'beta', 'release-candidate', 'stable'
stage = 'release-candidate'

# Global variable. Will be set later
branch = None
minor = ".".join(version.split('.')[:2])

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
        'branch': f'{minor}-2.4-wzd',
        'versions': ['2.4.1']
    }
}


def get_git_revision_short_hash() -> str:
    return subprocess.check_output(['git', 'rev-parse', '--short', branch]).decode('ascii').strip()


def update_package_json(v: str) -> tuple:
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
    logging.info(
        f'Switching to branch "{branch}" and removing outdated tags...')
    os.system(f'git checkout {branch}')
    os.system('git fetch --prune --prune-tags')


def main(platform: str, versions: list):
    for v in versions:
        if stage == 'stable':
            tag = f'v{version}-{v}'
        else:
            tag = f'v{version}-{v}-{stage}'
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
    os.system(f'git tag | grep -P -i "^v{version}-.*-{stage}" > tags.txt')


if __name__ == '__main__':
    logging.basicConfig(
        filename='output.log',
        level=logging.INFO,
        format='%(asctime)s %(message)s'
    )
    logging.info(
        f'Wazuh version is "{version}". App revision is "{revision}". Stage is "{stage}"')

    for platform_name, platform_data in supported_versions.items():
        branch, versions = platform_data['branch'], platform_data['versions']
        setup()
        main(platform_name, versions)
