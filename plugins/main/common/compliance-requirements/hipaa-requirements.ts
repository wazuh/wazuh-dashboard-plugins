/*
 * Wazuh app - Module for HIPAA requirements
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/*
 * Framework: hipaa
 * Edition: 45 CFR Part 164 Subpart C, eCFR issue of 2026-08-31
 * Source: eCFR (Office of the Federal Register / GPO), 45 CFR Part 164 Subpart C - Security Standards for the Protection of Electronic Protected Health Information
 * Controls: 64
 */
import { ComplianceRequirement } from './types';

const controls: Record<string, ComplianceRequirement> = {
  '164.308(a)(1)(i)': {
    title: 'Security management process',
    description:
      'Implement policies and procedures to prevent, detect, contain, and correct security violations.',
  },
  '164.308(a)(1)(ii)(A)': {
    title: 'Risk analysis',
    description:
      'Conduct an accurate and thorough assessment of the potential risks and vulnerabilities to the confidentiality, integrity, and availability of electronic protected health information held by the covered entity or business associate.',
  },
  '164.308(a)(1)(ii)(B)': {
    title: 'Risk management',
    description:
      'Implement security measures sufficient to reduce risks and vulnerabilities to a reasonable and appropriate level to comply with § 164.306(a).',
  },
  '164.308(a)(1)(ii)(C)': {
    title: 'Sanction policy',
    description:
      'Apply appropriate sanctions against workforce members who fail to comply with the security policies and procedures of the covered entity or business associate.',
  },
  '164.308(a)(1)(ii)(D)': {
    title: 'Information system activity review',
    description:
      'Implement procedures to regularly review records of information system activity, such as audit logs, access reports, and security incident tracking reports.',
  },
  '164.308(a)(2)': {
    title: 'Assigned security responsibility',
    description:
      'Identify the security official who is responsible for the development and implementation of the policies and procedures required by this subpart for the covered entity or business associate.',
  },
  '164.308(a)(3)(i)': {
    title: 'Workforce security',
    description:
      'Implement policies and procedures to ensure that all members of its workforce have appropriate access to electronic protected health information, as provided under paragraph (a)(4) of this section, and to prevent those workforce members who do not have access under paragraph (a)(4) of this section from obtaining access to electronic protected health information.',
  },
  '164.308(a)(3)(ii)(A)': {
    title: 'Authorization and/or supervision',
    description:
      'Implement procedures for the authorization and/or supervision of workforce members who work with electronic protected health information or in locations where it might be accessed.',
  },
  '164.308(a)(3)(ii)(B)': {
    title: 'Workforce clearance procedure',
    description:
      'Implement procedures to determine that the access of a workforce member to electronic protected health information is appropriate.',
  },
  '164.308(a)(3)(ii)(C)': {
    title: 'Termination procedures',
    description:
      'Implement procedures for terminating access to electronic protected health information when the employment of, or other arrangement with, a workforce member ends or as required by determinations made as specified in paragraph (a)(3)(ii)(B) of this section.',
  },
  '164.308(a)(4)(i)': {
    title: 'Information access management',
    description:
      'Implement policies and procedures for authorizing access to electronic protected health information that are consistent with the applicable requirements of subpart E of this part.',
  },
  '164.308(a)(4)(ii)(A)': {
    title: 'Isolating health care clearinghouse functions',
    description:
      'If a health care clearinghouse is part of a larger organization, the clearinghouse must implement policies and procedures that protect the electronic protected health information of the clearinghouse from unauthorized access by the larger organization.',
  },
  '164.308(a)(4)(ii)(B)': {
    title: 'Access authorization',
    description:
      'Implement policies and procedures for granting access to electronic protected health information, for example, through access to a workstation, transaction, program, process, or other mechanism.',
  },
  '164.308(a)(4)(ii)(C)': {
    title: 'Access establishment and modification',
    description:
      "Implement policies and procedures that, based upon the covered entity's or the business associate's access authorization policies, establish, document, review, and modify a user's right of access to a workstation, transaction, program, or process.",
  },
  '164.308(a)(5)(i)': {
    title: 'Security awareness and training',
    description:
      'Implement a security awareness and training program for all members of its workforce (including management).',
  },
  '164.308(a)(5)(ii)(A)': {
    title: 'Security reminders',
    description: 'Periodic security updates.',
  },
  '164.308(a)(5)(ii)(B)': {
    title: 'Protection from malicious software',
    description:
      'Procedures for guarding against, detecting, and reporting malicious software.',
  },
  '164.308(a)(5)(ii)(C)': {
    title: 'Log-in monitoring',
    description:
      'Procedures for monitoring log-in attempts and reporting discrepancies.',
  },
  '164.308(a)(5)(ii)(D)': {
    title: 'Password management',
    description:
      'Procedures for creating, changing, and safeguarding passwords.',
  },
  '164.308(a)(6)(i)': {
    title: 'Security incident procedures',
    description:
      'Implement policies and procedures to address security incidents.',
  },
  '164.308(a)(6)(ii)': {
    title: 'Response and reporting',
    description:
      'Identify and respond to suspected or known security incidents; mitigate, to the extent practicable, harmful effects of security incidents that are known to the covered entity or business associate; and document security incidents and their outcomes.',
  },
  '164.308(a)(7)(i)': {
    title: 'Contingency plan',
    description:
      'Establish (and implement as needed) policies and procedures for responding to an emergency or other occurrence (for example, fire, vandalism, system failure, and natural disaster) that damages systems that contain electronic protected health information.',
  },
  '164.308(a)(7)(ii)(A)': {
    title: 'Data backup plan',
    description:
      'Establish and implement procedures to create and maintain retrievable exact copies of electronic protected health information.',
  },
  '164.308(a)(7)(ii)(B)': {
    title: 'Disaster recovery plan',
    description:
      'Establish (and implement as needed) procedures to restore any loss of data.',
  },
  '164.308(a)(7)(ii)(C)': {
    title: 'Emergency mode operation plan',
    description:
      'Establish (and implement as needed) procedures to enable continuation of critical business processes for protection of the security of electronic protected health information while operating in emergency mode.',
  },
  '164.308(a)(7)(ii)(D)': {
    title: 'Testing and revision procedures',
    description:
      'Implement procedures for periodic testing and revision of contingency plans.',
  },
  '164.308(a)(7)(ii)(E)': {
    title: 'Applications and data criticality analysis',
    description:
      'Assess the relative criticality of specific applications and data in support of other contingency plan components.',
  },
  '164.308(a)(8)': {
    title: 'Evaluation',
    description:
      "Perform a periodic technical and nontechnical evaluation, based initially upon the standards implemented under this rule and, subsequently, in response to environmental or operational changes affecting the security of electronic protected health information, that establishes the extent to which a covered entity's or business associate's security policies and procedures meet the requirements of this subpart.",
  },
  '164.308(b)(1)': {
    title: 'Business associate contracts and other arrangements',
    description:
      "A covered entity may permit a business associate to create, receive, maintain, or transmit electronic protected health information on the covered entity's behalf only if the covered entity obtains satisfactory assurances, in accordance with § 164.314(a), that the business associate will appropriately safeguard the information. A covered entity is not required to obtain such satisfactory assurances from a business associate that is a subcontractor.",
  },
  '164.308(b)(3)': {
    title: 'Written contract or other arrangement',
    description:
      'Document the satisfactory assurances required by paragraph (b)(1) or (b)(2) of this section through a written contract or other arrangement with the business associate that meets the applicable requirements of § 164.314(a).',
  },
  '164.310(a)(1)': {
    title: 'Facility access controls',
    description:
      'Implement policies and procedures to limit physical access to its electronic information systems and the facility or facilities in which they are housed, while ensuring that properly authorized access is allowed.',
  },
  '164.310(a)(2)(i)': {
    title: 'Contingency operations',
    description:
      'Establish (and implement as needed) procedures that allow facility access in support of restoration of lost data under the disaster recovery plan and emergency mode operations plan in the event of an emergency.',
  },
  '164.310(a)(2)(ii)': {
    title: 'Facility security plan',
    description:
      'Implement policies and procedures to safeguard the facility and the equipment therein from unauthorized physical access, tampering, and theft.',
  },
  '164.310(a)(2)(iii)': {
    title: 'Access control and validation procedures',
    description:
      "Implement procedures to control and validate a person's access to facilities based on their role or function, including visitor control, and control of access to software programs for testing and revision.",
  },
  '164.310(a)(2)(iv)': {
    title: 'Maintenance records',
    description:
      'Implement policies and procedures to document repairs and modifications to the physical components of a facility which are related to security (for example, hardware, walls, doors, and locks).',
  },
  '164.310(b)': {
    title: 'Workstation use',
    description:
      'Implement policies and procedures that specify the proper functions to be performed, the manner in which those functions are to be performed, and the physical attributes of the surroundings of a specific workstation or class of workstation that can access electronic protected health information.',
  },
  '164.310(c)': {
    title: 'Workstation security',
    description:
      'Implement physical safeguards for all workstations that access electronic protected health information, to restrict access to authorized users.',
  },
  '164.310(d)(1)': {
    title: 'Device and media controls',
    description:
      'Implement policies and procedures that govern the receipt and removal of hardware and electronic media that contain electronic protected health information into and out of a facility, and the movement of these items within the facility.',
  },
  '164.310(d)(2)(i)': {
    title: 'Disposal',
    description:
      'Implement policies and procedures to address the final disposition of electronic protected health information, and/or the hardware or electronic media on which it is stored.',
  },
  '164.310(d)(2)(ii)': {
    title: 'Media re-use',
    description:
      'Implement procedures for removal of electronic protected health information from electronic media before the media are made available for re-use.',
  },
  '164.310(d)(2)(iii)': {
    title: 'Accountability',
    description:
      'Maintain a record of the movements of hardware and electronic media and any person responsible therefore.',
  },
  '164.310(d)(2)(iv)': {
    title: 'Data backup and storage',
    description:
      'Create a retrievable, exact copy of electronic protected health information, when needed, before movement of equipment.',
  },
  '164.312(a)(1)': {
    title: 'Access control',
    description:
      'Implement technical policies and procedures for electronic information systems that maintain electronic protected health information to allow access only to those persons or software programs that have been granted access rights as specified in § 164.308(a)(4).',
  },
  '164.312(a)(2)(i)': {
    title: 'Unique user identification',
    description:
      'Assign a unique name and/or number for identifying and tracking user identity.',
  },
  '164.312(a)(2)(ii)': {
    title: 'Emergency access procedure',
    description:
      'Establish (and implement as needed) procedures for obtaining necessary electronic protected health information during an emergency.',
  },
  '164.312(a)(2)(iii)': {
    title: 'Automatic logoff',
    description:
      'Implement electronic procedures that terminate an electronic session after a predetermined time of inactivity.',
  },
  '164.312(a)(2)(iv)': {
    title: 'Encryption and decryption',
    description:
      'Implement a mechanism to encrypt and decrypt electronic protected health information.',
  },
  '164.312(b)': {
    title: 'Audit controls',
    description:
      'Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use electronic protected health information.',
  },
  '164.312(c)(1)': {
    title: 'Integrity',
    description:
      'Implement policies and procedures to protect electronic protected health information from improper alteration or destruction.',
  },
  '164.312(c)(2)': {
    title: 'Mechanism to authenticate electronic protected health information',
    description:
      'Implement electronic mechanisms to corroborate that electronic protected health information has not been altered or destroyed in an unauthorized manner.',
  },
  '164.312(d)': {
    title: 'Person or entity authentication',
    description:
      'Implement procedures to verify that a person or entity seeking access to electronic protected health information is the one claimed.',
  },
  '164.312(e)(1)': {
    title: 'Transmission security',
    description:
      'Implement technical security measures to guard against unauthorized access to electronic protected health information that is being transmitted over an electronic communications network.',
  },
  '164.312(e)(2)(i)': {
    title: 'Integrity controls',
    description:
      'Implement security measures to ensure that electronically transmitted electronic protected health information is not improperly modified without detection until disposed of.',
  },
  '164.312(e)(2)(ii)': {
    title: 'Encryption',
    description:
      'Implement a mechanism to encrypt electronic protected health information whenever deemed appropriate.',
  },
  '164.314(a)(1)': {
    title: 'Business associate contracts or other arrangements',
    description:
      'The contract or other arrangement required by § 164.308(b)(3) must meet the requirements of paragraph (a)(2)(i), (a)(2)(ii), or (a)(2)(iii) of this section, as applicable.',
  },
  '164.314(a)(2)(i)': {
    title: 'Business associate contracts',
    description:
      'The contract must provide that the business associate will—\n(A) Comply with the applicable requirements of this subpart;\n(B) In accordance with § 164.308(b)(2), ensure that any subcontractors that create, receive, maintain, or transmit electronic protected health information on behalf of the business associate agree to comply with the applicable requirements of this subpart by entering into a contract or other arrangement that complies with this section; and\n(C) Report to the covered entity any security incident of which it becomes aware, including breaches of unsecured protected health information as required by § 164.410.',
  },
  '164.314(a)(2)(ii)': {
    title: 'Other arrangements',
    description:
      'The covered entity is in compliance with paragraph (a)(1) of this section if it has another arrangement in place that meets the requirements of § 164.504(e)(3).',
  },
  '164.314(a)(2)(iii)': {
    title: 'Business associate contracts with subcontractors',
    description:
      'The requirements of paragraphs (a)(2)(i) and (a)(2)(ii) of this section apply to the contract or other arrangement between a business associate and a subcontractor required by § 164.308(b)(4) in the same manner as such requirements apply to contracts or other arrangements between a covered entity and business associate.',
  },
  '164.314(b)(1)': {
    title: 'Requirements for group health plans',
    description:
      'Except when the only electronic protected health information disclosed to a plan sponsor is disclosed pursuant to § 164.504(f)(1)(ii) or (iii), or as authorized under § 164.508, a group health plan must ensure that its plan documents provide that the plan sponsor will reasonably and appropriately safeguard electronic protected health information created, received, maintained, or transmitted to or by the plan sponsor on behalf of the group health plan.',
  },
  '164.316(a)': {
    title: 'Policies and procedures',
    description:
      'Implement reasonable and appropriate policies and procedures to comply with the standards, implementation specifications, or other requirements of this subpart, taking into account those factors specified in § 164.306(b)(2)(i), (ii), (iii), and (iv). This standard is not to be construed to permit or excuse an action that violates any other standard, implementation specification, or other requirements of this subpart. A covered entity or business associate may change its policies and procedures at any time, provided that the changes are documented and are implemented in accordance with this subpart.',
  },
  '164.316(b)(1)': {
    title: 'Documentation',
    description:
      '(i) Maintain the policies and procedures implemented to comply with this subpart in written (which may be electronic) form; and\n(ii) If an action, activity or assessment is required by this subpart to be documented, maintain a written (which may be electronic) record of the action, activity, or assessment.',
  },
  '164.316(b)(2)(i)': {
    title: 'Time limit',
    description:
      'Retain the documentation required by paragraph (b)(1) of this section for 6 years from the date of its creation or the date when it last was in effect, whichever is later.',
  },
  '164.316(b)(2)(ii)': {
    title: 'Availability',
    description:
      'Make documentation available to those persons responsible for implementing the procedures to which the documentation pertains.',
  },
  '164.316(b)(2)(iii)': {
    title: 'Updates',
    description:
      'Review documentation periodically, and update as needed, in response to environmental or operational changes affecting the security of the electronic protected health information.',
  },
};

