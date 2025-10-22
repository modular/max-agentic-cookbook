import { Link, useLocation } from 'react-router-dom'
import { Accordion, AppShell, Group, ScrollArea, Stack, Text } from '@mantine/core'
import { IconChevronRight, IconPlus } from '@tabler/icons-react'
import { iconStroke } from '../lib/theme'
import { isRecipeImplemented } from '../recipes/registry'
import { useEndpointFromQuery } from '../lib/hooks'
import { SelectEndpoint } from './SelectEndpoint'
import { SelectModel } from './SelectModel'
import chapters from '../lib/chapters'
import classes from './Navbar.module.css'

interface NavItemProps {
    item: { title: string; slug?: string }
    currentRecipe: string | null
}

function NavItem({ item, currentRecipe }: NavItemProps) {
    if (isRecipeImplemented(item.slug)) {
        return (
            <Group justify="space-between" align="center">
                <Link to={`/${item.slug}`} style={{ textDecoration: 'none' }}>
                    <Text size="sm">{item.title}</Text>
                </Link>
                {currentRecipe === item.slug && (
                    <IconChevronRight size={16} opacity={0.8} stroke={iconStroke} />
                )}
            </Group>
        )
    }
    return (
        <Text c="dimmed" size="sm">
            {item.title}
        </Text>
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
            <AppShell.Section grow component={ScrollArea}>
                <Accordion
                    multiple
                    chevronPosition="left"
                    defaultValue={['Foundations', 'Data, Tools & Reasoning']}
                    chevron={<IconPlus size={16} stroke={iconStroke} />}
                    classNames={{ chevron: classes.chevron }}
                >
                    {chapters.sections.map((section) => (
                        <Accordion.Item key={section.title} value={section.title}>
                            <Accordion.Control>{section.title}</Accordion.Control>
                            <Accordion.Panel bg="">
                                <Stack gap="sm">
                                    {section.items.map((item) => (
                                        <NavItem
                                            key={item.slug || item.title}
                                            item={item}
                                            currentRecipe={currentRecipe}
                                        />
                                    ))}
                                </Stack>
                            </Accordion.Panel>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </AppShell.Section>
        </>
    )
}
