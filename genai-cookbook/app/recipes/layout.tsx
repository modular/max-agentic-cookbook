import CookbookShell from '@/components/cookbook-shell'
import recipeStore from '@/store/RecipeStore'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const recipes = recipeStore.getAll()
    if (!recipes) {
        throw new Error('No Recipes Loaded')
    }

    return <CookbookShell recipes={recipes}>{children}</CookbookShell>
}
