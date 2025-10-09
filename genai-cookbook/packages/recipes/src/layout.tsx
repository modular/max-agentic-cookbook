'use client'

import { Flex } from '@mantine/core'

export interface RecipeLayoutProps {
    height: string
    header?: React.ReactNode
    children: React.ReactNode
}

export function RecipeLayout({ height, header: toolbar, children }: RecipeLayoutProps) {
    return (
        <Flex direction="column" gap="sm" style={{ overflow: 'hidden' }} h={height}>
            {toolbar}
            {children}
        </Flex>
    )
}
