import { BodyText } from '@/components/BodyText'
import CookbookShell from '@/components/cookbook-shell'
import recipeStore from '@/store/RecipeStore'
import { Flex } from '@mantine/core'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const recipes = recipeStore.getAll()

    return recipes ? (
        <CookbookShell recipes={recipes}>{children}</CookbookShell>
    ) : (
        <Flex dir="column" justify="center" align="center" h="100vh">
            <BodyText size="md">No Recipes Found</BodyText>
        </Flex>
    )
}
