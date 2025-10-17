'use client'

import { redirect } from 'next/navigation'
import { Toolbar } from '@/components/Toolbar'
import { cookbookRoute } from '@/lib/constants'
import { appShellContentHeight } from '@/lib/theme'
import { recipeMetadata, RecipeLayout } from '@modular/recipes'

export default function Layout({
    children,
    params,
}: {
    children: React.ReactNode
    params: { recipe?: string }
}) {
    if (!params.recipe) return redirect(cookbookRoute())

    const recipe = recipeMetadata[params.recipe]

    if (!recipe) return redirect(cookbookRoute())

    return (
        <RecipeLayout
            height={appShellContentHeight}
            header={<Toolbar title={recipe.title} />}
        >
            {children}
        </RecipeLayout>
    )
}
