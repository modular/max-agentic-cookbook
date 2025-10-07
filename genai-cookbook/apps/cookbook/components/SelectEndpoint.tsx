'use client'

import { Flex, Select } from '@mantine/core'
import { useCookbook } from '@modular/recipe-sdk/context'
import { useMemo } from 'react'

export interface SelectEndpointProps {
    label?: string
    showRefresh?: boolean
}

export function SelectEndpoint(props: SelectEndpointProps) {
    const { endpoints, selectedEndpoint, selectEndpointById } = useCookbook()

    const options = useMemo(
        () =>
            endpoints.map((e) => {
                const url = e.baseUrl.replace(/^https?:\/\//, '')
                return {
                    value: e.id,
                    label:
                        e.hwMake && e.hwModel
                            ? `${url} (${e.hwMake} ${e.hwModel})`
                            : url,
                }
            }),
        [endpoints]
    )

    return (
        <Flex gap="xs" align="center">
            <Select
                label={props.label ?? null}
                data={options}
                value={selectedEndpoint?.id}
                onChange={(id) => selectEndpointById(id)}
                nothingFoundMessage={'No endpoints available'}
                flex={1}
                w="100%"
            ></Select>
        </Flex>
    )
}
