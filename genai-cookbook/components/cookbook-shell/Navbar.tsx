import Link from 'next/link'
import { RecipeMetadata } from '@/lib/types'
import { AppShell, Group, ScrollArea, Stack, Text } from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import { useCookbook } from '@/hooks'
import { recipesPath } from '@/lib/constants'
import { iconStroke } from '@/lib/theme'

export default function Navbar({ recipes }: { recipes: RecipeMetadata[] }) {
    const { selectedRecipe, selectRecipeFromSlug } = useCookbook()

    return (
        <AppShell.Section grow component={ScrollArea}>
            <Stack align="stretch" justify="flex-start">
                <Text size="sm" fw="bold" tt="uppercase" c="dimmed">
                    Recipes
                </Text>
                {recipes.map((recipe) => {
                    return (
                        <Group key={recipe.slug} justify="space-between" align="center">
                            <Link
                                onClick={() => selectRecipeFromSlug(recipe.slug)}
                                href={`${recipesPath()}/${recipe.slug}`}
                            >
                                <Text c="var(--Black)">{recipe.title}</Text>
                            </Link>
                            {selectedRecipe?.slug === recipe.slug && (
                                <IconChevronRight opacity={0.5} stroke={iconStroke} />
                            )}
                        </Group>
                    )
                })}
            </Stack>
        </AppShell.Section>
    )
}
