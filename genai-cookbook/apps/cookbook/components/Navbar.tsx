import Link from 'next/link'
import { AppShell, Group, ScrollArea, Stack, Text } from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import { useCookbook } from '@modular/recipe-sdk/context'
import { cookbookRoute } from '@/lib/constants'
import { iconStroke } from '@modular/recipe-sdk/theme'
import { useSelectedLayoutSegment } from 'next/navigation'

export default function Navbar() {
    const { recipes } = useCookbook()
    const currentRecipe = useSelectedLayoutSegment()

    return (
        <AppShell.Section grow component={ScrollArea}>
            <Stack align="stretch" justify="flex-start">
                <Text size="sm" fw="bold" tt="uppercase" c="dimmed">
                    Recipes
                </Text>
                {recipes.map((recipe) => {
                    return (
                        <Group key={recipe.slug} justify="space-between" align="center">
                            <Link href={`${cookbookRoute()}/${recipe.slug}`}>
                                <Text c="var(--Black)">{recipe.title}</Text>
                            </Link>
                            {currentRecipe === recipe.slug && (
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
