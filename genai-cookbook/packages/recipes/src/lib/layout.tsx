'use client'

import { Flex } from '@mantine/core'

export interface RecipeLayoutProps {
    height: string
    toolbar?: React.ReactNode
    children: React.ReactNode
}

export function RecipeLayout({ height, toolbar, children }: RecipeLayoutProps) {
    return (
        <Flex
            direction="column"
            gap="sm"
            style={{ overflow: 'hidden' }}
            h={height}
        >
            {toolbar}
            {children}
        </Flex>
    )
}
