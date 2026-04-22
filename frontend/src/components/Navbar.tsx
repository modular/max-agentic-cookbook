import { Link, useLocation } from 'react-router-dom'
import {
    Anchor,
    AppShell,
    Box,
    Group,
    ScrollArea,
    Stack,
    Text,
} from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import { iconStroke } from '~/lib/theme'
import { isRecipeImplemented } from '~/recipes/registry'
import { useEndpointFromQuery } from '~/lib/hooks'
import { SelectEndpoint } from './SelectEndpoint'
import { SelectModel } from './SelectModel'
import chapters from '~/lib/chapters'
import type { NavItem } from '~/lib/types'

interface NavItemProps {
    item: NavItem
    currentRecipe: string | null
}

function NavItem({ item, currentRecipe }: NavItemProps) {
    if (isRecipeImplemented(item.slug)) {
        return (
            <Group justify="space-between" align="start">
                <li>
                    <Stack gap={0}>
                        <Anchor component={Link} to={`/${item.slug}`} underline="never">
                            <Text size="sm">{item.title}</Text>
                        </Anchor>
                        {item.tags && (
                            <Text c="dimmed" size="xs">
                                {item.tags.sort().join(', ')}
                            </Text>
                        )}
                    </Stack>
                </li>
                {currentRecipe === item.slug && (
                    <Box mt={1}>
                        <IconChevronRight size={16} opacity={0.8} stroke={iconStroke} />
                    </Box>
                )}
            </Group>
        )
    }
    return (
        <li>
            <Text c="dimmed" size="sm">
                {item.title}
            </Text>
        </li>
    )
}

export function Navbar() {
    const location = useLocation()
    // Extract recipe slug from pathname (e.g., "/multiturn-chat" -> "multiturn-chat")
    const currentRecipe = location.pathname.split('/')[1] || null
    const { selectedEndpoint } = useEndpointFromQuery()

    return (
        <>
            <AppShell.Section p="md" hiddenFrom="sm">
                <Stack gap="md">
                    <SelectEndpoint />
                    <SelectModel endpointId={selectedEndpoint?.id ?? null} />
                </Stack>
            </AppShell.Section>
            <AppShell.Section grow component={ScrollArea} p="md">
                <ol>
                    {chapters.sections[0].items.map((item) => (
                        <NavItem
                            key={item.slug || item.title}
                            item={item}
                            currentRecipe={currentRecipe}
                        />
                    ))}
                </ol>
            </AppShell.Section>
        </>
    )
}
