import recipeStore from '@/store/RecipeStore'
import CookbookShell from '@/components/cookbook-shell'

const recipes = recipeStore.getAll() ?? []

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <CookbookShell recipes={recipes}>
            {recipes.length < 1 && <>No Recipes Loaded</>}
            {recipes.length > 0 && children}
        </CookbookShell>
    )
}
