/**
 * Toolbar - Recipe page toolbar with title and controls
 *
 * Displays the recipe title and CodeToggle for switching between demo and code view.
 */

import { Group, Title } from '@mantine/core'
import { CodeToggle } from './CodeToggle'

export interface ToolbarProps {
    title?: string
}

export function Toolbar({ title }: ToolbarProps) {
    return (
        <Group>
            <Title order={3}>{title ?? ''}</Title>
            <CodeToggle />
        </Group>
    )
}
