/**
 * SelectEndpoint - Dropdown for selecting LLM endpoint
 *
 * Uses the useEndpointFromQuery hook to manage endpoint selection via URL query params.
 * Displays endpoints with their base URL and optional hardware info.
 */

import { Flex, Select } from '@mantine/core'
import { useMemo } from 'react'
import { useEndpointFromQuery } from '~/lib/hooks'

export interface SelectEndpointProps {
    label?: string
}

export function SelectEndpoint(props: SelectEndpointProps) {
    const { endpoints, selectedEndpoint, selectEndpoint, loading, error } =
        useEndpointFromQuery()

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

    const getPlaceholder = () => {
        if (loading) return 'Loading endpoints...'
        if (error) return `Error: ${error}`
        if (endpoints.length === 0) return 'No endpoints available'
        return 'Select an endpoint'
    }

    return (
        <Flex gap="xs" align="center">
            <Select
                label={props.label ?? null}
                data={options}
                value={selectedEndpoint?.id ?? null}
                onChange={(id) => selectEndpoint(id)}
                placeholder={getPlaceholder()}
                disabled={loading || endpoints.length === 0}
                nothingFoundMessage={error ? `Error: ${error}` : 'No endpoints found'}
                flex={1}
                w="100%"
            />
        </Flex>
    )
}
