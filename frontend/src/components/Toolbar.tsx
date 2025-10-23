/**
 * Toolbar - Recipe page toolbar with title and controls
 *
 * Displays the recipe title and ViewSelector for switching between readme, demo, and code views.
 * On wide screens, ViewSelector is pushed to the right edge; on small screens, items wrap.
 */

import { Flex, Title } from '@mantine/core'
import { ViewSelector } from './ViewSelector'

export interface ToolbarProps {
    title?: string
}

export function Toolbar({ title }: ToolbarProps) {
    return (
        <Flex
            justify={{ base: 'flex-start', sm: 'space-between' }}
            wrap="wrap"
            gap="md"
            align="center"
        >
            <Title order={3}>{title ?? ''}</Title>
            <ViewSelector />
        </Flex>
    )
}
