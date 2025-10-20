/**
 * Toolbar - Recipe page toolbar with title and controls
 *
 * Left side: Recipe title + CodeToggle
 * Right side: SelectEndpoint + SelectModel dropdowns
 *
 * Uses query params for endpoint/model selection.
 */

import { Flex, Group, Title } from '@mantine/core'
import { CodeToggle } from './CodeToggle'
import { SelectEndpoint } from './SelectEndpoint'
import { SelectModel } from './SelectModel'
import { useEndpointFromQuery } from '../lib/hooks'

export interface ToolbarProps {
    title?: string
}

export function Toolbar({ title }: ToolbarProps) {
    const { selectedEndpoint } = useEndpointFromQuery()

    return (
        <Flex w="100%" direction="row" justify="space-between" align="center">
            <Group>
                <Title order={3}>{title ?? ''}</Title>
                <CodeToggle />
            </Group>
            <Group>
                <SelectEndpoint />
                <SelectModel endpointId={selectedEndpoint?.id ?? null} />
            </Group>
        </Flex>
    )
}
