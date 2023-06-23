import { EuiFlexGroup, EuiFlexItem, EuiText } from "@elastic/eui"
import React, { Fragment } from "react"
import { SERVER_ADDRESS_TEXTS } from "../../utils/register-agent-data"
import { EnhancedFieldConfiguration } from "../../../../components/common/form/types"
import { InputForm } from "../../../../components/common/form"

interface ServerAddressInputProps {
    formField: EnhancedFieldConfiguration
}

const ServerAddressInput = (props: ServerAddressInputProps) => {
    const { formField } = props;

    return (
        <Fragment>
        <EuiFlexGroup gutterSize='s' wrap>
          {SERVER_ADDRESS_TEXTS.map((data, index) => (
            <EuiFlexItem key={index}>
              <EuiText className='stepSubtitleServerAddress'>
                {data.subtitle}
              </EuiText>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
        <InputForm
          {...formField}
          label={''}
          fullWidth={false}
          placeholder='Server address'
        />
      </Fragment>
    )
}

export default ServerAddressInput;