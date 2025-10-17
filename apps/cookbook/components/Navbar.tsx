'use client'

import Link from 'next/link'
import { Accordion, AppShell, Group, ScrollArea, Stack, Text } from '@mantine/core'
import { IconChevronRight, IconPlus } from '@tabler/icons-react'
import { cookbookRoute } from '@/utils/constants'
import { iconStroke } from '@/utils/theme'
import { useSelectedLayoutSegment } from 'next/navigation'
import { recipeMetadata } from '@modular/recipes'
import classes from './Navbar.module.css'

const recipeSections = {
    sections: [
        {
            title: 'Foundations',
            items: [
                { title: '1: Introduction' },
                { slug: 'multiturn-chat', title: '2: Multi-Turn Chat' },
                { title: '3: Batch Safety Classification' },
                { slug: 'image-captioning', title: '4: Streaming Image Captions' },
            ],
        },
        {
            title: 'Data, Tools & Reasoning',
            items: [
                { title: '5: Structured Data Generation' },
                { title: '6: Function Calling & Tools' },
                { title: '7: The ReAct Pattern' },
                { title: '8: Model Context Protocol (MCP)' },
            ],
        },
        {
            title: 'Planning & Collaboration',
            items: [
                { title: '9: State & Memory Management' },
                { title: '10: Planning & Self-Correction' },
                { title: '11: Multi-Tool Agents' },
                { title: '12: Human-in-the-Loop Systems' },
            ],
        },
        {
            title: 'Context Engineering',
            items: [
                { title: '13: Augmented Generation (RAG)' },
                { title: '14: Dynamic Context Construction' },
                { title: '15: Context Optimization Patterns' },
            ],
        },
        {
            title: 'Advanced Applications',
            items: [
                { title: '16: Generative UI' },
                { title: '17: GitHub Repo Agent' },
                { title: '18: Morning News Summary' },
                { title: '19: Multi-Agent Orchestration' },
            ],
        },
        {
            title: 'Appendix',
            items: [
                { title: 'A: Observability & Debugging' },
                { title: 'B: Agentic Frameworks' },
                { title: 'C: Token Optimization' },
                { title: 'D: Deployment Considerations' },
            ],
        },
    ],
}

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
                {recipeSections.sections.map((section) => (
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
