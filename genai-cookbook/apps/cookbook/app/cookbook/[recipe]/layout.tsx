'use client'

import { RecipeLayout } from '@modular/recipes/lib/layout'
import { appShellContentHeight } from '@/lib/theme'
import { Toolbar } from '@/components/Toolbar'
import { redirect } from 'next/navigation'
import { cookbookRoute } from '@/lib/constants'
import { recipeRegistry } from '@modular/recipes'

export default function Layout({
    children,
    params,
}: {
    children: React.ReactNode
    params: { recipe?: string }
}) {
    if (!params.recipe) return redirect(cookbookRoute())

    const recipe = recipeRegistry[params.recipe]

    if (!recipe) return redirect(cookbookRoute())

    return (
        <RecipeLayout
            height={appShellContentHeight}
            toolbar={<Toolbar title={recipe.title} />}
        >
            {children}
        </RecipeLayout>
    )
}
