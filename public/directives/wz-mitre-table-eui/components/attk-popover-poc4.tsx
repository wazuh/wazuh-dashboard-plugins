import React, { Component, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';

import {
  EuiFacetButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexItem,
  EuiFlexGroup,
  EuiFlyout,
  EuiTitle,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiStat,
  EuiPanel,
  EuiButton,
  EuiLoadingContent,
  EuiLink,
  EuiSpacer,
  EuiDescriptionList,
  EuiToolTip,
  EuiCheckbox
} from '@elastic/eui';
import { EuiPopover } from '@elastic/eui';

export class AttkPopover extends Component {
  state: {
    isOpen: boolean
    currentTechniqueData: object
    isFlyoutVisible: boolean
  }
  props!: {
    name: string
    attacksCount: number
    id: string
    addFilter: Function 
    addNegativeFilter: Function
  }

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      currentTechniqueData: {},
      isFlyoutVisible: false,
    }
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


  componentDidMount(){
    this.setState({currentTechniqueData: {created: "2017/05/31 23:30:18",
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

   openFlyout(item){
    const tmpTechnique = {...this.state.currentTechniqueData}
    tmpTechnique.name = item
    this.setState({isFlyoutVisible: true, currentTechniqueData: tmpTechnique});
  }


  closeFlyout() {
    this.setState({ isFlyoutVisible: false });
  }


  render() {
    const {
      attacksCount,
      name,
      addFilter,
      addNegativeFilter,
      id
    } = this.props;
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
    const { isOpen } = this.state;

    return (
      <Fragment>
      <EuiPopover
        className="euiButton euiButton--text facet-poc3"
        style={{margin:5, padding: "0px 5px",width:"23%"}}
        panelClassName='poc4-pop-over-panel'
        anchorPosition='downLeft'
        button={
          <EuiFacetButton 
          style={{width: "100%"}}
          quantity={attacksCount}
          onClick={() => this.setState({isOpen: !isOpen})} >
          {name}
          </EuiFacetButton>
        } 
        isOpen={isOpen}
        closePopover={() => this.setState({isOpen: !isOpen})} >
                    <EuiButtonEmpty 
              iconType='magnifyWithPlus'
              iconSide='right'
              onClick={() => {addFilter(id);this.setState({isOpen: !isOpen})}} >
                Filter In
              </EuiButtonEmpty><br />
            <EuiButtonEmpty 
              iconType='magnifyWithMinus'
              iconSide='right'
              onClick={() => {addNegativeFilter(id);this.setState({isOpen: !isOpen})}} >
                Filter Out
              </EuiButtonEmpty><br />
            <EuiButtonEmpty 
              iconType='iInCircle'
              iconSide='right'
              onClick={() => {this.openFlyout(name);this.setState({isOpen: !isOpen})}} >
                More Info
              </EuiButtonEmpty><br />
      </EuiPopover>
      {flyout}
      </Fragment>
      )
  }
}