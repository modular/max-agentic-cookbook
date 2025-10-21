/**
 * Toolbar - Recipe page toolbar with title and controls
 *
 * Displays the recipe title and ViewSelector for switching between readme, demo, and code views.
 */

import { Group, Title } from '@mantine/core'
import { ViewSelector } from './ViewSelector'

export interface ToolbarProps {
    title?: string
}

export function Toolbar({ title }: ToolbarProps) {
    return (
        <Group>
            <Title order={3}>{title ?? ''}</Title>
            <ViewSelector />
        </Group>
    )
}
