#!/usr/bin/env python3
import os
import re
import json
from pathlib import Path

# Load the current translation file
def load_translations():
    translations_file = "plugins/main/translations/sv-SE.json"
    with open(translations_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_translations(translations):
    translations_file = "plugins/main/translations/sv-SE.json"
    with open(translations_file, 'w', encoding='utf-8') as f:
        json.dump(translations, f, ensure_ascii=False, indent=2)

# Translation mappings
TRANSLATIONS = {
    'ID': 'ID',
    'Name': 'Namn',
    'Agent ID': 'Agent-ID',
    'Agent IDs': 'Agent-ID:n',
    'Task ID': 'Uppgifts-ID',
    'Code': 'Kod',
    'Error': 'Fel',
    'Remediation': 'Åtgärd',
    'Status': 'Status',
    'Type': 'Typ',
    'Date': 'Datum',
    'Description': 'Beskrivning',
    'Actions': 'Åtgärder',
    'Details': 'Detaljer',
    'Version': 'Version',
    'OS': 'OS',
    'IP': 'IP',
    'Groups': 'Grupper',
    'Last Keep Alive': 'Senaste tecken på liv',
    'Register Date': 'Registreringsdatum',
    'Platform': 'Plattform',
    'Architecture': 'Arkitektur',
    'Node': 'Nod',
    'Manager': 'Hanterare',
    'Configuration Sum': 'Konfigurationssum',
    'Merged Sum': 'Sammanslagen sum',
    'Configuration': 'Konfiguration',
    'Settings': 'Inställningar',
    'Dashboard': 'Kontrollpanel',
    'Agent': 'Agent',
    'Agents': 'Agenter',
    'Endpoint': 'Slutpunkt',
    'Endpoints': 'Slutpunkter',
    'Vulnerability': 'Sårbarhet',
    'Vulnerabilities': 'Sårbarheter',
    'Threat': 'Hot',
    'Threats': 'Hot',
    'Rule': 'Regel',
    'Rules': 'Regler',
    'Decoder': 'Avkodare',
    'Decoders': 'Avkodare',
    'Compliance': 'Efterlevnad',
    'Integrity': 'Integritet',
    'Monitoring': 'Övervakning',
    'Plugin': 'Insticksmodul',
    'Alert': 'Varning',
    'Alerts': 'Varningar',
    'Event': 'Händelse',
    'Events': 'Händelser',
    'Malware': 'Skadlig kod',
    'Overview': 'Översikt',
    'Cluster': 'Kluster',
    'Group': 'Grupp',
    'Log': 'Logg',
    'Logs': 'Loggar',
    'File': 'Fil',
    'Files': 'Filer',
    'Edit': 'Redigera',
    'View': 'Visa',
    'Help': 'Hjälp',
    'Search': 'Sök',
    'Filter': 'Filtrera',
    'Export': 'Exportera',
    'Download': 'Ladda ner',
    'Refresh': 'Uppdatera',
    'Warning': 'Varning',
    'Success': 'Lyckades',
    'Cancel': 'Avbryt',
    'Confirm': 'Bekräfta',
    'Save': 'Spara',
    'Delete': 'Ta bort',
    'Add': 'Lägg till',
    'Remove': 'Ta bort',
    'Enable': 'Aktivera',
    'Disable': 'Inaktivera',
    'Deploy': 'Distribuera',
    'Upgrade': 'Uppgradera',
    'Requirements': 'Krav',
    'Loading': 'Laddar',
    'Close': 'Stäng',
    'Open': 'Öppna',
    'Submit': 'Skicka',
    'Reset': 'Återställ',
    'Apply': 'Tillämpa',
    'Clear': 'Rensa',
    'Back': 'Tillbaka',
    'Next': 'Nästa',
    'Previous': 'Föregående',
    'Finish': 'Slutför',
    'Start': 'Starta',
    'Stop': 'Stoppa',
    'Pause': 'Pausa',
    'Resume': 'Återuppta',
    'Restart': 'Starta om',
    'Update': 'Uppdatera',
    'Create': 'Skapa',
    'New': 'Ny',
    'Copy': 'Kopiera',
    'Move': 'Flytta',
    'Rename': 'Byt namn',
    'Properties': 'Egenskaper',
    'Options': 'Alternativ',
    'Preferences': 'Inställningar',
    'About': 'Om',
    'Information': 'Information',
    'Documentation': 'Dokumentation',
    'Tutorial': 'Handledning',
    'Guide': 'Guide',
    'Manual': 'Manual',
    'FAQ': 'Vanliga frågor',
    'Terms': 'Villkor',
    'Privacy': 'Integritet',
    'License': 'Licens',
    'Contact': 'Kontakt',
    'Support': 'Support',
    'Community': 'Community',
    'Forum': 'Forum',
    'Blog': 'Blogg',
    'News': 'Nyheter',
    'Release Notes': 'Versionsanteckningar',
    'Changelog': 'Ändringslogg',
    'Roadmap': 'Roadmap',
    'Features': 'Funktioner',
    'Benefits': 'Fördelar',
    'Limitations': 'Begränsningar',
    'Requirements': 'Krav',
    'Installation': 'Installation',
    'Setup': 'Installation',
    'Configuration': 'Konfiguration',
    'Usage': 'Användning',
    'Examples': 'Exempel',
    'Best Practices': 'Bästa praxis',
    'Tips': 'Tips',
    'Tricks': 'Trick',
    'Troubleshooting': 'Felsökning',
    'Common Issues': 'Vanliga problem',
    'Known Issues': 'Kända problem',
    'Workarounds': 'Lösningar',
    'Fixes': 'Korrigeringar'
}

def generate_i18n_key(component_path, text):
    """Generate an i18n key based on component path and text"""
    # Extract component name from path
    component_parts = component_path.split('/')
    
    # Find relevant parts for key generation
    key_parts = []
    
    # Add wazuh prefix
    key_parts.append('wazuh')
    
    # Add component-specific parts
    if 'endpoints-summary' in component_path:
        key_parts.append('endpointsSummary')
        
        if 'register-agent' in component_path:
            key_parts.append('registerAgent')
        elif 'table' in component_path:
            key_parts.append('table')
            if 'global-actions' in component_path:
                key_parts.append('globalActions')
                if 'upgrade' in component_path:
                    key_parts.append('upgrade')
                elif 'remove' in component_path:
                    key_parts.append('remove')
                elif 'edit-groups' in component_path:
                    key_parts.append('editGroups')
            elif 'actions' in component_path:
                key_parts.append('actions')
        elif 'upgrades-in-progress' in component_path:
            key_parts.append('upgradesInProgress')
    elif 'security' in component_path:
        key_parts.append('security')
        if 'roles' in component_path:
            key_parts.append('roles')
        elif 'users' in component_path:
            key_parts.append('users')
        elif 'policies' in component_path:
            key_parts.append('policies')
        elif 'roles-mapping' in component_path:
            key_parts.append('rolesMapping')
    elif 'management' in component_path:
        key_parts.append('management')
        if 'cluster' in component_path:
            key_parts.append('cluster')
        elif 'groups' in component_path:
            key_parts.append('groups')
    elif 'common' in component_path:
        key_parts.append('common')
    elif 'overview' in component_path:
        key_parts.append('overview')
        if 'mitre' in component_path:
            key_parts.append('mitre')
        elif 'vulnerabilities' in component_path:
            key_parts.append('vulnerabilities')
        elif 'compliance' in component_path:
            key_parts.append('compliance')
        elif 'fim' in component_path:
            key_parts.append('fim')
        elif 'sca' in component_path:
            key_parts.append('sca')
    elif 'agents' in component_path:
        key_parts.append('agents')
        if 'syscollector' in component_path:
            key_parts.append('syscollector')
        elif 'prompts' in component_path:
            key_parts.append('prompts')
    elif 'tools' in component_path:
        key_parts.append('tools')
        if 'devtools' in component_path:
            key_parts.append('devtools')
    
    # Create a key from the text
    text_key = text.lower().replace(' ', '').replace('-', '').replace('_', '')
    text_key = re.sub(r'[^a-zA-Z0-9]', '', text_key)
    if len(text_key) > 30:
        text_key = text_key[:30]
    
    key_parts.append(text_key)
    
    return '.'.join(key_parts)

def process_file(file_path):
    """Process a single file for i18n"""
    print(f"Processing {file_path}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    new_translations = {}
    
    # Check if i18n import already exists
    has_i18n_import = "import { i18n } from '@osd/i18n'" in content
    
    # Add i18n import if needed
    if not has_i18n_import:
        # Find the imports section
        import_match = re.search(r"(import [^;]+from '@elastic/eui';)", content)
        if import_match:
            import_line = import_match.group(1)
            content = content.replace(import_line, import_line + "\nimport { i18n } from '@osd/i18n';")
    
    # Find and replace patterns
    patterns = [
        (r"name:\s*'([^']+)'", "name"),
        (r"title='([^']+)'", "title"),
        (r"label='([^']+)'", "label"),
        (r">([A-Z][a-zA-Z ]+)</", "jsx_text")
    ]
    
    for pattern, pattern_type in patterns:
        matches = re.finditer(pattern, content)
        for match in matches:
            original_text = match.group(1)
            
            # Skip if already using i18n
            if 'i18n.translate' in match.group(0):
                continue
                
            # Generate i18n key
            i18n_key = generate_i18n_key(file_path, original_text)
            
            # Get Swedish translation
            swedish_translation = TRANSLATIONS.get(original_text, original_text)
            
            # Store the translation
            new_translations[i18n_key] = swedish_translation
            
            # Create replacement
            if pattern_type == "jsx_text":
                replacement = ">{" + f"i18n.translate('{i18n_key}', {{ defaultMessage: '{original_text}' }})" + "}<"
            else:
                replacement = pattern_type + "={" + f"i18n.translate('{i18n_key}', {{ defaultMessage: '{original_text}' }})" + "}"
            
            # Replace in content
            content = content.replace(match.group(0), replacement)
    
    # Only write if content changed
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  Updated {file_path}")
        return new_translations
    else:
        print(f"  No changes needed for {file_path}")
        return {}

def main():
    # Get list of files to process
    files = [
        "plugins/main/public/components/endpoints-summary/table/upgrades-in-progress/upgrades-in-progress.tsx",
        "plugins/main/public/components/endpoints-summary/table/columns.tsx", 
        "plugins/main/public/components/endpoints-summary/table/actions/upgrade-agent-modal.tsx",
        "plugins/main/public/components/endpoints-summary/table/actions/edit-groups-modal.tsx",
        "plugins/main/public/components/endpoints-summary/table/actions/remove-agent-modal.tsx",
    ]
    
    # Load current translations
    current_translations = load_translations()
    
    # Process files
    all_new_translations = {}
    for file_path in files:
        if os.path.exists(file_path):
            new_trans = process_file(file_path)
            all_new_translations.update(new_trans)
        else:
            print(f"File not found: {file_path}")
    
    # Add new translations to the JSON file
    if all_new_translations:
        print(f"\nAdding {len(all_new_translations)} new translations...")
        current_translations.update(all_new_translations)
        save_translations(current_translations)
        print("Translations updated!")
    else:
        print("No new translations to add.")

if __name__ == "__main__":
    main()