import React, { useState, useEffect } from "react";
import { EuiStat, EuiStatProps } from "@elastic/eui"
import { RedirectAppLinks } from "../../../../../../../../src/plugins/opensearch_dashboards_react/public";
import { tUseDataSourceLoadedReturns } from "../../../data-source/hooks/use-data-source";
import { getCore } from "../../../../../kibana-services";

type VulsSeverityStatProps = {
    value: string;
    color: string;
    description?: string;
    textAlign?: EuiStatProps['textAlign']
    statElement?: EuiStatProps['descriptionElement'];
    isLoading: boolean;
}


export default function VulsSeverityStat({ value, description, color, textAlign = "center", statElement = "h2", isLoading }: VulsSeverityStatProps) {
    return (
        <RedirectAppLinks application={getCore().application}>
            <EuiStat
                className="vuls-severity-stat"
                title={value}
                description={""}
                titleElement={statElement}
                isLoading={isLoading}
                titleColor={color}
                textAlign={textAlign}
            />
        </RedirectAppLinks>

    )
}