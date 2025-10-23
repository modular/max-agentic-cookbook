import { Link } from 'react-router-dom'
import { ActionIcon, Burger, Flex, Group, Title } from '@mantine/core'
import { IconLayoutSidebar } from '@tabler/icons-react'

import { iconStroke } from '../lib/theme'
import { ThemeToggle } from './ThemeToggle'
import { SelectEndpoint } from './SelectEndpoint'
import { SelectModel } from './SelectModel'
import { useEndpointFromQuery } from '../lib/hooks'

interface HeaderProps {
    mobileOpened: boolean
    toggleMobile: () => void
    toggleDesktop: () => void
}

export function Header({ mobileOpened, toggleMobile, toggleDesktop }: HeaderProps) {
    const { selectedEndpoint } = useEndpointFromQuery()

    return (
        <Flex h="100%" px="md" justify="space-between" align="center">
            <Group gap="md">
                <Burger
                    opened={mobileOpened}
                    onClick={toggleMobile}
                    hiddenFrom="sm"
                    size="sm"
                />
                <ActionIcon
                    onClick={toggleDesktop}
                    visibleFrom="sm"
                    variant="transparent"
                >
                    <IconLayoutSidebar stroke={iconStroke} />
                </ActionIcon>
                <Title order={4}>
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        Modular Agentic Cookbook
                    </Link>
                </Title>
            </Group>
            <Group gap="md">
                <Group gap="md" visibleFrom="sm">
                    <SelectEndpoint />
                    <SelectModel endpointId={selectedEndpoint?.id ?? null} />
                </Group>
                <ThemeToggle stroke={iconStroke} />
            </Group>
        </Flex>
    )
}
