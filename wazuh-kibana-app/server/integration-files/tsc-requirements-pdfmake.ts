/*
 * Wazuh app - Module for TSC requirements (Reporting)
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export default {
  'A1.1': {
    stack: [
      'The entity maintains, monitors, and evaluates current processing capacity and use of system components (infrastructure, data, and software) to manage capacity demand and to enable the implementation of additional capacity to help meet its objectives',
      { text: '\n' },
      {
        ul: [
          'Measures Current Usage',
          'Forecasts Capacity',
          'Makes Changes Based on Forecasts'
        ]
      }
    ]
  },
  'A1.2': {
    stack: [
      'The entity authorizes, designs, develops or acquires, implements, operates, approves, maintains, and monitors environmental protections, software, data backup processes, and recovery infrastructure to meet its objectives.',
      { text: '\n' },
      {
        ul: [
          'Identifies Environmental Threats',
          'Designs Detection Measures',
          'Implements and Maintains Environmental Protection Mechanisms',
          'Implements Alerts to Analyze Anomalies',
          'Responds to Environmental Threat Events —',
          'Communicates and Reviews Detected Environmental Threat Events',
          'Determines Data Requiring Backup',
          'Performs Data Backup',
          'Addresses Offsite Storage',
          'Implements Alternate Processing Infrastructure'
        ]
      }
    ]
  },
  'CC5.1': {
    stack: [
      'The entity selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives to acceptable levels.',
      { text: '\n' },
      {
        ul: [
          'Integrates With Risk Assessment',
          'Considers Entity-Specific Factors',
          'Determines Relevant Business Processes',
          'Evaluates a Mix of Control Activity Types',
          'Considers at What Level Activities Are Applied',
          'Addresses Segregation of Duties'
        ]
      }
    ]
  },
  'CC5.2': {
    stack: [
      'The entity also selects and develops general control activities over technology to support the achievement of objectives.',
      { text: '\n' },
      {
        ul: [
          'Determines Dependency Between the Use of Technology in Business Processes and Technology General Controls',
          'Establishes Relevant Technology Infrastructure Control Activities',
          'Establishes Relevant Security Management Process Controls Activities',
          'Establishes Relevant Technology Acquisition, Development, and Maintenance Process Control Activities'
        ]
      }
    ]
  },
  'CC6.1': {
    stack: [
      "The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events to meet the entity's objectives.",
      { text: '\n' },
      {
        ul: [
          'Identifies and Manages the Inventory of Information Assets',
          'Restricts Logical Access',
          'Identifies and Authenticates Users',
          'Considers Network Segmentation',
          'Manages Points of Access',
          'Restricts Access to Information Assets',
          'Manages Identification and Authentication',
          'Manages Credentials for Infrastructure and Software',
          'Uses Encryption to Protect Data',
          'Protects Encryption Keys'
        ]
      }
    ]
  },
  'CC6.2': {
    stack: [
      'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users whose access is administered by the entity. For those users whose access is administered by the entity, user system credentials are removed when user access is no longer authorized.',
      { text: '\n' },
      {
        ul: [
          'Controls Access Credentials to Protected Assets',
          'Removes Access to Protected Assets When Appropriate',
          'Reviews Appropriateness of Access Credentials'
        ]
      }
    ]
  },
  'CC6.3': {
    stack: [
      'The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets based on roles, responsibilities, or the system design and changes, giving consideration to the concepts of least privilege and segregation of duties, to meet the entity’s objectives.',
      { text: '\n' },
      {
        ul: [
          'Creates or Modifies Access to Protected Information Assets',
          'Removes Access to Protected Information Assets',
          'Uses Role-Based Access Controls',
          'Reviews Access Roles and Rules'
        ]
      }
    ]
  },
  'CC6.4': {
    stack: [
      'The entity restricts physical access to facilities and protected information assets (for example, data center facilities, backup media storage, and other sensitive locations) to authorized personnel to meet the entity’s objectives',
      { text: '\n' },
      {
        ul: [
          'Creates or Modifies Physical Access',
          'Removes Physical Access',
          'Reviews Physical Access'
        ]
      }
    ]
  },
  'CC6.6': {
    stack: [
      'The entity implements logical access security measures to protect against threats from sources outside its system boundaries.',
      { text: '\n' },
      {
        ul: [
          'Restricts Access',
          'Protects Identification and Authentication Credentials',
          'Requires Additional Authentication or Credentials',
          'Implements Boundary Protection Systems'
        ]
      }
    ]
  },
  'CC6.7': {
    stack: [
      'The entity restricts the transmission, movement, and removal of information to authorized internal and external users and processes, and protects it during transmission, movement, or removal to meet the entity’s objectives.',
      { text: '\n' },
      {
        ul: [
          'Restricts the Ability to Perform Transmission',
          'Uses Encryption Technologies or Secure Communication Channels to Protect Data',
          'Protects Removal Media',
          'Protects Mobile Devices'
        ]
      }
    ]
  },
  'CC6.8': {
    stack: [
      'The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software to meet the entity’s objectives.',
      { text: '\n' },
      {
        ul: [
          'Restricts Application and Software Installation',
          'Detects Unauthorized Changes to Software and Configuration Parameters',
          'Uses a Defined Change Control Process',
          'Uses Antivirus and Anti-Malware Software',
          'Scans Information Assets from Outside the Entity for Malware and Other Unauthorized Software'
        ]
      }
    ]
  },
  'CC7.1': {
    stack: [
      'To meet its objectives, the entity uses detection and monitoring procedures to identify (1) changes to configurations that result in the introduction of new vulnerabilities, and (2) susceptibilities to newly discovered vulnerabilities.',
      { text: '\n' },
      {
        ul: [
          'Uses Defined Configuration Standards',
          'Monitors Infrastructure and Software',
          'Implements Change-Detection Mechanisms',
          'Detects Unknown or Unauthorized Components',
          'Conducts Vulnerability Scans'
        ]
      }
    ]
  },
  'CC7.2': {
    stack: [
      "The entity monitors system components and the operation of those components for anomalies that are indicative of malicious acts, natural disasters, and errors affecting the entity's ability to meet its objectives; anomalies are analyzed to determine whether they represent security events.",
      { text: '\n' },
      {
        ul: [
          'Implements Detection Policies, Procedures, and Tools',
          'Designs Detection Measures',
          'Implements Filters to Analyze Anomalies',
          'Monitors Detection Tools for Effective Operation'
        ]
      }
    ]
  },
  'CC7.3': {
    stack: [
      'The entity evaluates security events to determine whether they could or have resulted in a failure of the entity to meet its objectives (security incidents) and, if so, takes actions to prevent or address such failures.',
      { text: '\n' },
      {
        ul: [
          'Responds to Security Incidents',
          'Communicates and Reviews Detected Security Events',
          'Develops and Implements Procedures to Analyze Security Incidents'
        ]
      }
    ]
  },
  'CC7.4': {
    stack: [
      'The entity responds to identified security incidents by executing a defined incident-response program to understand, contain, remediate, and communicate security incidents, as appropriate.',
      { text: '\n' },
      {
        ul: [
          'Assigns Roles and Responsibilities',
          'Contains Security Incidents',
          'Mitigates Ongoing Security Incidents',
          'Ends Threats Posed by Security Incidents',
          'Restores Operations',
          'Develops and Implements Communication Protocols for Security Incidents',
          'Obtains Understanding of Nature of Incident and Determines Containment Strategy',
          'Remediates Identified Vulnerabilities',
          'Communicates Remediation Activities',
          'Evaluates the Effectiveness of Incident Response',
          'Periodically Evaluates Incidents'
        ]
      }
    ]
  },
  'CC8.1': {
    stack: [
      'The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures to meet its objectives',
      { text: '\n' },
      {
        ul: [
          'Manages Changes Throughout the System Life Cycle',
          'Authorizes Changes',
          'Designs and Develops Changes',
          'Documents Changes',
          'Tracks System Changes',
          'Configures Software',
          'Tests System Changes ',
          'Approves System Changes',
          'Deploys System Changes',
          'Identifies and Evaluates System Changes',
          'Identifies Changes in Infrastructure, Data, Software, and Procedures Required to Remediate Incidents',
          'Creates Baseline Configuration of IT Technology',
          'Provides for Changes Necessary in Emergency Situations'
        ]
      }
    ]
  },
  'PI1.4': {
    stack: [
      'The entity implements policies and procedures to make available or deliver output completely, accurately, and timely in accordance with specifications to meet the entity’s objectives.',
      { text: '\n' },
      {
        ul: [
          'Protects Output',
          'Distributes Output Only to Intended Parties',
          'Distributes Output Completely and Accurately',
          'Creates and Maintains Records of System Output Activities'
        ]
      }
    ]
  },
  'PI1.5': {
    stack: [
      'The entity implements policies and procedures to store inputs, items in processing, and outputs completely, accurately, and timely in accordance with system specifications to meet the entity’s objectives.',
      { text: '\n' },
      {
        ul: [
          'Protects Stored Items',
          'Archives and Protects System Records',
          'Stores Data Completely and Accurately',
          'Creates and Maintains Records of System Storage Activities'
        ]
      }
    ]
  }
};
