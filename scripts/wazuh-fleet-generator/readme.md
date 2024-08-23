# Agents and groups injector

This script generates agents and groups and saves them to a file or injects them to a Wazuh-Indexer/Opensearch instance.

# Files

- `dataInjectScript.py`: The main script file
- `DIS_Template.json`: If the script creates a new index in the instance, it will create it with this template. If this file doesn't exist, it will create it without templates.
- `DIS_Settings.json`: The script can save the Indexer/Opensearch connection parameters. They will be stored in this file.
- `generatedData.json`: If the script is told to save the data to a file, it save it to this file.

# Usage

1.  Install the requirements with `pip install -r requirements.txt`. For some Operating Systems it will fail and suggest a different way to install it (`sudo pacman -S python-xyz`, `sudo apt install python-xyz`, etc.).
    If the package is not found in this way, we can install it running `pip install -r requirements.txt --break-system-packages` (It is recommended to avoid this option if possible)

2.  Run the script with `python3 dataInjectScript.py`
3.  Follow the instructions that it will show on the console.
