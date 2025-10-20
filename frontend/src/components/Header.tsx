import { Link } from 'react-router-dom'
import { ActionIcon, Burger, Flex, Group, Title } from '@mantine/core'
import { IconLayoutSidebar } from '@tabler/icons-react'

import { iconStroke } from '../lib/theme'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
    mobileOpened: boolean
    toggleMobile: () => void
    toggleDesktop: () => void
}

export function Header({ mobileOpened, toggleMobile, toggleDesktop }: HeaderProps) {
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
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    Modular Agentic Cookbook
                </Link>
            </Title>
            <ThemeToggle stroke={iconStroke} />
        </Flex>
    )
}
