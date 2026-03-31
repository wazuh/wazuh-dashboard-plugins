#!/usr/bin/env python3
import re
import sys

# Common patterns and their Swedish translations
translations = {
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
}

def find_i18n_strings(file_path):
    """Find strings that need i18n in a file"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Find strings in name: 'String' pattern
    name_strings = re.findall(r"name:\s*'([^']+)'", content)
    
    # Find strings in title='String' pattern
    title_strings = re.findall(r"title='([^']+)'", content)
    
    # Find strings in >String< pattern
    jsx_strings = re.findall(r'>([A-Z][a-zA-Z ]+)</', content)
    
    all_strings = name_strings + title_strings + jsx_strings
    return list(set(all_strings))

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 i18n_helper.py <file>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    strings = find_i18n_strings(file_path)
    
    print(f"Strings found in {file_path}:")
    for s in strings:
        swedish = translations.get(s, f"NEEDS_TRANSLATION: {s}")
        print(f"  '{s}' -> '{swedish}'")