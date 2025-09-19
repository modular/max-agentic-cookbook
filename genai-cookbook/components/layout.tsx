import { centerStyle } from '@/lib/theme'
import { Box } from '@mantine/core'
import React from 'react'

export function Container({ children }: { children: React.ReactNode }) {
    return <Box style={centerStyle}>{children}</Box>
}

export function Spacer() {
    return <Box style={{ height: '100%' }}></Box>
}
