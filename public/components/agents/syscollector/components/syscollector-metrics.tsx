import React, {  useState } from "react";
import {EuiPanel, EuiFlexGroup, EuiFlexItem, EuiText, EuiLoadingSpinner, EuiIcon} from "@elastic/eui";
import mapValues from 'lodash';
import {useGenericRequest} from '../../../common/hooks/useGenericRequest';
import { formatUIDate } from '../../../../react-services/time-service';
import { i18n } from '@kbn/i18n';

export function InventoryMetrics({agent}) {
    const [params, setParams] = useState({});
    const offsetTimestamp = (text, time) => {
        try {
          return text + formatUIDate(time);
        } catch (error) {
          return time !== '-' ? `${text}${time} (UTC)` : time;
        }
      }
    const syscollector = useGenericRequest('GET', `/api/syscollector/${agent.id}`, params, (result) => {return (result || {}).data || {};});

  if (
    !syscollector.isLoading &&
    (mapValues.isEmpty(syscollector.data.hardware) || mapValues.isEmpty(syscollector.data.os))
  ) {
    return (
      <EuiPanel paddingSize="s" style={{ margin: 16, textAlign: 'center' }}>
        <EuiIcon type="iInCircle" /> {
          i18n.translate("components.agent.fim.ivv.lib.sys", {
            defaultMessage: "Not enough hardware or operating system information",
          })}
      </EuiPanel>
    );
  }

    return (
        <EuiPanel paddingSize="s" style={{margin: 16}}>
            <EuiFlexGroup>
                <EuiFlexItem grow={false}>
                    <EuiText>{
                      i18n.translate("components.agent.fim.ivv.lib.Cores", {
                        defaultMessage: "Cores:",
                      })} {syscollector.isLoading ? <EuiLoadingSpinner size="s" /> : <strong>{syscollector.data.hardware.cpu.cores}</strong>}</EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText>{
                    i18n.translate("components.agent.fim.ivv.lib.memomry", {
                      defaultMessage: "Memory:",
                    })} {syscollector.isLoading ? <EuiLoadingSpinner size="s" /> : <strong>{ (syscollector.data.hardware.ram.total / 1024).toFixed(2)  } {
                    i18n.translate("components.agent.fim.ivv.lib.MB", {
                      defaultMessage: "MB",
                    })}</strong>}
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText>{
                    i18n.translate("components.agent.fim.ivv.lib.Arch", {
                      defaultMessage: "Arch:",
                    })} {syscollector.isLoading ? <EuiLoadingSpinner size="s" /> : <strong>{syscollector.data.os.architecture}</strong>}
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                    <EuiText>{
                      i18n.translate("components.agent.fim.ivv.lib.OS", {
                        defaultMessage: "OS:",
                      })} {syscollector.isLoading ? <EuiLoadingSpinner size="s" /> : <strong>{syscollector.data.os.os.name} {syscollector.data.os.os.version}</strong>}</EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={true}>
                    <EuiText>{
                      i18n.translate("components.agent.fim.ivv.lib.CPU:", {
                        defaultMessage: "CPU:",
                      })} {syscollector.isLoading ? <EuiLoadingSpinner size="s" /> : <strong>{syscollector.data.hardware.cpu.name}</strong>}</EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText>{
                    i18n.translate("components.agent.fim.ivv.lib.Lastscan:", {
                      defaultMessage: "Last scan:",
                    })} {syscollector.isLoading ? <EuiLoadingSpinner size="s" /> : <strong>{offsetTimestamp('',syscollector.data.os.scan.time)}</strong>}
                  </EuiText>
                </EuiFlexItem>
            </EuiFlexGroup>
        </EuiPanel>
        );
}
