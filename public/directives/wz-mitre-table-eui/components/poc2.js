/*
 * Wazuh app - React component for alerts stats.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import ReactMarkdown from 'react-markdown';

import { 
  EuiPanel,
  EuiFacetButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiSpacer,
  EuiFieldSearch,
  EuiPopover,
  EuiTitle,
  EuiListGroup,
  EuiListGroupItem,
  EuiCheckbox,
  EuiColorPicker,
  EuiButton,
  EuiButtonIcon,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiLoadingContent,
  EuiDescriptionList  
} from '@elastic/eui';


 export class Poc2 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isShowingTechniques:"",
      isPopoverOpen: [],
      rounded:true,
      extra: false,
      color: '#FFFFFF',
      compacto: true,
      currentSearch: "",
      isFixedWidth:false,
      alerts: false,
      isFlyoutVisible: false,
      currentTechniqueData: {}
   };
  }


  getFlyoutHeader(){
    const link = `https://attack.mitre.org/techniques/${this.state.currentTechniqueData.id}/`;

    return (<EuiFlyoutHeader hasBorder>
       {(Object.keys(this.state.currentTechniqueData).length === 0) &&
           <div>
             <EuiLoadingContent lines={1} />
           </div>
         ||
         <EuiTitle size="m">
           <h2 id="flyoutSmallTitle">{this.state.currentTechniqueData.name}  &nbsp;
           <EuiButtonIcon
            href={`${link}`}
            target="_blank"
            iconType="link"
            aria-label="Link Mitre"
          />
          </h2>
         </EuiTitle>
         }
     </EuiFlyoutHeader> 
    )
   }

   getArrayFormatted(arrayText) {
    try{
      const stringText = (arrayText.toString());
      const splitString = stringText.split(',');
      const resultString = splitString.join(', ');
      return resultString;
    }catch(err){
      return arrayText;
    }
   }

   getFlyoutBody(){
    const link = `https://attack.mitre.org/techniques/${this.state.currentTechniqueData.id}/`;
     var descripionTmp = this.state.currentTechniqueData.description
     if(this.state.currentTechniqueData.description){ //Replace '<code>' with '`', so it can be printed correctly in markdown
      descripionTmp = this.state.currentTechniqueData.description.replace(/<code>/gi, '`')
      descripionTmp = descripionTmp.replace(/<\/code>/gi, '`')
     }
     const formattedDescription = this.state.currentTechniqueData.description ? (<ReactMarkdown className="wz-markdown-margin" source={descripionTmp} />) : descripionTmp;
     const data = [
       {
         title: 'Id',
         description: this.state.currentTechniqueData.id,
       },
       {
         title: 'Tactic',
         description: this.getArrayFormatted(this.state.currentTechniqueData.phase_name),
       },
       {
         title: 'Platform',
         description: this.getArrayFormatted(this.state.currentTechniqueData.platforms),
       },
       {
         title: 'Data sources',
         description: this.getArrayFormatted(this.state.currentTechniqueData.dataSources),
       },
       {
         title: 'Created',
         description: this.state.currentTechniqueData.created,
       },
       {
         title: 'Modified',
         description: this.state.currentTechniqueData.modified,
       },
       {
         title: 'Version',
         description: this.state.currentTechniqueData.version,
       },
       {
         title: 'Description',
         description: formattedDescription,
       },
     ];
     return (
       <EuiFlyoutBody>
         {(Object.keys(this.state.currentTechniqueData).length === 0) &&
           <div>
             <EuiLoadingContent lines={2} />
             <EuiLoadingContent lines={3} />
           </div>
         ||
         <div>
           <EuiDescriptionList listItems={data} />
           <EuiSpacer />
           <EuiButton
              style={{marginBottom: "100px"}}
              href={`${link}`}
              target="_blank"
              iconType="popout">
              Go to documentation
          </EuiButton>
         </div>
         }
     </EuiFlyoutBody>
     )
   }


  async componentDidMount() {
    this.setState({isPopoverOpen : Array(100).fill(false), color: "#FFFFFF",extra: false, isFixedWidth: true, currentTechniqueData: {created: "2017/05/31 23:30:18",
    dataSources: "Packet capture,Process use of network,Process monitoring,Network protocol analysis",
    description: `Credential dumping is the process of obtaining account login and password information, normally in the form of a hash or a clear text password, from the operating system and software. Credentials can then be used to perform Lateral Movement and access restricted information.

    Several of the tools mentioned in this technique may be used by both adversaries and professional security testers. Additional custom tools likely exist as well.
    
    ### Windows
    
    #### SAM (Security Accounts Manager)
    
    The SAM is a database file that contains local accounts for the host, typically those found with the ‘net user’ command. To enumerate the SAM database, system level access is required.
     
    A number of tools can be used to retrieve the SAM file through in-memory techniques:
    
    * pwdumpx.exe 
    * [gsecdump](https://attack.mitre.org/software/S0008)
    * [Mimikatz](https://attack.mitre.org/software/S0002)
    * secretsdump.py
    
    Alternatively, the SAM can be extracted from the Registry with [Reg](https://attack.mitre.org/software/S0075):
    
    * <code>reg save HKLM\sam sam</code>
    * <code>reg save HKLM\system system</code>
    
    Creddump7 can then be used to process the SAM database locally to retrieve hashes. (Citation: GitHub Creddump7)
    
    Notes:
    Rid 500 account is the local, in-built administrator.
    Rid 501 is the guest account.
    User accounts start with a RID of 1,000+.
    
    #### Cached Credentials
    
    The DCC2 (Domain Cached Credentials version 2) hash, used by Windows Vista and newer caches credentials when the domain controller is unavailable. The number of default cached credentials varies, and this number can be altered per system. This hash does not allow pass-the-hash style attacks.
     
    A number of tools can be used to retrieve the SAM file through in-memory techniques.
    
    * pwdumpx.exe 
    * [gsecdump](https://attack.mitre.org/software/S0008)
    * [Mimikatz](https://attack.mitre.org/software/S0002)
    
    Alternatively, reg.exe can be used to extract from the Registry and Creddump7 used to gather the credentials.
    
    Notes:
    Cached credentials for Windows Vista are derived using PBKDF2.
    
    #### Local Security Authority (LSA) Secrets
    
    With SYSTEM access to a host, the LSA secrets often allows trivial access from a local account to domain-based account credentials. The Registry is used to store the LSA secrets.
     
    When services are run under the context of local or domain users, their passwords are stored in the Registry. If auto-logon is enabled, this information will be stored in the Registry as well.
     
    A number of tools can be used to retrieve the SAM file through in-memory techniques.
    
    * pwdumpx.exe 
    * [gsecdump](https://attack.mitre.org/software/S0008)
    * [Mimikatz](https://attack.mitre.org/software/S0002)
    * secretsdump.py
    
    Alternatively, reg.exe can be used to extract from the Registry and Creddump7 used to gather the credentials.
    
    Notes:
    The passwords extracted by his mechanism are UTF-16 encoded, which means that they are returned in plaintext.
    Windows 10 adds protections for LSA Secrets described in Mitigation.
    
    #### NTDS from Domain Controller
    
    Active Directory stores information about members of the domain including devices and users to verify credentials and define access rights. The Active Directory domain database is stored in the NTDS.dit file. By default the NTDS file will be located in %SystemRoot%\NTDS\Ntds.dit of a domain controller. (Citation: Wikipedia Active Directory)
     
    The following tools and techniques can be used to enumerate the NTDS file and the contents of the entire Active Directory hashes.
    
    * Volume Shadow Copy
    * secretsdump.py
    * Using the in-built Windows tool, ntdsutil.exe
    * Invoke-NinjaCopy
    
    #### Group Policy Preference (GPP) Files
    
    Group Policy Preferences (GPP) are tools that allowed administrators to create domain policies with embedded credentials. These policies, amongst other things, allow administrators to set local accounts.
    
    These group policies are stored in SYSVOL on a domain controller, this means that any domain user can view the SYSVOL share and decrypt the password (the AES private key was leaked on-line. (Citation: Microsoft GPP Key) (Citation: SRD GPP)
    
    The following tools and scripts can be used to gather and decrypt the password file from Group Policy Preference XML files:
    
    * Metasploit’s post exploitation module: "post/windows/gather/credentials/gpp"
    * Get-GPPPassword (Citation: Obscuresecurity Get-GPPPassword)
    * gpprefdecrypt.py
    
    Notes:
    On the SYSVOL share, the following can be used to enumerate potential XML files.
    dir /s * .xml
    
    #### Service Principal Names (SPNs)
    
    See [Kerberoasting](https://attack.mitre.org/techniques/T1208).
    
    #### Plaintext Credentials
    
    After a user logs on to a system, a variety of credentials are generated and stored in the Local Security Authority Subsystem Service (LSASS) process in memory. These credentials can be harvested by a administrative user or SYSTEM.
    
    SSPI (Security Support Provider Interface) functions as a common interface to several Security Support Providers (SSPs): A Security Support Provider is a dynamic-link library (DLL) that makes one or more security packages available to applications.
    
    The following SSPs can be used to access credentials:
    
    Msv: Interactive logons, batch logons, and service logons are done through the MSV authentication package.
    Wdigest: The Digest Authentication protocol is designed for use with Hypertext Transfer Protocol (HTTP) and Simple Authentication Security Layer (SASL) exchanges. (Citation: TechNet Blogs Credential Protection)
    Kerberos: Preferred for mutual client-server domain authentication in Windows 2000 and later.
    CredSSP:  Provides SSO and Network Level Authentication for Remote Desktop Services. (Citation: Microsoft CredSSP)
     
    The following tools can be used to enumerate credentials:
    
    * [Windows Credential Editor](https://attack.mitre.org/software/S0005)
    * [Mimikatz](https://attack.mitre.org/software/S0002)
    
    As well as in-memory techniques, the LSASS process memory can be dumped from the target host and analyzed on a local system.
    
    For example, on the target host use procdump:
    
    * <code>procdump -ma lsass.exe lsass_dump</code>
    
    Locally, mimikatz can be run:
    
    * <code>sekurlsa::Minidump lsassdump.dmp</code>
    * <code>sekurlsa::logonPasswords</code>
    
    #### DCSync
    
    DCSync is a variation on credential dumping which can be used to acquire sensitive information from a domain controller. Rather than executing recognizable malicious code, the action works by abusing the domain controller's  application programming interface (API) (Citation: Microsoft DRSR Dec 2017) (Citation: Microsoft GetNCCChanges) (Citation: Samba DRSUAPI) (Citation: Wine API samlib.dll) to simulate the replication process from a remote domain controller. Any members of the Administrators, Domain Admins, Enterprise Admin groups or computer accounts on the domain controller are able to run DCSync to pull password data (Citation: ADSecurity Mimikatz DCSync) from Active Directory, which may include current and historical hashes of potentially useful accounts such as KRBTGT and Administrators. The hashes can then in turn be used to create a Golden Ticket for use in [Pass the Ticket](https://attack.mitre.org/techniques/T1097) (Citation: Harmj0y Mimikatz and DCSync) or change an account's password as noted in [Account Manipulation](https://attack.mitre.org/techniques/T1098). (Citation: InsiderThreat ChangeNTLM July 2017) DCSync functionality has been included in the "lsadump" module in Mimikatz. (Citation: GitHub Mimikatz lsadump Module) Lsadump also includes NetSync, which performs DCSync over a legacy replication protocol. (Citation: Microsoft NRPC Dec 2017)
    
    ### Linux
    
    #### Proc filesystem
    
    The /proc filesystem on Linux contains a great deal of information regarding the state of the running operating system. Processes running with root privileges can use this facility to scrape live memory of other running programs. If any of these programs store passwords in clear text or password hashes in memory, these values can then be harvested for either usage or brute force attacks, respectively. This functionality has been implemented in the [MimiPenguin](https://attack.mitre.org/software/S0179), an open source tool inspired by [Mimikatz](https://attack.mitre.org/software/S0002). The tool dumps process memory, then harvests passwords and hashes by looking for text strings and regex patterns for how given applications such as Gnome Keyring, sshd, and Apache use memory to store such authentication artifacts.`,
    id: "T1001",
    modified: "2019/07/17 20:54:32",
    name: "Data Obfuscation",
    phase_name: "Command and Control",
    platforms: "Linux,macOS,Windows",
    version: "1.0"} })
    console.log(this.props.mitreobject)
  }

  handleChange = value => {
    this.setState({ color: value });
  };



  selectTactic(tactic){
    this.setState({isShowingTechniques : this.state.isShowingTechniques === tactic ? "" : tactic, currentSearch : ""});
  }

  getTacticsCards(){
    const orderedArray = [
      "Initial Access",
      "Execution" ,
      "Persistence",
      "Privilege Escalation",
      "Defense Evation",
      "Credential Access" ,
      "Discovery" ,
      "Lateral Movement" ,
      "Collection" ,
      "Command And Control" ,
      "Exfiltriation",
      "Impact",
      "example tactic with a big amount of techniques"
    ]

    const result = orderedArray.map( (item,idx) => {
      return (
        <EuiFlexItem grow={false}>
          <EuiToolTip position="top" delay="long" content={"View " + item + " techniques"}>
            <EuiFacetButton isSelected={this.state.isShowingTechniques === item} onClick={() => this.selectTactic(item)} style={{padding: "10px", "backgroundColor": this.state.color, borderRadius: this.state.rounded ? "15px" : "0"}} quantity={this.props.mitreobject[item].attacks_count}>{item}</EuiFacetButton>
          </EuiToolTip>
        </EuiFlexItem>
      )
    } )

    return (<span><div style={{marginTop: "-8px", marginBottom: "12px", fontSize: "18px"}}>MITRE tactics &nbsp; &nbsp; </div> <EuiFlexGroup gutterSize={this.state.compacto ? 's' : 'm'} wrap>{result}</EuiFlexGroup></span>);
  }

  closePopover() {
    this.setState({isPopoverOpen : Array(100).fill(false)})
  }

  openPopover(id){
    let tmpArray = Array(100).fill(false);
    tmpArray[id] = true;
    this.setState({
      isPopoverOpen: tmpArray,
    });

  }

  getTechniques(){ 

    const result = this.props.mitreobject[this.state.isShowingTechniques].techniques.map( (item,idx) => {
      if(item.name.toLowerCase().includes(this.state.currentSearch.toLowerCase()) && (!this.state.alerts || item.attacks_count > 0))
      return (
        <EuiFlexItem grow={false}>
          <EuiPopover
              id={idx}
              ownFocus
              button={<EuiFacetButton onClick={() => this.openPopover(idx)} className={ this.state.isFixedWidth == true ? "testPoc2" : ""} style={{padding: "10px",width: this.state.isFixedWidth ? "250px !important": "", "backgroundColor": this.state.color, borderRadius: this.state.rounded ? "15px" : "0"}} quantity={item.attacks_count}>{item.name}</EuiFacetButton>}
              isOpen={this.state.isPopoverOpen[idx]}
              closePopover={() => this.closePopover()}
              anchorPosition="rightCenter">
              
              <EuiListGroup maxWidth={288}>
                <EuiListGroupItem
                  id="link1"
                  iconType="eye"
                  label="View details"
                  onClick={() => this.setState({isFlyoutVisible: true})}
                  isActive
                />

                <EuiListGroupItem
                  id="link2"
                  iconType="pin"
                  onClick={() => window.alert('Se añadiria esta tecnica como filtro  a la búsqueda')}
                  label="Add filter"
                />

                <EuiListGroupItem
                  id="link3"
                  onClick={() => window.alert('Se añadaria esta técnica excluida a la búsqueda')}
                  iconType="pin"
                  label="Exclude from search"
                />
              </EuiListGroup>


            </EuiPopover>
        </EuiFlexItem>
      )
    } )

    return (<span> <div style={{marginTop: "-8px", marginBottom: "12px", fontSize: "18px"}}><EuiFlexGroup> <EuiFlexItem grow={false}>{this.props.mitreobject[this.state.isShowingTechniques].name} techniques</EuiFlexItem>
    <EuiFlexItem><EuiFieldSearch
      style={{height: "20px", marginTop: "-15px"}}
      placeholder="Filter techniques"
      value={this.state.currentSearch}
      onChange={this.onChange3}
      aria-label="Use aria labels when no actual label is in use"
    /></EuiFlexItem>
    <EuiFlexItem grow={false} style={{float:"right"}}>
    <span style={{float: "right"}}>
    <EuiButtonIcon
      onClick={() => {this.setState({isShowingTechniques: ""})}}
      iconType="cross"
      aria-label="Close"
    /></span></EuiFlexItem>
    </EuiFlexGroup></div>
     <EuiFlexGroup gutterSize={this.state.compacto ? 's' : 'm'} wrap>{result}</EuiFlexGroup></span>);
  }

  onCheckChange = e => {
    this.setState({
      rounded: e.target.checked,
    });
  };
  
  onCheckChange2 = e => {
    this.setState({
      compacto: e.target.checked,
    });
  };
  onCheckChangre = e => {
    this.setState({
      alerts: e.target.checked,
    });
  };
  onCheckChangeda = e => {
    console.log(e)
    this.setState({
      isFixedWidth: e.target.checked,
    });
    console.log(this.state)
  };
  onChange3 = e => {
    this.setState({
      currentSearch: e.target.value,
    });
  };

  ocultar(){
    this.setState({extra: false})
  }

  closeFlyout() {
    this.setState({ isFlyoutVisible: false });
  }

  render(){

    let flyout;
    if (this.state.isFlyoutVisible) {
      flyout = (
        
        <EuiFlyout
          onClose={() => this.closeFlyout()}
          maxWidth="35%"
          className="flyout-no-overlap"
          aria-labelledby="flyoutSmallTitle">
          {this.getFlyoutHeader()}
          {this.getFlyoutBody()}
        </EuiFlyout>
      );
    }

    return (<div style={{margin: "10px"}}> 
    {this.state.extra && (<EuiFlexGroup style={{margin: "15px"}}>
    <EuiCheckbox
        id={"012"}
        label="rounded corners"
        checked={this.state.rounded}
        onChange={this.onCheckChange}
      /> &nbsp; &nbsp;
      <EuiCheckbox
          id={"0132"}
          label="Show techniques with alerts"
          checked={this.state.alerts}
          onChange={this.onCheckChangre}
        /> &nbsp; &nbsp;
      <EuiCheckbox
          id={"013299"}
          label="compacto"
          checked={this.state.compacto}
          onChange={this.onCheckChange2}
        />&nbsp; &nbsp;
        <EuiCheckbox
            id={"01232"}
            label="fixed width"
            checked={this.state.isFixedWidth}
            onChange={this.onCheckChangeda}
          />&nbsp; &nbsp;
      <EuiColorPicker
          onChange={this.handleChange}
          color={this.state.color}
        />
        <EuiButton onClick={() => this.ocultar()}>
          hide options
        </EuiButton>
        </EuiFlexGroup>)}
      <EuiPanel paddingSize="l" hasShadow >
         {this.getTacticsCards()}
      </EuiPanel>
      <EuiSpacer size="xs" />
      {this.state.isShowingTechniques && (
      <EuiPanel paddingSize="m" hasShadow>
         {this.getTechniques()}
      </EuiPanel>)}
      {flyout}
    </div>)
  }

}