/*
 * Bridge from the compliance tag values the Wazuh ruleset uses to the control
 * identifiers above. Both notations resolve to the same requirement.
 */
const aliases: Record<string, string> = {
  '164.308.a.1.ii.A': '164.308(a)(1)(ii)(A)',
  '164.308.a.1.ii.D': '164.308(a)(1)(ii)(D)',
  '164.308.a.3': '164.308(a)(3)(i)',
  '164.308.a.3.ii.A': '164.308(a)(3)(ii)(A)',
  '164.308.a.4': '164.308(a)(4)(i)',
  '164.308.a.5': '164.308(a)(5)(i)',
  '164.308.a.5.ii.A': '164.308(a)(5)(ii)(A)',
  '164.308.a.5.ii.B': '164.308(a)(5)(ii)(B)',
  '164.308.a.5.ii.C': '164.308(a)(5)(ii)(C)',
  '164.308.a.5.ii.D': '164.308(a)(5)(ii)(D)',
  '164.308.a.6': '164.308(a)(6)(i)',
  '164.308.a.6.ii': '164.308(a)(6)(ii)',
  '164.308.a.7': '164.308(a)(7)(i)',
  '164.308.a.7.ii.A': '164.308(a)(7)(ii)(A)',
  '164.308.a.8': '164.308(a)(8)',
  '164.310.b': '164.310(b)',
  '164.310.d.2.iv': '164.310(d)(2)(iv)',
  '164.312.a.1': '164.312(a)(1)',
  '164.312.a.2.i': '164.312(a)(2)(i)',
  '164.312.a.2.ii': '164.312(a)(2)(ii)',
  '164.312.a.2.iv': '164.312(a)(2)(iv)',
  '164.312.b': '164.312(b)',
  '164.312.c.1': '164.312(c)(1)',
  '164.312.c.2': '164.312(c)(2)',
  '164.312.d': '164.312(d)',
  '164.312.e': '164.312(e)(1)',
  '164.312.e.1': '164.312(e)(1)',
  '164.312.e.2.i': '164.312(e)(2)(i)',
  '164.312.e.2.ii': '164.312(e)(2)(ii)',
  '164.316.b.1': '164.316(b)(1)',
};

export const hipaaRequirementsFile: Record<string, ComplianceRequirement> = {
  ...controls,
  ...Object.fromEntries(
    Object.entries(aliases).map(([alias, id]) => [alias, controls[id]]),
  ),
};
