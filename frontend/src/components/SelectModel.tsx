/**
 * SelectModel - Dropdown for selecting AI model
 *
 * Uses the useModelFromQuery hook to manage model selection via URL query params.
 * Fetches available models based on the selected endpoint.
 */

import { Flex, Select } from '@mantine/core'
import { useModelFromQuery } from '../lib/hooks'

export interface SelectModelProps {
    label?: string
    endpointId: string | null
}

export function SelectModel(props: SelectModelProps) {
    const { models, selectedModel, selectModel, loading, error } = useModelFromQuery(
        props.endpointId
    )

    const options = models.map(({ id, name }) => ({
        value: id,
        label: name,
    }))

    const getPlaceholder = () => {
        if (!props.endpointId) return 'Select an endpoint first'
        if (loading) return 'Loading models...'
        if (error) return `Error: ${error}`
        if (models.length === 0) return 'No models available'
        return 'Select a model'
    }

    return (
        <Flex gap="xs" align="center">
            <Select
                label={props.label ?? null}
                data={options}
                value={selectedModel?.id ?? null}
                onChange={(id) => selectModel(id)}
                placeholder={getPlaceholder()}
                disabled={!props.endpointId || loading || models.length === 0}
                nothingFoundMessage={error ? `Error: ${error}` : 'No models found'}
                flex={1}
                w="100%"
            />
        </Flex>
    )
}
