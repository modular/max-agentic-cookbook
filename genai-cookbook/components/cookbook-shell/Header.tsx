'use client'

import Link from 'next/link'
import { ActionIcon, Burger, Flex, Group, Title } from '@mantine/core'
import { IconLayoutSidebar } from '@tabler/icons-react'

import { iconStroke } from '@/lib/theme'
import { recipesPath } from '@/lib/constants'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
    mobileOpened: boolean
    toggleMobile: () => void
    toggleDesktop: () => void
}

export default function Header({
    mobileOpened,
    toggleMobile,
    toggleDesktop,
}: HeaderProps) {
    return (
        <Flex h="100%" px="md" justify="space-between" align="center">
            <Burger
                opened={mobileOpened}
                onClick={toggleMobile}
                hiddenFrom="sm"
                size="sm"
            />
            <Group>
                <ActionIcon
                    onClick={toggleDesktop}
                    visibleFrom="sm"
                    variant="transparent"
                >
                    <IconLayoutSidebar stroke={iconStroke} />
                </ActionIcon>
            </Group>
            <Title style={{ fontWeight: 'normal' }} order={5}>
                <Link href={recipesPath()}>Modular GenAI Cookbook</Link>
            </Title>
            <ThemeToggle stroke={iconStroke} />
        </Flex>
    )
}
