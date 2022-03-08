## How to use
- Located at the same height as the Vagrantfile file, we execute `vagrant up`
  this will download the FreeBSD box and all the dependencies that are necessary to compile the Wazuh Agent will be installed, [Wazuh](https://github.com/wazuh/wazuh) source code is also downloaded, currently the version of the tag v4.2.2 is downloaded (check Vagrantfile to modify this last point)
- Once the installation process is finished we will have to enter the VM by executing the following command `vagrant ssh`
- Enter the folder wazuh `cd wazuh`
- Run the install script `sudo sh install.sh`
- Follow the installation steps.
- Ready we already have an Agent with FreeBSD

## Helpful Commands
### Vagrant
- `vagrant up` This command creates and configures guest machines according to your Vagrantfile. [For more Info.](https://www.vagrantup.com/docs/cli/up)
- `vagrant halt` This command shuts down the running machine Vagrant is managing. [For more Info.](https://www.vagrantup.com/docs/cli/halt)
- `vagrant destroy` This command stops the running machine Vagrant is managing and destroys all resources that were created during the machine creation process. [For more Info.](https://www.vagrantup.com/docs/cli/destroy)
- `vagrant ssh` This will SSH into a running Vagrant machine and give you access to a shell. [For more Info.](https://www.vagrantup.com/docs/cli/ssh)
- `vagrant status` This will tell you the state of the machines Vagrant is managing. [For more Info.](https://www.vagrantup.com/docs/cli/status)

### Wazuh Agent
- `/var/ossec/bin/wazuh-control start`  To start Wazuh.
- `/var/ossec/bin/wazuh-control stop`  To Stop Wazuh.
- `/var/ossec/bin/wazuh-control status`  To see the Wazuh status.

The configuration can be consulted and / or modified in `/var/ossec/etc/ossec.conf`

## Bug fixin

In macOS Monterrey 12.0.1 and VirtualBox 6.1.28 we have the following error when we run the command `vagrant up` in Wazuh Agent.

![docker](/public/assets/error-1-macOS.png)

You can fix it by following these steps
- Uninstall virtualBox 6.1.28 you can guide yourself with this reference [Uninstall virtualBox](https://nektony.com/how-to/uninstall-virtualbox-on-mac)
- Install VirtualBox 6.1.26, [download virtualBox 6.1.26](https://www.virtualbox.org/wiki/Download_Old_Builds_6_1)
- In the Vagrantfile add the following line `vb.gui = true` to enable the GUI. [Reference](https://www.vagrantup.com/docs/providers/virtualbox/configuration#gui-vs-headless)
- Run the command
```
sudo kextload -b org.virtualbox.kext.VBoxDrv;
sudo kextload -b org.virtualbox.kext.VBoxNetFlt;
sudo kextload -b org.virtualbox.kext.VBoxNetAdp;
sudo kextload -b org.virtualbox.kext.VBoxUSB;
```
- Finally run the command `vagrant up` again.

Original reference: https://github.com/hashicorp/vagrant/issues/12557#issuecomment-956354353

Original issue: https://github.com/hashicorp/vagrant/issues/12557#issue-1036151651
