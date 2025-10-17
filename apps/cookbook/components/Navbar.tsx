'use client'

import Link from 'next/link'
import { Accordion, AppShell, Group, ScrollArea, Stack, Text } from '@mantine/core'
import { IconChevronRight, IconPlus } from '@tabler/icons-react'
import { cookbookRoute } from '@/lib/constants'
import { iconStroke } from '@/lib/theme'
import { useSelectedLayoutSegment } from 'next/navigation'
import { recipeMetadata } from '@modular/recipes'
import chapters from '@/lib/chapters'
import classes from './Navbar.module.css'
interface NavItemProps {
    item: { title: string; slug?: string }
    currentRecipe: string | null
}

function NavItem({ item, currentRecipe }: NavItemProps) {
    if (item.slug && recipeMetadata[item.slug]) {
        return (
            <Group justify="space-between" align="center">
                <Link href={`${cookbookRoute()}/${item.slug}`}>
                    <Text
                        size="sm"
                        c={
                            currentRecipe === item.slug
                                ? 'var(--mantine-primary-color-0)'
                                : ''
                        }
                    >
                        {item.title}
                    </Text>
                </Link>
                {currentRecipe === item.slug && (
                    <IconChevronRight
                        size={16}
                        opacity={0.8}
                        stroke={iconStroke}
                        color="var(--mantine-primary-color-0)"
                    />
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

export default function Navbar() {
    const currentRecipe = useSelectedLayoutSegment()

    return (
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
    )
}
