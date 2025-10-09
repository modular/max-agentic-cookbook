import Link from 'next/link'
import { AppShell, Group, ScrollArea, Stack, Text } from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import { cookbookRoute } from '@/utils/constants'
import { iconStroke } from '@/utils/theme'
import { useSelectedLayoutSegment } from 'next/navigation'
import { recipeRegistry } from '@modular/recipes'

export default function Navbar() {
    const currentRecipe = useSelectedLayoutSegment()

    return (
        <AppShell.Section grow component={ScrollArea}>
            <Stack align="stretch" justify="flex-start">
                <Text size="sm" fw="bold" tt="uppercase" c="dimmed">
                    Recipes
                </Text>
                {Object.entries(recipeRegistry).map(([slug, recipe]) => {
                    return (
                        <Group key={slug} justify="space-between" align="center">
                            <Link href={`${cookbookRoute()}/${slug}`}>
                                <Text c="var(--Black)">{recipe.title}</Text>
                            </Link>
                            {currentRecipe === slug && (
                                <IconChevronRight
                                    size={16}
                                    opacity={0.8}
                                    stroke={iconStroke}
                                />
                            )}
                        </Group>
                    )
                })}
            </Stack>
        </AppShell.Section>
    )
}
